import React, { useState, useEffect } from 'react';
import { Download, BookOpen, FileText, Video, Mic, Image as ImageIcon } from 'lucide-react';

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
}

const BookViewer: React.FC = () => {
    const [ebooks, setEbooks] = useState<Ebook[]>([]);
    const [selectedEbook, setSelectedEbook] = useState<Ebook | null>(null);
    const [sourceBooks, setSourceBooks] = useState<SourceBook[]>([]);
    const [loading, setLoading] = useState(false);

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

    const findChunk = (bookId: string, chunkId: string) => {
        const book = sourceBooks.find(b => b.id === bookId);
        if (!book || !book.chunks) return null;
        return { chunk: book.chunks.find(c => c.id === chunkId), bookTitle: book.title };
    };

    const renderChunk = (ref: Ebook['chunkRefs'][0]) => {
        const found = findChunk(ref.bookId, ref.chunkId);
        if (!found || !found.chunk) {
            return (
                <div className="p-4 border border-red-300 bg-red-50 text-red-600 mb-4 rounded-lg">
                    Chunk not found: Book={ref.bookId}, Chunk={ref.chunkId}
                </div>
            );
        }

        const { chunk, bookTitle } = found;
        const mediaUrl = chunk.uri ? `/${chunk.uri}` : null;

        return (
            <div key={ref.seq} className="mb-8 p-6 bg-white shadow-lg rounded-xl border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800">
                        <span className="text-gray-400 mr-2">#{ref.seq}</span>
                        {chunk.title}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-medium">{bookTitle}</span>
                        <span className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-600 uppercase tracking-wide text-xs font-bold">
                            {chunk.chunkType}
                        </span>
                    </div>
                </div>

                <div className="mb-4">
                    {chunk.chunkType === 'video' && mediaUrl && (
                        <video controls className="w-full rounded-lg bg-black box-border" src={mediaUrl}>
                            Your browser does not support video.
                        </video>
                    )}
                    {chunk.chunkType === 'audio' && mediaUrl && (
                        <audio controls className="w-full mt-2" src={mediaUrl}>
                            Your browser does not support audio.
                        </audio>
                    )}
                    {chunk.chunkType === 'text' && mediaUrl && (
                        <div className="flex flex-col gap-2">
                            <object data={mediaUrl} type="application/pdf" className="w-full h-[600px] border rounded">
                                <p>Your browser does not support PDFs. <a href={mediaUrl} download className="text-blue-600 underline">Download the PDF</a>.</p>
                            </object>
                            <a href={mediaUrl} download className="flex items-center gap-2 text-blue-600 font-bold hover:underline">
                                <Download size={16} /> Download
                            </a>
                        </div>
                    )}
                    {chunk.chunkType === 'image' && mediaUrl && (
                        <img src={mediaUrl} alt={chunk.title} className="max-w-full h-auto rounded" />
                    )}
                    {chunk.chunkType === 'virtual' && (
                        <div className="flex flex-col gap-2">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 text-center">
                                <BookOpen size={36} className="text-blue-400 mx-auto mb-2" />
                                <p className="text-gray-700 font-medium">Virtual Chunk Reference</p>
                                {chunk.range && (
                                    <p className="text-gray-500 text-sm mt-1">Pages {chunk.range.startPage} – {chunk.range.endPage}</p>
                                )}
                            </div>
                            {mediaUrl && mediaUrl.toLowerCase().endsWith('.pdf') && (
                                <object 
                                    data={`${mediaUrl}${chunk.range?.startPage ? `#page=${chunk.range.startPage}` : ''}`} 
                                    type="application/pdf" 
                                    className="w-full h-[600px] border rounded mt-2"
                                >
                                    <p>Your browser does not support PDFs. <a href={mediaUrl} download className="text-blue-600 underline">Download the PDF</a>.</p>
                                </object>
                            )}
                        </div>
                    )}
                </div>

                {ref.note && (
                    <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400 text-gray-700 italic">
                        <strong>My Note:</strong> {ref.note}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-3xl mx-auto p-4">
            {/* Select an Ebook */}
            <div className="bg-white p-6 rounded shadow-sm mb-8">
                <h2 className="text-lg font-bold mb-3">Your E-Books</h2>
                {ebooks.length === 0 ? (
                    <p className="text-gray-500">No ebooks created yet. Go to the Student tab to assemble one!</p>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {ebooks.map(ebook => (
                            <button
                                key={ebook.id}
                                onClick={() => setSelectedEbook(ebook)}
                                className={`text-left border p-4 rounded-lg transition-all ${
                                    selectedEbook?.id === ebook.id
                                        ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                                        : 'hover:bg-gray-50'
                                }`}
                            >
                                <p className="font-bold text-gray-800">{ebook.title}</p>
                                <p className="text-sm text-gray-500">
                                    By {ebook.createdBy} • ${ebook.totalCost.toFixed(2)} •{' '}
                                    {ebook.chunkRefs?.length || 0} chunks
                                </p>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Render Selected Ebook */}
            {selectedEbook && (
                <div className="animate-fade-in">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{selectedEbook.title}</h1>
                        <p className="text-gray-500">
                            Created By: {selectedEbook.createdBy} • Total Cost: ${selectedEbook.totalCost.toFixed(2)}
                        </p>
                    </div>

                    <div className="space-y-6">
                        {selectedEbook.chunkRefs
                            ?.sort((a, b) => a.seq - b.seq)
                            .map(ref => renderChunk(ref))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookViewer;
