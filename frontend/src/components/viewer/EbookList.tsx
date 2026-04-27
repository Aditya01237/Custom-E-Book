import React from 'react';
import { BookOpen } from 'lucide-react';

interface EbookListProps {
    ebooks: any[];
    selectedEbook: any | null;
    setSelectedEbook: (ebook: any) => void;
}

const EbookList: React.FC<EbookListProps> = ({ ebooks, selectedEbook, setSelectedEbook }) => {
    return (
        <div className="bg-white rounded-3xl auto shadow-sm border border-slate-200 mb-10 p-8 text-center animate-slide-up">
            <h2 className="text-2xl font-bold mb-6 text-slate-800 tracking-tight">Your E-Books Library</h2>
            {ebooks.length === 0 ? (
                <div className="py-10 flex flex-col items-center justify-center text-slate-400">
                    <BookOpen size={48} className="text-slate-200 mb-4" />
                    <p className="font-medium text-lg text-slate-500">No ebooks compiled yet.</p>
                    <p className="text-sm">Go to the Student tab to assemble one!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {ebooks.map(ebook => (
                        <button
                            key={ebook.id}
                            onClick={() => setSelectedEbook(ebook)}
                            className={`text-left p-6 rounded-2xl transition-all hover-lift ${
                                selectedEbook?.id === ebook.id
                                    ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-300 shadow-sm'
                                    : 'bg-slate-50 border border-slate-200 hover:bg-white hover:border-indigo-200 shadow-sm'
                            }`}
                        >
                            <p className="font-bold text-slate-900 text-lg mb-2 line-clamp-1">{ebook.title}</p>
                            <div className="text-xs text-slate-500 font-medium space-y-1.5">
                                <p>By <span className="text-slate-700">{ebook.createdBy}</span></p>
                                <p>Cost: <span className="text-teal-600 font-bold bg-teal-50 px-1 py-0.5 rounded border border-teal-100">${ebook.totalCost.toFixed(2)}</span></p>
                                <p className="bg-white px-2 py-1 inline-block mt-2 rounded border border-slate-200 shadow-sm">{ebook.chunkRefs?.length || 0} chunks</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EbookList;
