package com.example.ebook.service;

import org.springframework.stereotype.Service;
import com.example.ebook.model.Book;
import com.example.ebook.model.CustomBookRegistry;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;

import java.util.List;
import java.util.UUID;

@Service
public class BookService {
    private final XmlService xmlService;
    private final EpubExportService epubExportService;

    @Autowired
    public BookService(XmlService xmlService, EpubExportService epubExportService) {
        this.xmlService = xmlService;
        this.epubExportService = epubExportService;
    }

    public ResponseEntity<Book> createBook(Book book) {
        try {
            book.setId(UUID.randomUUID().toString());

            // Calculate total cost by looking up each chunk in source books
            double totalCost = 0;
            if (book.getChunkRefs() != null) {
                for (Book.ChunkRef ref : book.getChunkRefs()) {
                    var chunkOpt = xmlService.findChunk(ref.getBookId(), ref.getChunkId());
                    if (chunkOpt.isPresent()) {
                        totalCost += chunkOpt.get().getPrice();
                    }
                }
            }
            book.setTotalCost(totalCost);

            // Save
            CustomBookRegistry registry = xmlService.getCustomBookRegistry();
            registry.getEbooks().add(book);
            xmlService.saveCustomBookRegistry(registry);

            return ResponseEntity.ok(book);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    public ResponseEntity<Book> getBook(String id) {
        return xmlService.getCustomBookRegistry().getEbooks().stream()
                .filter(b -> b.getId().equals(id))
                .findFirst()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    public ResponseEntity<List<Book>> getAllBooks() {
        return ResponseEntity.ok(xmlService.getCustomBookRegistry().getEbooks());
    }

    public ResponseEntity<Resource> exportBook(String id) {
        try {
            byte[] epubData = epubExportService.exportAsEpub(id);
            ByteArrayResource resource = new ByteArrayResource(epubData);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"book-" + id + ".epub\"")
                    .contentType(MediaType.parseMediaType("application/epub+zip"))
                    .contentLength(epubData.length)
                    .body(resource);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
