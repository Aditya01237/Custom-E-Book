import React, { useState, useEffect } from 'react';
import BookSelection from './author/BookSelection';
import ChunkEditor from './author/ChunkEditor';
import ChunkList from './author/ChunkList';


const AuthorDashboard: React.FC = () => {
    const [step, setStep] = useState<'select-flow' | 'create-book' | 'select-book' | 'chunking'>('select-flow');
    const [sourceBooks, setSourceBooks] = useState<any[]>([]);
    const [selectedBook, setSelectedBook] = useState<any | null>(null);

    // Book Creation State
    const [bookTitle, setBookTitle] = useState('');
    const [bookAuthor, setBookAuthor] = useState('');

    // Chunking State
    const [chunkTitle, setChunkTitle] = useState('');
    const [price, setPrice] = useState('');
    const [chunkType, setChunkType] = useState('text');
    const [file, setFile] = useState<File | null>(null);
    const [driveUrl, setDriveUrl] = useState('');
    const [isVirtual, setIsVirtual] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Virtual Range States
    const [startPage, setStartPage] = useState('');
    const [endPage, setEndPage] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    // AI Auto-chunking State
    const [isAutoChunking, setIsAutoChunking] = useState(false);
    const [autoChunkResults, setAutoChunkResults] = useState<any[]>([]);
    const [proposedChunks, setProposedChunks] = useState<any[] | null>(null);

    useEffect(() => {
        if (step === 'select-flow') {
            fetchBooks();
        }
    }, [step]);

    const fetchBooks = async () => {
        try {
            const res = await fetch('/api/books/source');
            const data = await res.json();
            setSourceBooks(data);
        } catch (err) {
            console.error('Failed to fetch books:', err);
        }
    };

    const fetchSelectedBook = async (id: string) => {
        try {
            const res = await fetch(`/api/books/source/${id}`);
            const data = await res.json();
            setSelectedBook(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateBook = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/books/source', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: bookTitle, author: bookAuthor })
            });
            if (res.ok) {
                const newBook = await res.json();
                setSelectedBook(newBook);
                setBookTitle('');
                setBookAuthor('');
                setStep('chunking');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleUploadChunk = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBook) return;
        if (!file && !driveUrl && !selectedBook.file?.path) {
            alert('Please select a file or choose from Google Drive before creating a chunk.');
            return;
        }
        
        setIsUploading(true);
        const formData = new FormData();
        if (file) formData.append('file', file);
        formData.append('bookId', selectedBook.id);
        formData.append('title', chunkTitle);
        formData.append('price', price || '0');
        formData.append('chunkType', chunkType);
        formData.append('isVirtual', isVirtual.toString());

        if (driveUrl) {
            formData.append('driveUrl', driveUrl);
        }

        if (isVirtual) {
            if (chunkType === 'text' || chunkType === 'pdf') {
                formData.append('startPage', startPage);
                formData.append('endPage', endPage);
            } else {
                formData.append('startTime', startTime);
                formData.append('endTime', endTime);
            }
        }

        try {
            const res = await fetch('/api/chunks/upload', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                setChunkTitle('');
                setPrice('');
                setStartPage('');
                setEndPage('');
                setStartTime('');
                setEndTime('');
                setDriveUrl('');
                await fetchSelectedBook(selectedBook.id);
            }
        } catch (err) {
            console.error('Failed to upload chunk:', err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteChunk = async (chunkId: string) => {
        if (!selectedBook) return;
        try {
            await fetch(`/api/chunks/${selectedBook.id}/${chunkId}`, { method: 'DELETE' });
            await fetchSelectedBook(selectedBook.id);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAutoChunk = async () => {
        if (!selectedBook) return;
        if (!file && !selectedBook.file?.path) return;

        setIsAutoChunking(true);
        setAutoChunkResults([]);
        setProposedChunks(null);

        const formData = new FormData();
        if (file) {
            formData.append('file', file);
        }
        formData.append('bookId', selectedBook.id);

        try {
            const res = await fetch('/api/chunks/auto-chunk', {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                setAutoChunkResults(data);
                setProposedChunks(data.map((item: any) => ({
                    title: item.title,
                    startPage: item.page,
                    endPage: item.page + 5,
                    price: 2.00,
                    virtual: true,
                    chunkType: 'pdf'
                })));
            }
        } catch (err) {
            console.error("Auto chunking failed", err);
        } finally {
            setIsAutoChunking(false);
        }
    };

    const handleSaveBulkChunks = async () => {
        if (!selectedBook || !proposedChunks) return;
        setIsUploading(true);

        try {
            for (const chunk of proposedChunks) {
                const formData = new FormData();
                if (file) {
                    formData.append('file', file);
                }
                formData.append('bookId', selectedBook.id);
                formData.append('title', chunk.title);
                formData.append('price', chunk.price.toString());
                formData.append('chunkType', chunk.chunkType);
                formData.append('isVirtual', 'true');
                formData.append('startPage', chunk.startPage.toString());
                formData.append('endPage', chunk.endPage.toString());

                await fetch('/api/chunks/upload', {
                    method: 'POST',
                    body: formData
                });
            }

            setProposedChunks(null);
            setAutoChunkResults([]);
            await fetchSelectedBook(selectedBook.id);

        } catch (err) {
            console.error('Failed bulk upload:', err);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen py-6 px-4 animate-fade-in relative z-10 w-full mb-10">
            <div className="max-w-4xl mx-auto space-y-8">
                {step !== 'chunking' ? (
                    <BookSelection
                        step={step}
                        setStep={setStep}
                        sourceBooks={sourceBooks}
                        fetchBooks={fetchBooks}
                        setSelectedBook={setSelectedBook}
                        handleCreateBook={handleCreateBook}
                        bookTitle={bookTitle}
                        setBookTitle={setBookTitle}
                        bookAuthor={bookAuthor}
                        setBookAuthor={setBookAuthor}
                    />
                ) : (
                    <div className="animate-slide-up space-y-8">
                        <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-2xl p-8 text-white shadow-md relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                            <div className="relative z-10 flex justify-between items-center">
                                <div>
                                    <h1 className="text-3xl font-extrabold tracking-tight mb-2">{selectedBook?.title || bookTitle}</h1>
                                    <p className="text-indigo-200 font-medium">by {selectedBook?.author || bookAuthor}</p>
                                </div>
                                <span className="bg-indigo-800 text-indigo-100 px-4 py-2 rounded-lg font-bold shadow-inner">
                                    {selectedBook?.chunks?.length || 0} Extraction(s)
                                </span>
                            </div>
                        </div>

                        <ChunkEditor
                            selectedBook={selectedBook}
                            chunkType={chunkType} setChunkType={setChunkType}
                            file={file} setFile={setFile}
                            isVirtual={isVirtual} setIsVirtual={setIsVirtual}
                            startPage={startPage} setStartPage={setStartPage}
                            endPage={endPage} setEndPage={setEndPage}
                            startTime={startTime} setStartTime={setStartTime}
                            endTime={endTime} setEndTime={setEndTime}
                            chunkTitle={chunkTitle} setChunkTitle={setChunkTitle}
                            price={price} setPrice={setPrice}
                            handleUploadChunk={handleUploadChunk}
                            isUploading={isUploading}
                            handleAutoChunk={handleAutoChunk}
                            isAutoChunking={isAutoChunking}
                            autoChunkResults={autoChunkResults}
                            driveUrl={driveUrl}
                            setDriveUrl={setDriveUrl}
                        />

                        <ChunkList
                            proposedChunks={proposedChunks}
                            setProposedChunks={setProposedChunks}
                            handleSaveBulkChunks={handleSaveBulkChunks}
                            isUploading={isUploading}
                            selectedBook={selectedBook}
                            handleDeleteChunk={handleDeleteChunk}
                            setStep={setStep}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthorDashboard;