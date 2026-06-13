'use client'

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    Globe, Wallet, X, ChevronLeft, Save, User, Loader2,
    MousePointer, Eye, TrendingUp, Coins, CheckCircle, Clock,
    Trash2,
} from 'lucide-react';

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

// ── Mini area chart (clicks) ──────────────────────────────────────────────────
const ClicksAreaChart = ({
    clicksChart,
    accent,
}: {
    clicksChart: { date: string; count: number }[];
    accent: string;
}) => {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    const r = parseInt(accent.slice(1, 3), 16);
    const g = parseInt(accent.slice(3, 5), 16);
    const b = parseInt(accent.slice(5, 7), 16);
    const a = (op: number) => `rgba(${r},${g},${b},${op})`;

    const W = 700; const H = 180;
    const padL = 10; const padR = 10; const padT = 24; const padB = 32;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const peak = Math.max(...clicksChart.map(c => c.count), 1);
    const total = clicksChart.reduce((s, c) => s + c.count, 0);

    const xOf = (i: number) => padL + (i / Math.max(clicksChart.length - 1, 1)) * chartW;
    const yOf = (v: number) => padT + chartH - (v / peak) * chartH;
    const pts = clicksChart.map((c, i) => ({ x: xOf(i), y: yOf(c.count) }));

    const toPath = (close = false) => {
        if (pts.length < 2) return '';
        let d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 0; i < pts.length - 1; i++) {
            const cp1x = pts[i].x + (pts[i + 1].x - pts[i].x) * 0.4;
            const cp2x = pts[i].x + (pts[i + 1].x - pts[i].x) * 0.6;
            d += ` C ${cp1x} ${pts[i].y}, ${cp2x} ${pts[i + 1].y}, ${pts[i + 1].x} ${pts[i + 1].y}`;
        }
        if (close) d += ` L ${pts[pts.length - 1].x} ${padT + chartH} L ${pts[0].x} ${padT + chartH} Z`;
        return d;
    };

    return (
        <div className="bg-[#111111] border border-gray-800/70 p-4 sm:p-6 rounded-xl mb-4 sm:mb-5">
            <div className="flex items-center justify-between mb-1">
                <div>
                    <h2 className="text-xs sm:text-sm font-semibold text-gray-200 uppercase tracking-widest">
                        Clicks — Last 7 Days
                    </h2>
                    <p className="text-xs text-gray-600 mt-0.5">Daily click activity</p>
                </div>
                <div className="text-right">
                    <span className="text-lg sm:text-xl font-bold font-mono" style={{ color: accent }}>
                        {total.toLocaleString()}
                    </span>
                    <p className="text-xs text-gray-600">total clicks</p>
                </div>
            </div>
            <div className="relative w-full" style={{ paddingBottom: '28%' }}>
                <svg
                    viewBox={`0 0 ${W} ${H}`}
                    className="absolute inset-0 w-full h-full overflow-visible"
                    preserveAspectRatio="none"
                >
                    <defs>
                        <linearGradient id="siteAreaFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={accent} stopOpacity="0.12" />
                            <stop offset="100%" stopColor={accent} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <line
                            key={i}
                            x1={padL} y1={padT + (i / 4) * chartH}
                            x2={padL + chartW} y2={padT + (i / 4) * chartH}
                            stroke="#1f1f1f" strokeWidth="1"
                        />
                    ))}
                    <path d={toPath(true)} fill="url(#siteAreaFill)" />
                    <path d={toPath()} fill="none" stroke={a(0.4)} strokeWidth="1.5" strokeLinecap="round" />
                    <path d={toPath()} fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
                    {hoveredIdx !== null && (
                        <line
                            x1={pts[hoveredIdx].x} y1={padT}
                            x2={pts[hoveredIdx].x} y2={padT + chartH}
                            stroke="#444" strokeWidth="1" strokeDasharray="3 3"
                        />
                    )}
                    {pts.map((pt, i) => (
                        <g key={i}>
                            <rect
                                x={pt.x - 30} y={padT} width={60} height={chartH}
                                fill="transparent"
                                onMouseEnter={() => setHoveredIdx(i)}
                                onMouseLeave={() => setHoveredIdx(null)}
                                onTouchStart={() => setHoveredIdx(i)}
                                onTouchEnd={() => setHoveredIdx(null)}
                                style={{ cursor: 'crosshair' }}
                            />
                            <circle
                                cx={pt.x} cy={pt.y}
                                r={hoveredIdx === i ? 4 : 2.5}
                                fill={hoveredIdx === i ? accent : a(0.4)}
                                stroke={hoveredIdx === i ? a(0.3) : 'none'}
                                strokeWidth="6"
                                style={{ transition: 'r 0.15s' }}
                                pointerEvents="none"
                            />
                            {hoveredIdx === i && (() => {
                                const tw = 108; const th = 38;
                                let tx = pt.x - tw / 2;
                                if (tx < 2) tx = 2;
                                if (tx + tw > W - 2) tx = W - tw - 2;
                                const ty = pt.y - th - 12;
                                return (
                                    <g pointerEvents="none">
                                        <rect x={tx} y={ty} width={tw} height={th} rx="5" fill="#1e1e1e" stroke="#333" strokeWidth="1" />
                                        <text x={tx + tw / 2} y={ty + 13} textAnchor="middle" fill="#aaa" fontSize="9" fontFamily="monospace">
                                            {clicksChart[i].date}
                                        </text>
                                        <circle cx={tx + 14} cy={ty + 27} r="3" fill={accent} />
                                        <text x={tx + 22} y={ty + 31} fill={accent} fontSize="11" fontWeight="700" fontFamily="monospace">
                                            {clicksChart[i].count} {clicksChart[i].count === 1 ? 'click' : 'clicks'}
                                        </text>
                                    </g>
                                );
                            })()}
                            <text
                                x={pt.x} y={padT + chartH + 18}
                                textAnchor="middle"
                                fill={hoveredIdx === i ? '#888' : '#3a3a3a'}
                                fontSize="9" fontFamily="monospace"
                            >
                                {clicksChart[i].date}
                            </text>
                        </g>
                    ))}
                </svg>
            </div>
        </div>
    );
};

