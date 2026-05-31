'use client'

import { Plus, MoreHorizontal, Pause, Play, AlertCircle, X } from 'lucide-react';
import Sidebar from '../Sidebar/Sidebar';
import { useEffect, useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { useRouter } from 'next/navigation';
import { adIdToBytes, getPDA } from '@/lib/solana';

const alpha = (op: number) => `rgba(255,255,255,${op})`;

type Campaign = {
    id: string;
    business_name: string;
    destination_url: string;
    status: boolean;
    cost_per_click: number;
    impression: number;
    clicks: number;
    Cost: number;
    cpc: string;
    spent: number;
    percentUsed: number;
    vaultBalance: number;
    isInsufficient: boolean;
    created_at: string;
};

type SortKey = 'date' | 'clicks' | 'spent' | 'status';
type SortDir = 'asc' | 'desc';

type Toast = {
    id: number;
    message: string;
    type: 'error' | 'success' | 'info';
};

const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!);


function ToastNotification({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
    useEffect(() => {
        const t = setTimeout(() => onDismiss(toast.id), 5000);
        return () => clearTimeout(t);
    }, [toast.id, onDismiss]);

    return (
        <div
            className="flex items-start gap-3 bg-[#161616] border border-red-500/30 rounded-xl px-4 py-3 shadow-2xl shadow-black/50 min-w-[300px] max-w-[380px]"
            style={{ animation: 'slideIn 0.3s ease-out' }}
        >
            <div className="mt-0.5 flex-shrink-0 w-7 h-7 bg-red-950/50 border border-red-900/30 rounded-full flex items-center justify-center">
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-200">Insufficient Budget</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed font-mono">{toast.message}</p>
            </div>
            <button
                onClick={() => onDismiss(toast.id)}
                className="flex-shrink-0 text-gray-600 hover:text-gray-300 transition-colors mt-0.5"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
            {toasts.map(toast => (
                <ToastNotification key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
}


const Campaigns = () => {
    const activeTab = 'Campaigns';
    const router = useRouter();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [accent, setAccent] = useState('#10B981');
    const [showBudgetPopup, setShowBudgetPopup] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [sortKey, setSortKey] = useState<SortKey>('date');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    const addToast = (message: string, type: Toast['type'] = 'error') =>
        setToasts(prev => [...prev, { id: Date.now(), message, type }]);
    const dismissToast = (id: number) =>
        setToasts(prev => prev.filter(t => t.id !== id));

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const res = await fetch("/api/crud/Advertiser/Campaings");
                const data = await res.json();
                setAccent(data.accent ?? '#10B981');
                const rawCampaigns = Array.isArray(data) ? data : (data.campaigns ?? []);
                const programId = new PublicKey("5AhkXaS77PEWP8pDdQx3SMDbEizqJFns6an8J42dXUuw");

                const enriched = await Promise.all(
                    rawCampaigns.map(async (c: any) => {
                        if (!c.wallet_address) {
                            console.warn(`Campaign ${c.id} has no wallet_address, skipping vault balance check`);
                            const spent = (c.clicks ?? 0) * Number(c.cost_per_click ?? 0);
                            const budget = Number(c.Cost ?? 0);
                            const cpc = c.cost_per_click ? Number(c.cost_per_click) : 0;

                            return {
                                ...c,
                                vaultBalance: 0,
                                spent: parseFloat(spent.toFixed(6)),
                                percentUsed: budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0,
                                cpc: cpc.toFixed(6),
                                isInsufficient: true,
                            };
                        }

                        try {
                            const advertiserPubkey = new PublicKey(c.wallet_address);
                            const [advertiserVault] = PublicKey.findProgramAddressSync(
                                [Buffer.from("vault"), advertiserPubkey.toBuffer(), adIdToBytes(c.id)],
                                programId
                            );
                            const vaultBalance = await connection.getBalance(advertiserVault);
                            const spent = (c.clicks ?? 0) * Number(c.cost_per_click ?? 0);
                            const budget = Number(c.Cost ?? 0);
                            const cpc = c.cost_per_click ? Number(c.cost_per_click) : 0;
                            const isInsufficient = vaultBalance / 1e9 < cpc;

                            if (isInsufficient) {
                                await fetch("/api/crud/Advertiser/Campaings", {
                                    method: "PATCH",
                                    headers: { "content-type": "application/json" },
                                    body: JSON.stringify({ id: c.id, status: false })
                                });
                            }

                            return {
                                ...c,
                                status: isInsufficient ? false : c.status,
                                vaultBalance,
                                spent: parseFloat(spent.toFixed(6)),
                                percentUsed: budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0,
                                cpc: cpc.toFixed(6),
                                isInsufficient,
                            };
                        } catch (error) {
                            console.error(`Error processing campaign ${c.id}:`, error);
                            const spent = (c.clicks ?? 0) * Number(c.cost_per_click ?? 0);
                            const budget = Number(c.Cost ?? 0);
                            const cpc = c.cost_per_click ? Number(c.cost_per_click) : 0;

                            return {
                                ...c,
                                vaultBalance: 0,
                                spent: parseFloat(spent.toFixed(6)),
                                percentUsed: budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0,
                                cpc: cpc.toFixed(6),
                                isInsufficient: true,
                            };
                        }
                    })
                );

                setCampaigns(enriched);
            } catch (error) {
                console.error("Error fetching campaigns:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCampaigns();
    }, []);

    const sorted = [...campaigns].sort((a, b) => {
        let diff = 0;
        if (sortKey === 'date') diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        if (sortKey === 'clicks') diff = a.clicks - b.clicks;
        if (sortKey === 'spent') diff = a.spent - b.spent;
        if (sortKey === 'status') diff = Number(b.status) - Number(a.status);
        return sortDir === 'desc' ? -diff : diff;
    });

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
        else { setSortKey(key); setSortDir('desc'); }
    };

    return (
        <>
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />

            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(100%); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes fadeScaleIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to   { opacity: 1; transform: scale(1); }
                }
            `}</style>

            <div className="flex h-screen bg-[#0a0a0a] text-gray-300">
                <Sidebar activeTab={activeTab} />

                <main className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-6xl">

                        <div className="flex items-center font-mono justify-between mb-10">
                            <div>
                                <h1 className="text-3xl font-bold mb-1 text-white tracking-tight">Campaigns</h1>
                                <p className="text-gray-600 text-sm">Manage your advertising campaigns</p>
                            </div>

                            <button
                                onClick={() => router.push("/Advertiser-campaign")}
                                className="flex cursor-pointer items-center gap-2 px-5 py-2.5 rounded-xl bg-[#161616] text-gray-200 text-sm font-semibold hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                                style={{ border: `1px solid ${alpha(0.18)}` }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = accent;
                                    e.currentTarget.style.boxShadow = `0 0 18px ${accent}33`;
                                    e.currentTarget.style.color = accent;
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = alpha(0.18);
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.color = '';
                                }}
                            >
                                <Plus className="w-4  h-4" />
                                New Campaign
                            </button>
                        </div>

                        <div className="flex items-center gap-2 mb-6 font-mono">
                            <span className="text-xs text-gray-600 mr-1">Sort:</span>
                            {(['date', 'clicks', 'spent', 'status'] as SortKey[]).map(key => (
                                <button
                                    key={key}
                                    onClick={() => toggleSort(key)}
                                    className="flex cursor-pointer items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-all duration-150 border"
                                    style={{
                                        background: sortKey === key ? '#1a1a1a' : 'transparent',
                                        borderColor: sortKey === key ? accent : 'rgba(255,255,255,0.08)',
                                        color: sortKey === key ? accent : '#6b7280',
                                    }}
                                >
                                    {key.charAt(0).toUpperCase() + key.slice(1)}
                                    {sortKey === key && (
                                        <span className="text-[10px]">{sortDir === 'desc' ? '↓' : '↑'}</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {loading && (
                            <div className="flex items-center justify-center py-24">
                                <div
                                    className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                                    style={{ borderColor: `${accent} transparent transparent transparent` }}
                                />
                            </div>
                        )}

                        {!loading && campaigns.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-24 text-gray-600 text-sm font-mono">
                                <p className="mb-1">No campaigns found.</p>
                                <p className="text-xs text-gray-700">Create your first campaign to get started.</p>
                            </div>
                        )}

                        <div className="grid gap-4">
                            {sorted.map((campaign) => {
                                const isActive = campaign.status === true;

                                return (
                                    <div
                                        key={campaign.id}
                                        className="bg-[#111111] rounded-xl overflow-hidden hover:-translate-y-0.5 transition-all duration-200"
                                        style={{ border: `1px solid ${alpha(0.08)}` }}
                                        onMouseEnter={e => {
                                            (e.currentTarget as HTMLElement).style.borderColor = accent;
                                            (e.currentTarget as HTMLElement).style.boxShadow = `0 0 32px ${accent}1a`;
                                        }}
                                        onMouseLeave={e => {
                                            (e.currentTarget as HTMLElement).style.borderColor = alpha(0.08);
                                            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                                        }}
                                    >
                                        <div className="p-6">
                                            <div className="flex items-start justify-between mb-6">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1.5">
                                                        <h3 className="text-lg font-semibold text-white tracking-tight font-mono">
                                                            {campaign.business_name}
                                                        </h3>
                                                        <span className={`text-xs px-2 py-0.5 rounded font-mono tracking-wide border ${isActive
                                                            ? 'bg-gray-800 text-gray-300 border-gray-700'
                                                            : 'bg-[#1a1a1a] text-gray-500 border-gray-800'
                                                            }`}>
                                                            {isActive && (
                                                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-300 mr-1.5 align-middle animate-pulse" />
                                                            )}
                                                            {isActive ? 'ACTIVE' : 'PAUSED'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 font-mono">
                                                        {campaign.destination_url}
                                                    </p>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={async () => {
                                                            if (campaign.isInsufficient) {
                                                                addToast("Your vault balance is too low to display this ad. Please add more SOL to your vault.");
                                                                return;
                                                            }
                                                            const newStatus = !isActive;
                                                            await fetch("/api/crud/Advertiser/Campaings", {
                                                                method: "PATCH",
                                                                headers: { "content-type": "application/json" },
                                                                body: JSON.stringify({ id: campaign.id, status: newStatus })
                                                            });
                                                            setCampaigns(prev =>
                                                                prev.map(c => c.id === campaign.id ? { ...c, status: newStatus } : c)
                                                            );
                                                        }}
                                                        className="p-2 rounded-lg bg-[#161616] border border-gray-800/60 text-gray-500 hover:text-gray-200 cursor-pointer hover:border-gray-600 transition-all duration-150"
                                                        title={campaign.isInsufficient ? 'Insufficient budget' : isActive ? 'Pause' : 'Resume'}
                                                    >
                                                        {isActive ? <Pause className="w-4 h-4" /> : (
                                                            <Play className={`w-4 h-4 ${campaign.isInsufficient ? 'text-red-500' : ''}`} />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => router.push(`/Advertiser/Advertiser_campaigns/${campaign.id}`)}
                                                        className="p-2 rounded-lg bg-[#161616] border border-gray-800/60 text-gray-500 hover:text-gray-200 cursor-pointer hover:border-gray-600 transition-all duration-150"
                                                        title="More options"
                                                    >
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
                                                {[
                                                    { label: 'Budget', value: `${Number(campaign.Cost ?? 0).toFixed(4)} SOL`, accentColor: false },
                                                    { label: 'Remaining', value: `${(campaign.vaultBalance / 1e9).toFixed(4)} SOL`, accentColor: false },
                                                    { label: 'Spent', value: `${campaign.spent} SOL`, accentColor: true },
                                                    { label: 'Clicks', value: (campaign.clicks ?? 0).toLocaleString(), accentColor: false },
                                                    { label: 'CPC', value: `${campaign.cpc} SOL`, accentColor: false },
                                                    { label: 'Impressions', value: (campaign.impression ?? 0).toLocaleString(), accentColor: false },
                                                ].map((metric) => (
                                                    <div key={metric.label} className="bg-[#0d0d0d] border border-gray-800/50 p-4 rounded-lg">
                                                        <p className="text-xs text-gray-600 uppercase tracking-widest mb-1.5 font-mono">{metric.label}</p>
                                                        <p
                                                            className="text-base font-semibold font-mono tabular-nums"
                                                            style={{ color: metric.accentColor ? accent : undefined }}
                                                        >
                                                            {metric.value}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-700"
                                                        style={{
                                                            width: `${campaign.percentUsed}%`,
                                                            background: campaign.percentUsed > 85 ? '#ef4444' : accent,
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-600 font-mono w-16 text-right tabular-nums">
                                                    {campaign.percentUsed}% used
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                    </div>
                </main>

                {showBudgetPopup && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                        <div
                            className="bg-[#111111] rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl shadow-black/60"
                            style={{
                                border: `1px solid rgba(255,255,255,0.08)`,
                                animation: 'fadeScaleIn 0.25s ease-out',
                            }}
                        >
                            {/* Close button */}
                            <button
                                onClick={() => setShowBudgetPopup(false)}
                                className="absolute top-4 right-4 text-gray-600 hover:text-gray-300 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="flex flex-col items-center text-center gap-4">
                                {/* Icon */}
                                <div className="w-12 h-12 rounded-full bg-red-950/50 border border-red-900/30 flex items-center justify-center">
                                    <AlertCircle className="w-5 h-5 text-red-400" />
                                </div>

                                <div>
                                    <h2 className="text-white font-semibold text-lg font-mono mb-1">Insufficient Budget</h2>
                                    <p className="text-gray-500 text-sm font-mono leading-relaxed">
                                        Your vault balance is too low to display this ad. Add more SOL to your vault to keep your campaign running.
                                    </p>
                                </div>

                                <div className="flex gap-3 w-full mt-2">
                                    <button
                                        onClick={() => setShowBudgetPopup(false)}
                                        className="flex-1 py-2.5 rounded-xl bg-[#1a1a1a] text-gray-400 text-sm font-mono border border-gray-800 hover:border-gray-600 hover:text-gray-200 transition-all duration-150"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowBudgetPopup(false);
                                            router.push('/Advertiser/deposit');
                                        }}
                                        className="flex-1 py-2.5 rounded-xl text-white text-sm font-mono transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0"
                                        style={{
                                            background: accent,
                                            boxShadow: `0 0 18px ${accent}33`,
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                    >
                                        Add Budget
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Campaigns;