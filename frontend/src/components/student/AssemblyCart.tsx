import React from 'react';
import { Save, BookOpen, Trash2 } from 'lucide-react';

interface AssemblyCartProps {
    cart: any[];
    removeFromCart: (idx: number) => void;
    updateNote: (idx: number, note: string) => void;
    moveItem: (idx: number, dir: 'up' | 'down') => void;
    totalCost: number;
    ebookTitle: string;
    setEbookTitle: (title: string) => void;
    saveBook: () => void;
}

const AssemblyCart: React.FC<AssemblyCartProps> = ({
    cart, removeFromCart, updateNote, moveItem, totalCost, ebookTitle, setEbookTitle, saveBook
}) => {

    return (
        <div className="w-full lg:w-1/3 bg-white border border-slate-200 shadow-sm rounded-3xl flex flex-col h-full overflow-hidden self-start sticky top-4">
            <div className="p-5 border-b border-indigo-100 bg-indigo-50/80">
                <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-900">
                    <Save size={20} className="text-indigo-600" /> E-Book Assembly
                </h2>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto space-y-4 custom-scrollbar bg-slate-50">
                {cart.length === 0 ? (
                    <div className="text-slate-400 text-center mt-10 flex flex-col items-center gap-3">
                        <BookOpen size={40} className="text-slate-300 opacity-50" />
                        <p className="font-medium text-sm px-4">Add chunks to build your custom ebook.</p>
                    </div>
                ) : (
                    cart.map((item, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 p-4 rounded-xl group relative shadow-sm hover:border-indigo-300 transition-colors">
                            <div className="flex justify-between items-start">
                                <div className="pr-2">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded leading-none">Part {idx + 1}</span>
                                    <h4 className="font-bold text-slate-800 leading-snug mt-1">{item.chunkInfo.chunk.title}</h4>
                                    <p className="text-[11px] text-slate-400 font-semibold mt-1 line-clamp-1">{item.chunkInfo.bookTitle}</p>
                                </div>
                                <button onClick={() => removeFromCart(idx)} className="text-red-400 hover:text-red-600 bg-red-50 p-1.5 rounded-md transition-colors flex-shrink-0" title="Remove">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            <textarea
                                className="w-full mt-3 text-sm border-0 ring-1 ring-slate-200 p-2.5 rounded-lg bg-orange-50/50 focus:ring-2 focus:ring-orange-300 outline-none resize-none transition-all"
                                placeholder="Add a study note..."
                                rows={2}
                                value={item.note}
                                onChange={e => updateNote(idx, e.target.value)}
                            />
                            <div className="flex gap-2 mt-3 justify-end text-xs font-semibold">
                                <button onClick={() => moveItem(idx, 'up')} disabled={idx === 0} className="text-slate-500 hover:text-indigo-600 disabled:opacity-30 bg-slate-100 hover:bg-indigo-50 px-2 py-1 rounded transition-colors block">Move Up</button>
                                <button onClick={() => moveItem(idx, 'down')} disabled={idx === cart.length - 1} className="text-slate-500 hover:text-indigo-600 disabled:opacity-30 bg-slate-100 hover:bg-indigo-50 px-2 py-1 rounded transition-colors block">Move Down</button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-5 border-t border-slate-200 bg-white">
                {cart.length > 0 && (
                    <div className="flex justify-between items-center mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span className="text-sm font-semibold text-slate-500">Total Price</span>
                        <span className="font-extrabold text-teal-600 text-lg">${totalCost.toFixed(2)}</span>
                    </div>
                )}
                <input
                    className="w-full border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 p-3.5 rounded-xl mb-4 outline-none text-base text-slate-800 placeholder-slate-400 bg-slate-50 transition-all"
                    placeholder="Enter Final E-Book Title"
                    value={ebookTitle}
                    onChange={e => setEbookTitle(e.target.value)}
                />
                <button
                    onClick={saveBook}
                    disabled={cart.length === 0 || !ebookTitle}
                    className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all"
                >
                    Create E-Book Layout
                </button>
            </div>
        </div>
    );
};

export default AssemblyCart;