// ── Delete Modal ──────────────────────────────────────────────────────────────
type DeleteModalProps = {
    accent: string;
    claimableSOL: number;
    onCancel: () => void;
    onClaimAndDelete: () => void;
    onDelete: () => void;
    isProcessing: boolean;
    phase: 'idle' | 'claiming' | 'deleting';
};

const DeleteModal = ({
    accent,
    claimableSOL,
    onCancel,
    onClaimAndDelete,
    onDelete,
    isProcessing,
    phase,
}: DeleteModalProps) => {
    const hasBalance = claimableSOL > 0;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
            style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }}
        >
            <div
                className="flex flex-col w-full sm:w-[360px] rounded-2xl px-6 sm:px-8 py-6 sm:py-8"
                style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)' }}
            >
                {/* Icon */}
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 sm:mb-6"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                    <Trash2 className="w-5 h-5 text-red-400" />
                </div>

                {/* Title */}
                <p className="text-white font-mono font-semibold text-sm tracking-tight mb-1">
                    {hasBalance ? 'Claim earnings before deleting' : 'Delete this website?'}
                </p>
                <p className="font-mono text-xs mb-5 sm:mb-6" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {hasBalance
                        ? 'You have unclaimed earnings. Withdraw them first, then this site will be deleted.'
                        : 'This action is permanent and cannot be undone.'}
                </p>

                {/* Balance card */}
                {hasBalance && (
                    <div
                        className="w-full rounded-xl p-4 mb-5 sm:mb-6 flex items-center justify-between"
                        style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                        <span
                            className="font-mono text-xs"
                            style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                        >
                            Claimable
                        </span>
                        <span className="font-mono font-semibold text-white text-sm">
                            {claimableSOL.toFixed(4)} SOL
                        </span>
                    </div>
                )}

                {/* Phase status */}
                {isProcessing && (
                    <div className="flex items-center gap-2 mb-4 sm:mb-5">
                        <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: accent, animation: 'withdraw-blink 1.2s ease-in-out infinite' }}
                        />
                        <span className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {phase === 'claiming' ? 'Processing withdrawal…' : 'Deleting website…'}
                        </span>
                    </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isProcessing}
                        className="flex-1 py-3 sm:py-2.5 rounded-xl text-sm font-mono font-medium transition-all duration-150 disabled:opacity-40 active:scale-95"
                        style={{
                            background: '#161616',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.5)',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={hasBalance ? onClaimAndDelete : onDelete}
                        disabled={isProcessing}
                        className="flex-1 py-3 sm:py-2.5 rounded-xl text-sm font-mono font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        style={{
                            background: 'rgba(239,68,68,0.12)',
                            border: '1px solid rgba(239,68,68,0.25)',
                            color: '#f87171',
                        }}
                    >
                        {isProcessing
                            ? phase === 'claiming' ? 'Claiming…' : 'Deleting…'
                            : hasBalance ? 'Claim & Delete' : 'Delete'}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes withdraw-blink {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function WebsiteDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [accent, setAccent] = useState('#ffffff');
    const [toast, setToast] = useState<string | null>(null);
    const [toastType, setToastType] = useState<'error' | 'success'>('error');
    const [userName, setUserName] = useState('');
    const [userImage, setUserImage] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePhase, setDeletePhase] = useState<'idle' | 'claiming' | 'deleting'>('idle');
    const isDeleteProcessing = deletePhase !== 'idle';

    // site data
    const [websiteName, setWebsiteName] = useState('');
    const [websiteURL, setWebsiteURL] = useState('');
    const [walletAddress, setWalletAddress] = useState('');
    const [siteStatus, setSiteStatus] = useState('');
    const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
    const [keywords, setKeywords] = useState<string[]>([]);
    const [keywordInput, setKeywordInput] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    // analytics
    const [analytics, setAnalytics] = useState<{
        totalImpressions: number;
        totalClicks: number;
        claimedClicks: number;
        unclaimedClicks: number;
        totalEarnings: number;
        claimedEarnings: number;
        ctr: string;
    } | null>(null);
    const [clicksChart, setClicksChart] = useState<{ date: string; count: number }[]>([]);

    const alpha = (op: number) => {
        const r = parseInt(accent.slice(1, 3), 16);
        const g = parseInt(accent.slice(3, 5), 16);
        const b = parseInt(accent.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${op})`;
    };

    const showToast = (msg: string, type: 'error' | 'success' = 'error') => {
        setToast(msg);
        setToastType(type);
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/crud/Publisher/Publisher_website/${id}`);
                const data = await res.json();
                if (!data.site) { setLoading(false); return; }

                setWebsiteName(data.site.website_name ?? '');
                setWebsiteURL(data.site.website_url ?? '');
                setWalletAddress(data.site.wallet_address ?? '');
                setSiteStatus(data.site.status ?? '');
                setSelectedNiches(
                    (data.site.Tags ?? []).map((t: string) => {
                        const match = niches.find(n => n.label === t);
                        return match ? `${match.emoji} ${match.label}` : t;
                    })
                );
                setKeywords(data.site.keywords ?? []);
                setAccent(data.accent ?? '#ffffff');
                setUserName(data.user?.name ?? '');
                setUserImage(data.user?.image ?? '');
                setAnalytics(data.analytics ?? null);
                setClicksChart(data.clicksChart ?? []);
            } catch (err) {
                console.error('Fetch failed:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    useEffect(() => { setErrors({}); }, [websiteName, selectedNiches, keywords]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
            e.preventDefault();
            const value = keywordInput.trim().toLowerCase();
            if (!value || keywords.includes(value)) return;
            setKeywords(prev => [...prev, value]);
            setKeywordInput('');
        }
    };

    const removeKeyword = (index: number) => setKeywords(prev => prev.filter((_, i) => i !== index));
    const removeNiche = (n: string) => setSelectedNiches(prev => prev.filter(x => x !== n));

    const validate = () => {
        const e: Record<string, string> = {};
        if (!websiteName.trim()) e.websiteName = 'Website name is required';
        if (selectedNiches.length === 0) e.selectedNiches = 'Please select at least one niche';
        if (keywords.length === 0 && !keywordInput.trim()) e.keywords = 'Please add at least one keyword';
        return e;
    };

    const handleSave = async () => {
        const newErrors = validate();
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;
        setSaving(true);
        try {
            const cleanNiches = selectedNiches.map(n =>
                n.replace(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu, '').trim()
            );
            const finalKeywords = keywordInput.trim()
                ? [...keywords, keywordInput.trim().toLowerCase()]
                : keywords;
            const res = await fetch(`/api/crud/Publisher/Publisher_website/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ websiteName, keywords: finalKeywords, selectedNiches: cleanNiches }),
            });
            if (!res.ok) throw new Error('Save failed');
            showToast('Changes saved successfully', 'success');
            setEditing(false);
        } catch {
            showToast('Failed to save changes. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeletePhase('deleting');
        const res = await fetch(`/api/crud/Publisher/Publisher_website/${id}`, { method: 'DELETE' });
        if (res.ok) {
            router.push('/Publisher/Dashboard');
        } else {
            showToast('Failed to delete website', 'error');
            setDeletePhase('idle');
            setShowDeleteModal(false);
        }
    };

    const inputClass = (hasError: boolean) =>
        `w-full px-4 py-3 rounded-lg bg-[#0d0d0d] border text-sm text-gray-200 placeholder-gray-700 font-mono focus:outline-none transition-colors duration-150 ${hasError ? 'border-red-500/50' : 'border-gray-800/60'}`;

    if (loading) return (
        <div className="flex h-screen bg-[#0a0a0a] items-center justify-center">
            <div className="w-5 h-5 border-2 border-gray-800 border-t-gray-400 rounded-full animate-spin" />
        </div>
    );

    const statCards = analytics ? [
        { label: 'Impressions', value: analytics.totalImpressions.toLocaleString(), icon: Eye, accent: false },
        { label: 'Total Clicks', value: analytics.totalClicks.toLocaleString(), icon: MousePointer, accent: false },
        { label: 'CTR', value: `${analytics.ctr}%`, icon: TrendingUp, accent: false },
        { label: 'Total Earnings', value: `${analytics.totalEarnings.toFixed(4)} SOL`, icon: Coins, accent: true },
        { label: 'Claimed', value: `${analytics.claimedEarnings.toFixed(4)} SOL`, icon: CheckCircle, accent: true },
        { label: 'Pending Clicks', value: analytics.unclaimedClicks.toLocaleString(), icon: Clock, accent: false },
    ] : [];

    return (
        <>
            {/* Delete Modal */}
            {showDeleteModal && (
                <DeleteModal
                    accent={accent}
                    claimableSOL={0}
                    onCancel={() => { if (!isDeleteProcessing) setShowDeleteModal(false); }}
                    onClaimAndDelete={handleDelete}
                    onDelete={handleDelete}
                    isProcessing={isDeleteProcessing}
                    phase={deletePhase}
                />
            )}

            {/* Saving overlay */}
            {saving && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-2 border-gray-700 border-t-gray-300 rounded-full animate-spin" />
                        <p className="text-gray-400 text-xs font-mono uppercase tracking-widest">Saving changes…</p>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div
                    className="fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 flex items-center gap-3 px-4 sm:px-5 py-3 rounded-lg shadow-xl"
                    style={{
                        background: '#1a1a1a',
                        border: toastType === 'success'
                            ? `1px solid ${alpha(0.35)}`
                            : '1px solid rgba(239,68,68,0.3)',
                    }}
                >
                    <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: toastType === 'success' ? accent : '#ef4444' }}
                    />
                    <p
                        className="text-sm font-mono flex-1"
                        style={{ color: toastType === 'success' ? accent : '#fca5a5' }}
                    >
                        {toast}
                    </p>
                    <button
                        onClick={() => setToast(null)}
                        className="text-gray-600 cursor-pointer hover:text-gray-300 transition-colors ml-2 p-1"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            <div className="min-h-screen bg-[#0a0a0a] text-gray-300">

                {/* ── Header ── */}
                <header className="bg-[#0c0c0c] border-b border-[#1f1f1f] sticky top-0 z-30">
                    <div className="max-w-4xl mx-auto px-3 sm:px-6">
                        <div className="flex items-center justify-between h-14 gap-2">

                            {/* Left: back + breadcrumb */}
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <button
                                    onClick={() => router.back()}
                                    className="w-7 h-7 shrink-0 rounded-md bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center hover:border-gray-600 hover:text-gray-300 text-gray-500 transition-all duration-150 active:scale-95"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-gray-700 hidden sm:block">|</span>
                                <span className="text-white font-semibold text-sm tracking-tight hidden sm:block">Publisher</span>
                                <span className="text-gray-700 hidden sm:block">|</span>
                                <span className="text-gray-500 text-sm truncate max-w-[120px] sm:max-w-none">
                                    {editing ? 'Edit Website' : websiteName || 'Website'}
                                </span>
                            </div>

                            {/* Right: user + actions */}
                            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                {userName && (
                                    <span className="text-xs text-gray-500 font-mono hidden md:block">{userName}</span>
                                )}
                                <div className="w-7 h-7 rounded-md bg-[#1a1a1a] border border-[#2a2a2a] overflow-hidden flex items-center justify-center">
                                    {userImage
                                        ? <img src={userImage} alt={userName} className="w-full h-full object-cover" />
                                        : <User className="w-4 h-4 text-gray-500" />
                                    }
                                </div>

                                {editing ? (
                                    <>
                                        <button
                                            onClick={() => setEditing(false)}
                                            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-200 border border-white/[0.06] hover:border-white/[0.12] transition-all duration-150 active:scale-95"
                                        >
                                            <X className="w-3 h-3" />
                                            <span className="hidden sm:inline">Cancel</span>
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 disabled:opacity-40 active:scale-95"
                                            style={{ background: alpha(0.1), border: `1px solid ${alpha(0.3)}`, color: accent }}
                                            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = alpha(0.18); }}
                                            onMouseLeave={e => { e.currentTarget.style.background = alpha(0.1); }}
                                        >
                                            {saving
                                                ? <><Loader2 className="w-3 h-3 animate-spin" /><span className="hidden sm:inline">Saving…</span></>
                                                : <><Save className="w-3 h-3" /><span className="hidden sm:inline">Save</span></>
                                            }
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setEditing(true)}
                                            className="flex cursor-pointer items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-200 border border-white/[0.06] hover:border-white/[0.12] transition-all duration-150 active:scale-95"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => setShowDeleteModal(true)}
                                            className="flex cursor-pointer items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition-all duration-150 text-red-500/60 hover:text-red-400 border border-red-500/10 hover:border-red-500/25 hover:bg-red-500/[0.04] active:scale-95"
                                        >
                                            <Trash2 className="w-3 h-3 sm:hidden" />
                                            <span className="hidden sm:inline">Delete</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="max-w-4xl mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-4 sm:space-y-6">

                    {/* ── View mode ── */}
                    {!editing && (
                        <>
                            {/* Site title row */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[10px] text-gray-700 uppercase tracking-[0.2em] mb-1 font-mono">Website</p>
                                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight break-words">
                                        {websiteName || websiteURL}
                                    </h1>
                                    <p className="text-xs text-gray-700 font-mono mt-0.5 break-all">{websiteURL}</p>
                                </div>
                                <span
                                    className="shrink-0 text-xs px-2 sm:px-2.5 py-1 rounded font-mono tracking-wide border whitespace-nowrap"
                                    style={{
                                        background: siteStatus === 'ACTIVE' ? alpha(0.06) : 'rgba(255,255,255,0.03)',
                                        borderColor: siteStatus === 'ACTIVE' ? alpha(0.25) : 'rgba(255,255,255,0.06)',
                                        color: siteStatus === 'ACTIVE' ? accent : '#52525b',
                                    }}
                                >
                                    {siteStatus === 'ACTIVE' && (
                                        <span
                                            className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle animate-pulse"
                                            style={{ background: accent }}
                                        />
                                    )}
                                    {siteStatus}
                                </span>
                            </div>

                            {/* Stat cards — 2 cols on mobile, 3 on desktop */}
                            {analytics && (
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                                    {statCards.map(card => (
                                        <div
                                            key={card.label}
                                            className="bg-[#0e0e0e] rounded-xl p-4 sm:p-5 border border-white/[0.05] hover:border-white/[0.1] transition-all duration-300"
                                        >
                                            <div className="flex items-start justify-between mb-3 sm:mb-4">
                                                <p className="text-[9px] sm:text-[10px] text-gray-600 uppercase tracking-[0.15em] leading-tight">
                                                    {card.label}
                                                </p>
                                                <card.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-700 shrink-0" />
                                            </div>
                                            <p
                                                className="text-lg sm:text-2xl font-bold tabular-nums font-mono break-all"
                                                style={{ color: card.accent ? accent : undefined }}
                                            >
                                                {card.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Clicks chart */}
                            {clicksChart.length > 0 && (
                                <ClicksAreaChart clicksChart={clicksChart} accent={accent} />
                            )}

                            {/* Site meta */}
                            <div className="bg-[#111111] border border-gray-800/70 rounded-xl overflow-hidden">
                                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-800/60">
                                    <h2 className="text-[10px] text-gray-600 uppercase tracking-[0.15em] font-mono">
                                        Site Details
                                    </h2>
                                </div>
                                <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                                    <div>
                                        <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1 font-mono">Niches</p>
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {selectedNiches.length > 0
                                                ? selectedNiches.map((n, i) => (
                                                    <span key={i} className="bg-[#161616] border border-white/[0.06] text-gray-400 px-2 sm:px-2.5 py-1 rounded-md text-[11px]">
                                                        {n}
                                                    </span>
                                                ))
                                                : <span className="text-gray-700 text-sm">—</span>
                                            }
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1 font-mono">Keywords</p>
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {keywords.length > 0
                                                ? keywords.map((k, i) => (
                                                    <span key={i} className="bg-[#161616] border border-white/[0.06] text-gray-400 px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-mono">
                                                        {k}
                                                    </span>
                                                ))
                                                : <span className="text-gray-700 text-sm">—</span>
                                            }
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1 font-mono">Wallet</p>
                                        <p className="text-xs text-gray-500 font-mono break-all">
                                            {walletAddress
                                                ? `${walletAddress.slice(0, 8)}…${walletAddress.slice(-8)}`
                                                : '—'
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1 font-mono">URL</p>
                                        <p className="text-xs text-gray-500 font-mono break-all">{websiteURL}</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── Edit mode ── */}
                    {editing && (
                        <div className="bg-[#111111] border border-gray-800/70 rounded-xl overflow-hidden">
                            <div className="px-4 sm:px-8 py-5 sm:py-6 border-b border-gray-800/60">
                                <p className="text-xs text-gray-600 uppercase tracking-widest font-mono mb-2">Website Settings</p>
                                <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight mb-1">Edit website details</h1>
                                <p className="text-xs text-gray-600">Update your website name, niches, and keywords. Wallet address is locked.</p>
                            </div>

                            <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">

                                {/* Website Name */}
                                <div>
                                    <label className="text-xs text-gray-600 uppercase tracking-widest mb-2 block">
                                        Website Name
                                    </label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                        <input
                                            type="text"
                                            value={websiteName}
                                            onChange={e => setWebsiteName(e.target.value)}
                                            placeholder="e.g., TechBlog Daily"
                                            className={`${inputClass(!!errors.websiteName)} pl-10`}
                                            onFocus={e => e.currentTarget.style.borderColor = accent}
                                            onBlur={e => e.currentTarget.style.borderColor = errors.websiteName ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}
                                        />
                                    </div>
                                    {errors.websiteName && (
                                        <p className="mt-1.5 text-xs text-red-400 font-mono">{errors.websiteName}</p>
                                    )}
                                </div>

                                {/* Website URL — locked */}
                                <div>
                                    <label className="text-xs text-gray-600 uppercase tracking-widest mb-2 block">Website URL</label>
                                    <p className="text-xs text-gray-600 mb-2">URL cannot be changed after registration</p>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs font-mono">
                                            https://
                                        </span>
                                        <input
                                            type="text"
                                            value={websiteURL}
                                            disabled
                                            className={`${inputClass(false)} pl-16 opacity-50 cursor-not-allowed`}
                                        />
                                    </div>
                                </div>

                                {/* Wallet — locked */}
                                <div>
                                    <label className="text-xs text-gray-600 uppercase tracking-widest mb-2 block">Wallet Address</label>
                                    <p className="text-xs text-gray-600 mb-2">Locked — change in Settings</p>
                                    <div className="relative">
                                        <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                        <input
                                            type="text"
                                            value={walletAddress}
                                            disabled
                                            className={`${inputClass(false)} pl-10 opacity-50 cursor-not-allowed`}
                                        />
                                    </div>
                                    <p className="mt-1.5 text-xs text-gray-600 font-mono">
                                        Change it in{' '}
                                        <span
                                            onClick={() => router.push('/Publisher/Settings')}
                                            className="text-gray-300 cursor-pointer hover:underline"
                                        >
                                            Settings →
                                        </span>
                                    </p>
                                </div>

                                {/* Niches */}
                                <div>
                                    <div className="flex items-center justify-between mb-2 gap-2">
                                        <label className={`text-xs uppercase tracking-widest font-mono ${errors.selectedNiches ? 'text-red-400' : 'text-gray-600'}`}>
                                            Website Niches
                                        </label>
                                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                            <span className="text-xs text-gray-600 font-mono">{selectedNiches.length} / 15</span>
                                            {selectedNiches.length > 0 && (
                                                <button
                                                    onClick={() => setSelectedNiches([])}
                                                    className="text-xs cursor-pointer text-gray-500 hover:text-gray-300 transition-colors font-mono"
                                                >
                                                    Clear all
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className={`text-xs mb-3 sm:mb-4 ${errors.selectedNiches ? 'text-red-400' : 'text-gray-600'}`}>
                                        Choose up to 15 niches
                                    </p>
                                    {errors.selectedNiches && (
                                        <p className="mb-3 text-xs text-red-400 font-mono">{errors.selectedNiches}</p>
                                    )}

                                    {selectedNiches.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {selectedNiches.map((niche, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center gap-1.5 bg-[#0d0d0d] border border-gray-800/50 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs text-gray-300"
                                                >
                                                    <span>{niche}</span>
                                                    <button
                                                        onClick={() => removeNiche(niche)}
                                                        className="text-gray-600 cursor-pointer hover:text-gray-300 transition-colors p-0.5"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Niche grid — 3 cols on mobile, 4 on sm, 5 on md */}
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                        {niches.map(niche => {
                                            const nicheText = `${niche.emoji} ${niche.label}`;
                                            const isSelected = selectedNiches.includes(nicheText);
                                            const isDisabled = !isSelected && selectedNiches.length >= 15;
                                            return (
                                                <button
                                                    key={niche.id}
                                                    type="button"
                                                    onClick={() => {
                                                        if (isSelected) removeNiche(nicheText);
                                                        else if (selectedNiches.length < 15) setSelectedNiches(prev => [...prev, nicheText]);
                                                    }}
                                                    disabled={isDisabled}
                                                    className="relative flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-lg border transition-all duration-150 aspect-square active:scale-95"
                                                    style={{
                                                        background: isSelected ? '#1c1c1c' : '#0d0d0d',
                                                        border: `1px solid ${isSelected ? accent : 'rgba(255,255,255,0.06)'}`,
                                                        boxShadow: isSelected ? `0 0 14px ${alpha(0.08)}` : 'none',
                                                        opacity: isDisabled ? 0.4 : 1,
                                                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                    }}
                                                    onMouseEnter={e => {
                                                        if (!isSelected && !isDisabled)
                                                            (e.currentTarget as HTMLElement).style.borderColor = alpha(0.25);
                                                    }}
                                                    onMouseLeave={e => {
                                                        if (!isSelected && !isDisabled)
                                                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
                                                    }}
                                                >
                                                    {isSelected && (
                                                        <div
                                                            className="absolute top-1.5 right-1.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center"
                                                            style={{ background: accent }}
                                                        >
                                                            <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                    <span className="text-xl sm:text-2xl">{niche.emoji}</span>
                                                    <span className={`text-[9px] sm:text-[10px] font-medium text-center leading-tight ${isSelected ? 'text-white' : 'text-gray-500'}`}>
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
                                    <p className="text-xs text-gray-600 mb-3">Press Enter, Space or comma to add</p>
                                    <div
                                        className="min-h-[48px] px-3 py-2 bg-[#0d0d0d] border border-gray-800/60 rounded-lg flex flex-wrap gap-2 items-center transition-colors duration-150"
                                        style={{ borderColor: errors.keywords ? 'rgba(239,68,68,0.5)' : undefined }}
                                    >
                                        {keywords.map((kw, i) => (
                                            <span
                                                key={i}
                                                className="flex items-center gap-1 bg-[#1c1c1c] border border-gray-700/60 text-gray-300 px-2 py-0.5 rounded text-xs font-mono"
                                            >
                                                {kw}
                                                <button
                                                    onClick={() => removeKeyword(i)}
                                                    className="text-gray-600 hover:text-gray-300 transition-colors p-0.5"
                                                >
                                                    <X className="w-2.5 h-2.5" />
                                                </button>
                                            </span>
                                        ))}
                                        <input
                                            type="text"
                                            value={keywordInput}
                                            onChange={e => setKeywordInput(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder={keywords.length === 0 ? 'Type and press Enter…' : ''}
                                            className="flex-1 outline-none text-sm text-gray-200 placeholder-gray-700 bg-transparent font-mono min-w-[100px]"
                                            onFocus={e => (e.currentTarget.closest('div') as HTMLElement).style.borderColor = accent}
                                            onBlur={e => (e.currentTarget.closest('div') as HTMLElement).style.borderColor = errors.keywords ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}
                                        />
                                    </div>
                                    {errors.keywords && (
                                        <p className="mt-1.5 text-xs text-red-400 font-mono">{errors.keywords}</p>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-4 sm:px-8 py-4 sm:py-5 bg-[#0d0d0d] border-t border-gray-800/60 flex items-center justify-between gap-3">
                                <button
                                    onClick={() => setEditing(false)}
                                    className="px-4 sm:px-5 py-2.5 rounded-lg bg-[#161616] border border-gray-800/60 text-gray-400 text-sm font-medium hover:text-gray-200 hover:border-gray-600 transition-all duration-150 active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-5 sm:px-6 py-2.5 rounded-lg bg-[#161616] text-gray-200 text-sm font-semibold hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{ border: `1px solid ${alpha(0.25)}` }}
                                    onMouseEnter={e => {
                                        if (!saving) {
                                            e.currentTarget.style.borderColor = accent;
                                            e.currentTarget.style.boxShadow = `0 0 18px ${alpha(0.12)}`;
                                            e.currentTarget.style.color = '#ffffff';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = alpha(0.25);
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.color = '';
                                    }}
                                >
                                    {saving ? 'Saving…' : 'Save changes'}
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}