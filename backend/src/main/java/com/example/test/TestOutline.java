package com.example.test;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.interactive.documentnavigation.outline.PDDocumentOutline;
import org.apache.pdfbox.pdmodel.interactive.documentnavigation.outline.PDOutlineItem;

import java.io.File;

public class TestOutline {
    public static void main(String[] args) throws Exception {
        PDDocument doc = Loader.loadPDF(new File("uploads/0ecbc562-2e12-4179-8326-90e9b6c7c153_NLP-Assignemtn-2_MT2025015.pdf"));
        PDDocumentOutline outline = doc.getDocumentCatalog().getDocumentOutline();
        if (outline != null) {
            PDOutlineItem item = outline.getFirstChild();
            PDPage page = item.findDestinationPage(doc);
            int pageNum = doc.getPages().indexOf(page) + 1;
            System.out.println("Page number: " + pageNum);
        }
        doc.close();
    }
}
