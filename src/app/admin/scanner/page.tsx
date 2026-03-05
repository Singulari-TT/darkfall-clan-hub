"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { createWorker } from 'tesseract.js';

export default function ScannerPage() {
    const { data: session, status } = useSession();
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);
    const [recentScans, setRecentScans] = useState<{ name: string, icon_url: string }[]>([]);

    // Confirmation State
    const [scannedImage, setScannedImage] = useState<string | null>(null);
    const [scannedName, setScannedName] = useState<string>("");
    const [isConfirming, setIsConfirming] = useState(false);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!session?.user?.id) return;
            try {
                const res = await fetch('/api/scanner/history');
                if (res.ok) {
                    const data = await res.json();
                    setRecentScans(data.items || []);
                }
            } catch (e) {
                console.error("Failed to load history");
            }
        };
        fetchHistory();
    }, [session?.user?.id]);

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

        if (!imageFile) {
            // Ignore text pastes (like the user accidentally copying in-game chat)
            return;
        }

        // Prevent users from pasting massive full-screen images that crash the OCR
        if (imageFile.size > 2 * 1024 * 1024) { // 2MB limit
            setMessage({ text: "Image is too massive! OCR requires you to clip just the small tooltip box.", type: 'error' });
            return;
        }

        // Display preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(imageFile);

        setLoading(true);
        setMessage({ text: "Processing image...", type: 'info' });

        try {
            // Convert file to base64
            const base64 = await new Promise<string>((resolve) => {
                const r = new FileReader();
                r.onloadend = () => resolve(r.result as string);
                r.readAsDataURL(imageFile as Blob);
            });

            // Preprocess securely via HTML5 Canvas
            setMessage({ text: "Enhancing image for Engine...", type: 'info' });

            const processedBase64 = await new Promise<string>((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return reject(new Error("Failed to get canvas context"));

                    canvas.width = img.width;
                    // Crop bottom half of tooltip out, grab top 40px title strip
                    canvas.height = Math.min(img.height, 40);
                    ctx.drawImage(img, 0, 0);

                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    for (let i = 0; i < data.length; i += 4) {
                        const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                        const contrast = (avg - 128) * 1.5 + 128;
                        const clamped = Math.max(0, Math.min(255, contrast));
                        const inverted = 255 - clamped;
                        data[i] = inverted;
                        data[i + 1] = inverted;
                        data[i + 2] = inverted;
                    }
                    ctx.putImageData(imageData, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                };
                img.onerror = () => reject(new Error("Failed to load image for processing"));
                img.src = base64;
            });

            setMessage({ text: "Running Local Neural OCR...", type: 'info' });

            // Move Tesseract to Client Side instead of Vercel Serverless!
            const worker = await createWorker('eng');
            const ret = await worker.recognize(processedBase64);
            const text = ret.data.text;
            await worker.terminate();

            const lines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
            if (lines.length === 0) {
                throw new Error("Could not read any text from the provided image.");
            }

            const extractedName = lines[0];

            // Allow user to manually confirm before uploading
            setScannedName(extractedName);
            setScannedImage(base64);
            setIsConfirming(true);
            setMessage({ text: `Neural OCR complete. Please verify the extraction.`, type: 'success' });

        } catch (err: any) {
            setMessage({ text: err.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    const handleConfirm = async () => {
        if (!scannedImage || !scannedName.trim()) return;

        setLoading(true);
        setMessage({ text: `Uploading "${scannedName}" to global archive...`, type: 'info' });

        try {
            const res = await fetch('/api/scanner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64: scannedImage, extractedName: scannedName.trim() })
            });

            const contentType = res.headers.get("content-type");
            let data: any = {};

            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await res.json();
            } else {
                throw new Error(`Server returned status ${res.status}: Upload timed out or failed.`);
            }

            if (!res.ok) {
                throw new Error(data.error || "Failed to scan image");
            }

            setMessage({ text: data.message, type: 'success' });
            setRecentScans(prev => [{ name: data.item.name, icon_url: data.item.iconUrl }, ...prev].slice(0, 5));
            setIsConfirming(false);
            setScannedImage(null);
            setScannedName("");
        } catch (err: any) {
            setMessage({ text: err.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        document.addEventListener("paste", handlePaste);
        return () => {
            document.removeEventListener("paste", handlePaste);
        };
    }, [handlePaste]);

    if (status === "loading") {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="w-12 h-12 rounded-full border-4 border-[#c5a059] border-t-transparent animate-spin"></div>
            </div>
        );
    }

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
                            {isConfirming && (
                                <div className="w-full p-4 bg-black/40 border border-red-900/40 rounded-lg mt-2">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-[#c5a059] mb-2">Confirm Item Name</label>
                                    <input
                                        type="text"
                                        value={scannedName}
                                        onChange={(e) => setScannedName(e.target.value)}
                                        className="w-full bg-black/50 border border-red-900/50 rounded p-3 text-white focus:outline-none focus:border-red-500 mb-4 font-bold tracking-wider"
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleConfirm}
                                            disabled={loading || !scannedName.trim()}
                                            className="flex-1 bg-green-900/40 hover:bg-green-800/60 text-green-400 border border-green-900/50 uppercase tracking-widest text-xs font-bold py-3 rounded transition-colors disabled:opacity-50"
                                        >
                                            {loading ? 'Archiving...' : 'Confirm & Archive'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsConfirming(false);
                                                setPreview(null);
                                                setScannedImage(null);
                                                setMessage(null);
                                            }}
                                            disabled={loading}
                                            className="px-4 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 uppercase tracking-widest text-xs font-bold rounded transition-colors disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {loading && !isConfirming && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-xl z-20">
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
                                    <div key={i} className="flex items-center gap-3 bg-black/40 p-2 rounded border border-emerald-900/30">
                                        <div className="w-10 h-10 bg-[#2a252b] rounded flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                                            <div className="absolute inset-0 bg-emerald-500/10 z-0"></div>
                                            <img src={scan.icon_url} alt={scan.name} className="max-w-full max-h-full object-contain relative z-10" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-gray-200">{scan.name}</span>
                                            <span className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                Verified
                                            </span>
                                        </div>
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
