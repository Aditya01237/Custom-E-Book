package com.example.ebook.controller;

import com.example.ebook.model.SourceBook;
import com.example.ebook.model.SourceBookRegistry;
import com.example.ebook.service.XmlService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ChunkController {

    private final XmlService xmlService;
    private final Path uploadPath;

    @Autowired
    public ChunkController(XmlService xmlService) {
        this.xmlService = xmlService;
        this.uploadPath = Paths.get("uploads").toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadPath);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory", e);
        }
    }

    // ─── Source Book endpoints ───────────────────────────────────────────

    @PostMapping("/books/source")
    public ResponseEntity<SourceBook> createSourceBook(@RequestBody Map<String, String> body) {
        try {
            SourceBook book = new SourceBook();
            book.setId(UUID.randomUUID().toString());
            book.setTitle(body.getOrDefault("title", "Untitled Book"));
            book.setAuthor(body.getOrDefault("author", "Unknown Author"));
            book.setChunks(new ArrayList<>());

            // Optional file path
            String filePath = body.get("filePath");
            if (filePath != null && !filePath.isBlank()) {
                book.setFile(new SourceBook.FileInfo(filePath));
            }

            SourceBookRegistry registry = xmlService.getSourceBookRegistry();
            registry.getBooks().add(book);
            xmlService.saveSourceBookRegistry(registry);

            return ResponseEntity.ok(book);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/books/source")
    public ResponseEntity<List<SourceBook>> getAllSourceBooks() {
        return ResponseEntity.ok(xmlService.getSourceBookRegistry().getBooks());
    }

    @GetMapping("/books/source/{bookId}")
    public ResponseEntity<SourceBook> getSourceBook(@PathVariable String bookId) {
        return xmlService.findSourceBook(bookId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── Chunk endpoints (within a source book) ─────────────────────────

    @GetMapping("/chunks")
    public ResponseEntity<List<XmlService.ChunkWithBookInfo>> getAllChunks() {
        return ResponseEntity.ok(xmlService.getAllChunksFlat());
    }

    @PostMapping("/chunks/upload")
    public ResponseEntity<SourceBook.SourceChunk> uploadChunk(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam("bookId") String bookId,
            @RequestParam("title") String title,
            @RequestParam("price") double price,
            @RequestParam("chunkType") String chunkType,
            @RequestParam(value = "isVirtual", required = false, defaultValue = "false") boolean isVirtual,
            @RequestParam(value = "startPage", required = false, defaultValue = "0") int startPage,
            @RequestParam(value = "endPage", required = false, defaultValue = "0") int endPage,
            @RequestParam(value = "startTime", required = false) String startTime,
            @RequestParam(value = "endTime", required = false) String endTime) {

        try {
            // Find the source book
            SourceBookRegistry registry = xmlService.getSourceBookRegistry();
            SourceBook sourceBook = registry.getBooks().stream()
                    .filter(b -> b.getId().equals(bookId))
                    .findFirst()
                    .orElse(null);

            if (sourceBook == null) {
                return ResponseEntity.badRequest().build();
            }

            // Save file or resolve existing
            Path targetLocation;
            String filename;
            
            if (file != null && !file.isEmpty()) {
                filename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
                targetLocation = this.uploadPath.resolve(filename);
                Files.copy(file.getInputStream(), targetLocation);
                
                // If the book doesn't have a primary file yet, set this as the primary file
                if (sourceBook.getFile() == null || sourceBook.getFile().getPath() == null) {
                    sourceBook.setFile(new SourceBook.FileInfo("uploads/" + filename));
                }
            } else {
                if (sourceBook.getFile() == null || sourceBook.getFile().getPath() == null) {
                    return ResponseEntity.badRequest().build(); // No file to process
                }
                String existingPath = sourceBook.getFile().getPath();
                if (existingPath.startsWith("uploads/")) {
                    filename = existingPath.substring("uploads/".length());
                } else {
                    filename = Paths.get(existingPath).getFileName().toString();
                }
                // Determine absolute path of the existing file (assuming it sits in project root or uploads folder)
                targetLocation = Paths.get(existingPath).toAbsolutePath().normalize();
            }

            // Create chunk
            SourceBook.SourceChunk chunk = new SourceBook.SourceChunk();
            chunk.setId(UUID.randomUUID().toString());
            chunk.setTitle(title);
            chunk.setChunkType(chunkType);
            chunk.setVirtual(isVirtual);
            chunk.setPrice(price);
            chunk.setUri("uploads/" + filename);

            if (isVirtual) {
                SourceBook.Range range = new SourceBook.Range();
                if ("text".equalsIgnoreCase(chunkType) || "pdf".equalsIgnoreCase(chunkType)) {
                    range.setStartPage(startPage);
                    range.setEndPage(endPage);
                    try (org.apache.pdfbox.pdmodel.PDDocument document = org.apache.pdfbox.Loader
                            .loadPDF(targetLocation.toFile())) {
                        int totalPages = document.getNumberOfPages();
                        
                        // Prevent out of bounds
                        int safeEndPage = Math.min(endPage, totalPages);
                        int safeStartPage = Math.max(startPage, 1);
                        
                        if (safeStartPage <= safeEndPage && safeEndPage > 0) {
                            for (int i = totalPages - 1; i >= safeEndPage; i--) {
                                if (i >= 0 && i < document.getNumberOfPages())
                                    document.removePage(i);
                            }
                            for (int i = 0; i < safeStartPage - 1; i++) {
                                if (document.getNumberOfPages() > 0)
                                    document.removePage(0);
                            }
                        }
                        
                        String newFilename = "trimmed_" + filename;
                        Path newTargetLocation = this.uploadPath.resolve(newFilename);
                        document.save(newTargetLocation.toFile());
                        chunk.setUri("uploads/" + newFilename);
                    } catch (Exception e) {
                        e.printStackTrace();
                        return ResponseEntity.status(500).build();
                    }
                } else if ("audio".equalsIgnoreCase(chunkType) || "video".equalsIgnoreCase(chunkType)) {
                    // if Chunk type is audio/video then use timestamps for range
                    range.setStartTime(startTime);
                    range.setEndTime(endTime);
                    String newFilename = "trimmed_" + filename;
                    Path newTargetLocation = this.uploadPath.resolve(newFilename);
                    try {
                        ProcessBuilder pb = new ProcessBuilder(
                                "ffmpeg", "-y", 
                                "-i", targetLocation.toString(),
                                "-ss", startTime, 
                                "-to", endTime,
                                newTargetLocation.toString());
                        pb.inheritIO();
                        Process process = pb.start();
                        int exitCode = process.waitFor();
                        if (exitCode == 0) {
                            chunk.setUri("uploads/" + newFilename);
                        } else {
                            System.err.println("FFmpeg failed with exit code " + exitCode);
                            return ResponseEntity.status(500).build();
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                        return ResponseEntity.status(500).build();
                    }
                }
                chunk.setRange(range);
            }

            // Add chunk to book
            if (sourceBook.getChunks() == null) {
                sourceBook.setChunks(new ArrayList<>());
            }
            sourceBook.getChunks().add(chunk);
            xmlService.saveSourceBookRegistry(registry);

            return ResponseEntity.ok(chunk);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/chunks/{bookId}/{chunkId}")
    public ResponseEntity<Void> deleteChunk(@PathVariable String bookId, @PathVariable String chunkId) {
        try {
            SourceBookRegistry registry = xmlService.getSourceBookRegistry();
            SourceBook sourceBook = registry.getBooks().stream()
                    .filter(b -> b.getId().equals(bookId))
                    .findFirst()
                    .orElse(null);

            if (sourceBook == null || sourceBook.getChunks() == null) {
                return ResponseEntity.notFound().build();
            }

            boolean removed = sourceBook.getChunks().removeIf(chunk -> chunk.getId().equals(chunkId));

            if (removed) {
                xmlService.saveSourceBookRegistry(registry);
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
