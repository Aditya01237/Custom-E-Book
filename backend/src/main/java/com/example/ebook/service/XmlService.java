package com.example.ebook.service;

import com.example.ebook.model.CustomBookRegistry;
import com.example.ebook.model.SourceBook;
import com.example.ebook.model.SourceBookRegistry;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.xml.bind.JAXBContext;
import jakarta.xml.bind.JAXBException;
import jakarta.xml.bind.Marshaller;
import jakarta.xml.bind.Unmarshaller;
import jakarta.xml.bind.ValidationEvent;
import jakarta.xml.bind.ValidationEventHandler;

import javax.xml.XMLConstants;
import javax.xml.validation.Schema;
import javax.xml.validation.SchemaFactory;
import org.xml.sax.SAXException;

import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class XmlService {

    private static final String BOOKS_DB_PATH = "data/books.xml";
    private static final String EBOOKS_DB_PATH = "data/ebooks.xml";

    private SourceBookRegistry sourceBookRegistry;
    private CustomBookRegistry customBookRegistry;
    
    private Schema booksSchema;
    private Schema ebooksSchema;

    @PostConstruct
    public void init() {
        new File("data").mkdirs();
        try {
            booksSchema = getSchema("books.xsd");
            ebooksSchema = getSchema("ebooks.xsd");
            loadSourceBookRegistry();
            loadCustomBookRegistry();
        } catch (SAXException | JAXBException | IOException e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to initialize XmlService", e);
        }
    }
    
    private Schema getSchema(String schemaResource) throws SAXException {
        URL schemaUrl = getClass().getClassLoader().getResource(schemaResource);
        if (schemaUrl == null) {
            throw new RuntimeException("Schema file " + schemaResource + " not found in classpath");
        }
        SchemaFactory sf = SchemaFactory.newInstance(XMLConstants.W3C_XML_SCHEMA_NS_URI);
        return sf.newSchema(schemaUrl);
    }
    
    private ValidationEventHandler getValidationEventHandler() {
        return new ValidationEventHandler() {
            @Override
            public boolean handleEvent(ValidationEvent event) {
                System.err.println("XML Validation Error: " + event.getMessage());
                return false; 
            }
        };
    }

    // ─── Source Book Registry ────────────────────────────────────────────

    public synchronized SourceBookRegistry getSourceBookRegistry() {
        return sourceBookRegistry;
    }

    public synchronized void saveSourceBookRegistry(SourceBookRegistry registry) throws JAXBException {
        this.sourceBookRegistry = registry;
        saveToXml(registry, BOOKS_DB_PATH, booksSchema);
    }

    // ─── Custom Book (Ebook) Registry ───────────────────────────────────

    public synchronized CustomBookRegistry getCustomBookRegistry() {
        return customBookRegistry;
    }

    public synchronized void saveCustomBookRegistry(CustomBookRegistry registry) throws JAXBException {
        this.customBookRegistry = registry;
        saveToXml(registry, EBOOKS_DB_PATH, ebooksSchema);
    }

    // ─── Helper: Get all chunks flat (for marketplace browsing) ─────────

    public synchronized List<ChunkWithBookInfo> getAllChunksFlat() {
        List<ChunkWithBookInfo> result = new ArrayList<>();
        for (SourceBook book : sourceBookRegistry.getBooks()) {
            if (book.getChunks() != null) {
                for (SourceBook.SourceChunk chunk : book.getChunks()) {
                    result.add(new ChunkWithBookInfo(chunk, book.getId(), book.getTitle()));
                }
            }
        }
        return result;
    }

    // ─── Helper: Find a specific chunk by bookId + chunkId ──────────────

    public synchronized Optional<SourceBook.SourceChunk> findChunk(String bookId, String chunkId) {
        return sourceBookRegistry.getBooks().stream()
                .filter(b -> b.getId().equals(bookId))
                .flatMap(b -> b.getChunks() != null ? b.getChunks().stream() : java.util.stream.Stream.empty())
                .filter(c -> c.getId().equals(chunkId))
                .findFirst();
    }

    // ─── Helper: Find a source book by id ───────────────────────────────

    public synchronized Optional<SourceBook> findSourceBook(String bookId) {
        return sourceBookRegistry.getBooks().stream()
                .filter(b -> b.getId().equals(bookId))
                .findFirst();
    }

    // ─── Private loaders ────────────────────────────────────────────────

    private void loadSourceBookRegistry() throws JAXBException, IOException {
        File file = new File(BOOKS_DB_PATH);
        if (!file.exists()) {
            sourceBookRegistry = new SourceBookRegistry();
            saveSourceBookRegistry(sourceBookRegistry);
            return;
        }
        JAXBContext context = JAXBContext.newInstance(SourceBookRegistry.class);
        Unmarshaller unmarshaller = context.createUnmarshaller();
        if (booksSchema != null) {
            unmarshaller.setSchema(booksSchema);
            unmarshaller.setEventHandler(getValidationEventHandler());
        }
        sourceBookRegistry = (SourceBookRegistry) unmarshaller.unmarshal(file);
    }

    private void loadCustomBookRegistry() throws JAXBException, IOException {
        File file = new File(EBOOKS_DB_PATH);
        if (!file.exists()) {
            customBookRegistry = new CustomBookRegistry();
            saveCustomBookRegistry(customBookRegistry);
            return;
        }
        JAXBContext context = JAXBContext.newInstance(CustomBookRegistry.class);
        Unmarshaller unmarshaller = context.createUnmarshaller();
        if (ebooksSchema != null) {
            unmarshaller.setSchema(ebooksSchema);
            unmarshaller.setEventHandler(getValidationEventHandler());
        }
        customBookRegistry = (CustomBookRegistry) unmarshaller.unmarshal(file);
    }

    private <T> void saveToXml(T object, String filePath, Schema schema) throws JAXBException {
        JAXBContext context = JAXBContext.newInstance(object.getClass());
        Marshaller marshaller = context.createMarshaller();
        marshaller.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, true);
        if (schema != null) {
            marshaller.setSchema(schema);
            marshaller.setEventHandler(getValidationEventHandler());
        }
        marshaller.marshal(object, new File(filePath));
    }

    // ─── DTO for flat chunk listing ─────────────────────────────────────

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class ChunkWithBookInfo {
        private SourceBook.SourceChunk chunk;
        private String bookId;
        private String bookTitle;
    }
}
