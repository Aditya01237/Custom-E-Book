import React from 'react';
import { BookOpen, Eye, Video, Mic, Image as ImageIcon, FileText } from 'lucide-react';

interface MarketplaceGridProps {
    groupedChunks: Record<string, { bookTitle: string; bookId: string; chunks: any[] }>;
    openPreview: (chunkInfo: any) => void;
}

const MarketplaceGrid: React.FC<MarketplaceGridProps> = ({ groupedChunks, openPreview }) => {

    const getIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video size={16} />;
            case 'audio': return <Mic size={16} />;
            case 'image': return <ImageIcon size={16} />;
            default: return <FileText size={16} />;
        }
    };

    return (
        <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
            <h2 className="text-2xl font-bold mb-6 text-slate-800 tracking-tight">Content Marketplace</h2>
            {Object.keys(groupedChunks).length === 0 && (
                <div className="text-slate-400 text-center mt-20 flex flex-col items-center">
                    <BookOpen size={48} className="text-slate-300 mb-4 opacity-50" />
                    <p className="text-lg font-medium">No content available yet.</p>
                </div>
            )}
            {Object.values(groupedChunks).map(group => (
                <div key={group.bookId} className="mb-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold mb-5 flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3">
                        <BookOpen size={20} className="text-indigo-500" /> {group.bookTitle}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {group.chunks.map(item => (
                            <div
                                key={`${item.bookId}-${item.chunk.id}`}
                                className="bg-slate-50 border border-slate-200 p-5 rounded-2xl hover:border-indigo-300 hover:shadow-md cursor-pointer group transition-all"
                                onClick={() => openPreview(item)}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-xs font-bold bg-white text-indigo-700 px-3 py-1 rounded-full border border-indigo-100 capitalize flex items-center gap-1.5 shadow-sm">
                                        {getIcon(item.chunk.chunkType)} {item.chunk.chunkType}
                                    </span>
                                    <span className="text-teal-700 font-extrabold bg-teal-50 px-2 py-1 rounded border border-teal-100 shadow-sm">${item.chunk.price.toFixed(2)}</span>
                                </div>
                                <h4 className="font-bold text-lg text-slate-800 line-clamp-2 leading-tight mb-2 group-hover:text-indigo-700">{item.chunk.title}</h4>
                                {item.chunk.range && (
                                    <p className="text-xs text-slate-500 font-medium bg-white border border-slate-200 inline-block px-2 py-1 rounded">Pages {item.chunk.range.startPage} – {item.chunk.range.endPage}</p>
                                )}
                                <div className="mt-4 flex items-center gap-2 text-sm text-indigo-500 font-semibold group-hover:text-indigo-600 transition-colors">
                                    <Eye size={16} /> Click to preview
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MarketplaceGrid;
