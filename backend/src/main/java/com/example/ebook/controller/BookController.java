package com.example.ebook.controller;

import com.example.ebook.model.Book;

import com.example.ebook.service.BookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.Resource;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ebooks")
@CrossOrigin(origins = "*")
public class BookController {

    private final BookService bookService;

    @Autowired
    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    @PostMapping("/create")
    public ResponseEntity<Book> createBook(@RequestBody Book book) { // create
        return bookService.createBook(book);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Book> getBook(@PathVariable String id) { // get
        return bookService.getBook(id);
    }

    @GetMapping
    public ResponseEntity<List<Book>> getAllBooks() { //get all
        return bookService.getAllBooks();
    }

    @GetMapping("/{id}/export/epub")
    public ResponseEntity<Resource> exportBookAsEpub(@PathVariable String id) { // export
        return bookService.exportBook(id);
    }
}
