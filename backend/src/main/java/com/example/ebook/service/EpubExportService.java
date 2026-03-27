package com.example.ebook.service;

import com.example.ebook.model.Book;
import com.example.ebook.model.Book.ChunkRef;
import com.example.ebook.model.SourceBook;
import com.example.ebook.model.SourceBook.SourceChunk;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.zip.CRC32;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class EpubExportService {

    private final XmlService xmlService;

    public EpubExportService(XmlService xmlService) {
        this.xmlService = xmlService;
    }

    public byte[] exportAsEpub(String bookId) throws IOException {
        Optional<Book> bookOpt = xmlService.getCustomBookRegistry().getEbooks().stream()
                .filter(b -> b.getId().equals(bookId))
                .findFirst();

        if (bookOpt.isEmpty()) {
            throw new RuntimeException("E-Book not found");
        }

        Book book = bookOpt.get();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            // 1. mimetype (MUST be uncompressed and first)
            writeUncompressedFile(zos, "mimetype", "application/epub+zip");

            // 2. META-INF/container.xml
            String containerXml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
                    "<container version=\"1.0\" xmlns=\"urn:oasis:names:tc:opendocument:xmlns:container\">\n" +
                    "  <rootfiles>\n" +
                    "    <rootfile full-path=\"OEBPS/content.opf\" media-type=\"application/oebps-package+xml\"/>\n" +
                    "  </rootfiles>\n" +
                    "</container>";
            writeFile(zos, "META-INF/container.xml", containerXml);

            // 3. Process Chunks
            List<ChunkData> chunkDataList = processChunks(book.getChunkRefs(), zos);

            // 4. OEBPS/content.opf
            String contentOpf = generateContentOpf(book, chunkDataList);
            writeFile(zos, "OEBPS/content.opf", contentOpf);

            // 5. OEBPS/toc.ncx
            String tocNcx = generateTocNcx(book, chunkDataList);
            writeFile(zos, "OEBPS/toc.ncx", tocNcx);

            // 6. OEBPS/nav.xhtml
            String navXhtml = generateNavXhtml(book, chunkDataList);
            writeFile(zos, "OEBPS/nav.xhtml", navXhtml);
            
            // 7. OEBPS/css/style.css
            String styleCss = "body { font-family: sans-serif; margin: 1em; line-height: 1.6; }\n" +
                    "video, img { max-width: 100%; height: auto; display: block; margin: auto; }\n" +
                    "audio { width: 100%; margin: 1em 0; }\n";
            writeFile(zos, "OEBPS/css/style.css", styleCss);
        }

        return baos.toByteArray();
    }

    private List<ChunkData> processChunks(List<ChunkRef> chunkRefs, ZipOutputStream zos) throws IOException {
        List<ChunkData> result = new ArrayList<>();
        int i = 1;
        for (ChunkRef ref : chunkRefs) {
            Optional<SourceChunk> chunkOpt = xmlService.findChunk(ref.getBookId(), ref.getChunkId());
            if (chunkOpt.isEmpty()) continue;

            SourceChunk chunk = chunkOpt.get();
            String id = "chunk_" + i;
            String href = "OEBPS/text/" + id + ".xhtml";
            String title = chunk.getTitle() != null ? chunk.getTitle() : "Section " + i;

            String bodyContent = "";

            if ("text".equalsIgnoreCase(chunk.getChunkType()) && !chunk.isVirtual()) {
                Optional<SourceBook> sbOpt = xmlService.findSourceBook(ref.getBookId());
                if (sbOpt.isPresent() && sbOpt.get().getFile() != null) {
                    bodyContent = extractTextFromPdf(sbOpt.get().getFile().getPath(), chunk.getRange());
                } else {
                    bodyContent = "<p>Text content missing</p>";
                }
            } else if ("video".equalsIgnoreCase(chunk.getChunkType()) || "audio".equalsIgnoreCase(chunk.getChunkType())) {
                String mediaHref = "OEBPS/media/" + Paths.get(chunk.getUri()).getFileName().toString();
                String mediaType = "video".equalsIgnoreCase(chunk.getChunkType()) ? "video/mp4" : "audio/mpeg";
                
                // Copy media file into zip
                File mediaFile = new File("uploads/" + Paths.get(chunk.getUri()).getFileName().toString());
                if (mediaFile.exists()) {
                    zos.putNextEntry(new ZipEntry(mediaHref));
                    Files.copy(mediaFile.toPath(), zos);
                    zos.closeEntry();
                    
                    if ("video".equalsIgnoreCase(chunk.getChunkType())) {
                        bodyContent = "<video controls=\"controls\" src=\"../media/" + mediaFile.getName() + "\"></video>";
                    } else {
                        bodyContent = "<audio controls=\"controls\" src=\"../media/" + mediaFile.getName() + "\"></audio>";
                    }
                } else {
                    bodyContent = "<p>Media file missing</p>";
                }
                
                result.add(new ChunkData(id + "_media", mediaHref, mediaType, false));
            } else if (chunk.isVirtual()) {
                bodyContent = "<p>This is a virtual chunk placeholder.</p>";
            }

            String xhtml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
                    "<!DOCTYPE html>\n" +
                    "<html xmlns=\"http://www.w3.org/1999/xhtml\" xmlns:epub=\"http://www.idpf.org/2007/ops\">\n" +
                    "<head>\n" +
                    "  <title>" + escapeXml(title) + "</title>\n" +
                    "  <link rel=\"stylesheet\" type=\"text/css\" href=\"../css/style.css\"/>\n" +
                    "</head>\n" +
                    "<body>\n" +
                    "  <h1>" + escapeXml(title) + "</h1>\n" +
                    "  " + bodyContent + "\n" +
                    "</body>\n" +
                    "</html>";

            writeFile(zos, href, xhtml);
            result.add(new ChunkData(id, href, "application/xhtml+xml", true));
            i++;
        }
        return result;
    }

    private String extractTextFromPdf(String pdfPath, SourceBook.Range range) {
        File pdfFile = new File(pdfPath);
        if (!pdfFile.exists()) return "<p>PDF file not found</p>";

        try (PDDocument document = Loader.loadPDF(pdfFile)) {
            PDFTextStripper stripper = new PDFTextStripper();
            if (range != null) {
                if (range.getStartPage() > 0) stripper.setStartPage(range.getStartPage());
                if (range.getEndPage() > 0) stripper.setEndPage(range.getEndPage());
            }
            String text = stripper.getText(document);
            String[] paragraphs = text.split("\n\\s*\n");
            StringBuilder sb = new StringBuilder();
            for (String p : paragraphs) {
                if (!p.trim().isEmpty()) {
                    sb.append("<p>").append(escapeXml(p.trim().replace("\n", " "))).append("</p>\n");
                }
            }
            return sb.toString();
        } catch (IOException e) {
            e.printStackTrace();
            return "<p>Error extracting text from PDF</p>";
        }
    }

    private String generateContentOpf(Book book, List<ChunkData> items) {
        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<package xmlns=\"http://www.idpf.org/2007/opf\" unique-identifier=\"BookId\" version=\"3.0\">\n");
        sb.append("  <metadata xmlns:dc=\"http://purl.org/dc/elements/1.1/\">\n");
        sb.append("    <dc:title>").append(escapeXml(book.getTitle())).append("</dc:title>\n");
        sb.append("    <dc:creator>").append(escapeXml(book.getCreatedBy() != null ? book.getCreatedBy() : "Unknown")).append("</dc:creator>\n");
        sb.append("    <dc:identifier id=\"BookId\">urn:uuid:").append(UUID.randomUUID().toString()).append("</dc:identifier>\n");
        sb.append("    <dc:language>en</dc:language>\n");
        sb.append("    <meta property=\"dcterms:modified\">2026-01-01T12:00:00Z</meta>\n");
        sb.append("  </metadata>\n");
        
        sb.append("  <manifest>\n");
        sb.append("    <item id=\"ncx\" href=\"toc.ncx\" media-type=\"application/x-dtbncx+xml\"/>\n");
        sb.append("    <item id=\"nav\" href=\"nav.xhtml\" media-type=\"application/xhtml+xml\" properties=\"nav\"/>\n");
        sb.append("    <item id=\"style\" href=\"css/style.css\" media-type=\"text/css\"/>\n");
        for (ChunkData item : items) {
            sb.append("    <item id=\"").append(item.id).append("\" href=\"").append(item.href.replace("OEBPS/", "")).append("\" media-type=\"").append(item.mediaType).append("\"/>\n");
        }
        sb.append("  </manifest>\n");
        
        sb.append("  <spine toc=\"ncx\">\n");
        for (ChunkData item : items) {
            if (item.isSpine) {
                sb.append("    <itemref idref=\"").append(item.id).append("\"/>\n");
            }
        }
        sb.append("  </spine>\n");
        sb.append("</package>");
        return sb.toString();
    }

    private String generateTocNcx(Book book, List<ChunkData> items) {
        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<ncx xmlns=\"http://www.daisy.org/z3986/2005/ncx/\" version=\"2005-1\">\n");
        sb.append("  <head>\n");
        sb.append("    <meta name=\"dtb:uid\" content=\"urn:uuid:").append(UUID.randomUUID().toString()).append("\"/>\n");
        sb.append("  </head>\n");
        sb.append("  <docTitle><text>").append(escapeXml(book.getTitle())).append("</text></docTitle>\n");
        sb.append("  <navMap>\n");
        int playOrder = 1;
        for (ChunkData item : items) {
            if (item.isSpine) {
                sb.append("    <navPoint id=\"").append(item.id).append("\" playOrder=\"").append(playOrder++).append("\">\n");
                sb.append("      <navLabel><text>Section ").append(playOrder - 1).append("</text></navLabel>\n");
                sb.append("      <content src=\"").append(item.href.replace("OEBPS/", "")).append("\"/>\n");
                sb.append("    </navPoint>\n");
            }
        }
        sb.append("  </navMap>\n");
        sb.append("</ncx>");
        return sb.toString();
    }

    private String generateNavXhtml(Book book, List<ChunkData> items) {
        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<html xmlns=\"http://www.w3.org/1999/xhtml\" xmlns:epub=\"http://www.idpf.org/2007/ops\">\n");
        sb.append("<head>\n");
        sb.append("  <title>Table of Contents</title>\n");
        sb.append("</head>\n");
        sb.append("<body>\n");
        sb.append("  <nav epub:type=\"toc\" id=\"toc\">\n");
        sb.append("    <h1>Table of Contents</h1>\n");
        sb.append("    <ol>\n");
        int i = 1;
        for (ChunkData item : items) {
            if (item.isSpine) {
                sb.append("      <li><a href=\"").append(item.href.replace("OEBPS/", "")).append("\">Section ").append(i++).append("</a></li>\n");
            }
        }
        sb.append("    </ol>\n");
        sb.append("  </nav>\n");
        sb.append("</body>\n");
        sb.append("</html>");
        return sb.toString();
    }

    private void writeFile(ZipOutputStream zos, String entryName, String content) throws IOException {
        zos.putNextEntry(new ZipEntry(entryName));
        zos.write(content.getBytes("UTF-8"));
        zos.closeEntry();
    }

    private void writeUncompressedFile(ZipOutputStream zos, String entryName, String content) throws IOException {
        byte[] bytes = content.getBytes("UTF-8");
        ZipEntry entry = new ZipEntry(entryName);
        entry.setMethod(ZipEntry.STORED);
        entry.setSize(bytes.length);
        entry.setCrc(calculateCrc(bytes));
        zos.putNextEntry(entry);
        zos.write(bytes);
        zos.closeEntry();
    }

    private long calculateCrc(byte[] bytes) {
        CRC32 crc = new CRC32();
        crc.update(bytes);
        return crc.getValue();
    }

    private String escapeXml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }

    private static class ChunkData {
        String id;
        String href;
        String mediaType;
        boolean isSpine;

        ChunkData(String id, String href, String mediaType, boolean isSpine) {
            this.id = id;
            this.href = href;
            this.mediaType = mediaType;
            this.isSpine = isSpine;
        }
    }
}
