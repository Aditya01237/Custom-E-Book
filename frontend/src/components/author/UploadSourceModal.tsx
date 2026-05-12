import React, { useRef, useCallback } from 'react';
import { HardDrive, X } from 'lucide-react';

// ─── Google Picker Config ────────────────────────────────────────────────────
// Get these from https://console.cloud.google.com/
// Enable: Google Picker API, Google Drive API
// Add http://localhost:5173 to Authorized JavaScript Origins in OAuth client
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

interface UploadSourceModalProps {
    open: boolean;
    onClose: () => void;
    onFileSelected: (file: File) => void;
    onDriveFileSelected: (url: string, name: string) => void;
    chunkType: string;
}

const MIME_TYPES: Record<string, string> = {
    pdf: 'application/pdf',
    text: 'text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    image: 'image/png,image/jpeg,image/webp,image/gif',
    audio: 'audio/mpeg,audio/wav,audio/ogg,audio/mp4',
    video: 'video/mp4,video/webm,video/ogg,video/x-matroska',
};

const ACCEPT_ATTR: Record<string, string> = {
    pdf: '.pdf',
    text: '.txt,.doc,.docx',
    image: '.png,.jpg,.jpeg,.webp,.gif',
    audio: '.mp3,.wav,.ogg,.m4a',
    video: '.mp4,.webm,.ogv,.mkv',
};

// Lazy-load the GAPI picker script
async function loadGapiPicker(): Promise<void> {
    return new Promise((resolve) => {
        if (window.gapi?.picker) { resolve(); return; }

        const gapiReady = () => {
            window.gapi.load('picker', () => resolve());
        };

        if (window.gapi) { gapiReady(); return; }

        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = gapiReady;
        document.body.appendChild(script);
    });
}

// Lazy-load the new Google Identity Services library
async function loadGIS(): Promise<void> {
    return new Promise((resolve) => {
        if (window.google?.accounts?.oauth2) { resolve(); return; }
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => resolve();
        document.body.appendChild(script);
    });
}

// Ask GIS for an access token, then open the picker
async function openGooglePicker(
    chunkType: string,
    onPicked: (url: string, name: string) => void
): Promise<void> {
    if (!GOOGLE_API_KEY || !GOOGLE_CLIENT_ID) {
        alert(
            'Google credentials are not set.\n\n' +
            'Please edit frontend/.env and fill in:\n' +
            '  VITE_GOOGLE_API_KEY\n' +
            '  VITE_GOOGLE_CLIENT_ID\n\n' +
            'Then restart npm run dev.'
        );
        return;
    }

    await Promise.all([loadGapiPicker(), loadGIS()]);

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        callback: (tokenResponse: any) => {
            if (tokenResponse.error) {
                console.error('GIS token error:', tokenResponse);
                alert('Google sign-in failed. Check your Client ID and try again.');
                return;
            }

            const mimeTypes = MIME_TYPES[chunkType] || '';

            const view = new window.google.picker.DocsView()
                .setIncludeFolders(false)
                .setMimeTypes(mimeTypes)
                .setMode(window.google.picker.DocsViewMode.LIST);

            const picker = new window.google.picker.PickerBuilder()
                .addView(view)
                .setOAuthToken(tokenResponse.access_token)
                .setDeveloperKey(GOOGLE_API_KEY)
                .setTitle('Select a file from Google Drive')
                .setCallback((data: any) => {
                    if (data.action === window.google.picker.Action.PICKED) {
                        const doc = data.docs[0];
                        // Direct download URL so the backend can fetch it
                        const url = `https://drive.google.com/uc?export=download&id=${doc.id}`;
                        onPicked(url, doc.name);
                    }
                })
                .build();

            picker.setVisible(true);
        },
    });

    // Prompt user to sign in (no popup blocker issues)
    tokenClient.requestAccessToken({ prompt: 'consent' });
}

// ─── Component ───────────────────────────────────────────────────────────────

const UploadSourceModal: React.FC<UploadSourceModalProps> = ({
    open, onClose, onFileSelected, onDriveFileSelected, chunkType
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrivePick = useCallback(async () => {
        try {
            await openGooglePicker(chunkType, (url, name) => {
                onDriveFileSelected(url, name);
                onClose();
            });
        } catch (err) {
            console.error('Drive picker error:', err);
        }
    }, [chunkType, onClose, onDriveFileSelected]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

            {/* Sheet / Modal */}
            <div
                className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full sm:max-w-sm mx-0 sm:mx-4 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Drag handle (mobile) */}
                <div className="flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="w-10 h-1 bg-slate-300 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">Add File</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Choose where to upload from</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Options */}
                <div className="p-5 grid grid-cols-2 gap-3">
                    {/* Device */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="group flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                            <HardDrive size={28} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-sm text-slate-800 group-hover:text-indigo-700 transition-colors">Your Device</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Browse local files</p>
                        </div>
                    </button>

                    {/* Google Drive */}
                    <button
                        type="button"
                        onClick={handleDrivePick}
                        className="group flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                            <svg className="w-8 h-8" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 27h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                            </svg>
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-sm text-slate-800 group-hover:text-blue-700 transition-colors">Google Drive</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Pick from your Drive</p>
                        </div>
                    </button>
                </div>

                {/* Credentials warning (only shown if not configured) */}
                {(!GOOGLE_API_KEY || GOOGLE_API_KEY === 'YOUR_GOOGLE_API_KEY_HERE') && (
                    <div className="mx-5 mb-5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-medium">
                        ⚠️ Google Drive credentials not configured — device upload still works.
                    </div>
                )}

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={ACCEPT_ATTR[chunkType] || '*'}
                    onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) { onFileSelected(f); onClose(); }
                        e.target.value = '';
                    }}
                />
            </div>
        </div>
    );
};

export default UploadSourceModal;
