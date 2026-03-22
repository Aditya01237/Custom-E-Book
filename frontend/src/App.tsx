import React, { useState } from 'react';
import { Book as BookIcon } from 'lucide-react';
import AuthorDashboard from './components/AuthorDashboard';
import StudentDashboard from './components/StudentDashboard';
import BookViewer from './components/BookViewer';

const App: React.FC = () => {
    const [view, setView] = useState<'author' | 'student' | 'viewer'>('student');

    return (
        <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
            <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                        <BookIcon className="text-blue-600" /> Custom E-Book Assembler
                    </h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setView('author')}
                            className={`px-4 py-2 rounded-full font-medium transition-all ${view === 'author' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            Author
                        </button>
                        <button
                            onClick={() => setView('student')}
                            className={`px-4 py-2 rounded-full font-medium transition-all ${view === 'student' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            Student
                        </button>
                        <button
                            onClick={() => setView('viewer')}
                            className={`px-4 py-2 rounded-full font-medium transition-all ${view === 'viewer' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            Read Book
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-6">
                {view === 'author' && <AuthorDashboard />}
                {view === 'student' && <StudentDashboard />}
                {view === 'viewer' && <BookViewer />}
            </main>
        </div>
    );
};

export default App;
