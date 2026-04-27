import React, { useState } from 'react';
import { Book as BookIcon } from 'lucide-react';
import AuthorDashboard from './components/AuthorDashboard';
import StudentDashboard from './components/StudentDashboard';
import BookViewer from './components/BookViewer';

const App: React.FC = () => {
    const [view, setView] = useState<'author' | 'student' | 'viewer'>('student');

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col relative">

            <nav className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 shadow-sm animate-fade-in">
                <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-indigo-700 flex items-center gap-2 tracking-tight">
                        <BookIcon className="text-indigo-600" /> ChunkCrafter
                    </h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setView('author')}
                            className={`px-5 py-2 rounded-full font-semibold transition-all duration-300 ${view === 'author' ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'}`}
                        >
                            Author
                        </button>
                        <button
                            onClick={() => setView('student')}
                            className={`px-5 py-2 rounded-full font-semibold transition-all duration-300 ${view === 'student' ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'}`}
                        >
                            Student
                        </button>
                        <button
                            onClick={() => setView('viewer')}
                            className={`px-5 py-2 rounded-full font-semibold transition-all duration-300 ${view === 'viewer' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'}`}
                        >
                            Read Books
                        </button>
                    </div>
                </div>
            </nav>

            <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 mt-4 z-10 animate-fade-in relative">
                {view === 'author' && <AuthorDashboard />}
                {view === 'student' && <StudentDashboard />}
                {view === 'viewer' && <BookViewer />}
            </main>
        </div>
    );
};

export default App;
