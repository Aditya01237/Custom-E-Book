package com.example.ebook.service;

import com.example.ebook.model.Book;
import com.example.ebook.model.CustomBookRegistry;
import com.example.ebook.model.SourceBook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

class EpubExportServiceTest {

    private XmlService xmlService;
    private EpubExportService epubExportService;

    @BeforeEach
    void setUp() {
        xmlService = Mockito.mock(XmlService.class);
        epubExportService = new EpubExportService(xmlService);
    }

    @Test
    void exportAsEpub_success() throws IOException {
        // Arrange
        String bookId = "book-123";
        Book book = new Book();
        book.setId(bookId);
        book.setTitle("Test Book");
        book.setCreatedBy("Test Author");
        
        List<Book.ChunkRef> chunkRefs = new ArrayList<>();
        Book.ChunkRef textRef = new Book.ChunkRef(bookId, "chunk-1", 1, "");
        chunkRefs.add(textRef);
        book.setChunkRefs(chunkRefs);

        CustomBookRegistry registry = new CustomBookRegistry();
        registry.setEbooks(List.of(book));
        when(xmlService.getCustomBookRegistry()).thenReturn(registry);

        SourceBook.SourceChunk textChunk = new SourceBook.SourceChunk();
        textChunk.setId("chunk-1");
        textChunk.setTitle("Chapter 1");
        textChunk.setChunkType("text");
        textChunk.setVirtual(true); // virtual to skip PDF extraction for simplicity
        
        when(xmlService.findChunk(bookId, "chunk-1")).thenReturn(Optional.of(textChunk));

        // Act
        byte[] epubData = epubExportService.exportAsEpub(bookId);

        // Assert
        assertNotNull(epubData);
        assertTrue(epubData.length > 0);

        // Verify Zip contents
        boolean hasMimetype = false;
        boolean hasContainerXml = false;
        boolean hasContentOpf = false;
        boolean hasTocNcx = false;
        boolean hasNavXhtml = false;
        boolean hasChunk1 = false;
        boolean hasStyleCss = false;

        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(epubData))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                switch (entry.getName()) {
                    case "mimetype": hasMimetype = true; break;
                    case "META-INF/container.xml": hasContainerXml = true; break;
                    case "OEBPS/content.opf": hasContentOpf = true; break;
                    case "OEBPS/toc.ncx": hasTocNcx = true; break;
                    case "OEBPS/nav.xhtml": hasNavXhtml = true; break;
                    case "OEBPS/text/chunk_1.xhtml": hasChunk1 = true; break;
                    case "OEBPS/css/style.css": hasStyleCss = true; break;
                }
            }
        }

        assertTrue(hasMimetype, "mimetype should exist");
        assertTrue(hasContainerXml, "META-INF/container.xml should exist");
        assertTrue(hasContentOpf, "OEBPS/content.opf should exist");
        assertTrue(hasTocNcx, "OEBPS/toc.ncx should exist");
        assertTrue(hasNavXhtml, "OEBPS/nav.xhtml should exist");
        assertTrue(hasChunk1, "OEBPS/text/chunk_1.xhtml should exist");
        assertTrue(hasStyleCss, "OEBPS/css/style.css should exist");
    }

    @Test
    void exportAsEpub_notFound() {
        when(xmlService.getCustomBookRegistry()).thenReturn(new CustomBookRegistry());
        
        Exception exception = assertThrows(RuntimeException.class, () -> {
            epubExportService.exportAsEpub("non-existent");
        });
        
        assertEquals("E-Book not found", exception.getMessage());
    }
}
