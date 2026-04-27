import React from 'react';
import { BookOpen, FileText, ArrowLeft } from 'lucide-react';

interface BookSelectionProps {
    step: string;
    setStep: (step: any) => void;
    sourceBooks: any[];
    fetchBooks: () => void;
    setSelectedBook: (book: any) => void;
    handleCreateBook: (e: React.FormEvent) => void;
    bookTitle: string;
    setBookTitle: (title: string) => void;
    bookAuthor: string;
    setBookAuthor: (author: string) => void;
}

const BookSelection: React.FC<BookSelectionProps> = ({
    step, setStep, sourceBooks, fetchBooks, setSelectedBook,
    handleCreateBook, bookTitle, setBookTitle, bookAuthor, setBookAuthor
}) => {

    const renderHeader = (title: string, onBack?: () => void) => (
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            {onBack && (
                <button onClick={onBack} type="button" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-800 focus:outline-none">
                    <ArrowLeft size={18} />
                </button>
            )}
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        </div>
    );

    return (
        <>
            {step === 'select-flow' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-10 mt-10 text-center animate-slide-up shadow-sm">
                    <h2 className="text-2xl font-bold text-slate-800 mb-8 tracking-tight">What would you like to do?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button
                            onClick={() => setStep('create-book')}
                            className="group p-8 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300 transition-all flex flex-col items-center gap-4 hover-lift"
                        >
                            <div className="p-4 bg-indigo-50 rounded-full text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors border border-indigo-100">
                                <BookOpen size={32} />
                            </div>
                            <span className="text-lg font-bold text-slate-800">Create Chunked Book</span>
                            <p className="text-sm text-slate-500">Start fresh. Enter metadata and upload your files to create chunks.</p>
                        </button>

                        <button
                            onClick={() => {
                                fetchBooks();
                                setStep('select-book');
                            }}
                            className="group p-8 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-teal-300 transition-all flex flex-col items-center gap-4 hover-lift"
                        >
                            <div className="p-4 bg-teal-50 rounded-full text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors border border-teal-100">
                                <FileText size={32} />
                            </div>
                            <span className="text-lg font-bold text-slate-800">Update Chunked Book</span>
                            <p className="text-sm text-slate-500">Select an existing book to add, modify, or remove its chunks.</p>
                        </button>
                    </div>
                </div>
            )}

            {step === 'create-book' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-xl mx-auto mt-10 animate-slide-up shadow-sm">
                    {renderHeader('Create New Book', () => setStep('select-flow'))}
                    <form onSubmit={handleCreateBook} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Book Title</label>
                            <input
                                type="text" required value={bookTitle} onChange={e => setBookTitle(e.target.value)}
                                placeholder="Enter book title"
                                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-base transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Author</label>
                            <input
                                type="text" value={bookAuthor} onChange={e => setBookAuthor(e.target.value)}
                                placeholder="Enter author name"
                                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-base transition-colors"
                            />
                        </div>
                        <button className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 shadow-sm transition-colors mt-6">
                            Create Book
                        </button>
                    </form>
                </div>
            )}

            {step === 'select-book' && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 mt-10">
                    {renderHeader('Select a Book to Update', () => setStep('select-flow'))}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {sourceBooks.map(book => (
                            <button
                                key={book.id}
                                onClick={() => {
                                    setSelectedBook(book);
                                    setStep('chunking');
                                }}
                                className="flex flex-col text-left p-5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300 transition-all hover-lift"
                            >
                                <h3 className="font-bold text-base text-slate-800 line-clamp-1">{book.title}</h3>
                                <p className="text-sm text-slate-500 mb-3">{book.author}</p>
                                <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-1 bg-slate-200 text-slate-600 rounded">
                                    {book.chunks?.length || 0} Chunks
                                </span>
                            </button>
                        ))}
                        {sourceBooks.length === 0 && (
                            <div className="col-span-full py-10 text-center text-slate-400">
                                No books found. Please create one first.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default BookSelection;
