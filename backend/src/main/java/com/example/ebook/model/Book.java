package com.example.ebook.model;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlAttribute;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlElementWrapper;
import jakarta.xml.bind.annotation.XmlRootElement;
import java.util.List;
import java.util.ArrayList;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@XmlRootElement(name = "ebook")
@XmlAccessorType(XmlAccessType.FIELD)
public class Book {

    @XmlAttribute
    private String id;

    @XmlElement(name = "title")
    private String title;

    @XmlElement(name = "createdBy")
    private String createdBy;

    @XmlElement(name = "totalCost")
    private double totalCost;

    @XmlElementWrapper(name = "chunks")
    @XmlElement(name = "chunkRef")
    private List<ChunkRef> chunkRefs = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @XmlAccessorType(XmlAccessType.FIELD)
    public static class ChunkRef {
        @XmlAttribute
        private String bookId;

        @XmlAttribute
        private String chunkId;

        @XmlAttribute
        private int seq;

        @XmlElement(name = "note")
        private String note;
    }
}
