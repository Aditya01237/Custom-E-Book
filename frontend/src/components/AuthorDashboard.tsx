import React, { useState, useEffect } from 'react';
import { FileText, Mic, Video, Plus, BookOpen, Trash2, ArrowLeft } from 'lucide-react';

interface Range {
    startPage?: number;
    endPage?: number;
    startTime?: string;
    endTime?: string;
}

interface SourceChunk {
    id: string;
    title: string;
    chunkType: string;
    virtual: boolean;
    price: number;
    uri: string;
    range?: Range;
}

interface SourceBook {
    id: string;
    title: string;
    author: string;
    chunks?: SourceChunk[];
}

type WizardStep = 'select-flow' | 'create-book' | 'select-book' | 'chunking';

const AuthorDashboard: React.FC = () => {
    const [step, setStep] = useState<WizardStep>('select-flow');
    const [sourceBooks, setSourceBooks] = useState<SourceBook[]>([]);
    const [selectedBook, setSelectedBook] = useState<SourceBook | null>(null);

    // Create Book State
    const [bookTitle, setBookTitle] = useState('');
    const [bookAuthor, setBookAuthor] = useState('');

    // Chunking State
    const [chunkTitle, setChunkTitle] = useState('');
    const [chunkType, setChunkType] = useState('text');
    const [isVirtual, setIsVirtual] = useState(false);
    const [price, setPrice] = useState('');
    
    // Range State
    const [startPage, setStartPage] = useState('');
    const [endPage, setEndPage] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const fetchBooks = () => {
        return fetch('/api/books/source')
            .then(res => res.json())
            .then(data => {
                setSourceBooks(data || []);
                return data;
            })
            .catch(console.error);
    };

    const fetchSelectedBook = async (bookId: string) => {
        try {
            const res = await fetch(`/api/books/source/${bookId}`);
            if (res.ok) {
                const book = await res.json();
                setSelectedBook(book);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchBooks();
    }, []);

    const handleCreateBook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bookTitle) return;

        try {
            const res = await fetch('/api/books/source', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: bookTitle, author: bookAuthor || 'Unknown Author' })
            });

            if (res.ok) {
                const newBook = await res.json();
                setBookTitle('');
                setBookAuthor('');
                fetchBooks();
                setSelectedBook(newBook);
                setStep('chunking');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleUploadChunk = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBook || !file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bookId', selectedBook.id);
        formData.append('title', chunkTitle);
        formData.append('price', price || '0');
        formData.append('chunkType', chunkType);
        formData.append('isVirtual', isVirtual.toString());

        if (isVirtual) {
            if (chunkType === 'text') {
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
                // Clear inputs EXCEPT file, so user can create another chunk quickly
                setChunkTitle('');
                setPrice('');
                setStartPage('');
                setEndPage('');
                setStartTime('');
                setEndTime('');
                
                // Refresh book data to see new chunks
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
            const res = await fetch(`/api/chunks/${selectedBook.id}/${chunkId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                await fetchSelectedBook(selectedBook.id);
            }
        } catch (err) {
            console.error('Failed to delete chunk:', err);
        }
    };


    // ─── Render Helpers ──────────────────────────────────────────────────────────

    const renderHeader = (title: string, onBack?: () => void) => (
        <div className="flex items-center gap-3 mb-6">
            {onBack && (
                <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-800">
                    <ArrowLeft size={20} />
                </button>
            )}
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-10 px-4">
            <div className="max-w-4xl mx-auto space-y-8">

                {step === 'select-flow' && (
                    <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-sm p-10 mt-10 text-center">
                        <h2 className="text-3xl font-bold text-gray-800 mb-8">What would you like to do?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button
                                onClick={() => setStep('create-book')}
                                className="group p-8 rounded-2xl border-2 border-blue-100 bg-blue-50 hover:bg-blue-600 hover:border-blue-600 transition-all flex flex-col items-center gap-4 shadow-sm hover:shadow-lg"
                            >
                                <div className="p-4 bg-white rounded-full group-hover:bg-blue-500 transition-colors">
                                    <BookOpen size={40} className="text-blue-600 group-hover:text-white" />
                                </div>
                                <span className="text-xl font-bold text-blue-900 group-hover:text-white transition-colors">Create Chunked Book</span>
                                <p className="text-sm text-blue-600/80 group-hover:text-blue-100">Start fresh. Enter metadata and upload your files to create chunks.</p>
                            </button>

                            <button
                                onClick={() => {
                                    fetchBooks();
                                    setStep('select-book');
                                }}
                                className="group p-8 rounded-2xl border-2 border-green-100 bg-green-50 hover:bg-green-600 hover:border-green-600 transition-all flex flex-col items-center gap-4 shadow-sm hover:shadow-lg"
                            >
                                <div className="p-4 bg-white rounded-full group-hover:bg-green-500 transition-colors">
                                    <FileText size={40} className="text-green-600 group-hover:text-white" />
                                </div>
                                <span className="text-xl font-bold text-green-900 group-hover:text-white transition-colors">Update Chunked Book</span>
                                <p className="text-sm text-green-600/80 group-hover:text-green-100">Select an existing book to add, modify, or remove its chunks.</p>
                            </button>
                        </div>
                    </div>
                )}

                {step === 'create-book' && (
                    <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-sm p-8 max-w-2xl mx-auto mt-10">
                        {renderHeader('Create New Book', () => setStep('select-flow'))}
                        <form onSubmit={handleCreateBook} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Book Title</label>
                                <input
                                    type="text" required value={bookTitle} onChange={e => setBookTitle(e.target.value)}
                                    placeholder="Enter book title"
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Author</label>
                                <input
                                    type="text" value={bookAuthor} onChange={e => setBookAuthor(e.target.value)}
                                    placeholder="Enter author name"
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-lg"
                                />
                            </div>
                            <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-md flex justify-center items-center gap-2 transition-colors mt-4">
                                Continue to Chunks <ArrowLeft className="rotate-180" size={20} />
                            </button>
                        </form>
                    </div>
                )}

                {step === 'select-book' && (
                    <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-sm p-8 mt-10">
                        {renderHeader('Select a Book to Update', () => setStep('select-flow'))}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {sourceBooks.map(book => (
                                <button
                                    key={book.id}
                                    onClick={() => {
                                        setSelectedBook(book);
                                        setStep('chunking');
                                    }}
                                    className="flex flex-col text-left p-5 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-md bg-white transition-all hover:-translate-y-1"
                                >
                                    <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{book.title}</h3>
                                    <p className="text-sm text-gray-500 mb-3">{book.author}</p>
                                    <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-600 rounded-md w-fit">
                                        {book.chunks?.length || 0} Chunks
                                    </span>
                                </button>
                            ))}
                            {sourceBooks.length === 0 && (
                                <div className="col-span-full py-10 text-center text-gray-500">
                                    No books found. Please create one first.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 'chunking' && selectedBook && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        
                        <div className="flex justify-between items-center mb-6">
                            <button onClick={() => setStep('select-flow')} className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2">
                                <ArrowLeft size={18} /> Back to Menu
                            </button>
                            <h3 className="font-bold text-gray-700 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                                Editing: <span className="text-gray-900">{selectedBook.title}</span>
                            </h3>
                        </div>

                        {/* Chunking Form UI */}
                        <div className="bg-white border text-gray-800 border-gray-200 rounded-2xl shadow-xl overflow-hidden mb-8">
                            <div className="bg-gray-50 border-b border-gray-200 p-6 sm:p-8">
                                <h2 className="text-2xl font-bold mb-6 text-gray-900">1. Upload Content & Select Format</h2>
                                
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {['text', 'pdf', 'audio', 'video'].map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setChunkType(type)}
                                            className={`px-5 py-2.5 rounded-full font-bold capitalize transition-all border-2
                                                ${chunkType === type 
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                                                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>

                                <div className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all ${file ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white hover:bg-gray-100'}`}>
                                    <input
                                        type="file"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={e => setFile(e.target.files?.[0] || null)}
                                    />
                                    <div className="flex flex-col items-center gap-3">
                                        {chunkType === 'text' || chunkType === 'pdf' ? <FileText size={48} className={file ? "text-green-600" : "text-gray-400"} /> : null}
                                        {chunkType === 'audio' && <Mic size={48} className={file ? "text-green-600" : "text-gray-400"} />}
                                        {chunkType === 'video' && <Video size={48} className={file ? "text-green-600" : "text-gray-400"} />}
                                        <div className="font-semibold text-lg">
                                            {file ? <span className="text-green-700">{file.name} (Uploaded)</span> : <span className="text-gray-600">Click or drag file here to upload</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 sm:p-8 border-t border-gray-100">
                                <h2 className="text-2xl font-bold mb-6 text-gray-900">2. Select Chunk Type & Metadata</h2>
                                <form onSubmit={handleUploadChunk}>
                                    
                                    <div className="flex gap-4 mb-8">
                                        <button
                                            type="button"
                                            onClick={() => setIsVirtual(false)}
                                            className={`flex-1 py-3 rounded-lg font-bold border-2 transition-all ${!isVirtual ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            PHYSICAL
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsVirtual(true)}
                                            className={`flex-1 py-3 rounded-lg font-bold border-2 transition-all ${isVirtual ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            VIRTUAL
                                        </button>
                                    </div>

                                    {/* Range Card (Only for Virtual) */}
                                    {isVirtual && (
                                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 mb-6">
                                            <h4 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">Range Selection</h4>
                                            
                                            {(chunkType === 'text' || chunkType === 'pdf') && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-indigo-800 mb-1">Start Page</label>
                                                        <input required type="number" value={startPage} onChange={e => setStartPage(e.target.value)} className="w-full border-gray-300 rounded-lg p-3" placeholder="e.g. 1" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-indigo-800 mb-1">End Page</label>
                                                        <input required type="number" value={endPage} onChange={e => setEndPage(e.target.value)} className="w-full border-gray-300 rounded-lg p-3" placeholder="e.g. 20" />
                                                    </div>
                                                </div>
                                            )}

                                            {(chunkType === 'audio' || chunkType === 'video') && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-indigo-800 mb-1">Start Time (hh:mm:ss)</label>
                                                        <input required type="text" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full border-gray-300 rounded-lg p-3" placeholder="00:00:30" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-indigo-800 mb-1">End Time (hh:mm:ss)</label>
                                                        <input required type="text" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full border-gray-300 rounded-lg p-3" placeholder="00:02:10" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Chunk Name</label>
                                            <input required type="text" value={chunkTitle} onChange={e => setChunkTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-blue-500" placeholder="e.g. Chapter 1 Summary" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Price ($)</label>
                                            <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-blue-500" placeholder="0.00" />
                                        </div>
                                    </div>

                                    <button 
                                        disabled={!file || isUploading}
                                        className="bg-blue-600 disabled:bg-blue-400 text-white font-bold py-4 px-8 rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg transition-all flex items-center gap-2"
                                    >
                                        {isUploading ? 'Creating...' : <>Create Chunk <Plus size={20} /></>}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Created Chunks List */}
                        <div className="mb-10">
                            <h2 className="text-2xl font-bold uppercase tracking-wider text-green-700 mb-6 flex items-center gap-2">
                                <span className="bg-green-100 text-green-800 w-8 h-8 rounded-full flex items-center justify-center text-sm">{selectedBook?.chunks?.length || 0}</span>
                                Created Chunks
                            </h2>
                            
                            {(!selectedBook.chunks || selectedBook.chunks.length === 0) ? (
                                <div className="text-gray-500 bg-gray-100 p-8 rounded-xl border border-dashed border-gray-300 text-center">
                                    No chunks created yet. Add one above!
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {selectedBook.chunks.map((chunk, index) => (
                                        <div key={chunk.id} className="relative bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">CHUNK #{index + 1}</span>
                                                    <button onClick={() => handleDeleteChunk(chunk.id)} className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-full transition-colors" title="Delete Chunk">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <h3 className="font-bold text-gray-900 text-lg mb-1">{chunk.title}</h3>
                                                <div className="text-xs text-gray-500 font-medium space-y-1">
                                                    <p>Type: <span className="uppercase text-gray-700">{chunk.chunkType}</span> • {chunk.virtual ? 'Virtual' : 'Physical'}</p>
                                                    <p>Price: ${chunk.price.toFixed(2)}</p>
                                                    {chunk.virtual && chunk.range && (
                                                        <p className="bg-indigo-50 text-indigo-700 px-2 py-1 inline-block rounded mt-1">
                                                            {(chunk.chunkType === 'text' || chunk.chunkType === 'pdf') 
                                                                ? `Pages: ${chunk.range.startPage} - ${chunk.range.endPage}`
                                                                : `Time: ${chunk.range.startTime} - ${chunk.range.endTime}`
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Submit returning to Dashboard root */}
                        <div className="flex justify-center mt-12 mb-10 pb-10">
                            <button 
                                onClick={() => setStep('select-flow')} 
                                className="bg-green-600 text-white font-bold text-lg py-4 px-12 rounded-full shadow-lg hover:bg-green-700 hover:scale-105 transition-all text-center tracking-wide"
                            >
                                SUBMIT AND FINISH BOOK
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default AuthorDashboard;