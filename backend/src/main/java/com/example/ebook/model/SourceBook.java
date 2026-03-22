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
@XmlRootElement(name = "book")
@XmlAccessorType(XmlAccessType.FIELD)
public class SourceBook {

    @XmlAttribute
    private String id;

    @XmlElement(name = "title")
    private String title;

    @XmlElement(name = "author")
    private String author;

    @XmlElement(name = "file")
    private FileInfo file;

    @XmlElementWrapper(name = "chunks")
    @XmlElement(name = "chunk")
    private List<SourceChunk> chunks = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @XmlAccessorType(XmlAccessType.FIELD)
    public static class FileInfo {
        @XmlElement(name = "path")
        private String path;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @XmlAccessorType(XmlAccessType.FIELD)
    public static class SourceChunk {
        @XmlAttribute
        private String id;

        @XmlElement(name = "title")
        private String title;

        @XmlElement(name = "chunkType")
        private String chunkType; // text, video, audio, image

        @XmlElement(name = "isVirtual")
        private boolean isVirtual;

        @XmlElement(name = "range")
        private Range range;

        @XmlElement(name = "price")
        private double price;

        @XmlElement(name = "uri")
        private String uri; // path to the uploaded file for this chunk
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @XmlAccessorType(XmlAccessType.FIELD)
    public static class Range {
        @XmlElement(name = "startPage")
        private int startPage;

        @XmlElement(name = "endPage")
        private int endPage;

        @XmlElement(name = "startTime")
        private String startTime;

        @XmlElement(name = "endTime")
        private String endTime;
    }
}
