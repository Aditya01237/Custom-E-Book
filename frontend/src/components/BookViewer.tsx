import React, { useState, useEffect } from 'react';
import EbookList from './viewer/EbookList';
import EbookReader from './viewer/EbookReader';

interface Ebook {
    id: string;
    title: string;
    createdBy: string;
    totalCost: number;
    chunkRefs: Array<{
        bookId: string;
        chunkId: string;
        seq: number;
        note: string;
    }>;
}

interface SourceBook {
    id: string;
    title: string;
    author: string;
    chunks: Array<{
        id: string;
        title: string;
        chunkType: string;
        uri: string;
        price: number;
        range?: {
            startPage: number;
            endPage: number;
        };
    }>;
    file?: { path: string };
}

const BookViewer: React.FC = () => {
    const [ebooks, setEbooks] = useState<Ebook[]>([]);
    const [selectedEbook, setSelectedEbook] = useState<Ebook | null>(null);
    const [sourceBooks, setSourceBooks] = useState<SourceBook[]>([]);

    // Fetch all ebooks and source books
    useEffect(() => {
        fetch('/api/ebooks')
            .then(res => res.json())
            .then(data => setEbooks(data || []))
            .catch(console.error);

        fetch('/api/books/source')
            .then(res => res.json())
            .then(data => setSourceBooks(data || []))
            .catch(console.error);
    }, []);

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-20">
            {/* Select an Ebook */}
            <EbookList 
                ebooks={ebooks} 
                selectedEbook={selectedEbook} 
                setSelectedEbook={setSelectedEbook} 
            />

            {/* Render Selected Ebook */}
            <EbookReader 
                selectedEbook={selectedEbook} 
                sourceBooks={sourceBooks} 
            />
        </div>
    );
};

export default BookViewer;
