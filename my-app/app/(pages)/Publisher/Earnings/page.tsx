'use client'

import React, { useEffect } from 'react';
import { BarChart3, ArrowDownRight, DollarSign, Download, TrendingUp, Pencil, Wallet, Clock, Hash, AlertCircle, X, ArrowDownToLine } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from "next-auth/react";
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { AnchorProvider, BN, Program } from '@coral-xyz/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { IDL } from '@/lib/idl';
import { adIdToBytes } from '@/lib/solana';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';

const alpha = (op: number) => `rgba(255,255,255,${op})`;

type TxRecord = {
    ad_id: string;
    publisher_id: string;
    click_count: number;
    earnings: number;
    timestamp: string | null;
};

type Earnings_Data = {
    publisher: { wallet_address: string };
    earningsRecords: {
        publisher: string;
        ad: string;
        claimable_amount: number;
        advertiser: string | null;
    }[];
    transactionList: TxRecord[];
    accent: string;
}

const fetchEarningData = async (): Promise<Earnings_Data> => {
    const res = await fetch("/api/crud/Publisher/Earning");
    if (!res.ok) throw new Error('Failed to fetch Earnings data');
    return res.json();
}

const formatTimestamp = (ts: string | null) => {
    if (!ts) return 'Pending';
    const d = new Date(ts);
    return d.toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
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

    const styles = {
        error: {
            border: 'border-red-500/30',
            bg: 'bg-red-950/50',
            borderIcon: 'border-red-900/30',
            icon: <AlertCircle className="w-3.5 h-3.5 text-red-400" />,
            title: 'Error'
        },
        success: {
            border: 'border-green-500/30',
            bg: 'bg-green-950/50',
            borderIcon: 'border-green-900/30',
            icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />,
            title: 'Success'
        },
        info: {
            border: 'border-blue-500/30',
            bg: 'bg-blue-950/50',
            borderIcon: 'border-blue-900/30',
            icon: <AlertCircle className="w-3.5 h-3.5 text-blue-400" />,
            title: 'Info'
        }
    };

    const style = styles[toast.type];

    return (
        <div
            className={`flex items-start gap-3 bg-[#161616] border ${style.border} rounded-xl px-4 py-3 shadow-2xl shadow-black/50 min-w-[300px] max-w-[380px]`}
            style={{ animation: 'slideIn 0.3s ease-out' }}
        >
            <div className={`mt-0.5 flex-shrink-0 w-7 h-7 ${style.bg} border ${style.borderIcon} rounded-full flex items-center justify-center`}>
                {style.icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-200">{style.title}</p>
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
            {toasts.map(toast => (
                <ToastNotification key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
}

const WithdrawModal = ({ accent }: { accent: string }) => (
    <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }}
    >
        <div
            className="flex flex-col items-center w-[340px] rounded-2xl px-8 py-10"
            style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)' }}
        >
            <div className="relative w-14 h-14 mb-7">
                <svg width="56" height="56" viewBox="0 0 56 56" className="absolute inset-0">
                    <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
                    <circle
                        cx="28" cy="28" r="24" fill="none"
                        stroke={accent} strokeWidth="2"
                        strokeDasharray="30 121" strokeLinecap="round"
                        style={{ transformOrigin: '28px 28px', animation: 'withdraw-spin 1.4s cubic-bezier(0.4,0,0.6,1) infinite' }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <ArrowDownToLine className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.35)' }} />
                </div>
            </div>

            <p className="text-white font-mono font-medium text-sm tracking-tight mb-1.5">
                Processing withdrawal
            </p>
            <p className="font-mono text-xs mb-8" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.04em' }}>
                Signing &amp; confirming on-chain
            </p>

            {/* Status card */}
            <div
                className="w-full rounded-xl p-4 flex flex-col gap-3 mb-6"
                style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.05)' }}
            >
                <div className="flex items-center justify-between">
                    <span className="font-mono uppercase tracking-widest" style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Status</span>
                    <span className="font-mono flex items-center gap-1.5" style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
                        <span
                            className="w-1.5 h-1.5 rounded-full inline-block"
                            style={{ background: accent, animation: 'withdraw-blink 1.2s ease-in-out infinite' }}
                        />
                        Awaiting confirmation
                    </span>
                </div>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.04)' }} />
                <div className="flex items-center justify-between">
                    <span className="font-mono uppercase tracking-widest" style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Network</span>
                    <span className="font-mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Solana Devnet</span>
                </div>
            </div>

            <p className="font-mono text-center" style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.02em' }}>
                Do not close or refresh this page
            </p>
        </div>

        <style>{`
            @keyframes withdraw-spin {
                from { transform: rotate(0deg); }
                to   { transform: rotate(360deg); }
            }
            @keyframes withdraw-blink {
                0%, 100% { opacity: 0.3; }
                50%       { opacity: 1; }
            }
        `}</style>
    </div>
);

