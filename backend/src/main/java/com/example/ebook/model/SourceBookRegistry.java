package com.example.ebook.model;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlRootElement;
import java.util.List;
import java.util.ArrayList;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@XmlRootElement(name = "SourceBookRegistry")
@XmlAccessorType(XmlAccessType.FIELD)
public class SourceBookRegistry {

    @XmlElement(name = "book")
    private List<SourceBook> books = new ArrayList<>();
}
