import React from 'react';
import { BookOpen, X, Video, Mic, Image as ImageIcon, FileText, Download, DollarSign, Plus } from 'lucide-react';

interface PreviewModalProps {
    selectedChunk: any;
    closePreview: () => void;
    isInCart: (bookId: string, chunkId: string) => boolean;
    addToCart: (chunkInfo: any) => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ selectedChunk, closePreview, isInCart, addToCart }) => {

    if (!selectedChunk) return null;

    const getLargeIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video size={28} className="text-red-500" />;
            case 'audio': return <Mic size={28} className="text-purple-500" />;
            case 'image': return <ImageIcon size={28} className="text-teal-500" />;
            default: return <FileText size={28} className="text-indigo-500" />;
        }
    };

    const renderPreviewContent = (chunkInfo: any) => {
        const chunk = chunkInfo.chunk;
        if (!chunk.uri) {
            return (
                <div className="bg-slate-50 rounded-xl p-10 text-center border border-slate-200">
                    <BookOpen size={64} className="text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-700">Virtual Extract</h3>
                    <p className="text-slate-500 mt-2">Pages {chunk.range?.startPage} – {chunk.range?.endPage}</p>
                    <p className="text-sm text-slate-400 mt-1">From: {chunkInfo.bookTitle}</p>
                </div>
            );
        }
        const mediaUrl = `/${chunk.uri}`;
        const isPdf = chunk.uri?.toLowerCase().endsWith('.pdf');

        switch (chunk.chunkType) {
            case 'video':
                return (
                    <div className="rounded-xl overflow-hidden bg-black shadow-inner">
                        <video controls autoPlay className="w-full max-h-[400px]" src={mediaUrl}>
                            Your browser does not support video playback.
                        </video>
                    </div>
                );
            case 'audio':
                return (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 flex flex-col items-center gap-4">
                        <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center shadow-inner">
                            <Mic size={40} className="text-indigo-600" />
                        </div>
                        <audio controls autoPlay className="w-full mt-4" src={mediaUrl}>
                            Your browser does not support audio playback.
                        </audio>
                    </div>
                );
            case 'image':
                return (
                    <div className="rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center border border-slate-200 p-4">
                        <img src={mediaUrl} alt={chunk.title} className="max-w-full max-h-[400px] object-contain rounded-lg shadow-sm" />
                    </div>
                );
            case 'text':
            case 'pdf':
                if (isPdf) {
                    return (
                        <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                            <object data={mediaUrl} type="application/pdf" className="w-full h-[600px] bg-slate-50">
                                <p className="p-4 text-center">Your browser does not support PDFs. <a href={mediaUrl} download className="text-indigo-600 underline">Download the PDF</a>.</p>
                            </object>
                        </div>
                    );
                }
                return (
                    <div className="rounded-xl border border-slate-200 bg-white p-10 flex flex-col items-center gap-4 shadow-sm">
                        <FileText size={64} className="text-slate-300" />
                        <p className="text-slate-500 font-medium text-lg">Text Document</p>
                        <a href={mediaUrl} download className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-6 py-2.5 rounded-full font-bold hover:bg-indigo-100 transition-colors mt-2">
                            <Download size={18} /> Download Resource
                        </a>
                    </div>
                );
            case 'virtual':
                return (
                    <div className="flex flex-col gap-4">
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col items-center">
                            <BookOpen size={48} className="text-slate-400 mb-4" />
                            <h4 className="font-bold text-slate-800 text-lg mb-2">Virtual Book Reference</h4>
                            <p className="text-slate-600 text-center mb-4">
                                This chunk references pages from the original source book.
                            </p>
                            {chunk.range && (
                                <div className="bg-white px-4 py-2 rounded-lg font-mono text-sm shadow-sm border border-slate-200 text-slate-700">
                                    Pages {chunk.range.startPage} to {chunk.range.endPage}
                                </div>
                            )}
                        </div>
                        {mediaUrl && mediaUrl.toLowerCase().endsWith('.pdf') && (
                            <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                                <object 
                                    data={`${mediaUrl}${chunk.range?.startPage ? `#page=${chunk.range.startPage}` : ''}`} 
                                    type="application/pdf" 
                                    className="w-full h-[500px] bg-slate-50"
                                >
                                    <p className="p-4 text-center">Your browser does not support PDFs. <a href={mediaUrl} download className="text-indigo-600 underline">Download the PDF</a>.</p>
                                </object>
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closePreview}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            {getLargeIcon(selectedChunk.chunk.chunkType)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{selectedChunk.chunk.title}</h2>
                            <span className="text-sm font-semibold text-slate-500 capitalize">{selectedChunk.chunk.chunkType} Extract • {selectedChunk.bookTitle}</span>
                        </div>
                    </div>
                    <button onClick={closePreview} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Media Content */}
                <div className="p-6">
                    {renderPreviewContent(selectedChunk)}
                </div>

                {/* Details */}
                <div className="px-6 pb-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-4">
                            <BookOpen size={20} className="text-slate-400" />
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Source Book</p>
                                <p className="font-semibold text-slate-800 text-sm mt-0.5 line-clamp-1">{selectedChunk.bookTitle}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-teal-50 border border-teal-100 rounded-xl p-4">
                            <DollarSign size={20} className="text-teal-500" />
                            <div>
                                <p className="text-[10px] text-teal-600/70 uppercase tracking-widest font-bold">Price</p>
                                <p className="font-bold text-teal-700 text-sm mt-0.5">${selectedChunk.chunk.price.toFixed(2)}</p>
                            </div>
                        </div>
                        {selectedChunk.chunk.range && (
                            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-4 col-span-2">
                                <FileText size={20} className="text-slate-400" />
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Page Range</p>
                                    <p className="font-semibold text-slate-800 text-sm mt-0.5">{selectedChunk.chunk.range.startPage} – {selectedChunk.chunk.range.endPage}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Button */}
                <div className="p-6 border-t border-slate-100 bg-white rounded-b-2xl">
                    {isInCart(selectedChunk.bookId, selectedChunk.chunk.id) ? (
                        <div className="bg-green-50 border border-green-200 text-center text-green-700 font-bold py-3.5 rounded-xl">
                            ✓ Already added to your assembly
                        </div>
                    ) : (
                        <button
                            onClick={() => {
                                addToCart(selectedChunk);
                                closePreview();
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            <Plus size={20} /> Add to E-Book Cart
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PreviewModal;
