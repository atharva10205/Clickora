'use client'

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Trash2, Pencil, Save, X, MousePointer, Eye, TrendingUp, Wallet, ArrowDownToLine, AlertTriangle, ChevronLeft, Plus, Minus, Loader2 } from 'lucide-react';
import BN from "bn.js";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { adIdToBytes, getPDA, getProgram } from '@/lib/solana';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

type AdData = {
    id: string;
    business_name: string | null;
    title: string | null;
    Description: string | null;
    Tags: string[];
    keywords: string[];
    imageUrl: string | null;
    cost_per_click: string | null;
    Clicks: number | null;
    Cost: string | null;
    RemainingAmount: number | null;
    status: boolean;
    AmountNull: boolean | null;
};

type Analytics = {
    totalClicks: number;
    totalImpressions: number;
    ctr: string;
    budgetUsed: string;
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

const CampaignPage = () => {
    const { id } = useParams();
    const router = useRouter();
    const [ad, setAd] = useState<AdData | null>(null);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [accent, setAccent] = useState('#ffffff');
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAddress, setWithdrawAddress] = useState('');
    const [withdrawing, setWithdrawing] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [withdrawnAmount, setWithdrawnAmount] = useState<string>('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [keywords, setKeywords] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [Wallet_Address, setWallet_Address] = useState('');
    const [vaultBalance, setVaultBalance] = useState<number | null>(null);
    const [unclaimedClicks, setUnclaimedClicks] = useState(0);
    const [showAddFundsModal, setShowAddFundsModal] = useState(false);
    const [addClicksInput, setAddClicksInput] = useState<string>('100');
    const [depositing, setDepositing] = useState(false);
    const [addFundsSuccess, setAddFundsSuccess] = useState(false);
    const [addFundsDepositedSOL, setAddFundsDepositedSOL] = useState<string>('');

    const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!);
    const { connection: walletConnection } = useConnection();
    const wallet = useWallet();


    const addClicksNum = Math.max(0, parseInt(addClicksInput) || 0);
    const cpcSOL = Number(ad?.cost_per_click ?? 0);
    const addFundsTotalSOL = addClicksNum * cpcSOL;
    const addFundsLamports = Math.round(addFundsTotalSOL * 1_000_000_000);
    const platformFee = Math.round(addFundsLamports * 10 / 1000);
    const netToVault = addFundsLamports - platformFee;

    const alpha = (op: number) => {
        const r = parseInt(accent.slice(1, 3), 16);
        const g = parseInt(accent.slice(3, 5), 16);
        const b = parseInt(accent.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${op})`;
    };

    const handleAddFunds = async () => {
        if (!ad || !wallet.publicKey) { showToast("Please connect your wallet first"); return; }
        if (wallet.publicKey.toString() !== Wallet_Address) {
            showToast("Connect the advertiser wallet to add funds");
            return;
        }
        if (addClicksNum <= 0) { showToast("Enter a valid number of clicks"); return; }

        setDepositing(true);
        try {
            const program = getProgram(wallet, walletConnection);
            const AdId = adIdToBytes(ad.id);
            const advertiserKey = new PublicKey(Wallet_Address);
            const SERVICE_FEE = new PublicKey("C3qzo7FpXSgQ7ytMdjhqjd3R5ZWReEYFeHdKD7oyXpLz");

            const { adPDA, vaultPDA } = getPDA(advertiserKey, AdId);



            const tx = await program.methods
                .deposit(new BN(addFundsLamports))
                .accounts({
                    ad: adPDA,
                    vault: vaultPDA,
                    advertiser: advertiserKey,
                    serviceFee: SERVICE_FEE,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();
            const latestBlockhash = await walletConnection.getLatestBlockhash();
            await walletConnection.confirmTransaction(
                { signature: tx, ...latestBlockhash },
                'confirmed'
            );

            await fetch(`/api/crud/Advertiser/Advertiser-campaign/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    additionalClicks: addClicksNum,
                    additionalSOL: addFundsTotalSOL,
                    additionalLamports: netToVault,
                }),
            });

            const res = await fetch(`/api/crud/Advertiser/Advertiser-campaign/${id}`);
            const data = await res.json();
            setAd(data.ad);
            setAnalytics(data.analytics);

            setAddFundsDepositedSOL(addFundsTotalSOL.toFixed(6));
            setAddFundsSuccess(true);
        } catch (err: any) {
            console.error("Deposit failed:", err);
            showToast(`Deposit failed: ${err.message || "Unknown error"}`);
        } finally {
            setDepositing(false);
        }
    };

    const openAddFundsModal = () => {
        setAddClicksInput('100');
        setAddFundsSuccess(false);
        setShowAddFundsModal(true);
    };

    const closeAddFundsModal = () => {
        setShowAddFundsModal(false);
        setAddFundsSuccess(false);
    };

    useEffect(() => {
        const fetch_data = async () => {
            try {
                const res = await fetch(`/api/crud/Advertiser/Advertiser-campaign/${id}`);
                const data = await res.json();
                if (!data.ad) { setLoading(false); return; }
                setAd(data.ad);
                setAnalytics(data.analytics);
                setAccent(data.accent ?? '#ffffff');
                setTitle(data.ad.title ?? '');
                setDescription(data.ad.Description ?? '');
                setBusinessName(data.ad.business_name ?? '');
                setSelectedTags(data.ad.Tags ?? []);
                setKeywords((data.ad.keywords ?? []).join(', '));
                setImageUrl(data.ad.imageUrl ?? '');
                setWallet_Address(data.ad.wallet_address ?? '');
                setUnclaimedClicks(data.analytics.unclaimedClicks ?? 0);
            } catch (err) {
                console.error("Fetch failed:", err);
            } finally {
                setLoading(false);
            }
        };
        fetch_data();
    }, [id]);

    useEffect(() => {
        const fetchVaultBalance = async () => {
            if (!Wallet_Address || !ad?.id || !analytics) return;
            try {
                const PROGRAM_ID = new PublicKey("5AhkXaS77PEWP8pDdQx3SMDbEizqJFns6an8J42dXUuw");
                const adId = adIdToBytes(ad.id);
                const [vaultPDA] = PublicKey.findProgramAddressSync(
                    [Buffer.from("vault"), new PublicKey(Wallet_Address).toBuffer(), Buffer.from(adId)],
                    PROGRAM_ID
                );
                const lamports = await connection.getBalance(vaultPDA);
                const cpc = Number(ad.cost_per_click ?? 0);
                const totalOwedLamports = Math.round(analytics.totalClicks * cpc * 1e9);
                const withdrawableLamports = Math.max(0, lamports - totalOwedLamports);
                setVaultBalance(withdrawableLamports / 1e9);
            } catch (err) {
                console.error("Failed to fetch vault balance:", err);
            }
        };
        fetchVaultBalance();
    }, [Wallet_Address, ad?.id, analytics]);
    const removeTag = (tag: string) => setSelectedTags(prev => prev.filter(t => t !== tag));

    const handleSave = async () => {
        setSaving(true);
        await fetch(`/api/crud/Advertiser/Advertiser-campaign/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                Description: description,
                business_name: businessName,
                Tags: selectedTags,
                keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
                imageUrl,
            }),
        });
        setSaving(false);
        setEditing(false);
        const res = await fetch(`/api/crud/Advertiser/Advertiser-campaign/${id}`);
        const data = await res.json();
        setAd(data.ad);
        setSelectedTags(data.ad.Tags ?? []);
    };

   const Withdraw = async () => {
    if (!ad || !wallet.publicKey) { showToast("Please connect your wallet first"); return; }
    if (!withdrawAddress.trim()) { showToast("Please enter a recipient address"); return; }
    
    let recipientPubkey: PublicKey;
    try { 
        recipientPubkey = new PublicKey(withdrawAddress); 
    } catch (err) { 
        showToast("Invalid recipient address"); 
        return; 
    }
    
    if (wallet.publicKey.toString() !== Wallet_Address) {
        showToast("You must be connected with the advertiser wallet to withdraw funds");
        return;
    }

    setWithdrawing(true);
    try {
        const program = getProgram(wallet, walletConnection);
        const adID = adIdToBytes(ad.id);
        const advertiserKey = new PublicKey(Wallet_Address);
        const PROGRAM_ID = new PublicKey("5AhkXaS77PEWP8pDdQx3SMDbEizqJFns6an8J42dXUuw");

        const [adPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("ad"), advertiserKey.toBuffer(), Buffer.from(adID)],
            PROGRAM_ID
        );
        const [vaultPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("vault"), advertiserKey.toBuffer(), Buffer.from(adID)],
            PROGRAM_ID
        );

        const rawLamports = await walletConnection.getBalance(vaultPDA);
        const cpc = Number(ad.cost_per_click ?? 0);
        const totalOwedLamports = Math.round((analytics?.totalClicks ?? 0) * cpc * 1e9);
        const withdrawableLamports = Math.max(0, rawLamports - totalOwedLamports);

        if (withdrawableLamports === 0) {
            showToast("No withdrawable funds — remaining balance is reserved for publisher payouts");
            setWithdrawing(false);
            return;
        }

        const signature = await program.methods
            .refund(new BN(withdrawableLamports))
            .accounts({
                vault: vaultPDA,
                ad: adPDA,
                advertiserKey: advertiserKey,
                recipient: recipientPubkey,
                signer: wallet.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        const latestBlockhash = await walletConnection.getLatestBlockhash();
        await walletConnection.confirmTransaction(
            { signature, ...latestBlockhash },
            'confirmed'
        );

        await fetch(`/api/crud/Advertiser/Advertiser-campaign/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tx_signature: signature,
                publisher_wallet: withdrawAddress,
                total_amount: withdrawableLamports,
            }),
        });

        const res = await fetch(`/api/crud/Advertiser/Advertiser-campaign/${id}`);
        const data = await res.json();
        setAd(data.ad);
        setAnalytics(data.analytics);
        setVaultBalance(0);

        setShowWithdrawModal(false);
        setWithdrawAddress('');
        setWithdrawnAmount((withdrawableLamports / 1e9).toFixed(6));
        setShowSuccessModal(true);

    } catch (err: any) {
        console.error("Withdrawal failed:", err);
        if (err.message?.includes("Unauthorized")) {
            showToast("Unauthorized: You must be the advertiser to withdraw funds");
        } else if (err.message?.includes("InvalidAmount")) {
            showToast("Invalid amount: Vault may be empty or below minimum rent");
        } else if (err.message?.includes("User rejected")) {
            showToast("Transaction rejected by wallet");
        } else {
            showToast(`Withdrawal failed: ${err.message || "Unknown error"}`);
        }
    } finally {
        setWithdrawing(false);
    }
};

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 4000);
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await fetch(`/api/crud/Advertiser/Advertiser-campaign/${id}`, { method: 'DELETE' });
            router.push('Advertiser/Campaigns');
        } catch (err) {
            console.error("Delete failed:", err);
            showToast("Failed to delete campaign. Please try again.");
        } finally {
            setDeleting(false);
        }
    };

   const handleDeleteClick = async () => {
    if (!Wallet_Address || !ad?.id) return;

    const res = await fetch(`/api/crud/Advertiser/Advertiser-campaign/${id}`);
    const data = await res.json();

    if (!data.ad) {
        showToast("Failed to verify campaign state.");
        return;
    }

    setAd(data.ad);

    if (data.ad.AmountNull !== true) {
        showToast("Withdraw remaining funds before deleting this campaign.");
        return;
    }

    setShowDeleteModal(true);
};
    if (loading) return (
        <div className="flex h-screen bg-[#0a0a0a] items-center justify-center">
            <div className="w-5 h-5 border-2 border-gray-800 border-t-gray-400 rounded-full animate-spin" />
        </div>
    );

    const budgetUsedNum = analytics ? parseFloat(analytics.budgetUsed) : 0;

    const remainingClicks = ad?.Clicks != null && analytics
        ? Math.max(ad.Clicks - analytics.totalClicks, 0)
        : null;

    const statCards = analytics ? [
        { label: 'Clicks', value: analytics.totalClicks.toLocaleString(), icon: MousePointer, sub: 'total recorded' },
        { label: 'Impressions', value: analytics.totalImpressions.toLocaleString(), icon: Eye, sub: 'total views' },
        { label: 'CTR', value: `${analytics.ctr}%`, icon: TrendingUp, sub: 'click-through rate' },
        { label: 'Budget Used', value: `${analytics.budgetUsed}%`, icon: Wallet, sub: 'of total budget' },
        { label: 'Remaining Budget', value: vaultBalance !== null ? `${vaultBalance.toFixed(4)} SOL` : '—', icon: ArrowDownToLine, sub: 'in vault' },
        { label: 'Remaining Clicks', value: remainingClicks !== null ? remainingClicks.toLocaleString() : '—', icon: MousePointer, sub: 'clicks left' },
    ] : [];
    const textFields = [
        { label: 'Business Name', value: businessName, set: setBusinessName, placeholder: 'Your business name' },
        { label: 'Title', value: title, set: setTitle, placeholder: 'Ad headline' },
        { label: 'Description', value: description, set: setDescription, placeholder: 'Ad copy' },
        { label: 'Image URL', value: imageUrl, set: setImageUrl, placeholder: 'https://...' },
    ];

    return (
        <div className="min-h-screen bg-[#080808] text-gray-300 font-mono">
            <style>{`
                @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
                @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
                .fade-up { animation: fadeUp 0.4s ease forwards; }
                .fade-up-1 { animation: fadeUp 0.4s 0.05s ease both; }
                .fade-up-2 { animation: fadeUp 0.4s 0.1s ease both; }
                .fade-up-3 { animation: fadeUp 0.4s 0.15s ease both; }
                .fade-up-4 { animation: fadeUp 0.4s 0.2s ease both; }
                input:focus { outline: none; }
                .stat-card:hover .stat-icon { opacity: 1; transform: scale(1.1); }
            `}</style>

            <div className="sticky top-0 z-30 bg-[#080808]/90 backdrop-blur-md border-b border-white/[0.04]">
                <div className="max-w-5xl mx-auto px-8 h-14 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex cursor-pointer items-center gap-2 text-xs text-gray-600 hover:text-gray-300 transition-colors duration-150"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        Back
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full border"
                            style={{
                                background: ad?.status ? alpha(0.06) : 'rgba(255,255,255,0.03)',
                                borderColor: ad?.status ? alpha(0.25) : 'rgba(255,255,255,0.06)',
                                color: ad?.status ? accent : '#52525b',
                            }}>
                            <span className="w-1.5 h-1.5 rounded-full"
                                style={{ background: ad?.status ? accent : '#52525b' }} />
                            {ad?.status ? 'Active' : 'Paused'}
                        </span>

                        {editing ? (
                            <>
                                <button
                                    onClick={() => setEditing(false)}
                                    className="flex cursor-pointer items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-200 border border-white/[0.06] hover:border-white/[0.12] transition-all duration-150"
                                >
                                    <X className="w-3 h-3" /> Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center cursor-pointer gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 disabled:opacity-40"
                                    style={{ background: accent, color: '#000' }}
                                >
                                    <Save className="w-3 h-3" />
                                    {saving ? 'Saving…' : 'Save changes'}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => setEditing(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer rounded-lg text-xs text-gray-500 hover:text-gray-200 border border-white/[0.06] hover:border-white/[0.12] transition-all duration-150"
                                >
                                    <Pencil className="w-3 h-3" /> Edit
                                </button>
                                <button
                                    onClick={openAddFundsModal}
                                    className="flex items-center cursor-pointer gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-150 text-red-500/70 hover:text-red-400 border border-red-500/10 hover:border-red-500/25 hover:bg-red-500/5 cursor-pointer"
                                    style={{ background: alpha(0.07), border: `1px solid ${alpha(0.18)}`, color: accent }}
                                    onMouseEnter={e => { e.currentTarget.style.background = alpha(0.13); }}
                                    onMouseLeave={e => { e.currentTarget.style.background = alpha(0.07); }}
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add funds
                                </button>

                                <button
                                    onClick={() => setShowWithdrawModal(true)}
                                    className="flex items-center cursor-pointer gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-150 text-red-500/70 hover:text-red-400 border border-red-500/10 hover:border-red-500/25 hover:bg-red-500/5 cursor-pointer"
                                    style={{ background: alpha(0.07), border: `1px solid ${alpha(0.18)}`, color: accent }}
                                    onMouseEnter={e => { e.currentTarget.style.background = alpha(0.13); }}
                                    onMouseLeave={e => { e.currentTarget.style.background = alpha(0.07); }}
                                >
                                    <ArrowDownToLine className="w-3.5 h-3.5" />
                                    Withdraw funds
                                </button>
                                <button
                                    onClick={handleDeleteClick}
                                    className="flex items-center cursor-pointer gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-150 text-red-500/70 hover:text-red-400 border border-red-500/10 hover:border-red-500/25 hover:bg-red-500/5 cursor-pointer"
                                >
                                    <Trash2 className="w-3 h-3" /> Delete
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-8 py-10">

                <div className="fade-up mb-10">
                    <p className="text-[10px] text-gray-700 uppercase tracking-[0.2em] mb-3">Campaign</p>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
                        {ad?.business_name ?? 'Unnamed Campaign'}
                    </h1>
                    <p className="text-xs text-gray-700 truncate max-w-md">{id}</p>
                </div>

                <div className="fade-up-1 grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                    {statCards.map((card, i) => (
                        <div
                            key={card.label}
                            className="stat-card group relative bg-[#0e0e0e] rounded-xl p-5 border border-white/[0.05] hover:border-white/[0.1] transition-all duration-300 overflow-hidden"
                        >
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
                                style={{ background: `radial-gradient(ellipse at top left, ${alpha(0.04)}, transparent 70%)` }} />
                            <div className="flex items-start justify-between mb-4">
                                <p className="text-[10px] text-gray-600 uppercase tracking-[0.15em]">{card.label}</p>
                                <card.icon className="stat-icon w-3.5 h-3.5 text-gray-700 opacity-60 transition-all duration-200" />
                            </div>
                            <p className="text-2xl font-bold tabular-nums" style={{ color: accent }}>{card.value}</p>
                            <p className="text-[10px] text-gray-700 mt-1">{card.sub}</p>
                        </div>
                    ))}
                </div>

                <div className="fade-up-2 bg-[#0e0e0e] rounded-xl p-5 border border-white/[0.05] mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] text-gray-600 uppercase tracking-[0.15em]">Budget consumption</span>
                        <span className="text-xs tabular-nums" style={{ color: budgetUsedNum > 85 ? '#ef4444' : accent }}>
                            {analytics?.budgetUsed ?? 0}%
                        </span>
                    </div>
                    <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                                width: `${budgetUsedNum}%`,
                                background: budgetUsedNum > 85 ? '#ef4444' : accent,
                            }}
                        />
                    </div>
                    <div className="flex text-[12px] justify-between mt-3">
                        <span className="text-[12px] text-gray-700">
                            Spent ·<span className="text-gray-500">
                                {ad?.cost_per_click && analytics
                                    ? (analytics.totalClicks * parseFloat(ad.cost_per_click)).toFixed(4)
                                    : '—'} SOL
                            </span>
                        </span>
                        <span className="text-[12px] text-gray-700">
                            Total · <span className="text-gray-500">
                                {ad?.cost_per_click && analytics && vaultBalance !== null
                                    ? ((analytics.totalClicks * parseFloat(ad.cost_per_click)) + vaultBalance).toFixed(4)
                                    : '—'} SOL
                            </span>
                        </span>
                    </div>
                </div>

                <div className="fade-up-3 grid grid-cols-1 lg:grid-cols-3 gap-4">

                    <div className="lg:col-span-2 bg-[#0e0e0e] rounded-xl border border-white/[0.05] overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between">
                            <h2 className="text-[10px] text-gray-600 uppercase tracking-[0.15em]">Campaign details</h2>
                            {editing && (
                                <span className="text-[10px] text-gray-700">editing mode</span>
                            )}
                        </div>

                        <div className="p-6 space-y-6">
                            {textFields.map(field => (
                                <div key={field.label}>
                                    <p className="text-[10px] text-gray-600 uppercase tracking-[0.15em] mb-2">{field.label}</p>
                                    {editing ? (
                                        <input
                                            value={field.value}
                                            onChange={e => field.set(e.target.value)}
                                            placeholder={field.placeholder}
                                            className="w-full bg-[#0a0a0a] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-gray-200 placeholder-gray-700 transition-colors duration-150"
                                            onFocus={e => e.currentTarget.style.borderColor = alpha(0.4)}
                                            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                                        />
                                    ) : (
                                        <p className="text-sm text-gray-300">
                                            {field.value || <span className="text-gray-700">—</span>}
                                        </p>
                                    )}
                                </div>
                            ))}

                            <div>
                                <p className="text-[10px] text-gray-600 uppercase tracking-[0.15em] mb-2">Keywords</p>
                                {editing ? (
                                    <input
                                        value={keywords}
                                        onChange={e => setKeywords(e.target.value)}
                                        placeholder="keyword1, keyword2, ..."
                                        className="w-full bg-[#0a0a0a] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-gray-200 placeholder-gray-700 transition-colors duration-150"
                                        onFocus={e => e.currentTarget.style.borderColor = alpha(0.4)}
                                        onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                                    />
                                ) : (
                                    <p className="text-sm text-gray-400">
                                        {keywords || <span className="text-gray-700">—</span>}
                                    </p>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[10px] text-gray-600 uppercase tracking-[0.15em]">Tags</p>
                                    {editing && (
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] text-gray-700">{selectedTags.length}/15</span>
                                            {selectedTags.length > 0 && (
                                                <button onClick={() => setSelectedTags([])} className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors">
                                                    clear all
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {editing ? (
                                    <>
                                        {selectedTags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mb-4">
                                                {selectedTags.map((tag, i) => (
                                                    <div key={i} className="flex items-center gap-1 bg-[#0a0a0a] border border-white/[0.08] rounded-md px-2.5 py-1 text-[11px] text-gray-300">
                                                        {tag}
                                                        <button onClick={() => removeTag(tag)} className="text-gray-600 hover:text-gray-300 ml-1 transition-colors">
                                                            <X className="w-2.5 h-2.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
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
                                                            else if (selectedTags.length < 15) setSelectedTags(prev => [...prev, tagText]);
                                                        }}
                                                        disabled={isDisabled}
                                                        className="relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border transition-all duration-150 aspect-square"
                                                        style={{
                                                            background: isSelected ? alpha(0.06) : '#0a0a0a',
                                                            borderColor: isSelected ? alpha(0.35) : 'rgba(255,255,255,0.05)',
                                                            opacity: isDisabled ? 0.35 : 1,
                                                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                        }}
                                                        onMouseEnter={e => { if (!isSelected && !isDisabled) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'; }}
                                                        onMouseLeave={e => { if (!isSelected && !isDisabled) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)'; }}
                                                    >
                                                        {isSelected && (
                                                            <div className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full flex items-center justify-center" style={{ background: accent }}>
                                                                <svg className="w-2 h-2 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                        <span className="text-lg">{niche.emoji}</span>
                                                        <span className={`text-[9px] text-center leading-tight ${isSelected ? 'text-gray-300' : 'text-gray-600'}`}>
                                                            {niche.label}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedTags.length > 0
                                            ? selectedTags.map((tag, i) => (
                                                <span key={i} className="bg-[#161616] border border-white/[0.06] text-gray-400 px-2.5 py-1 rounded-md text-[11px]">
                                                    {tag}
                                                </span>
                                            ))
                                            : <span className="text-gray-700 text-sm">—</span>
                                        }
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">

                        <div className="bg-[#0e0e0e] rounded-xl border border-white/[0.05] overflow-hidden">
                            <div className="px-5 py-4 border-b border-white/[0.04]">
                                <h3 className="text-[10px] text-gray-600 uppercase tracking-[0.15em]">Financials</h3>
                            </div>
                            <div className="p-5 space-y-4">
                                {[
                                    { label: 'Total Budget', value: `${ad?.Cost ?? '—'} SOL` },
                                    { label: 'Cost per Click', value: `${ad?.cost_per_click ?? '—'} SOL` },
                                    { label: 'Max Clicks', value: String(ad?.Clicks ?? '—') },
                                ].map(f => (
                                    <div key={f.label} className="flex items-center justify-between">
                                        <span className="text-[10px] text-gray-600 uppercase tracking-[0.1em]">{f.label}</span>
                                        <span className="text-xs text-gray-300 tabular-nums">{f.value}</span>
                                    </div>
                                ))}

                                <div className="border-t border-white/[0.04] pt-4">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] text-gray-600 uppercase tracking-[0.1em]">Vault Balance</span>
                                        <span className="text-xs tabular-nums font-semibold" style={{ color: accent }}>
                                            {vaultBalance !== null ? `${vaultBalance.toFixed(6)} SOL` : '—'}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-gray-700">Available for withdrawal</p>
                                </div>

                                <button
                                    onClick={() => setShowWithdrawModal(true)}
                                    className="w-full flex cursor-pointer items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all duration-150"
                                    style={{ background: alpha(0.07), border: `1px solid ${alpha(0.18)}`, color: accent }}
                                    onMouseEnter={e => { e.currentTarget.style.background = alpha(0.13); }}
                                    onMouseLeave={e => { e.currentTarget.style.background = alpha(0.07); }}
                                >
                                    <ArrowDownToLine className="w-3.5 h-3.5" />
                                    Withdraw funds
                                </button>
                            </div>
                        </div>

                        <div className="bg-[#0e0e0e] rounded-xl border border-white/[0.05] overflow-hidden">
                            <div className="px-5 py-4 border-b border-white/[0.04]">
                                <h3 className="text-[10px] text-gray-600 uppercase tracking-[0.15em]">Meta</h3>
                            </div>
                            <div className="p-5 space-y-3">
                                <div>
                                    <p className="text-[10px] text-gray-600 uppercase tracking-[0.1em] mb-1">Campaign ID</p>
                                    <p className="text-[11px] text-gray-600 break-all leading-relaxed">{id}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-600 uppercase tracking-[0.1em] mb-1">Wallet</p>
                                    <p className="text-[11px] text-gray-600 break-all leading-relaxed">
                                        {Wallet_Address
                                            ? `${Wallet_Address.slice(0, 6)}...${Wallet_Address.slice(-6)}`
                                            : '—'}
                                    </p>
                                </div>
                                <div className="pt-2 border-t border-white/[0.04]">
                                    <button
                                        onClick={handleDeleteClick}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs transition-all duration-150 text-red-500/60 hover:text-red-400 border border-red-500/10 hover:border-red-500/20 hover:bg-red-500/[0.04]"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Delete campaign
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showAddFundsModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease' }}
                    onClick={e => { if (e.target === e.currentTarget) closeAddFundsModal(); }}
                >
                    <div
                        className="w-full max-w-sm rounded-2xl overflow-hidden"
                        style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.07)', animation: 'fadeUp 0.25s ease' }}
                    >
                        <div className="px-6 pt-6 pb-5 border-b border-white/[0.04] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{ background: alpha(0.08), border: `1px solid ${alpha(0.18)}` }}>
                                    <Plus className="w-3.5 h-3.5" style={{ color: accent }} />
                                </div>
                                <div>
                                    <h3 className="text-white text-sm font-semibold">Add Funds</h3>
                                    <p className="text-[10px] text-gray-600 mt-0.5">Top up campaign vault</p>
                                </div>
                            </div>
                            <button onClick={closeAddFundsModal} className="text-gray-700 hover:text-gray-400 transition-colors p-1">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {addFundsSuccess ? (
                            <div className="p-6 flex flex-col items-center text-center gap-5">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                                    style={{ background: alpha(0.08), border: `1px solid ${alpha(0.2)}` }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold text-base mb-1">Deposit Successful</h3>
                                    <p className="text-gray-600 text-xs leading-relaxed">Funds added to vault. Campaign is now active.</p>
                                </div>
                                <div className="w-full rounded-xl p-4" style={{ background: alpha(0.05), border: `1px solid ${alpha(0.12)}` }}>
                                    <p className="text-[10px] text-gray-600 uppercase tracking-[0.15em] mb-1.5">Amount Deposited</p>
                                    <p className="text-2xl font-bold tabular-nums" style={{ color: accent }}>{addFundsDepositedSOL} SOL</p>
                                </div>
                                <div className="w-full rounded-xl p-3.5" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-gray-600">Clicks added</span>
                                        <span className="text-gray-300 tabular-nums">+{addClicksNum.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px] mt-2">
                                        <span className="text-gray-600">New max clicks</span>
                                        <span className="text-gray-300 tabular-nums">{(ad?.Clicks ?? 0).toLocaleString()}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={closeAddFundsModal}
                                    className="w-full py-2.5 rounded-lg text-xs font-medium transition-all duration-150"
                                    style={{ background: alpha(0.08), border: `1px solid ${alpha(0.18)}`, color: accent }}
                                    onMouseEnter={e => { e.currentTarget.style.background = alpha(0.14); }}
                                    onMouseLeave={e => { e.currentTarget.style.background = alpha(0.08); }}
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <div className="p-6 space-y-5">
                                <div className="rounded-xl p-4" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] text-gray-600 uppercase tracking-[0.15em] mb-1">Cost per Click</p>
                                            <p className="text-lg font-bold tabular-nums text-gray-300">{cpcSOL} SOL</p>
                                        </div>
                                        <div className="text-[10px] text-gray-700 text-right">
                                            <p>fixed rate</p>
                                            <p>cannot change</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] text-gray-600 uppercase tracking-[0.15em] mb-2 block">
                                        Number of Clicks to Add
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setAddClicksInput(String(Math.max(1, addClicksNum - (addClicksNum >= 1000 ? 100 : addClicksNum >= 100 ? 10 : 1))))}
                                            className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/[0.06] text-gray-500 hover:text-gray-200 hover:border-white/[0.12] transition-all duration-150 shrink-0"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <input
                                            type="number"
                                            value={addClicksInput}
                                            onChange={e => setAddClicksInput(e.target.value)}
                                            min={1}
                                            className="clicks-input flex-1 bg-[#0a0a0a] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-gray-200 text-center tabular-nums transition-colors duration-150"
                                            onFocus={e => e.currentTarget.style.borderColor = alpha(0.4)}
                                            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                                        />
                                        <button
                                            onClick={() => setAddClicksInput(String(addClicksNum + (addClicksNum >= 1000 ? 100 : addClicksNum >= 100 ? 10 : 1)))}
                                            className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/[0.06] text-gray-500 hover:text-gray-200 hover:border-white/[0.12] transition-all duration-150 shrink-0"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <div className="flex gap-1.5 mt-2">
                                        {[100, 500, 1000, 5000].map(preset => (
                                            <button
                                                key={preset}
                                                onClick={() => setAddClicksInput(String(preset))}
                                                className="flex-1 py-1.5 rounded-md text-[10px] transition-all duration-150 border"
                                                style={{
                                                    background: addClicksNum === preset ? alpha(0.08) : 'transparent',
                                                    borderColor: addClicksNum === preset ? alpha(0.3) : 'rgba(255,255,255,0.05)',
                                                    color: addClicksNum === preset ? accent : '#52525b',
                                                }}
                                            >
                                                {preset >= 1000 ? `${preset / 1000}k` : preset}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div className="px-4 py-3" style={{ background: alpha(0.04) }}>
                                        <p className="text-[10px] text-gray-600 uppercase tracking-[0.15em]">Breakdown</p>
                                    </div>
                                    <div className="px-4 py-3 space-y-2.5 bg-[#0a0a0a]">
                                        <div className="flex justify-between text-[11px]">
                                            <span className="text-gray-600">{addClicksNum.toLocaleString()} clicks × {cpcSOL} SOL</span>
                                            <span className="text-gray-400 tabular-nums">{addFundsTotalSOL.toFixed(6)} SOL</span>
                                        </div>
                                        <div className="flex justify-between text-[11px]">
                                            <span className="text-gray-600">Platform fee (1%)</span>
                                            <span className="text-gray-500 tabular-nums">−{(platformFee / 1e9).toFixed(6)} SOL</span>
                                        </div>
                                        <div className="border-t border-white/[0.04] pt-2.5 flex justify-between">
                                            <span className="text-[11px] text-gray-500 font-medium">Net to vault</span>
                                            <span className="text-[11px] font-bold tabular-nums" style={{ color: accent }}>
                                                {(netToVault / 1e9).toFixed(6)} SOL
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl p-4" style={{ background: alpha(0.04), border: `1px solid ${alpha(0.1)}` }}>
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] text-gray-600 uppercase tracking-[0.15em]">You Pay</p>
                                        <p className="text-xl font-bold tabular-nums" style={{ color: accent }}>
                                            {addFundsTotalSOL.toFixed(6)} SOL
                                        </p>
                                    </div>
                                    {!ad?.status && (
                                        <p className="text-[10px] mt-2" style={{ color: accent }}>
                                            ✦ Campaign will reactivate after deposit
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={closeAddFundsModal}
                                        className="flex-1 py-2.5 rounded-lg text-xs text-gray-500 hover:text-gray-300 border border-white/[0.06] hover:border-white/[0.1] transition-all duration-150"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        disabled={depositing || addClicksNum <= 0 || addFundsTotalSOL <= 0}
                                        onClick={handleAddFunds}
                                        className="flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                                        style={{ background: alpha(0.1), border: `1px solid ${alpha(0.3)}`, color: accent }}
                                        onMouseEnter={e => { if (!depositing && addClicksNum > 0) e.currentTarget.style.background = alpha(0.18); }}
                                        onMouseLeave={e => { e.currentTarget.style.background = alpha(0.1); }}
                                    >
                                        {depositing
                                            ? <><Loader2 className="w-3 h-3 animate-spin" /> Processing…</>
                                            : <><Plus className="w-3 h-3" /> Deposit</>
                                        }
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showWithdrawModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease' }}
                    onClick={e => { if (e.target === e.currentTarget) setShowWithdrawModal(false); }}
                >
                    <div
                        className="w-full max-w-sm rounded-2xl overflow-hidden"
                        style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.07)', animation: 'fadeUp 0.25s ease' }}
                    >
                        <div className="px-6 pt-6 pb-5 border-b border-white/[0.04] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{ background: alpha(0.08), border: `1px solid ${alpha(0.18)}` }}>
                                    <ArrowDownToLine className="w-3.5 h-3.5" style={{ color: accent }} />
                                </div>
                                <div>
                                    <h3 className="text-white text-sm font-semibold">Withdraw Funds</h3>
                                    <p className="text-[10px] text-gray-600 mt-0.5">Campaign vault withdrawal</p>
                                </div>
                            </div>
                            <button onClick={() => setShowWithdrawModal(false)} className="text-gray-700 hover:text-gray-400 transition-colors p-1">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="rounded-xl p-4" style={{ background: alpha(0.04), border: `1px solid ${alpha(0.1)}` }}>
                                <p className="text-[10px] text-gray-600 uppercase tracking-[0.15em] mb-1.5">Available Balance</p>
                                <p className="text-2xl font-bold tabular-nums" style={{ color: accent }}>
                                    {vaultBalance !== null ? `${vaultBalance.toFixed(6)} SOL` : '—'}
                                </p>
                            </div>

                            <div className="flex gap-2.5 rounded-xl p-3.5" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                                <AlertTriangle className="w-3.5 h-3.5 text-red-500/70 mt-0.5 shrink-0" />
                                <p className="text-[11px] text-red-400/70 leading-relaxed">
                                    Campaign will be <span className="text-red-400 font-medium">paused</span> immediately after withdrawal.
                                </p>
                            </div>

                            <div>
                                <label className="text-[10px] text-gray-600 uppercase tracking-[0.15em] mb-2 block">
                                    Recipient Address
                                </label>
                                <input
                                    value={withdrawAddress}
                                    onChange={e => setWithdrawAddress(e.target.value)}
                                    placeholder="Solana wallet address"
                                    className="w-full bg-[#0a0a0a] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-gray-200 placeholder-gray-700 transition-colors duration-150"
                                    onFocus={e => e.currentTarget.style.borderColor = alpha(0.35)}
                                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                                />
                            </div>

                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={() => { setShowWithdrawModal(false); setWithdrawAddress(''); }}
                                    className="flex-1 py-2.5 rounded-lg text-xs text-gray-500 hover:text-gray-300 border border-white/[0.06] hover:border-white/[0.1] transition-all duration-150"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={withdrawing || !withdrawAddress.trim()}
                                    onClick={Withdraw}
                                    className="flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                                    style={{ background: alpha(0.1), border: `1px solid ${alpha(0.3)}`, color: accent }}
                                    onMouseEnter={e => { if (!withdrawing && withdrawAddress.trim()) e.currentTarget.style.background = alpha(0.18); }}
                                    onMouseLeave={e => { e.currentTarget.style.background = alpha(0.1); }}
                                >
                                    <ArrowDownToLine className="w-3 h-3" />
                                    {withdrawing ? 'Processing…' : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showSuccessModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease' }}
                    onClick={e => { if (e.target === e.currentTarget) setShowSuccessModal(false); }}
                >
                    <div
                        className="w-full max-w-sm rounded-2xl overflow-hidden"
                        style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.07)', animation: 'fadeUp 0.25s ease' }}
                    >
                        <div className="p-8 flex flex-col items-center text-center gap-5">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                                style={{ background: alpha(0.08), border: `1px solid ${alpha(0.2)}` }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>

                            <div>
                                <h3 className="text-white font-semibold text-base mb-1">Withdrawal Successful</h3>
                                <p className="text-gray-600 text-xs leading-relaxed">Funds sent to the recipient wallet.</p>
                            </div>

                            <div className="w-full rounded-xl p-4" style={{ background: alpha(0.05), border: `1px solid ${alpha(0.12)}` }}>
                                <p className="text-[10px] text-gray-600 uppercase tracking-[0.15em] mb-1.5">Amount Withdrawn</p>
                                <p className="text-2xl font-bold tabular-nums" style={{ color: accent }}>{withdrawnAmount} SOL</p>
                            </div>

                            <div className="w-full rounded-xl p-3.5" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <p className="text-[10px] text-gray-600 uppercase tracking-[0.12em] mb-1">Recipient</p>
                                <p className="text-xs text-gray-400 font-mono">{withdrawAddress.slice(0, 8)}...{withdrawAddress.slice(-8)}</p>
                            </div>

                            <div className="flex gap-2 w-full rounded-xl p-3.5" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                                <AlertTriangle className="w-3.5 h-3.5 text-red-500/70 mt-0.5 shrink-0" />
                                <p className="text-[11px] text-red-400/70 leading-relaxed">
                                    Campaign <span className="text-red-400 font-medium">paused</span>. Top up vault to reactivate.
                                </p>
                            </div>

                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="w-full py-2.5 rounded-lg text-xs font-medium transition-all duration-150"
                                style={{ background: alpha(0.08), border: `1px solid ${alpha(0.18)}`, color: accent }}
                                onMouseEnter={e => { e.currentTarget.style.background = alpha(0.14); }}
                                onMouseLeave={e => { e.currentTarget.style.background = alpha(0.08); }}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete confirmation modal */}
            {showDeleteModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease' }}
                    onClick={e => { if (e.target === e.currentTarget) setShowDeleteModal(false); }}
                >
                    <div
                        className="w-full max-w-sm rounded-2xl overflow-hidden"
                        style={{ background: '#0e0e0e', border: '1px solid rgba(239,68,68,0.15)', animation: 'fadeUp 0.25s ease' }}
                    >
                        <div className="px-6 pt-6 pb-5 border-b border-white/[0.04] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-white text-sm font-semibold">Delete Campaign</h3>
                                    <p className="text-[10px] text-gray-600 mt-0.5">This action cannot be undone</p>
                                </div>
                            </div>
                            <button onClick={() => setShowDeleteModal(false)} className="text-gray-700 hover:text-gray-400 transition-colors p-1">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex gap-2.5 rounded-xl p-3.5"
                                style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                                <AlertTriangle className="w-3.5 h-3.5 text-red-500/70 mt-0.5 shrink-0" />
                                <p className="text-[11px] text-red-400/70 leading-relaxed">
                                    Deleting <span className="text-red-400 font-medium">{ad?.business_name ?? 'this campaign'}</span> will
                                    permanently remove all campaign data, analytics, and settings.
                                </p>
                            </div>

                            <div className="rounded-xl p-4" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <p className="text-[10px] text-gray-600 uppercase tracking-[0.15em] mb-1">Campaign ID</p>
                                <p className="text-[11px] text-gray-600 break-all font-mono">{id}</p>
                            </div>

                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 py-2.5 rounded-lg text-xs text-gray-500 hover:text-gray-300 border border-white/[0.06] hover:border-white/[0.1] transition-all duration-150"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={deleting}
                                    onClick={handleDelete}
                                    className="flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed text-red-400 hover:text-red-300"
                                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
                                    onMouseEnter={e => { if (!deleting) e.currentTarget.style.background = 'rgba(239,68,68,0.14)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                                >
                                    <Trash2 className="w-3 h-3" />
                                    {deleting ? 'Deleting…' : 'Delete campaign'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium whitespace-nowrap"
                    style={{
                        background: '#0e0e0e',
                        border: '1px solid rgba(239,68,68,0.3)',
                        color: '#ef4444',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
                        animation: 'fadeUp 0.2s ease',
                    }}
                >
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {toast}
                </div>
            )}
        </div>
    );
};

export default CampaignPage;