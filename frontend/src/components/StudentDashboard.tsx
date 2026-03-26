import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, FileText, Video, Mic, Image as ImageIcon, X, Eye, Download, DollarSign, BookOpen } from 'lucide-react';

interface ChunkWithBookInfo {
    chunk: {
        id: string;
        title: string;
        chunkType: string;
        price: number;
        uri: string;
        range?: {
            startPage: number;
            endPage: number;
        };
    };
    bookId: string;
    bookTitle: string;
}

interface CartItem {
    chunkInfo: ChunkWithBookInfo;
    note: string;
}

const StudentDashboard: React.FC = () => {
    const [chunkList, setChunkList] = useState<ChunkWithBookInfo[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [ebookTitle, setEbookTitle] = useState('');
    const [selectedChunk, setSelectedChunk] = useState<ChunkWithBookInfo | null>(null);

    useEffect(() => {
        fetch('/api/chunks')
            .then(res => res.json())
            .then(data => setChunkList(data || []))
            .catch(console.error);
    }, []);

    const addToCart = (chunkInfo: ChunkWithBookInfo) => {
        setCart([...cart, { chunkInfo, note: '' }]);
    };

    const removeFromCart = (index: number) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    const moveItem = (index: number, direction: 'up' | 'down') => {
        const newCart = [...cart];
        if (direction === 'up' && index > 0) {
            [newCart[index], newCart[index - 1]] = [newCart[index - 1], newCart[index]];
        } else if (direction === 'down' && index < newCart.length - 1) {
            [newCart[index], newCart[index + 1]] = [newCart[index + 1], newCart[index]];
        }
        setCart(newCart);
    };

    const updateNote = (index: number, note: string) => {
        const newCart = [...cart];
        newCart[index].note = note;
        setCart(newCart);
    };

    const saveBook = async () => {
        if (!ebookTitle) return alert('Please enter a book title');
        if (cart.length === 0) return alert('Book cannot be empty');

        const payload = {
            title: ebookTitle,
            createdBy: 'Student User',
            totalCost: 0,
            chunkRefs: cart.map((item, index) => ({
                bookId: item.chunkInfo.bookId,
                chunkId: item.chunkInfo.chunk.id,
                seq: index + 1,
                note: item.note
            }))
        };

        try {
            const res = await fetch('/api/ebooks/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const result = await res.json();
                alert(`Book Created Successfully! Book ID: ${result.id}`);
                setCart([]);
                setEbookTitle('');
            } else {
                alert('Failed to create book');
            }
        } catch (e) {
            console.error(e);
            alert('Error creating book');
        }
    };

    const openPreview = (chunkInfo: ChunkWithBookInfo) => {
        setSelectedChunk(chunkInfo);
    };

    const closePreview = () => {
        setSelectedChunk(null);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video size={16} />;
            case 'audio': return <Mic size={16} />;
            case 'image': return <ImageIcon size={16} />;
            default: return <FileText size={16} />;
        }
    };

    const getLargeIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video size={28} className="text-red-500" />;
            case 'audio': return <Mic size={28} className="text-purple-500" />;
            case 'image': return <ImageIcon size={28} className="text-teal-500" />;
            default: return <FileText size={28} className="text-blue-500" />;
        }
    };

    const isInCart = (bookId: string, chunkId: string) =>
        cart.some(item => item.chunkInfo.bookId === bookId && item.chunkInfo.chunk.id === chunkId);

    // Group chunks by source book
    const groupedChunks = chunkList.reduce<Record<string, { bookTitle: string; bookId: string; chunks: ChunkWithBookInfo[] }>>((acc, item) => {
        if (!acc[item.bookId]) {
            acc[item.bookId] = { bookTitle: item.bookTitle, bookId: item.bookId, chunks: [] };
        }
        acc[item.bookId].chunks.push(item);
        return acc;
    }, {});

    const totalCost = cart.reduce((sum, item) => sum + item.chunkInfo.chunk.price, 0);

    const renderPreviewContent = (chunkInfo: ChunkWithBookInfo) => {
        const chunk = chunkInfo.chunk;
        if (!chunk.uri) {
            return (
                <div className="bg-gray-50 rounded-xl p-8 text-center">
                    <BookOpen size={48} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Virtual chunk (pages {chunk.range?.startPage}–{chunk.range?.endPage})</p>
                    <p className="text-sm text-gray-400 mt-1">From: {chunkInfo.bookTitle}</p>
                </div>
            );
        }
        const mediaUrl = `/${chunk.uri}`;
        const isPdf = chunk.uri?.toLowerCase().endsWith('.pdf');

        switch (chunk.chunkType) {
            case 'video':
                return (
                    <div className="rounded-xl overflow-hidden bg-black">
                        <video controls autoPlay className="w-full max-h-[400px]" src={mediaUrl}>
                            Your browser does not support video playback.
                        </video>
                    </div>
                );
            case 'audio':
                return (
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-8 flex flex-col items-center gap-4">
                        <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                            <Mic size={40} className="text-white" />
                        </div>
                        <audio controls autoPlay className="w-full mt-4" src={mediaUrl}>
                            Your browser does not support audio playback.
                        </audio>
                    </div>
                );
            case 'image':
                return (
                    <div className="rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
                        <img src={mediaUrl} alt={chunk.title} className="max-w-full max-h-[400px] object-contain rounded-lg" />
                    </div>
                );
            case 'text':
                if (isPdf) {
                    return (
                        <div className="rounded-xl overflow-hidden border">
                            <object data={mediaUrl} type="application/pdf" className="w-full h-[600px] border rounded">
                                <p>Your browser does not support PDFs. <a href={mediaUrl} download className="text-blue-600 underline">Download the PDF</a>.</p>
                            </object>
                        </div>
                    );
                }
                return (
                    <div className="rounded-xl border bg-white p-8 flex flex-col items-center gap-3">
                        <FileText size={48} className="text-gray-300" />
                        <p className="text-gray-500">Text document</p>
                        <a href={mediaUrl} download className="flex items-center gap-2 text-blue-600 font-medium hover:underline mt-2">
                            <Download size={16} /> Download File
                        </a>
                    </div>
                );
            case 'virtual':
                return (
                    <div className="flex flex-col gap-4">
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex flex-col items-center">
                            <BookOpen size={48} className="text-blue-300 mb-4" />
                            <h4 className="font-bold text-gray-800 text-lg mb-2">Virtual Book Reference</h4>
                            <p className="text-gray-600 text-center mb-4">
                                This chunk references pages from the original source book.
                            </p>
                            {chunk.range && (
                                <div className="bg-white px-4 py-2 rounded-lg font-mono text-sm shadow-sm border">
                                    Pages {chunk.range.startPage} to {chunk.range.endPage}
                                </div>
                            )}
                        </div>
                        {mediaUrl && mediaUrl.toLowerCase().endsWith('.pdf') && (
                            <div className="rounded-xl overflow-hidden border">
                                <object 
                                    data={`${mediaUrl}${chunk.range?.startPage ? `#page=${chunk.range.startPage}` : ''}`} 
                                    type="application/pdf" 
                                    className="w-full h-[600px] border rounded"
                                >
                                    <p>Your browser does not support PDFs. <a href={mediaUrl} download className="text-blue-600 underline">Download the PDF</a>.</p>
                                </object>
                            </div>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="flex gap-6 h-[calc(100vh-100px)]">
            {/* Marketplace Grid — grouped by source book */}
            <div className="flex-1 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Content Marketplace</h2>
                {Object.keys(groupedChunks).length === 0 && (
                    <p className="text-gray-500 text-center mt-10">No content available yet.</p>
                )}
                {Object.values(groupedChunks).map(group => (
                    <div key={group.bookId} className="mb-6">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-700">
                            <BookOpen size={18} className="text-blue-500" /> {group.bookTitle}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {group.chunks.map(item => (
                                <div
                                    key={`${item.bookId}-${item.chunk.id}`}
                                    className="border p-4 rounded-lg bg-white shadow hover:shadow-lg transition cursor-pointer group"
                                    onClick={() => openPreview(item)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-bold bg-gray-200 px-2 py-1 rounded capitalize flex items-center gap-1">
                                            {getIcon(item.chunk.chunkType)} {item.chunk.chunkType}
                                        </span>
                                        <span className="text-green-600 font-bold">${item.chunk.price}</span>
                                    </div>
                                    <h4 className="font-bold text-lg">{item.chunk.title}</h4>
                                    {item.chunk.range && (
                                        <p className="text-xs text-gray-500 mt-1">Pages {item.chunk.range.startPage}–{item.chunk.range.endPage}</p>
                                    )}
                                    <div className="mt-3 flex items-center gap-2 text-sm text-indigo-500 group-hover:text-indigo-700 transition">
                                        <Eye size={14} /> Click to preview
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Assembly Cart */}
            <div className="w-1/3 bg-white border rounded shadow flex flex-col">
                <div className="p-4 border-b bg-gray-50">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Save size={20} /> E-Book Assembly
                    </h2>
                </div>
                <div className="p-4 flex-1 overflow-y-auto space-y-4">
                    {cart.length === 0 ? (
                        <p className="text-gray-500 text-center mt-10">Add chunks from the marketplace to build your ebook.</p>
                    ) : (
                        cart.map((item, idx) => (
                            <div key={idx} className="border p-3 rounded group relative">
                                <div className="flex justify-between">
                                    <div>
                                        <h4 className="font-bold">{item.chunkInfo.chunk.title}</h4>
                                        <p className="text-xs text-gray-400">From: {item.chunkInfo.bookTitle}</p>
                                    </div>
                                    <button onClick={() => removeFromCart(idx)} className="text-red-500 hover:text-red-700">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <textarea
                                    className="w-full mt-2 text-sm border p-1 rounded bg-yellow-50"
                                    placeholder="Add a study note..."
                                    value={item.note}
                                    onChange={e => updateNote(idx, e.target.value)}
                                />
                                <div className="flex gap-2 mt-2 text-xs">
                                    <button onClick={() => moveItem(idx, 'up')} disabled={idx === 0} className="text-gray-500 hover:text-black disabled:opacity-30">Move Up</button>
                                    <button onClick={() => moveItem(idx, 'down')} disabled={idx === cart.length - 1} className="text-gray-500 hover:text-black disabled:opacity-30">Move Down</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="p-4 border-t bg-gray-50">
                    {cart.length > 0 && (
                        <p className="text-right text-sm text-gray-600 mb-2">
                            Total: <span className="font-bold text-green-600">${totalCost.toFixed(2)}</span>
                        </p>
                    )}
                    <input
                        className="w-full border p-2 rounded mb-2"
                        placeholder="Enter E-Book Title"
                        value={ebookTitle}
                        onChange={e => setEbookTitle(e.target.value)}
                    />
                    <button
                        onClick={saveBook}
                        disabled={cart.length === 0 || !ebookTitle}
                        className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700 disabled:opacity-50"
                    >
                        Create E-Book
                    </button>
                </div>
            </div>

            {/* Preview Modal */}
            {selectedChunk && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={closePreview}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b">
                            <div className="flex items-center gap-3">
                                {getLargeIcon(selectedChunk.chunk.chunkType)}
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{selectedChunk.chunk.title}</h2>
                                    <span className="text-sm text-gray-500 capitalize">{selectedChunk.chunk.chunkType} content • {selectedChunk.bookTitle}</span>
                                </div>
                            </div>
                            <button onClick={closePreview} className="p-2 hover:bg-gray-100 rounded-full transition">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Media Content */}
                        <div className="p-5">
                            {renderPreviewContent(selectedChunk)}
                        </div>

                        {/* Details */}
                        <div className="px-5 pb-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                                    <BookOpen size={16} className="text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wide">Source Book</p>
                                        <p className="font-semibold text-gray-800 text-sm">{selectedChunk.bookTitle}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                                    <DollarSign size={16} className="text-green-500" />
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wide">Price</p>
                                        <p className="font-semibold text-green-600 text-sm">${selectedChunk.chunk.price}</p>
                                    </div>
                                </div>
                                {selectedChunk.chunk.range && (
                                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3 col-span-2">
                                        <FileText size={16} className="text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase tracking-wide">Page Range</p>
                                            <p className="font-semibold text-gray-800 text-sm">{selectedChunk.chunk.range.startPage} – {selectedChunk.chunk.range.endPage}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="p-5 border-t bg-gray-50 rounded-b-2xl">
                            {isInCart(selectedChunk.bookId, selectedChunk.chunk.id) ? (
                                <div className="text-center text-green-600 font-semibold py-2">
                                    ✓ Already added to your ebook
                                </div>
                            ) : (
                                <button
                                    onClick={() => {
                                        addToCart(selectedChunk);
                                        closePreview();
                                    }}
                                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-md hover:shadow-lg"
                                >
                                    <Plus size={20} /> Add to My E-Book
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
