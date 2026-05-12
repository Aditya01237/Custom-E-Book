import React from 'react';
import { Download, BookOpen } from 'lucide-react';

interface EbookReaderProps {
    selectedEbook: any;
    sourceBooks: any[];
}

const EbookReader: React.FC<EbookReaderProps> = ({ selectedEbook, sourceBooks }) => {

    if (!selectedEbook) return null;

    const findChunk = (bookId: string, chunkId: string) => {
        const book = sourceBooks.find(b => b.id === bookId);
        if (!book || !book.chunks) return null;
        return { 
            chunk: book.chunks.find((c: any) => c.id === chunkId), 
            bookTitle: book.title, 
            bookFile: book.file 
        };
    };

    const renderChunk = (ref: any) => {
        const found = findChunk(ref.bookId, ref.chunkId);
        if (!found || !found.chunk) {
            return (
                <div key={ref.seq} className="p-4 border border-red-200 bg-red-50 text-red-600 mb-4 rounded-lg text-sm font-medium">
                    Chunk not found: Book={ref.bookId}, Chunk={ref.chunkId}
                </div>
            );
        }

        const { chunk, bookTitle, bookFile } = found;
        const rawUrl = chunk.uri || bookFile?.path;
        const mediaUrl = rawUrl ? (rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`) : null;

        return (
            <div key={ref.seq} className="mb-10 bg-white shadow-sm hover:shadow-md transition-shadow rounded-2xl border border-slate-200 overflow-hidden group">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-sm">{ref.seq}</span>
                        {chunk.title}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-extrabold tracking-widest bg-white border border-slate-200 text-slate-500 px-2 py-1 rounded shadow-sm">{bookTitle}</span>
                        <span className="text-[10px] uppercase tracking-widest font-extrabold bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-1 rounded">
                            {chunk.chunkType}
                        </span>
                    </div>
                </div>

                <div className="p-6">
                    {chunk.chunkType === 'video' && mediaUrl && (
                        <video controls className="w-full rounded-xl bg-slate-900 box-border shadow-inner" src={mediaUrl}>
                            Your browser does not support video.
                        </video>
                    )}
                    {chunk.chunkType === 'audio' && mediaUrl && (
                        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 shadow-inner">
                            <audio controls className="w-full" src={mediaUrl}>
                                Your browser does not support audio.
                            </audio>
                        </div>
                    )}
                    {(chunk.chunkType === 'text' || chunk.chunkType === 'pdf') && mediaUrl && (
                        <div className="flex flex-col gap-4">
                            <div className="p-1 bg-slate-100 rounded-xl shadow-inner border border-slate-200 block">
                                <object data={mediaUrl} type="application/pdf" className="w-full h-[600px] rounded-lg bg-white">
                                    <p className="p-6 text-slate-500 text-center">Your browser does not support inline PDFs. <a href={mediaUrl} download className="text-indigo-600 font-bold hover:underline">Download the PDF</a>.</p>
                                </object>
                            </div>
                            <a href={mediaUrl} download className="self-end flex items-center gap-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-5 py-2.5 rounded-lg border border-indigo-100 font-bold transition-colors shadow-sm text-sm">
                                <Download size={16} /> Download File
                            </a>
                        </div>
                    )}
                    {chunk.chunkType === 'image' && mediaUrl && (
                        <div className="flex justify-center bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-inner">
                            <img src={mediaUrl} alt={chunk.title} className="max-w-full h-auto rounded-lg" />
                        </div>
                    )}
                    {chunk.chunkType === 'virtual' && (
                        <div className="flex flex-col gap-3">
                            <div className="bg-slate-50 rounded-xl p-6 text-center border border-slate-200 shadow-sm">
                                <BookOpen size={40} className="text-slate-400 mx-auto mb-3" />
                                <p className="text-slate-800 font-bold text-lg">Virtual Reference</p>
                                {chunk.range && (
                                    <div className="mt-3 inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg font-mono text-sm text-slate-600 shadow-sm border border-slate-200">
                                        Pages <span className="font-bold text-slate-900">{chunk.range.startPage}</span> to <span className="font-bold text-slate-900">{chunk.range.endPage}</span>
                                    </div>
                                )}
                            </div>
                            {mediaUrl && mediaUrl.toLowerCase().endsWith('.pdf') && (
                                <div className="p-1 bg-slate-100 rounded-xl shadow-inner mt-4 border border-slate-200">
                                    <object 
                                        data={`${mediaUrl}${chunk.range?.startPage ? `#page=${chunk.range.startPage}` : ''}`} 
                                        type="application/pdf" 
                                        className="w-full h-[600px] rounded-lg bg-white"
                                    >
                                        <p className="p-6 text-slate-500 text-center">Your browser does not support inline PDFs. <a href={mediaUrl} download className="text-indigo-600 font-bold hover:underline">Download the PDF</a>.</p>
                                    </object>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {ref.note && (
                    <div className="bg-amber-50 p-5 border-t border-amber-100 text-slate-700 text-sm">
                        <strong className="text-amber-800 block mb-1 text-[11px] uppercase tracking-widest font-extrabold flex items-center gap-1.5 ">📝 Student Note</strong>
                        <p className="italic leading-relaxed ml-5 text-amber-900/80">{ref.note}</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="animate-fade-in bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm mt-8">
            <div className="text-center mb-10 pb-10 border-b border-slate-100">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">{selectedEbook.title}</h1>
                <p className="text-slate-500 mb-8 font-medium">
                    Created By: <span className="font-semibold text-slate-700">{selectedEbook.createdBy}</span> • Total Cost: <span className="font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">${selectedEbook.totalCost.toFixed(2)}</span>
                </p>
                <a 
                    href={`/api/ebooks/${selectedEbook.id}/export/epub`}
                    download
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold shadow-sm transition-colors border border-indigo-700"
                >
                    <Download size={20} />
                    Download as EPUB
                </a>
            </div>

            <div className="space-y-8 mt-10 max-w-3xl mx-auto">
                {selectedEbook.chunkRefs
                    ?.sort((a: any, b: any) => a.seq - b.seq)
                    .map((ref: any) => renderChunk(ref))}
            </div>
        </div>
    );
};

export default EbookReader;
