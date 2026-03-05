"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function ScannerPage() {
    const { data: session } = useSession();
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);
    const [recentScans, setRecentScans] = useState<{ name: string, url: string }[]>([]);

    const handlePaste = useCallback(async (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        let imageFile = null;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                imageFile = items[i].getAsFile();
                break;
            }
        }

        if (!imageFile) return;

        // Display preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(imageFile);

        setLoading(true);
        setMessage({ text: "Scanning Intelligence...", type: 'info' });

        try {
            // Convert file to base64
            const base64 = await new Promise<string>((resolve) => {
                const r = new FileReader();
                r.onloadend = () => resolve(r.result as string);
                r.readAsDataURL(imageFile as Blob);
            });

            const res = await fetch('/api/scanner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64: base64 })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to scan image");
            }

            setMessage({ text: data.message, type: 'success' });
            setRecentScans(prev => [data.item, ...prev].slice(0, 5));

        } catch (err: any) {
            setMessage({ text: err.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        document.addEventListener("paste", handlePaste);
        return () => {
            document.removeEventListener("paste", handlePaste);
        };
    }, [handlePaste]);

    if (!session?.user) return null;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black font-heading text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-[#c5a059] tracking-widest uppercase mb-1 drop-shadow-md">
                    OCR Intelligence Scanner
                </h1>
                <p className="text-gray-400 font-serif italic text-sm">
                    Paste (CTRL+V) an in-game tooltip screenshot directly into this window to extract its text and archive the icon.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[#1a151b]/80 border border-red-900/40 rounded-xl p-6 shadow-lg flex flex-col items-center justify-center min-h-[400px] relative transition-all">
                    {!preview ? (
                        <div className="text-center space-y-4 opacity-50">
                            <svg className="w-16 h-16 mx-auto text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="font-bold uppercase tracking-widest text-stone-400">Awaiting Clipboard Data</p>
                            <p className="text-xs text-stone-500">Press CTRL + V to Paste</p>
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center gap-4">
                            <div className="relative border border-red-900/50 rounded-lg overflow-hidden max-h-[300px] bg-black">
                                <img src={preview} alt="Pasted clipboard" className="object-contain max-h-[300px] w-auto mx-auto" />
                            </div>
                            {loading && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-xl">
                                    <div className="space-y-4 text-center">
                                        <div className="w-12 h-12 rounded-full border-4 border-[#c5a059] border-t-transparent animate-spin mx-auto"></div>
                                        <p className="text-[#c5a059] font-bold tracking-widest uppercase text-sm animate-pulse">Running Neural OCR...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {message && (
                        <div className={`p-4 rounded-xl border flex items-start gap-4 shadow-lg ${message.type === 'error' ? 'bg-red-950/50 border-red-900 text-red-400' :
                                message.type === 'success' ? 'bg-emerald-950/50 border-emerald-900 text-emerald-400' :
                                    'bg-blue-950/50 border-blue-900 text-blue-400'
                            }`}>
                            <span className="text-xl">
                                {message.type === 'error' ? '❌' : message.type === 'success' ? '✅' : 'ℹ️'}
                            </span>
                            <div>
                                <h3 className="font-bold uppercase tracking-widest text-xs mb-1">
                                    {message.type === 'error' ? 'Scan Failed' : message.type === 'success' ? 'Archived' : 'Processing'}
                                </h3>
                                <p className="text-sm">{message.text}</p>
                            </div>
                        </div>
                    )}

                    {recentScans.length > 0 && (
                        <div className="bg-[#1a151b]/80 border border-red-900/40 rounded-xl p-6 shadow-lg">
                            <h3 className="font-bold uppercase tracking-widest text-[#c5a059] text-sm mb-4 pb-2 border-b border-red-900/30">
                                Recently Scanned
                            </h3>
                            <div className="space-y-3">
                                {recentScans.map((scan, i) => (
                                    <div key={i} className="flex items-center gap-3 bg-black/40 p-2 rounded border border-red-900/20">
                                        <div className="w-10 h-10 bg-[#2a252b] rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                                            <img src={scan.url} alt={scan.name} className="max-w-full max-h-full object-contain" />
                                        </div>
                                        <span className="font-bold text-sm text-gray-200">{scan.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
