'use client'

import { HelpCircle, User, Globe, Wallet, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';


export default function WebsiteRegistrationForm() {
    const [websiteName, setWebsiteName] = useState("");
    const [websiteURL, setWebsiteURL] = useState("");
    const [walletAddress, setWalletAddress] = useState("");
    const [keywords, setKeywords] = useState([]);
    const [keywordInput, setKeywordInput] = useState("");
    const [selectedNiches, setSelectedNiches] = useState([]);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [hasExistingWallet, setHasExistingWallet] = useState(false);
    const [userName, setUserName] = useState("");
    const [userImage, setUserImage] = useState("");

    const router = useRouter();

    const [accent, setAccent] = useState('#ffffff');

    const alpha = (op: number) => {
        const r = parseInt(accent.slice(1, 3), 16);
        const g = parseInt(accent.slice(3, 5), 16);
        const b = parseInt(accent.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${op})`;
    };
    useEffect(() => {
        const get_wallet_address = async () => {
            const res = await fetch("/api/crud/Publisher-campaign");
            const data = await res.json();
            if (data?.address?.wallet_address) {
                setWalletAddress(data.address.wallet_address);
                setHasExistingWallet(true);
            }
            setAccent(data.accent ?? '#ffffff');
            setUserName(data.user?.name ?? "");
            setUserImage(data.user?.image ?? "");
        };
        get_wallet_address();
    }, []);

    useEffect(() => { setErrors({}); }, [websiteName, websiteURL, walletAddress, keywords, selectedNiches]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" || e.key === " " || e.key === ",") {
            e.preventDefault();
            const value = keywordInput.trim().toLowerCase();
            if (!value) return;
            if (!keywords.includes(value)) setKeywords([...keywords, value]);
            setKeywordInput("");
        }
    };

    const removeKeyword = (index) => setKeywords(keywords.filter((_, i) => i !== index));
    const removeNiche = (n) => setSelectedNiches(selectedNiches.filter(x => x !== n));

    const validateForm = () => {
        const e: any = {};
        if (!websiteName.trim()) e.websiteName = "Website name is required";
        if (!websiteURL.trim()) e.websiteURL = "Website URL is required";
        else if (!/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(websiteURL)) e.websiteURL = "Please enter a valid URL";
        if (!walletAddress.trim()) e.walletAddress = "Wallet address is required";
        else if (walletAddress.length < 26 || walletAddress.length > 44) e.walletAddress = "Please enter a valid wallet address";
        if (selectedNiches.length === 0) e.selectedNiches = "Please select at least one niche";
        if (keywords.length === 0 && !keywordInput.trim()) e.keywords = "Please add at least one keyword";
        return e;
    };

    const handleSubmit = async () => {
        const newErrors = validateForm();
        setErrors(newErrors);
        if (Object.keys(newErrors).length !== 0) return;
        setLoading(true);
        try {
            const res = await fetch("/api/crud/Publisher-campaign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ websiteName, websiteURL, walletAddress, keywords, selectedNiches }),
            });
            if (!res.ok) throw new Error("Request failed");
            const data = await res.json();
            if (data.success === true) {
                setLoading(false);
                router.push("Publisher/Websites");
            }
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
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

    const inputClass = (hasError: boolean) =>
        `w-full px-4 py-3 rounded-lg bg-[#0d0d0d] border text-sm text-gray-200 placeholder-gray-700 font-mono focus:outline-none transition-colors duration-150 ${hasError ? 'border-red-500/50' : 'border-gray-800/60'
        }`;

    return (
        <>
            {loading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-2 border-gray-700 border-t-gray-300 rounded-full animate-spin" />
                        <p className="text-gray-400 text-xs font-mono uppercase tracking-widest">Registering website…</p>
                    </div>
                </div>
            )}

            <div className="min-h-screen bg-[#0a0a0a] text-gray-300">

                <header className="bg-[#0c0c0c] border-b border-[#1f1f1f]">
                    <div className="max-w-4xl mx-auto px-6">
                        <div className="flex items-center justify-between h-14">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => router.back()}
                                    className="w-7 h-7 rounded-md bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center hover:border-gray-600 hover:text-gray-300 text-gray-500 transition-all duration-150"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <span className="text-gray-700">|</span>
                                <span className="text-white font-semibold text-sm tracking-tight">Publisher Campaign</span>
                                <span className="text-gray-700">|</span>
                                <span className="text-gray-500 text-sm">Register Your Website</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {userName && (
                                    <span className="text-xs text-gray-500 font-mono hidden sm:block">{userName}</span>
                                )}
                                <div className="w-7 h-7 rounded-md bg-[#1a1a1a] border border-[#2a2a2a] overflow-hidden flex items-center justify-center">
                                    {userImage ? (
                                        <img src={userImage} alt={userName} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-4 h-4 text-gray-500" />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="max-w-4xl mx-auto px-6 py-8">
                    <div className="bg-[#111111] border border-gray-800/70 rounded-xl overflow-hidden">

                        <div className="px-8 py-6 border-b border-gray-800/60">
                            <p className="text-xs text-gray-600 uppercase tracking-widest font-mono mb-2">Website Details</p>
                            <h1 className="text-xl font-semibold text-white tracking-tight mb-1">Register your website to start earning</h1>
                            <p className="text-xs text-gray-600">Fill in your website details and we'll review your application within 24 hours</p>
                        </div>

                        <div className="p-8 space-y-8">

                            <div>
                                <label className="text-xs text-gray-600 uppercase tracking-widest mb-2 block">Website Name</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                    <input
                                        type="text"
                                        value={websiteName}
                                        onChange={(e) => setWebsiteName(e.target.value)}
                                        placeholder="e.g., TechBlog Daily"
                                        className={`${inputClass(!!errors.websiteName)} pl-10`}
                                        onFocus={e => e.currentTarget.style.borderColor = accent}
                                        onBlur={e => e.currentTarget.style.borderColor = errors.websiteName ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}
                                    />
                                </div>
                                {errors.websiteName && <p className="mt-1.5 text-xs text-red-400 font-mono">{errors.websiteName}</p>}
                            </div>

                            <div>
                                <label className="text-xs text-gray-600 uppercase tracking-widest mb-2 block">Website URL / Domain</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs font-mono">https://</span>
                                    <input
                                        type="text"
                                        value={websiteURL}
                                        onChange={(e) => setWebsiteURL(e.target.value)}
                                        placeholder="example.com"
                                        className={`${inputClass(!!errors.websiteURL)} pl-16`}
                                        onFocus={e => e.currentTarget.style.borderColor = accent}
                                        onBlur={e => e.currentTarget.style.borderColor = errors.websiteURL ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}
                                    />
                                </div>
                                {errors.websiteURL && <p className="mt-1.5 text-xs text-red-400 font-mono">{errors.websiteURL}</p>}
                            </div>

                            <div>
                                <label className="text-xs text-gray-600 uppercase tracking-widest mb-2 block">Wallet Address</label>
                                <p className="text-xs text-gray-600 mb-2">Your public wallet address to receive payments</p>
                                <div className="relative">
                                    <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                    <input
                                        type="text"
                                        value={walletAddress}
                                        onChange={(e) => setWalletAddress(e.target.value)}
                                        placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                                        disabled={hasExistingWallet}
                                        className={`${inputClass(!!errors.walletAddress)} pl-10 ${hasExistingWallet ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        onFocus={e => { if (!hasExistingWallet) e.currentTarget.style.borderColor = accent; }}
                                        onBlur={e => { if (!hasExistingWallet) e.currentTarget.style.borderColor = errors.walletAddress ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'; }}
                                    />
                                </div>
                                {errors.walletAddress && <p className="mt-1.5 text-xs text-red-400 font-mono">{errors.walletAddress}</p>}
                                {hasExistingWallet && (
                                    <p className="mt-1.5 text-xs text-gray-600 font-mono">
                                        Wallet locked. Change it in{" "}
                                        <span onClick={() => router.push("/Publisher/Settings")} className="text-gray-300 cursor-pointer hover:underline">
                                            Settings →
                                        </span>
                                    </p>
                                )}
                            </div>

                            {/* Niches */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className={`text-xs uppercase tracking-widest font-mono ${errors.selectedNiches ? 'text-red-400' : 'text-gray-600'}`}>
                                        Website Niches
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-600 font-mono">{selectedNiches.length} / 15</span>
                                        {selectedNiches.length > 0 && (
                                            <button onClick={() => setSelectedNiches([])} className="text-xs text-gray-500 hover:text-gray-300 transition-colors font-mono">
                                                Clear all
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className={`text-xs mb-4 ${errors.selectedNiches ? 'text-red-400' : 'text-gray-600'}`}>
                                    Choose up to 15 niches that represent your website content
                                </p>
                                {errors.selectedNiches && <p className="mb-3 text-xs text-red-400 font-mono">{errors.selectedNiches}</p>}

                                {/* Selected pills */}
                                {selectedNiches.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {selectedNiches.map((niche, i) => (
                                            <div key={i} className="flex items-center gap-1.5 bg-[#0d0d0d] border border-gray-800/50 rounded-lg px-3 py-1.5 text-xs text-gray-300">
                                                <span>{niche}</span>
                                                <button onClick={() => removeNiche(niche)} className="text-gray-600 hover:text-gray-300 transition-colors">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Niche grid */}
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                    {niches.map((niche) => {
                                        const nicheText = `${niche.emoji} ${niche.label}`;
                                        const isSelected = selectedNiches.includes(nicheText);
                                        const isDisabled = !isSelected && selectedNiches.length >= 15;

                                        return (
                                            <button
                                                key={niche.id}
                                                type="button"
                                                onClick={() => {
                                                    if (isSelected) removeNiche(nicheText);
                                                    else if (selectedNiches.length < 15) setSelectedNiches([...selectedNiches, nicheText]);
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
                                <p className="text-xs text-gray-600 mb-3">Add keywords describing your website — press Enter, Space or comma to add</p>

                                <div
                                    className="min-h-[48px] px-3 py-2 bg-[#0d0d0d] border border-gray-800/60 rounded-lg flex flex-wrap gap-2 items-center transition-colors duration-150"
                                    style={{ borderColor: errors.keywords ? 'rgba(239,68,68,0.5)' : undefined }}
                                    onFocus={() => { }}
                                >
                                    {keywords.map((kw, i) => (
                                        <span key={i} className="flex items-center gap-1 bg-[#1c1c1c] border border-gray-700/60 text-gray-300 px-2 py-0.5 rounded text-xs font-mono">
                                            {kw}
                                            <button onClick={() => removeKeyword(i)} className="text-gray-600 hover:text-gray-300 transition-colors">
                                                <X className="w-2.5 h-2.5" />
                                            </button>
                                        </span>
                                    ))}
                                    <input
                                        type="text"
                                        value={keywordInput}
                                        onChange={(e) => setKeywordInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={keywords.length === 0 ? "Type and press Enter…" : ""}
                                        className="flex-1 outline-none text-sm text-gray-200 placeholder-gray-700 bg-transparent font-mono min-w-[120px]"
                                        onFocus={e => (e.currentTarget.closest('div') as HTMLElement).style.borderColor = accent}
                                        onBlur={e => (e.currentTarget.closest('div') as HTMLElement).style.borderColor = errors.keywords ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}
                                    />
                                </div>
                                {errors.keywords && <p className="mt-1.5 text-xs text-red-400 font-mono">{errors.keywords}</p>}
                            </div>

                        </div>

                        {/* Footer actions */}
                        <div className="px-8 py-5 bg-[#0d0d0d] border-t border-gray-800/60 flex items-center justify-between">
                            <button
                                onClick={() => router.push("/Publisher/Websites")}
                                className="px-5 py-2.5 rounded-lg bg-[#161616] border border-gray-800/60 text-gray-400 text-sm font-medium hover:text-gray-200 hover:border-gray-600 transition-all duration-150"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-6 py-2.5 rounded-lg bg-[#161616] text-gray-200 text-sm font-semibold hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
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
                                Submit for Review
                            </button>
                        </div>

                    </div>
                </main>
            </div>
        </>
    );
}