import React, { useState } from 'react';
import { FileText, Mic, Video, Sparkles, Loader, Upload, X } from 'lucide-react';
import UploadSourceModal from './UploadSourceModal';

interface ChunkEditorProps {
    selectedBook: any;
    chunkType: string;
    setChunkType: (type: string) => void;
    file: File | null;
    setFile: (file: File | null) => void;
    isVirtual: boolean;
    setIsVirtual: (val: boolean) => void;
    startPage: string;
    setStartPage: (val: string) => void;
    endPage: string;
    setEndPage: (val: string) => void;
    startTime: string;
    setStartTime: (val: string) => void;
    endTime: string;
    setEndTime: (val: string) => void;
    chunkTitle: string;
    setChunkTitle: (val: string) => void;
    price: string;
    setPrice: (val: string) => void;
    handleUploadChunk: (e: React.FormEvent) => void;
    isUploading: boolean;
    handleAutoChunk: () => void;
    isAutoChunking: boolean;
    autoChunkResults: any[];
    driveUrl: string;
    setDriveUrl: (val: string) => void;
}

const FileIcon: React.FC<{ chunkType: string; hasFile: boolean }> = ({ chunkType, hasFile }) => {
    const cls = hasFile ? 'text-indigo-600' : 'text-slate-400';
    if (chunkType === 'audio') return <Mic size={40} className={cls} />;
    if (chunkType === 'video') return <Video size={40} className={cls} />;
    return <FileText size={40} className={cls} />;
};

