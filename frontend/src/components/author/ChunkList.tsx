import React from 'react';
import { Trash2 } from 'lucide-react';

interface ChunkListProps {
    proposedChunks: any[] | null;
    setProposedChunks: (chunks: any[] | null) => void;
    handleSaveBulkChunks: () => void;
    isUploading: boolean;
    selectedBook: any;
    handleDeleteChunk: (chunkId: string) => void;
    setStep: (step: any) => void;
}

const ChunkList: React.FC<ChunkListProps> = ({
    proposedChunks, setProposedChunks, handleSaveBulkChunks, isUploading,
    selectedBook, handleDeleteChunk, setStep
}) => {

    return (
        <>
            {proposedChunks && (
                <div className="mb-10 bg-white border border-indigo-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-xl font-bold mb-6 text-slate-800 border-b border-slate-100 pb-4">
                        Review AI Proposed Chunks
                    </h3>
                    <div className="space-y-4 mb-6">
                        {proposedChunks.map((chunk, idx) => (
                            <div key={idx} className="bg-slate-50 p-4 border border-slate-200 rounded-xl flex flex-col md:flex-row gap-4 items-center">
                                <div className="flex-1 w-full relative">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1 uppercase">Title</label>
                                    <input
                                        type="text"
                                        value={chunk.title}
                                        onChange={e => {
                                            const newChunks = [...proposedChunks];
                                            newChunks[idx].title = e.target.value;
                                            setProposedChunks(newChunks);
                                        }}
                                        className="w-full p-2.5 bg-white border border-slate-300 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 rounded-lg outline-none"
                                    />
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <div className="w-24 relative">
                                        <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1 uppercase">Start</label>
                                        <input
                                            type={chunk.chunkType === 'audio' || chunk.chunkType === 'video' ? 'text' : 'number'}
                                            value={chunk.chunkType === 'audio' || chunk.chunkType === 'video' ? (chunk.startTime || '') : (chunk.startPage || '')}
                                            onChange={e => {
                                                const newChunks = [...proposedChunks];
                                                if (chunk.chunkType === 'audio' || chunk.chunkType === 'video') {
                                                    newChunks[idx].startTime = e.target.value;
                                                } else {
                                                    newChunks[idx].startPage = parseInt(e.target.value, 10) || 0;
                                                }
                                                setProposedChunks(newChunks);
                                            }}
                                            className="w-full p-2.5 bg-white border border-slate-300 focus:border-indigo-400 rounded-lg outline-none"
                                        />
                                    </div>
                                    <div className="w-24 relative">
                                        <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1 uppercase">End</label>
                                        <input
                                            type={chunk.chunkType === 'audio' || chunk.chunkType === 'video' ? 'text' : 'number'}
                                            value={chunk.chunkType === 'audio' || chunk.chunkType === 'video' ? (chunk.endTime || '') : (chunk.endPage || '')}
                                            onChange={e => {
                                                const newChunks = [...proposedChunks];
                                                if (chunk.chunkType === 'audio' || chunk.chunkType === 'video') {
                                                    newChunks[idx].endTime = e.target.value;
                                                } else {
                                                    newChunks[idx].endPage = parseInt(e.target.value, 10) || 0;
                                                }
                                                setProposedChunks(newChunks);
                                            }}
                                            className="w-full p-2.5 bg-white border border-slate-300 focus:border-indigo-400 rounded-lg outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="w-full md:w-32 relative">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1 uppercase">Price</label>
                                    <input
                                        type="text"
                                        value={chunk.price}
                                        onChange={e => {
                                            const newChunks = [...proposedChunks];
                                            newChunks[idx].price = parseFloat(e.target.value) || 0;
                                            setProposedChunks(newChunks);
                                        }}
                                        className="w-full p-2.5 pl-7 bg-white border border-slate-300 focus:border-indigo-400 rounded-lg outline-none"
                                    />
                                    <span className="absolute left-3 top-[32px] font-bold text-slate-400">$</span>
                                </div>
                                <button
                                    onClick={() => {
                                        const newChunks = proposedChunks.filter((_, i) => i !== idx);
                                        setProposedChunks(newChunks.length ? newChunks : null);
                                    }}
                                    className="text-red-500 hover:text-red-700 md:mt-5 p-2 h-11 border border-slate-200 bg-white hover:bg-red-50 rounded-lg flex items-center justify-center w-full md:w-auto transition-colors shadow-sm"
                                    title="Remove Chunk"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            onClick={() => setProposedChunks(null)}
                            className="bg-white text-slate-600 px-6 py-2.5 rounded-lg font-bold border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={isUploading}
                            onClick={handleSaveBulkChunks}
                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-700 shadow-sm transition-colors disabled:bg-indigo-400"
                        >
                            {isUploading ? 'Saving Chunks...' : 'Save AI Chunks'}
                        </button>
                    </div>
                </div>
            )}

            {/* Created Chunks List */}
            <div className="mt-12 mb-10 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold tracking-tight text-slate-800 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                    <span className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">{selectedBook?.chunks?.length || 0}</span>
                    Created Master Chunks
                </h2>

                {(!selectedBook?.chunks || selectedBook.chunks.length === 0) ? (
                    <div className="text-slate-500 bg-slate-50 p-10 rounded-xl border border-dashed border-slate-300 text-center">
                        No chunks extracted yet. Add one above!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {selectedBook.chunks.map((chunk: any, index: number) => (
                            <div key={chunk.id} className="relative bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between hover-lift">
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded">Chunk {index + 1}</span>
                                        <button onClick={() => handleDeleteChunk(chunk.id)} className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded-md transition-colors" title="Delete Chunk">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-lg mb-2 leading-tight line-clamp-2">{chunk.title}</h3>
                                    <div className="text-xs text-slate-500 font-medium space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded uppercase font-bold text-slate-600">{chunk.chunkType}</span>
                                            <span className="text-slate-400">•</span>
                                            <span className="text-indigo-600 font-semibold">{chunk.virtual ? 'Virtual' : 'Physical'}</span>
                                        </div>
                                        <p className="mt-2 text-teal-600 font-bold bg-teal-50 inline-block px-2 py-0.5 rounded border border-teal-100">${chunk.price.toFixed(2)}</p>
                                        
                                        {chunk.virtual && chunk.range && (
                                            <p className="bg-slate-50 text-slate-600 px-2 py-1 block rounded mt-2 border border-slate-200">
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
                    className="bg-slate-800 text-white font-bold text-base py-3 px-10 rounded-full shadow-md hover:bg-slate-900 hover:-translate-y-0.5 transition-all text-center tracking-wide"
                >
                    FINISH AND RETURN
                </button>
            </div>
        </>
    );
};

export default ChunkList;
