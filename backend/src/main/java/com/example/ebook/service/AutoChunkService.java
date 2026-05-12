package com.example.ebook.service;

import com.example.ebook.model.SourceBook;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.interactive.documentnavigation.outline.PDDocumentOutline;
import org.apache.pdfbox.pdmodel.interactive.documentnavigation.outline.PDOutlineItem;
import org.apache.pdfbox.pdmodel.interactive.documentnavigation.outline.PDOutlineNode;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AutoChunkService {

    private final AiChunkingService aiChunkingService;

    @Autowired
    public AutoChunkService(AiChunkingService aiChunkingService) {
        this.aiChunkingService = aiChunkingService;
    }

    public List<SourceBook.SourceChunk> autoChunkPdf(File file, String bookFilename) {
        List<SourceBook.SourceChunk> chunks = new ArrayList<>();
        try (PDDocument document = Loader.loadPDF(file)) {
            int totalPages = document.getNumberOfPages();
            PDDocumentOutline outline = document.getDocumentCatalog().getDocumentOutline();
            
            boolean foundMetadata = false;
            if (outline != null) {
                // Try to extract chapters from metadata
                List<AiChunkingService.ChapterInfo> metadataChapters = new ArrayList<>();
                extractOutlineChapters(outline, document, metadataChapters);
                
                if (!metadataChapters.isEmpty()) {
                    foundMetadata = true;
                    // Fix end pages based on start pages of next chapters
                    for (int i = 0; i < metadataChapters.size(); i++) {
                        AiChunkingService.ChapterInfo curr = metadataChapters.get(i);
                        int endPage = (i < metadataChapters.size() - 1) ? 
                                metadataChapters.get(i+1).startPage() - 1 : totalPages;
                        if (endPage < curr.startPage()) endPage = curr.startPage();
                        
                        SourceBook.SourceChunk chunk = createTextChunk(curr.title(), curr.startPage(), endPage, bookFilename);
                        chunks.add(chunk);
                    }
                }
            }
            
            if (!foundMetadata) {
                // Determine chapters using AI reading first few pages
                PDFTextStripper stripper = new PDFTextStripper();
                stripper.setStartPage(1);
                // Read up to 10 pages for TOC or headers to save tokens
                stripper.setEndPage(Math.min(10, totalPages)); 
                String text = stripper.getText(document);
                
                List<AiChunkingService.ChapterInfo> aiChapters = aiChunkingService.extractChaptersFromText(text, totalPages);
                for (AiChunkingService.ChapterInfo chap : aiChapters) {
                    SourceBook.SourceChunk chunk = createTextChunk(chap.title(), chap.startPage(), chap.endPage(), bookFilename);
                    chunks.add(chunk);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return chunks;
    }

    private void extractOutlineChapters(PDOutlineNode outline, PDDocument document, List<AiChunkingService.ChapterInfo> chapters) {
        PDOutlineItem current = outline.getFirstChild();
        while (current != null) {
            try {
                int pageNum = 1;
                try {
                    org.apache.pdfbox.pdmodel.PDPage pdPage = current.findDestinationPage(document);
                    if (pdPage != null) {
                        pageNum = document.getPages().indexOf(pdPage) + 1;
                    }
                } catch (Exception e) {}
                
                if (pageNum <= 0) pageNum = 1;
                chapters.add(new AiChunkingService.ChapterInfo(current.getTitle(), pageNum, pageNum, null, null));
            } catch (Exception e) {
                // ignore
            }
            current = current.getNextSibling();
        }
    }

    public List<SourceBook.SourceChunk> autoChunkVideo(File file, String bookFilename) {
        List<SourceBook.SourceChunk> chunks = new ArrayList<>();
        try {
            // Try ffprobe for video chapters
            ProcessBuilder pb = new ProcessBuilder(
                    "ffprobe", "-v", "quiet", "-print_format", "json", "-show_chapters", file.getAbsolutePath());
            Process p = pb.start();
            StringBuilder sb = new StringBuilder();
            try (BufferedReader br = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
                String line;
                while ((line = br.readLine()) != null) {
                    sb.append(line);
                }
            }
            
            String jsonOutput = sb.toString();
            // A simple check if chapters exist
            if (jsonOutput.contains("\"chapters\": [") && jsonOutput.split("\"chapters\": \\[")[1].trim().length() > 5) {
                // Parse chapters with simple regex for demonstration instead of adding Jackson object mapping
                Matcher startMatcher = Pattern.compile("\"start_time\": \"([0-9.]+)\"").matcher(jsonOutput);
                Matcher endMatcher = Pattern.compile("\"end_time\": \"([0-9.]+)\"").matcher(jsonOutput);
                Matcher titleMatcher = Pattern.compile("\"title\": \"([^\"]+)\"").matcher(jsonOutput);
                
                int chunkCounter = 1;
                while (startMatcher.find() && endMatcher.find()) {
                    String startTime = formatTime(Double.parseDouble(startMatcher.group(1)));
                    String endTime = formatTime(Double.parseDouble(endMatcher.group(1)));
                    String title = titleMatcher.find() ? titleMatcher.group(1) : "Chapter " + chunkCounter;
                    
                    SourceBook.SourceChunk chunk = createVideoChunk(title, startTime, endTime, bookFilename);
                    chunks.add(chunk);
                    chunkCounter++;
                }
            } else {
                // Fallback logical split for video if no chapters
                // We just split in two 5-minute intervals for now as AI video processing is complex
                chunks.add(createVideoChunk("Part 1", "00:00:00", "00:05:00", bookFilename));
                chunks.add(createVideoChunk("Part 2", "00:05:00", "00:10:00", bookFilename));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return chunks;
    }

    private String formatTime(double seconds) {
        int h = (int) (seconds / 3600);
        int m = (int) ((seconds % 3600) / 60);
        int s = (int) (seconds % 60);
        return String.format("%02d:%02d:%02d", h, m, s);
    }
    
    private SourceBook.SourceChunk createTextChunk(String title, int startPage, int endPage, String uri) {
        SourceBook.SourceChunk chunk = new SourceBook.SourceChunk();
        chunk.setId(UUID.randomUUID().toString());
        chunk.setTitle(title);
        chunk.setChunkType("pdf");
        chunk.setVirtual(true);
        chunk.setPrice(0.0);
        chunk.setUri(uri);
        SourceBook.Range range = new SourceBook.Range();
        range.setStartPage(startPage);
        range.setEndPage(endPage);
        chunk.setRange(range);
        return chunk;
    }

    private SourceBook.SourceChunk createVideoChunk(String title, String startTime, String endTime, String uri) {
        SourceBook.SourceChunk chunk = new SourceBook.SourceChunk();
        chunk.setId(UUID.randomUUID().toString());
        chunk.setTitle(title);
        chunk.setChunkType("video");
        chunk.setVirtual(true);
        chunk.setPrice(0.0);
        chunk.setUri(uri);
        SourceBook.Range range = new SourceBook.Range();
        range.setStartTime(startTime);
        range.setEndTime(endTime);
        chunk.setRange(range);
        return chunk;
    }
}
