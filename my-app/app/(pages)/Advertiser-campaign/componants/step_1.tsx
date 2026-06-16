'use client'

import { HelpCircle, Globe, User, ChevronRight, AlertCircle, X } from 'lucide-react'
import { useEffect, useState, useRef } from 'react';

type OneProps = {
    next: () => void;
    setAdID: (id: string) => void;
    setFormattedURL: (url: string) => void;
};

type Errors = {
    businessName?: string;
    url?: string;
};

type Toast = {
    id: number;
    message: string;
    type: 'error' | 'success' | 'info';
};


function ToastNotification({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
    useEffect(() => {
        const t = setTimeout(() => onDismiss(toast.id), 5000);
        return () => clearTimeout(t);
    }, [toast.id, onDismiss]);

    return (
        <div className="flex items-start gap-3 bg-[#161616] border border-red-500/30 rounded-xl px-4 py-3 shadow-2xl shadow-black/50 min-w-[300px] max-w-[380px]"
            style={{ animation: 'slideIn 0.3s ease-out' }}>
            <div className="mt-0.5 flex-shrink-0 w-7 h-7 bg-red-950/50 border border-red-900/30 rounded-full flex items-center justify-center">
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-200">URL already in use</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed font-mono">{toast.message}</p>
            </div>
            <button onClick={() => onDismiss(toast.id)} className="flex-shrink-0 text-gray-600 hover:text-gray-300 transition-colors mt-0.5">
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
            {toasts.map(toast => <ToastNotification key={toast.id} toast={toast} onDismiss={onDismiss} />)}
        </div>
    );
}


export default function One({ next, setAdID }: OneProps) {
    const [accent, setAccent] = useState('#ffffff');

    useEffect(() => {
        const fetchAccent = async () => {
            const res = await fetch("/api/crud/Advertiser-campaign-step-1");
            const data = await res.json();
            setAccent(data.accent ?? '#ffffff');
        };
        fetchAccent();
    }, []);

    const alpha = (op: number) => {
        const r = parseInt(accent.slice(1, 3), 16);
        const g = parseInt(accent.slice(3, 5), 16);
        const b = parseInt(accent.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${op})`;
    };
    const [businessName, setBusinessName] = useState("");
    const [url, setUrl] = useState("");
    const [errors, setErrors] = useState<Errors>({});
    const [loading, setLoading] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (message: string, type: Toast['type'] = 'error') => setToasts(prev => [...prev, { id: Date.now(), message, type }]);
    const dismissToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

    const isValidUrl = (s: string): boolean => {
        if (!s.trim()) return false;
        const u = s.startsWith('http://') || s.startsWith('https://') ? s : `https://${s}`;
        try {
            const parsed = new URL(u);
            return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.includes('.');
        } catch { return false; }
    };

    const input_field_check = async () => {
        setLoading(true);
        const newErrors: Errors = {};
        if (!businessName.trim()) newErrors.businessName = "This field is mandatory";
        if (!url.trim()) newErrors.url = "This field is mandatory";
        else if (!isValidUrl(url)) newErrors.url = "Please enter a valid URL (e.g., example.com)";
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) { setLoading(false); return; }

        const formattedUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;

        const res = await fetch("/api/crud/Advertiser-campaign-step-1", {
            method: "POST",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify({ businessName, url: formattedUrl }),
        });

        if (res.status === 409) {
            const data = await res.json();
            addToast(data.error || "This website URL is already registered. Try a different one.");
            setErrors(prev => ({ ...prev, url: "This URL is already in use" }));
            setLoading(false);
            return;
        }
        if (!res.ok) { addToast("Something went wrong. Please try again."); setLoading(false); return; }

        const data = await res.json();
        setAdID(data.adID);
        setLoading(false);
        next();
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUrl(e.target.value);
        if (errors.url) setErrors(prev => ({ ...prev, url: undefined }));
    };

    const steps = [
        { n: 1, label: 'About your business', active: true },
        { n: 2, label: 'Create campaign', active: false },
        { n: 3, label: 'Set Budget', active: false },
    ];

    return (
        <>
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />

            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(100%); }
                    to   { opacity: 1; transform: translateX(0);    }
                }
            `}</style>

            {loading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-2 border-gray-700 border-t-gray-300 rounded-full animate-spin" />
                        <p className="text-gray-400 text-xs font-mono uppercase tracking-widest">Setting up your account…</p>
                    </div>
                </div>
            )}

            <div className="min-h-screen bg-[#0a0a0a] text-gray-300">

                <header className="bg-[#0c0c0c] border-b border-[#1f1f1f]">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="flex items-center justify-between h-14">
                            <div className="flex items-center gap-2">
                                <span className="text-white font-semibold text-sm tracking-tight">Advertiser Campaign</span>
                                <span className="text-gray-700 hidden sm:inline">|</span>
                                <span className="text-gray-500 text-sm hidden sm:inline">Create your first campaign</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="flex items-center gap-1.5 text-gray-600 hover:text-gray-300 transition-colors text-xs font-mono">
                                    <HelpCircle className="w-4 h-4" />
                                    <span className="hidden sm:inline">Help</span>
                                </button>
                                <div className="w-7 h-7 rounded-md bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
                                    <User className="w-4 h-4 text-gray-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8">                    <div className="flex flex-col lg:flex-row gap-6">

                    <aside className="hidden lg:block lg:w-56 flex-shrink-0">
                        <div className="bg-[#111111] border border-gray-800/70 rounded-xl p-5 sticky top-8">
                            <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-widest mb-5">Business Information</h3>
                            <div className="space-y-4">
                                {steps.map((step, i) => (
                                    <div key={step.n} className="relative">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                                                style={{
                                                    background: step.active ? accent : '#161616',
                                                    color: step.active ? '#000000' : '#4b5563',
                                                    border: step.active ? 'none' : '1px solid rgba(255,255,255,0.08)',
                                                }}
                                            >
                                                {step.n}
                                            </div>
                                            <span className={`text-sm font-medium ${step.active ? 'text-white' : 'text-gray-600'}`}>
                                                {step.label}
                                            </span>
                                        </div>
                                        {i < steps.length - 1 && (
                                            <div className="absolute left-3.5 top-7 w-px h-4 bg-gray-800/60" />
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-5 ml-10 space-y-2">
                                <p className="text-xs text-gray-400 font-medium">Your business name</p>
                                <p className="text-xs text-gray-600">Choose your destination</p>
                            </div>
                        </div>
                    </aside>

                    <div className="flex-1">
                        <div className="bg-[#111111] border border-gray-800/70 rounded-xl overflow-hidden">

                            <div className="p-4 sm:p-8">                          
                                <div className="flex items-center gap-2 text-xs text-gray-600 font-mono mb-4">
                                    <span>Step 1 of 3</span>
                                    <ChevronRight className="w-3 h-3" />
                                    <span className="text-gray-300">About your business</span>
                                </div>

                                <h1 className="text-xl font-semibold text-white tracking-tight mb-1">Tell us about your business</h1>
                                <p className="text-xs text-gray-600 mb-8">Get personalized suggestions based on your business information</p>

                              <div className="mb-8">
                                    <label className="text-xs text-gray-600 uppercase tracking-widest mb-2 block">Business Name</label>
                                    <input
                                        type="text"
                                        value={businessName}
                                        onChange={(e) => setBusinessName(e.target.value)}
                                        placeholder="e.g., 'Bharat Stores' or 'Sunny Restaurant'"
                                        className="w-full bg-[#0d0d0d] border border-gray-800/60 rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-700 focus:outline-none transition-colors duration-150"
                                        style={{ borderColor: errors.businessName ? 'rgba(239,68,68,0.5)' : undefined }}
                                        onFocus={e => e.currentTarget.style.borderColor = accent}
                                        onBlur={e => e.currentTarget.style.borderColor = errors.businessName ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}
                                    />
                                    {errors.businessName && <p className="mt-1.5 text-xs text-red-400 font-mono">{errors.businessName}</p>}
                                    <p className="mt-1.5 text-xs text-gray-600">Your business name will appear in your ads</p>
                                </div>

                                <div className="relative my-8">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-800/50" />
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="px-4 bg-[#111111] text-xs text-gray-600 font-mono">Where should people go after clicking your ad?</span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-gray-200 mb-1">Choose your destination</h3>
                                    <p className="text-xs text-gray-600 mb-5">Select where you want to send people who click your ad</p>

                                    <div
                                        className="p-5 bg-[#0d0d0d] border border-gray-800/50 rounded-lg transition-all duration-150"
                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = alpha(0.15)}
                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'}
                                    >
                                        <div className="flex items-start gap-3 mb-4">
                                            <input
                                                type="radio"
                                                id="website"
                                                name="destination"
                                                defaultChecked
                                                className="mt-0.5 w-4 h-4 accent-white"
                                            />
                                            <label htmlFor="website" className="cursor-pointer flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Globe className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm font-semibold text-gray-200">Your website</span>
                                                </div>
                                                <p className="text-xs text-gray-600 leading-relaxed">
                                                    Send people to a specific page on your website, homepage, YouTube channel, or social media page.
                                                </p>
                                            </label>
                                        </div>

                                        <div className="ml-7">
                                            <label className="text-xs text-gray-600 uppercase tracking-widest mb-2 block">Website URL</label>
                                            <div className="flex items-center min-w-0">
                                                <div className="flex items-center gap-1.5 px-2 sm:px-3 py-3 bg-[#111111] border border-r-0 border-gray-800/60 rounded-l-lg flex-shrink-0">
                                                    <Globe className="w-3.5 h-3.5 text-gray-600" />
                                                    <span className="text-xs text-gray-600 font-mono hidden sm:inline">https://</span>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={url}
                                                    onChange={handleUrlChange}
                                                    placeholder="www.example.com"
                                                    className="flex-1 bg-[#0d0d0d] border border-gray-800/60 rounded-r-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-700 font-mono focus:outline-none transition-colors duration-150"
                                                    style={{ borderColor: errors.url ? 'rgba(239,68,68,0.5)' : undefined }}
                                                    onFocus={e => e.currentTarget.style.borderColor = accent}
                                                    onBlur={e => e.currentTarget.style.borderColor = errors.url ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}
                                                />
                                            </div>
                                            {errors.url && <p className="mt-1.5 text-xs text-red-400 font-mono">{errors.url}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="px-4 sm:px-8 py-4 sm:py-5 bg-[#0d0d0d] border-t border-gray-800/60 flex items-center justify-between gap-3">
                                <p className="text-xs text-gray-600 font-mono hidden sm:flex items-center gap-1.5">
                                    <HelpCircle className="w-3.5 h-3.5" />
                                    Free ad setup help: <span className="text-gray-400">+91 8530920300</span>
                                </p>
                                <button
                                    onClick={input_field_check}
                                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#161616] text-gray-200 text-sm font-semibold hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                                    style={{ border: `1px solid ${alpha(0.25)}` }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = accent;
                                        e.currentTarget.style.boxShadow = `0 0 18px ${alpha(0.12)}`;
                                        e.currentTarget.style.color = '#ffffff';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = alpha(0.25);
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.color = '';
                                    }}
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
                </main>
            </div>
        </>
    );
}