const ChunkEditor: React.FC<ChunkEditorProps> = ({
    selectedBook, chunkType, setChunkType, file, setFile, isVirtual, setIsVirtual,
    startPage, setStartPage, endPage, setEndPage, startTime, setStartTime,
    endTime, setEndTime, chunkTitle, setChunkTitle, price, setPrice,
    handleUploadChunk, isUploading, handleAutoChunk, isAutoChunking, autoChunkResults,
    driveUrl, setDriveUrl
}) => {
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [driveFileName, setDriveFileName] = useState('');

    const hasSource = !!file || !!driveUrl || !!selectedBook?.file?.path;

    const clearSource = () => {
        setFile(null);
        setDriveUrl('');
        setDriveFileName('');
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* ── Section 1: Format ────────────────────────── */}
            <div className="bg-slate-50 p-6 sm:p-8 border-b border-slate-200">
                <h2 className="text-2xl font-bold mb-1 text-slate-900">1. Select Format &amp; Source</h2>
                <p className="text-sm text-slate-500 mb-6">Choose a content type, then pick a file from your device or Google Drive.</p>

                {/* Format pills */}
                <div className="flex flex-wrap gap-3 mb-8">
                    {['text', 'image', 'video', 'audio', 'pdf'].map(type => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => {
                                setChunkType(type);
                                if (['text', 'image'].includes(type)) setIsVirtual(false);
                                clearSource();
                            }}
                            className={`px-5 py-2.5 rounded-full font-bold capitalize transition-all border-2
                                ${chunkType === type
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {/* Upload area */}
                {hasSource ? (
                    /* ── File selected state ── */
                    <div className="flex items-center gap-4 bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <FileIcon chunkType={chunkType} hasFile={true} />
                        </div>
                        <div className="flex-1 min-w-0">
                            {file && (
                                <p className="font-bold text-indigo-800 truncate">{file.name}</p>
                            )}
                            {driveUrl && !file && (
                                <>
                                    <p className="font-bold text-indigo-800 truncate">{driveFileName || 'Google Drive file'}</p>
                                    <p className="text-xs text-indigo-500 mt-0.5 flex items-center gap-1">
                                        <svg className="w-3 h-3" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                                            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                                            <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                                            <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                                            <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                                            <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                                            <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 27h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                                        </svg>
                                        From Google Drive
                                    </p>
                                </>
                            )}
                            {!file && !driveUrl && selectedBook?.file?.path && (
                                <p className="font-bold text-teal-700">Book native file pre-loaded</p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={clearSource}
                            className="p-2 rounded-lg hover:bg-indigo-100 text-indigo-400 hover:text-indigo-700 transition-colors shrink-0"
                            title="Remove file"
                        >
                            <X size={18} />
                        </button>
                    </div>
                ) : (
                    /* ── Empty state: click to open modal ── */
                    <button
                        type="button"
                        onClick={() => setShowUploadModal(true)}
                        className="w-full border-2 border-dashed border-slate-300 rounded-xl p-10 text-center hover:border-indigo-400 hover:bg-indigo-50/40 transition-all group"
                    >
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                                <Upload size={28} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-700 group-hover:text-indigo-700 transition-colors">Click to add a file</p>
                                <p className="text-sm text-slate-400 mt-1">Upload from device or pick from Google Drive</p>
                            </div>
                        </div>
                    </button>
                )}
            </div>

            {/* ── Section 2: Metadata ────────────────────────── */}
            <div className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold mb-6 text-slate-900">2. Select Chunk Metadata</h2>
                <form onSubmit={handleUploadChunk}>

                    {/* Virtual toggle — only for pdf / audio / video */}
                    {['pdf', 'audio', 'video'].includes(chunkType) && (
                        <div className="flex gap-4 mb-8 bg-slate-100 p-1.5 rounded-xl">
                            <button type="button" onClick={() => setIsVirtual(false)}
                                className={`flex-1 py-3 rounded-lg font-bold transition-all ${!isVirtual ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-800'}`}>
                                PHYSICAL
                            </button>
                            <button type="button" onClick={() => setIsVirtual(true)}
                                className={`flex-1 py-3 rounded-lg font-bold transition-all ${isVirtual ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-800'}`}>
                                VIRTUAL EXTRACT
                            </button>
                        </div>
                    )}

                    {/* Range inputs for virtual */}
                    {isVirtual && (
                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-6 mb-6 shadow-inner">
                            <h4 className="font-semibold text-indigo-900 mb-4">Range Extraction</h4>
                            {chunkType === 'pdf' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Start Page</label>
                                        <input required type="number" value={startPage} onChange={e => setStartPage(e.target.value)}
                                            className="w-full border border-slate-200 rounded-lg p-3 outline-none focus:border-indigo-400" placeholder="e.g. 1" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">End Page</label>
                                        <input required type="number" value={endPage} onChange={e => setEndPage(e.target.value)}
                                            className="w-full border border-slate-200 rounded-lg p-3 outline-none focus:border-indigo-400" placeholder="e.g. 20" />
                                    </div>
                                </div>
                            )}
                            {(chunkType === 'audio' || chunkType === 'video') && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Start Time (hh:mm:ss)</label>
                                        <input required type="text" value={startTime} onChange={e => setStartTime(e.target.value)}
                                            className="w-full border border-slate-200 rounded-lg p-3 outline-none focus:border-indigo-400" placeholder="00:00:30" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">End Time (hh:mm:ss)</label>
                                        <input required type="text" value={endTime} onChange={e => setEndTime(e.target.value)}
                                            className="w-full border border-slate-200 rounded-lg p-3 outline-none focus:border-indigo-400" placeholder="00:02:10" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Chunk Name</label>
                            <input required type="text" value={chunkTitle} onChange={e => setChunkTitle(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                                placeholder="e.g. Chapter 1 Summary" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Price ($)</label>
                            <input type="number" value={price} onChange={e => setPrice(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                                placeholder="0.00" />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mt-6">
                        <button type="submit" disabled={isUploading || isAutoChunking}
                            className="flex-1 bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 shadow-sm disabled:opacity-50 transition-colors">
                            {isUploading ? 'Uploading...' : 'Create Master Chunk'}
                        </button>

                        {chunkType === 'pdf' && (
                            <button type="button" onClick={handleAutoChunk}
                                disabled={isUploading || isAutoChunking || (!file && !driveUrl && !selectedBook?.file?.path)}
                                className="flex-1 bg-indigo-50 border border-indigo-200 text-indigo-700 py-3.5 rounded-xl font-bold hover:bg-indigo-100 shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                                {isAutoChunking ? <Loader className="animate-spin" size={20} /> : <Sparkles size={20} />}
                                {isAutoChunking ? 'AI is Analyzing...' : 'Auto-Chunk with AI'}
                            </button>
                        )}
                    </div>
                </form>

                {autoChunkResults.length > 0 && (
                    <div className="mt-8 bg-green-50 border border-green-200 p-6 rounded-xl shadow-inner">
                        <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                            <Sparkles size={18} /> AI Suggested Chunks
                        </h4>
                        <p className="text-sm text-green-700 mb-4">
                            Found {autoChunkResults.length} logical sections. Click to pre-fill the form.
                        </p>
                        <div className="flex gap-2 flex-wrap max-h-48 overflow-y-auto pr-2">
                            {autoChunkResults.map((res: any, idx) => (
                                <button key={idx} type="button"
                                    onClick={() => {
                                        setChunkTitle(res.title);
                                        setStartPage(res.page?.toString() || '');
                                        setEndPage(res.page ? (res.page + 5).toString() : '');
                                        setIsVirtual(true);
                                    }}
                                    className="px-4 py-2 bg-white text-green-800 rounded-full text-sm font-semibold border border-green-200 hover:bg-green-100 hover:border-green-300 transition-colors shadow-sm">
                                    {res.title} (Pg. {res.page})
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Upload source modal */}
            <UploadSourceModal
                open={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                chunkType={chunkType}
                onFileSelected={(f) => { setFile(f); setDriveUrl(''); setDriveFileName(''); }}
                onDriveFileSelected={(url, name) => { setDriveUrl(url); setDriveFileName(name); setFile(null); }}
            />
        </div>
    );
};

export default ChunkEditor;
