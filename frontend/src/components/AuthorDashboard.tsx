import React, { useState, useEffect } from 'react';
import { Upload, FileText, Image, Mic, Video, Plus, BookOpen, Check } from 'lucide-react';

interface SourceBook {
    id: string;
    title: string;
    author: string;
}

const AuthorDashboard: React.FC = () => {
    const [bookTitle, setBookTitle] = useState('');
    const [bookAuthor, setBookAuthor] = useState('');

    const [sourceBooks, setSourceBooks] = useState<SourceBook[]>([]);
    const [selectedBookId, setSelectedBookId] = useState('');

    const [chunkTitle, setChunkTitle] = useState('');
    const [chunkType, setChunkType] = useState('text');
    const [isVirtual, setIsVirtual] = useState(false);
    const [price, setPrice] = useState('');

    const [startPage, setStartPage] = useState('');
    const [endPage, setEndPage] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    const [file, setFile] = useState<File | null>(null);

    const fetchBooks = () => {
        fetch('/api/books/source')
            .then(res => res.json())
            .then(data => setSourceBooks(data || []))
            .catch(console.error);
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
                setBookTitle('');
                setBookAuthor('');
                fetchBooks();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleUploadChunk = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedBookId || !file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('bookId', selectedBookId);
        formData.append('title', chunkTitle);
        formData.append('price', price);
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
                setChunkTitle('');
                setPrice('');
                setStartPage('');
                setEndPage('');
                setStartTime('');
                setEndTime('');
                setIsVirtual(false);
                setFile(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-10 px-4">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Create Book */}
                <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <BookOpen className="text-blue-600" /> Create Source Book
                    </h2>

                    <form onSubmit={handleCreateBook} className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                required
                                value={bookTitle}
                                onChange={e => setBookTitle(e.target.value)}
                                placeholder="Book Title"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            />

                            <input
                                type="text"
                                value={bookAuthor}
                                onChange={e => setBookAuthor(e.target.value)}
                                placeholder="Author"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 flex items-center justify-center gap-2">
                            <Plus size={18} /> Create Book
                        </button>
                    </form>
                </div>

                {/* Books */}
                {sourceBooks.length > 0 && (
                    <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-sm p-6">
                        <h3 className="text-lg font-semibold mb-4">Select Book</h3>

                        <div className="grid grid-cols-2 gap-4">
                            {sourceBooks.map(book => (
                                <div
                                    key={book.id}
                                    onClick={() => setSelectedBookId(book.id)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all hover:-translate-y-0.5
                  ${selectedBookId === book.id
                                            ? 'bg-blue-50 border-blue-500 shadow-sm'
                                            : 'bg-white hover:shadow-md'
                                        }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-gray-800">{book.title}</p>
                                            <p className="text-sm text-gray-500">{book.author}</p>
                                        </div>
                                        {selectedBookId === book.id && <Check className="text-blue-600" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Upload */}
                <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-sm p-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Upload className="text-green-600" /> Upload Chunk
                    </h2>

                    {!selectedBookId ? (
                        <p className="text-gray-500 text-center py-6">Select a book first</p>
                    ) : (
                        <form onSubmit={handleUploadChunk} className="space-y-4 mt-4">

                            <input
                                type="text"
                                required
                                value={chunkTitle}
                                onChange={e => setChunkTitle(e.target.value)}
                                placeholder="Chunk Title"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                            />

                            <div className="grid grid-cols-3 gap-4">
                                <select
                                    value={isVirtual ? 'virtual' : 'physical'}
                                    onChange={e => setIsVirtual(e.target.value === 'virtual')}
                                    className="rounded-lg border border-gray-300 px-3 py-2"
                                >
                                    <option value="physical">Physical</option>
                                    <option value="virtual">Virtual</option>
                                </select>

                                <select
                                    value={chunkType}
                                    onChange={e => setChunkType(e.target.value)}
                                    className="rounded-lg border border-gray-300 px-3 py-2"
                                >
                                    <option value="text">Text</option>
                                    {!isVirtual && <option value="image">Image</option>}
                                    <option value="audio">Audio</option>
                                    <option value="video">Video</option>
                                </select>

                                <input
                                    type="number"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    placeholder="Price"
                                    className="rounded-lg border border-gray-300 px-3 py-2"
                                />
                            </div>

                            {/* Virtual bounds */}
                            {isVirtual && chunkType === 'text' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="number"
                                        placeholder="Start Page"
                                        value={startPage}
                                        onChange={e => setStartPage(e.target.value)}
                                        className="rounded-lg border border-gray-300 px-3 py-2"
                                    />
                                    <input
                                        type="number"
                                        placeholder="End Page"
                                        value={endPage}
                                        onChange={e => setEndPage(e.target.value)}
                                        className="rounded-lg border border-gray-300 px-3 py-2"
                                    />
                                </div>
                            )}

                            {isVirtual && (chunkType === 'audio' || chunkType === 'video') && (
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        placeholder="Start Time"
                                        value={startTime}
                                        onChange={e => setStartTime(e.target.value)}
                                        className="rounded-lg border border-gray-300 px-3 py-2"
                                    />
                                    <input
                                        type="text"
                                        placeholder="End Time"
                                        value={endTime}
                                        onChange={e => setEndTime(e.target.value)}
                                        className="rounded-lg border border-gray-300 px-3 py-2"
                                    />
                                </div>
                            )}

                            {/* Upload box */}
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center bg-gray-50 hover:bg-gray-100 relative cursor-pointer">
                                <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={e => setFile(e.target.files?.[0] || null)}
                                />

                                <div className="flex flex-col items-center gap-2 text-gray-500">
                                    {chunkType === 'text' && <FileText size={40} />}
                                    {chunkType === 'image' && <Image size={40} />}
                                    {chunkType === 'audio' && <Mic size={40} />}
                                    {chunkType === 'video' && <Video size={40} />}

                                    <p className="text-sm">
                                        {file ? file.name : 'Click or drag file to upload'}
                                    </p>
                                </div>
                            </div>

                            <button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 flex items-center justify-center gap-2">
                                <Plus size={18} /> Upload Chunk
                            </button>

                        </form>
                    )}
                </div>

            </div>
        </div>
    );
};

export default AuthorDashboard;