import React, { useState, useEffect } from 'react';
import MarketplaceGrid from './student/MarketplaceGrid';
import AssemblyCart from './student/AssemblyCart';
import PreviewModal from './student/PreviewModal';

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

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)] pt-6">
            <MarketplaceGrid
                groupedChunks={groupedChunks}
                openPreview={openPreview}
            />

            <AssemblyCart
                cart={cart}
                removeFromCart={removeFromCart}
                updateNote={updateNote}
                moveItem={moveItem}
                totalCost={totalCost}
                ebookTitle={ebookTitle}
                setEbookTitle={setEbookTitle}
                saveBook={saveBook}
            />

            <PreviewModal
                selectedChunk={selectedChunk}
                closePreview={closePreview}
                isInCart={isInCart}
                addToCart={addToCart}
            />
        </div>
    );
};

export default StudentDashboard;