const Earnings = () => {
    const { status } = useSession();
    const activeTab = 'Earnings';
    const wallet = useWallet();
    const router = useRouter();
    const [withdrawing, setWithdrawing] = React.useState(false);
    const [toasts, setToasts] = React.useState<Toast[]>([]);

    const addToast = (message: string, type: Toast['type'] = 'error') =>
        setToasts(prev => [...prev, { id: Date.now(), message, type }]);

    const dismissToast = (id: number) =>
        setToasts(prev => prev.filter(t => t.id !== id));

    useEffect(() => {
        if (!withdrawing) return;
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [withdrawing]);

    const queryClient = useQueryClient();
    const fetchquery = useQuery({
        queryKey: ['earnings'],
        queryFn: fetchEarningData,
        enabled: status === 'authenticated',
    });

    const earningsRecords = fetchquery.data?.earningsRecords ?? [];
    const transactionList = fetchquery.data?.transactionList ?? [];
    const ACCENT = fetchquery.data?.accent ?? '#0010FF';

    const hAlpha = (op: number) => {
        const r = parseInt(ACCENT.slice(1, 3), 16);
        const g = parseInt(ACCENT.slice(3, 5), 16);
        const b = parseInt(ACCENT.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${op})`;
    };

    const totalBalanceSOL = earningsRecords.reduce((sum, tx) => sum + tx.claimable_amount, 0) / 1_000_000_000;
    const totalEarned = transactionList.reduce((sum, tx) => sum + tx.earnings, 0);

    const Withdraw_BTN = async () => {

        if (!wallet.publicKey || !wallet.signTransaction) {
            addToast("Please connect your wallet first", "error");
            return;
        }
        setWithdrawing(true);
        try {
            const res = await fetch("/api/crud/Publisher/Earning", { method: "POST" });
            const data = await res.json();

            const postResults: { ad: string; advertiser: string, claimable_amount: number; }[] = data.results ?? [];

            const connection = new Connection("https://api.devnet.solana.com", "confirmed");
            const provider = new AnchorProvider(connection, wallet as any, {});
            const program = new Program(IDL as any, provider);

            const transaction = new Transaction();
            const publisherPubkey = new PublicKey(fetchquery.data?.publisher?.wallet_address!);

            let claimSources: { ad: string; advertiser: string, claimable_amount: number; }[] = [];

            if (postResults.length > 0) {
                claimSources = postResults;
            } else {
                const adMap = new Map<string, { ad: string; advertiser: string; claimable_amount: number }>();
                for (const e of earningsRecords) {
                    if (!e.advertiser) continue;
                    if (!adMap.has(e.ad)) {
                        adMap.set(e.ad, { ad: e.ad, advertiser: e.advertiser, claimable_amount: 0 });
                    }
                    adMap.get(e.ad)!.claimable_amount += e.claimable_amount;
                }
                claimSources = [...adMap.values()];
            }

            if (claimSources.length === 0) {
                addToast("No claimable earnings found", "info");
                setWithdrawing(false);
                return;
            }

            for (const e of claimSources) {
                const adIdBytes = adIdToBytes(e.ad);
                const advertiserPubkey = new PublicKey(e.advertiser);

                const [adPda] = PublicKey.findProgramAddressSync(
                    [Buffer.from("ad"), advertiserPubkey.toBuffer(), adIdBytes],
                    program.programId
                );
                const [vaultPda] = PublicKey.findProgramAddressSync(
                    [Buffer.from("vault"), advertiserPubkey.toBuffer(), adIdBytes],
                    program.programId
                );
                // const [earningsPda] = PublicKey.findProgramAddressSync(
                //     [Buffer.from("earnings"), adPda.toBuffer(), publisherPubkey.toBuffer()],
                //     program.programId
                // );

                const ix = await program.methods.claim(new BN(e.claimable_amount)).accounts({
                    vault: vaultPda,
                    ad: adPda,
                    advertiser: advertiserPubkey,
                    publisher: publisherPubkey,
                    systemProgram: SystemProgram.programId,
                }).instruction();

                transaction.add(ix);
            }

            if (transaction.instructions.length === 0) {
                addToast("Nothing to claim", "info");
                setWithdrawing(false);
                return;
            }

            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = wallet.publicKey;

            const { value: simResult } = await connection.simulateTransaction(transaction);
            if (simResult.err) {
                console.error("Simulation failed:", simResult.err, simResult.logs);
                simResult.logs?.forEach(l => console.log(l));
                addToast(`Transaction would fail: ${JSON.stringify(simResult.err)}`, "error");
                setWithdrawing(false);
                return;
            }

            const signed = await wallet.signTransaction(transaction);
            const txSig = await connection.sendRawTransaction(signed.serialize());
            const confirmation = await connection.confirmTransaction(txSig, "confirmed");
            if (confirmation.value.err) {
                throw new Error(`Transaction confirmed but failed: ${JSON.stringify(confirmation.value.err)}`);
            }

            const claimedAdIds = claimSources.map(r => r.ad);
            await fetch("/api/crud/Publisher/Earning", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ adIds: claimedAdIds })
            });

            addToast("Withdrawal successful!", "success");
            await queryClient.invalidateQueries({ queryKey: ['earnings'] });
            await fetchquery.refetch({ cancelRefetch: false });

        } catch (error: any) {
            console.error("Withdrawal failed:", error);

            if (error.message?.includes("User rejected") || error.message?.includes("User declined")) {
                addToast("Transaction cancelled", "info");
            } else if (error.message?.includes("Insufficient")) {
                addToast("Insufficient funds in vault", "error");
            } else {
                addToast(`Withdrawal failed: ${error.message || "Unknown error"}`, "error");
            }
        } finally {
            setWithdrawing(false);
        }
    };

    return (
        <>
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(100%); }
                    to   { opacity: 1; transform: translateX(0); }
                }
            `}</style>
            <div className="flex h-screen overflow-hidden bg-[#0a0a0a] text-gray-300">
                {withdrawing && <WithdrawModal accent={ACCENT} />}

                <Sidebar activeTab={activeTab} />

                <main className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-6xl">

                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h1 className="text-3xl font-bold mb-1 text-white tracking-tight font-mono">Earnings</h1>
                                <p className="text-gray-600 text-sm font-mono">Track your revenue and payments</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">

                            <div
                                className="bg-[#111111] p-8 rounded-xl transition-all duration-200"
                                style={{ border: `1px solid ${alpha(0.08)}` }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLElement).style.boxShadow = `0 0 32px ${hAlpha(0.1)}`;
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLElement).style.borderColor = alpha(0.08);
                                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                                }}
                            >
                                <p className="text-xs text-gray-600 uppercase tracking-widest mb-3 font-mono">Estimated Total Balance</p>
                                <p className="text-5xl font-bold text-white font-mono tabular-nums mb-1">
                                    {totalBalanceSOL.toFixed(4)}
                                    <span className="text-2xl text-gray-500 ml-2 font-mono">SOL</span>
                                </p>
                                <p className="text-xs text-gray-600 mb-8 font-mono"></p>

                                <button
                                    onClick={Withdraw_BTN}
                                    disabled={withdrawing}
                                    className="flex cursor-pointer items-center gap-2 px-6 py-3 rounded-xl bg-[#161616] text-gray-200 text-sm font-semibold font-mono hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
                                    style={{ border: `1px solid ${alpha(0.18)}` }}
                                    onMouseEnter={e => {
                                        if (withdrawing) return;
                                        e.currentTarget.style.borderColor = ACCENT;
                                        e.currentTarget.style.boxShadow = `0 0 18px ${hAlpha(0.2)}`;
                                        e.currentTarget.style.color = '#ffffff';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = alpha(0.18);
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.color = '';
                                    }}
                                >
                                    <Download className="w-4 h-4" />
                                    Withdraw
                                </button>

                                <div className="mt-8">
                                    <p className="text-xs text-gray-600 uppercase tracking-widest mb-1.5 font-mono">Receiver's address</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-mono text-xs truncate max-w-[260px]">
                                            {fetchquery.data?.publisher?.wallet_address}
                                        </span>
                                        <button
                                            onClick={() => router.push('/Publisher/Settings')}
                                            className="flex items-center cursor-pointer gap-1 text-gray-600 hover:text-gray-300 transition-colors duration-150 ml-1 group"
                                        >
                                            <Pencil className="w-3 h-3" />
                                            <span className="text-xs group-hover:underline font-mono">Edit</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div
                                className="bg-[#111111] p-8 rounded-xl transition-all duration-200"
                                style={{ border: `1px solid ${alpha(0.08)}` }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLElement).style.boxShadow = `0 0 32px ${hAlpha(0.1)}`;
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLElement).style.borderColor = alpha(0.08);
                                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                                }}
                            >
                                <p className="text-xs text-gray-600 uppercase tracking-widest mb-6 font-mono">Earnings Overview</p>
                                <div className="space-y-3">

                                    <div className="flex items-center justify-between p-4 bg-[#0d0d0d] border border-gray-800/50 rounded-lg">
                                        <div>
                                            <p className="text-xs text-gray-600 uppercase tracking-widest mb-1.5 text-mono">Claimable Now</p>
                                            <p className="text-xl font-bold text-white font-mono tabular-nums">
                                                +{totalBalanceSOL.toFixed(4)} SOL
                                            </p>
                                        </div>
                                        <TrendingUp className="w-6 h-6 text-gray-500" />
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-[#0d0d0d] border border-gray-800/50 rounded-lg">
                                        <div>
                                            <p className="text-xs text-gray-600 uppercase tracking-widest mb-1.5 text-mono">Total Claimed</p>
                                            <p className="text-xl font-bold text-white font-mono tabular-nums">
                                                {totalEarned.toFixed(4)} SOL
                                            </p>
                                        </div>
                                        <BarChart3 className="w-6 h-6 text-gray-500" />
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-[#0d0d0d] border border-gray-800/50 rounded-lg">
                                        <div>
                                            <p className="text-xs text-gray-600 uppercase tracking-widest mb-1.5 text-mono">Total Transactions</p>
                                            <p className="text-xl font-bold text-white font-mono tabular-nums">
                                                {transactionList.length}
                                            </p>
                                        </div>
                                        <DollarSign className="w-6 h-6 text-gray-500" />
                                    </div>

                                </div>
                            </div>
                        </div>

                        <div className="bg-[#111111] border border-gray-800/70 rounded-xl overflow-hidden">

                            <div className="px-6 py-5 border-b border-gray-800/60 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-widest font-mono">Transaction History</h2>
                                    <p className="text-xs text-gray-600 mt-0.5 font-mono">All claimed earnings grouped by session</p>
                                </div>
                                <span className="text-xs text-gray-600 font-mono bg-[#161616] border border-gray-800/60 px-3 py-1 rounded-lg">
                                    {transactionList.length} transactions
                                </span>
                            </div>

                            {transactionList.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-gray-700">
                                    <Wallet className="w-8 h-8 mb-3 opacity-40" />
                                    <p className="text-sm font-mono">No transactions yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-800/50 max-h-[420px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                                    {transactionList.map((tx, idx) => (
                                        <div
                                            key={idx}
                                            className="px-6 py-5 hover:bg-[#161616]/60 transition-colors duration-150 cursor-pointer group"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2.5 rounded-lg bg-[#161616] border border-gray-800/60 group-hover:border-gray-700 transition-colors">
                                                        <ArrowDownRight className="w-4 h-4 text-gray-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-200 mb-1 font-mono">Revenue</p>
                                                        <div className="flex items-center gap-2 text-xs text-gray-600 font-mono">
                                                            <span className="flex items-center gap-1">
                                                                <Hash className="w-3 h-3" />
                                                                {tx.ad_id.slice(0, 8)}…
                                                            </span>
                                                            <span className="text-gray-800">•</span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {formatTimestamp(tx.timestamp)}
                                                            </span>
                                                            <span className="text-gray-800">•</span>
                                                            <span>{tx.click_count} click{tx.click_count !== 1 ? 's' : ''}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-base font-bold text-white font-mono tabular-nums mb-1">
                                                        +{tx.earnings.toFixed(6)} SOL
                                                    </p>
                                                    <span
                                                        className="text-xs font-mono px-2 py-0.5 rounded tracking-wide border text-black border-black"
                                                        style={{ background: ACCENT.toLowerCase() === '#ffffff' ? '#4ADE80' : ACCENT }}
                                                    >
                                                        Claimed
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </main>
            </div>
        </>
    );
};

export default Earnings;