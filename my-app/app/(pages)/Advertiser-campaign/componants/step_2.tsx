'use client'

import { HelpCircle, User, ChevronRight, Check, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Errors = {
    title?: string;
    description?: string;
    selectedTags?: string;
    keywords?: string;
    image?: string;
};

type StepProps = {
    adID: string | null;
    next: () => void;
    back: () => void;
};

const niches = [
    { id: 'ecommerce', emoji: '🛒', label: 'E-commerce' },
    { id: 'tech', emoji: '💻', label: 'Tech & Software' },
    { id: 'health', emoji: '💊', label: 'Health & Wellness' },
    { id: 'finance', emoji: '💰', label: 'Finance' },
    { id: 'education', emoji: '📚', label: 'Education' },
    { id: 'travel', emoji: '✈️', label: 'Travel' },
    { id: 'food', emoji: '🍕', label: 'Food & Recipe' },
    { id: 'fashion', emoji: '👗', label: 'Fashion' },
    { id: 'gaming', emoji: '🎮', label: 'Gaming' },
    { id: 'realestate', emoji: '🏠', label: 'Real Estate' },
    { id: 'business', emoji: '📈', label: 'Business & Marketing' },
    { id: 'entertainment', emoji: '🎬', label: 'Entertainment' },
    { id: 'lifestyle', emoji: '🌿', label: 'Lifestyle' },
    { id: 'sports', emoji: '⚽', label: 'Sports' },
    { id: 'automotive', emoji: '🚗', label: 'Automotive' },
];

export default function Two({ adID, next, back }: StepProps) {

    const [accent, setAccent] = useState('#ffffff');

    useEffect(() => {
        const fetchAccent = async () => {
            const res = await fetch("/api/crud/Advertiser-campaign-step-2");
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

    const [KeyWords, setKeyWords] = useState([]);
    const [input, setInput] = useState("");
    const [description, setDescription] = useState("");
    const [errors, setErrors] = useState<Errors>({});
    const [selectedTags, setSelectedTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [Title, setTitle] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");
    const completedRef = useRef(false);
    const adIDRef = useRef(adID);

    useEffect(() => {
        adIDRef.current = adID;
    }, [adID]);

    useEffect(() => {
        return () => {
            if (!completedRef.current && adIDRef.current) {
                navigator.sendBeacon(
                    "/api/crud/Advertiser-campaign-cleanup",
                    JSON.stringify({ adID: adIDRef.current })
                );
            }
        };
    }, []);


    useEffect(() => { setErrors({}); }, [description, input, KeyWords, selectedTags, Title, imageFile]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === " " || e.key === ",") {
            e.preventDefault();
            const value = input.trim().toLowerCase();
            if (!value) return;
            if (!KeyWords.includes(value)) setKeyWords([...KeyWords, value]);
            setInput("");
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { setErrors({ ...errors, image: "Please select a valid image file" }); return; }
        if (file.size > 5 * 1024 * 1024) { setErrors({ ...errors, image: "Image size should be less than 5MB" }); return; }
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const removeImage = () => { setImageFile(null); setImagePreview(""); };
    const removeKeyword = (i) => setKeyWords(KeyWords.filter((_, idx) => idx !== i));
    const removeTag = (tag) => setSelectedTags(selectedTags.filter(t => t !== tag));

    const Next_btn = async () => {
        setLoading(true);
        const newErrors: Errors = {};
        if (!Title) newErrors.title = "This field is mandatory";
        if (!description) newErrors.description = "This field is mandatory";
        if (selectedTags.length === 0) newErrors.selectedTags = "This field is mandatory";
        if (KeyWords.length === 0 && !input) newErrors.keywords = "This field is mandatory";
        if (!imageFile) newErrors.image = "Please upload an image";
        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            try {
                const formData = new FormData();
                formData.append('image', imageFile);
                formData.append('KeyWords', JSON.stringify(KeyWords));
                formData.append('description', description);
                formData.append('selectedTags', JSON.stringify(selectedTags));
                formData.append('input', input);
                formData.append('adID', adID || '');
                formData.append('Title', Title);

                const res = await fetch("/api/crud/Advertiser-campaign-step-2", { method: "POST", body: formData });
                if (!res.ok) { setLoading(false); return; }
                completedRef.current = true;
                next();
            } catch (error) {
                console.error('Error:', error);
            }
        }
        setLoading(false);
    };

    const inputClass = (hasError: boolean) =>
        `w-full bg-[#0d0d0d] border rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-700 font-mono focus:outline-none transition-colors duration-150 ${hasError ? 'border-red-500/50' : 'border-gray-800/60'
        }`;

    const steps = [
        { n: 1, label: 'About your business', done: true, active: false },
        { n: 2, label: 'Create your campaign', done: false, active: true },
        { n: 3, label: 'Set Budget', done: false, active: false },
    ];

    return (
        <>
            {loading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-2 border-gray-700 border-t-gray-300 rounded-full animate-spin" />
                        <p className="text-gray-400 text-xs font-mono uppercase tracking-widest">Setting up your account…</p>
                    </div>
                </div>
            )}

            <div className="min-h-screen bg-[#0a0a0a] text-gray-300">

                {/* Header */}
                <header className="bg-[#0c0c0c] border-b border-[#1f1f1f]">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="flex items-center justify-between h-14">
                            <div className="flex items-center gap-3">
                                <span className="text-white font-semibold text-sm tracking-tight">Advertiser Campaign</span>
                                <span className="text-gray-700">|</span>
                                <span className="text-gray-500 text-sm">Create your first campaign</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="flex items-center gap-1.5 text-gray-600 hover:text-gray-300 transition-colors text-xs font-mono">
                                    <HelpCircle className="w-4 h-4" />
                                    Help
                                </button>
                                <div className="w-7 h-7 rounded-md bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
                                    <User className="w-4 h-4 text-gray-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="max-w-6xl mx-auto px-6 py-8">
                    <div className="flex flex-col lg:flex-row gap-6">

                        {/* Sidebar */}
                        <aside className="lg:w-56 flex-shrink-0">
                            <div className="bg-[#111111] border border-gray-800/70 rounded-xl p-5 sticky top-8">
                                <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-widest mb-5">Business Information</h3>
                                <div className="space-y-4">
                                    {steps.map((step, i) => (
                                        <div key={step.n} className="relative">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                                                    style={{
                                                        background: step.done || step.active ? accent : '#161616',
                                                        color: step.done || step.active ? '#000000' : '#4b5563',
                                                        border: step.done || step.active ? 'none' : '1px solid rgba(255,255,255,0.08)',
                                                    }}
                                                >
                                                    {step.done ? <Check className="w-3 h-3" /> : step.n}
                                                </div>
                                                <span className={`text-sm font-medium ${step.active ? 'text-white' : step.done ? 'text-gray-500' : 'text-gray-600'}`}>
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
                                    <p className="text-xs text-gray-400 font-medium">Campaign details</p>
                                    <p className="text-xs text-gray-600">Select Website Niches</p>
                                    <p className="text-xs text-gray-600">Enter keywords</p>
                                </div>
                            </div>
                        </aside>

                        {/* Main card */}
                        <div className="flex-1">
                            <div className="bg-[#111111] border border-gray-800/70 rounded-xl overflow-hidden">
                                <div className="p-8 space-y-8">

                                    {/* Step label */}
                                    <div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600 font-mono mb-4">
                                            <span>Step 2 of 3</span>
                                            <ChevronRight className="w-3 h-3" />
                                            <span className="text-gray-300">Create your campaign</span>
                                        </div>
                                        <h1 className="text-xl font-semibold text-white tracking-tight mb-1">Tell us more about your business</h1>
                                    </div>

                                    {/* Title */}
                                    <div>
                                        <label className="text-xs text-gray-600 uppercase tracking-widest mb-2 block">Title</label>
                                        <p className="text-xs text-gray-600 mb-3">Title which best represents your business</p>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={Title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                placeholder='e.g., "The best Web3 guide for Beginners"'
                                                className={inputClass(!!errors.title)}
                                                maxLength={3000}
                                                onFocus={e => e.currentTarget.style.borderColor = accent}
                                                onBlur={e => e.currentTarget.style.borderColor = errors.title ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}
                                            />
                                            <span className="absolute bottom-2.5 right-3 text-[10px] text-gray-700 font-mono">{Title.length} / 3000</span>
                                        </div>
                                        {errors.title && <p className="mt-1.5 text-xs text-red-400 font-mono">{errors.title}</p>}
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="text-xs text-gray-600 uppercase tracking-widest mb-2 block">Description</label>
                                        <p className="text-xs text-gray-600 mb-3">Describe what makes your business unique</p>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder='e.g., "Independent bookstore specialising in rare first editions"'
                                                className={inputClass(!!errors.description)}
                                                maxLength={3000}
                                                onFocus={e => e.currentTarget.style.borderColor = accent}
                                                onBlur={e => e.currentTarget.style.borderColor = errors.description ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}
                                            />
                                            <span className="absolute bottom-2.5 right-3 text-[10px] text-gray-700 font-mono">{description.length} / 3000</span>
                                        </div>
                                        {errors.description && <p className="mt-1.5 text-xs text-red-400 font-mono">{errors.description}</p>}
                                    </div>

                                    {/* Image upload */}
                                    <div>
                                        <label className="text-xs text-gray-600 uppercase tracking-widest mb-2 block">Business Image</label>
                                        <p className="text-xs text-gray-600 mb-3">Upload an image that represents your business (max 5MB)</p>

                                        {!imagePreview ? (
                                            <label className="block cursor-pointer">
                                                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                                <div
                                                    className="border border-dashed rounded-lg p-8 text-center transition-all duration-150"
                                                    style={{ borderColor: errors.image ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)', background: '#0d0d0d' }}
                                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = alpha(0.25)}
                                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = errors.image ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}
                                                >
                                                    <Upload className={`w-8 h-8 mx-auto mb-3 ${errors.image ? 'text-red-400' : 'text-gray-600'}`} />
                                                    <p className="text-sm text-gray-400 font-medium mb-1">Click to upload or drag and drop</p>
                                                    <p className="text-xs text-gray-600 font-mono">PNG, JPG, GIF up to 5MB</p>
                                                </div>
                                            </label>
                                        ) : (
                                            <div className="relative bg-[#0d0d0d] border border-gray-800/60 rounded-lg p-4">
                                                <img src={imagePreview} alt="Preview" className="max-h-56 mx-auto rounded-lg" />
                                                <button
                                                    onClick={removeImage}
                                                    className="absolute top-3 right-3 w-7 h-7 bg-[#161616] border border-gray-700/60 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:border-red-900/50 transition-all duration-150"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                        {errors.image && <p className="mt-1.5 text-xs text-red-400 font-mono">{errors.image}</p>}
                                    </div>

                                    {/* Niches */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className={`text-xs uppercase tracking-widest font-mono ${errors.selectedTags ? 'text-red-400' : 'text-gray-600'}`}>
                                                Website Niches
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-gray-600 font-mono">{selectedTags.length} / 15</span>
                                                {selectedTags.length > 0 && (
                                                    <button onClick={() => setSelectedTags([])} className="text-xs text-gray-500 hover:text-gray-300 transition-colors font-mono">
                                                        Clear all
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <p className={`text-xs mb-4 ${errors.selectedTags ? 'text-red-400' : 'text-gray-600'}`}>
                                            Choose niches that match your target audience — up to 15
                                        </p>
                                        {errors.selectedTags && <p className="mb-3 text-xs text-red-400 font-mono">{errors.selectedTags}</p>}

                                        {/* Selected pills */}
                                        {selectedTags.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {selectedTags.map((tag, i) => (
                                                    <div key={i} className="flex items-center gap-1.5 bg-[#0d0d0d] border border-gray-800/50 rounded-lg px-3 py-1.5 text-xs text-gray-300">
                                                        <span>{tag}</span>
                                                        <button onClick={() => removeTag(tag)} className="text-gray-600 hover:text-gray-300 transition-colors">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Niche grid */}
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                            {niches.map((niche) => {
                                                const tagText = `${niche.emoji} ${niche.label}`;
                                                const isSelected = selectedTags.includes(tagText);
                                                const isDisabled = !isSelected && selectedTags.length >= 15;

                                                return (
                                                    <button
                                                        key={niche.id}
                                                        type="button"
                                                        onClick={() => {
                                                            if (isSelected) removeTag(tagText);
                                                            else if (selectedTags.length < 15) setSelectedTags([...selectedTags, tagText]);
                                                        }}
                                                        disabled={isDisabled}
                                                        className="relative flex flex-col items-center justify-center gap-2 p-4 rounded-lg border transition-all duration-150 aspect-square"
                                                        style={{
                                                            background: isSelected ? '#1c1c1c' : '#0d0d0d',
                                                            border: `1px solid ${isSelected ? accent : 'rgba(255,255,255,0.06)'}`,
                                                            boxShadow: isSelected ? `0 0 14px ${alpha(0.08)}` : 'none',
                                                            opacity: isDisabled ? 0.4 : 1,
                                                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                        }}
                                                        onMouseEnter={e => { if (!isSelected && !isDisabled) (e.currentTarget as HTMLElement).style.borderColor = alpha(0.25); }}
                                                        onMouseLeave={e => { if (!isSelected && !isDisabled) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; }}
                                                    >
                                                        {isSelected && (
                                                            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                                                                <svg className="w-2.5 h-2.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                        <span className="text-2xl">{niche.emoji}</span>
                                                        <span className={`text-[10px] font-medium text-center leading-tight ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                                                            {niche.label}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Keywords */}
                                    <div>
                                        <label className="text-xs text-gray-600 uppercase tracking-widest mb-2 block">Keywords</label>
                                        <p className="text-xs text-gray-600 mb-3">
                                            Words or phrases to match your ads with search terms — press Enter, Space or comma to add
                                        </p>
                                        <div
                                            className="min-h-[48px] px-3 py-2 bg-[#0d0d0d] border border-gray-800/60 rounded-lg flex flex-wrap gap-2 items-center transition-colors duration-150"
                                            style={{ borderColor: errors.keywords ? 'rgba(239,68,68,0.5)' : undefined }}
                                        >
                                            {KeyWords.map((kw, i) => (
                                                <span key={i} className="flex items-center gap-1 bg-[#1c1c1c] border border-gray-700/60 text-gray-300 px-2 py-0.5 rounded text-xs font-mono">
                                                    {kw}
                                                    <button onClick={() => removeKeyword(i)} className="text-gray-600 hover:text-gray-300 transition-colors">
                                                        <X className="w-2.5 h-2.5" />
                                                    </button>
                                                </span>
                                            ))}
                                            <input
                                                type="text"
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                onKeyDown={handleKeyDown}
                                                placeholder={KeyWords.length === 0 ? "Type and press Enter…" : ""}
                                                className="flex-1 outline-none text-sm text-gray-200 placeholder-gray-700 bg-transparent font-mono min-w-[120px]"
                                                onFocus={e => (e.currentTarget.closest('div') as HTMLElement).style.borderColor = accent}
                                                onBlur={e => (e.currentTarget.closest('div') as HTMLElement).style.borderColor = errors.keywords ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}
                                            />
                                        </div>
                                        {errors.keywords && <p className="mt-1.5 text-xs text-red-400 font-mono">{errors.keywords}</p>}
                                    </div>

                                </div>

                                {/* Footer */}
                                <div className="px-8 py-5 bg-[#0d0d0d] border-t border-gray-800/60 flex items-center justify-between">
                                    <button
                                        onClick={back}
                                        className="px-5 py-2.5 rounded-lg bg-[#161616] border border-gray-800/60 text-gray-400 text-sm font-medium hover:text-gray-200 hover:border-gray-600 transition-all duration-150"
                                    >
                                        ← Back
                                    </button>
                                    <button
                                        onClick={Next_btn}
                                        className="px-6 py-2.5 cursor-pointer rounded-lg bg-[#161616] text-gray-200 text-sm font-semibold hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
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