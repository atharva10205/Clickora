'use client'

import { getPDA, getProgram, adIdToBytes } from '@/lib/solana';
import { HelpCircle, ChevronRight, Check, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import BN from 'bn.js';
import { useRouter } from 'next/navigation';

const AUTHORITY = new PublicKey("C3qzo7FpXSgQ7ytMdjhqjd3R5ZWReEYFeHdKD7oyXpLz");

type CostItem = { clicks: number; cpc: number; weekly: number };
type Errors = { maximim_cost_per_bid?: string; selected?: string; click?: string };

function BudgetCard({
    id, label, cost, isRecommended = false, children = null,
    selected, onSelect, formatSOL, accent, alpha,
}: {
    id: string; label: string; cost?: CostItem; isRecommended?: boolean;
    children?: React.ReactNode; selected: string;
    onSelect: (id: string) => void; formatSOL: (n: number) => string;
    accent: string; alpha: (op: number) => string;
}) {
    const isActive = selected === id;
    return (
        <div
            onClick={() => onSelect(id)}
            className="rounded-lg p-4 cursor-pointer transition-all duration-150 bg-[#0d0d0d]"
            style={{
                border: `1px solid ${isActive ? accent : 'rgba(255,255,255,0.06)'}`,
                boxShadow: isActive ? `0 0 18px ${alpha(0.08)}` : 'none',
            }}
            onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.borderColor = alpha(0.2); }}
            onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; }}
        >
            <div className="flex items-center gap-3 mb-3">
                <div
                    className="w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: isActive ? accent : 'rgba(255,255,255,0.2)', background: isActive ? accent : 'transparent' }}
                >
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                </div>
                <span className="text-sm font-semibold text-gray-200">{label}</span>
                {isRecommended && (
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono border bg-gray-800 text-gray-300 border-gray-700 ml-auto">
                        Recommended
                    </span>
                )}
            </div>

            {children}

            {cost && (
                <div className="border-t border-gray-800/50 pt-3 mt-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                            { label: 'Clicks', value: String(cost.clicks) },
                            { label: 'CPC', value: `${formatSOL(cost.cpc)} SOL` },
                            { label: 'Cost', value: `${formatSOL(cost.weekly)} SOL` },
                        ].map(col => (
                            <div key={col.label}>
                                <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">{col.label}</p>
                                <p className="text-sm font-bold text-gray-100 font-mono">{col.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Three({ next, back, adID }) {
    const [accent, setAccent] = useState('#ffffff');

    useEffect(() => {
        const fetchAccent = async () => {
            const res = await fetch("/api/crud/Advertiser-campaign-step-3");
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

    const [Customclick, setCustomclick] = useState<number>(0);
    const [selected, setSelected] = useState("");
    const [budget, setbudget] = useState(false);
    const [maximim_cost_per_bid, set_maximim_cost_per_bid] = useState<number>(0);
    const [Cost, setCost] = useState<CostItem[]>([]);
    const [errors, setErrors] = useState<Errors>({});
    const router = useRouter();
    const { connection } = useConnection();
    const ClintKey = useWallet();
    const { publicKey: walletPublicKey, connect, disconnect, select, wallet } = ClintKey;
    useEffect(() => { setErrors({}); }, [selected, Customclick]);

    useEffect(() => {
        if (wallet && !walletPublicKey) {
            connect().catch(err => console.error("Auto-connect failed", err));
        }
    }, [wallet]);

    const formatSOL = (amount: number): string => parseFloat(amount.toFixed(8)).toString();

    const Initialize_and_Deposit = async () => {
        const newError: Errors = {};
        if (!walletPublicKey) { alert("Please connect your wallet first"); return; }
        if (selected === "") { newError.selected = "This field is mandatory"; setErrors(newError); return; }
        if (selected === "custom" && Customclick === 0) { newError.click = "This is mandatory"; setErrors(newError); return; }
        if (maximim_cost_per_bid === 0) { newError.maximim_cost_per_bid = "This field is mandatory"; setErrors(newError); return; }

        let clickValue = 0;
        if (selected === "low") clickValue = 200;
        else if (selected === "medium") clickValue = 400;
        else if (selected === "high") clickValue = 600;
        else if (selected === "custom") clickValue = Customclick;

        const totalSOL = clickValue * maximim_cost_per_bid;
        const platformFeeSOL = totalSOL * 0.01;
        const totalWithFee = totalSOL + platformFeeSOL;
        const lamports = Math.round(totalWithFee * 1_000_000_000);
        try {
            const adIdBytes = adIdToBytes(adID);
            const program = getProgram(ClintKey, connection);
            const { adPDA, vaultPDA } = getPDA(walletPublicKey, adIdBytes);
            const SERVICE_FEE = new PublicKey("C3qzo7FpXSgQ7ytMdjhqjd3R5ZWReEYFeHdKD7oyXpLz");

            const initIx = await program.methods.initialiseAd(adIdBytes).accounts({
                ad: adPDA,
                vault: vaultPDA,
                advertiser: walletPublicKey,
                authority: AUTHORITY,
                systemProgram: SystemProgram.programId,
            }).instruction();
            const tx = await program.methods.deposit(new BN(lamports)).accounts({
                ad: adPDA,
                vault: vaultPDA,
                advertiser: walletPublicKey,
                serviceFee: SERVICE_FEE,
                systemProgram: SystemProgram.programId,
            }).preInstructions([initIx]).rpc();

            const res = await fetch("/api/crud/Advertiser-campaign-step-3", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ publicKey: walletPublicKey.toString(), maximim_cost_per_bid, click: clickValue, adID }),
            });

            if (!res.ok) {
                alert("Failed to save campaign data");
                return;
            }
            await router.push("/Advertiser/Campaigns");
        } catch (err: any) {
            console.error("Init + Deposit failed:", err);
            alert("Transaction failed: " + err.message);
        }
    };

    const check_btn = () => {
        const newError: Errors = {};
        if (maximim_cost_per_bid === 0) { newError.maximim_cost_per_bid = "This field is mandatory"; setErrors(newError); return; }
        setErrors({});
        setbudget(true);
        const cpc = Number(maximim_cost_per_bid);
        if (!cpc || cpc <= 0) return;
        setCost([200, 400, 600].map(clicks => ({
            clicks,
            cpc: parseFloat(cpc.toFixed(8)),
            weekly: parseFloat((clicks * cpc).toFixed(8)),
        })));
    };

    const connectPhantom = async () => {
        try {
            if (!wallet) {
                select("Phantom" as any);
                return;
            }
            await connect();
        } catch (err) { console.error("Wallet connection failed", err); }
    };
    const disconnectPhantom = async () => {
        await disconnect();
    };

    const steps = [
        { n: 1, label: 'About your business', done: true, active: false },
        { n: 2, label: 'Create campaign', done: true, active: false },
        { n: 3, label: 'Set Budget', done: false, active: true },
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300">

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
                                <HelpCircle className="w-4 h-4" />Help
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
                        </div>
                    </aside>

                    <div className="flex-1">
                        <div className="bg-[#111111] border border-gray-800/70 rounded-xl overflow-hidden">
                            <div className="p-8">

                                <div className="flex items-center gap-2 text-xs text-gray-600 font-mono mb-4">
                                    <span>Step 3 of 3</span>
                                    <ChevronRight className="w-3 h-3" />
                                    <span className="text-gray-300">Payment</span>
                                </div>

                                <h1 className="text-xl font-semibold text-white tracking-tight mb-1">Pay with SOL</h1>
                                <p className="text-xs text-gray-600 mb-8">Connect your wallet and set your bid strategy</p>

                                {!walletPublicKey && (
                                    <button
                                        onClick={connectPhantom}
                                        className="px-6 py-2.5 rounded-lg bg-[#161616] text-gray-200 text-sm font-semibold hover:-translate-y-0.5 transition-all duration-200"
                                        style={{ border: `1px solid ${alpha(0.25)}` }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 0 18px ${alpha(0.12)}`; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = alpha(0.25); e.currentTarget.style.boxShadow = 'none'; }}
                                    >
                                        Connect Wallet
                                    </button>
                                )}

                                {walletPublicKey && (
                                    <div className="space-y-8">

                                        <div className="p-4 bg-[#0d0d0d] border border-gray-800/50 rounded-lg">
                                            <p className="text-xs text-gray-600 uppercase tracking-widest mb-1.5">Wallet Address</p>
                                            <p className="text-sm text-gray-200 font-mono break-all">{walletPublicKey.toString()}</p>                                        </div>

                                        <button
                                            onClick={disconnectPhantom}
                                            className="px-5 py-2 rounded-lg bg-[#161616] border border-gray-800/60 text-gray-500 text-sm font-medium hover:text-red-400 hover:border-red-900/50 transition-all duration-150"
                                        >
                                            Disconnect Wallet
                                        </button>

                                        {/* CPC */}
                                        <div>
                                            <p className="text-xs text-gray-600 uppercase tracking-widest mb-1">Bid Strategy</p>
                                            <p className="text-xs text-gray-600 mb-4">Your bid strategy defines how we should bid for your ad in auctions</p>
                                            <label className="text-xs text-gray-600 uppercase tracking-widest mb-2 block">Maximum cost per click</label>
                                            <div className="flex items-start gap-3">
                                                <div>
                                                    <input
                                                        type="number"
                                                        placeholder="SOL amount"
                                                        min={0.0008} max={1} step="any"
                                                        onChange={(e) => {
                                                            const v = Number(e.target.value);
                                                            if (v >= 0) set_maximim_cost_per_bid(v);
                                                        }}
                                                        className="bg-[#0d0d0d] border border-gray-800/60 rounded-lg h-10 px-4 w-40 text-sm text-gray-200 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none transition-colors duration-150"
                                                        style={{ borderColor: errors.maximim_cost_per_bid ? 'rgba(239,68,68,0.5)' : undefined }}
                                                        onFocus={e => e.currentTarget.style.borderColor = accent}
                                                        onBlur={e => e.currentTarget.style.borderColor = errors.maximim_cost_per_bid ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}
                                                    />
                                                    {errors.maximim_cost_per_bid && <p className="mt-1.5 text-xs text-red-400 font-mono">{errors.maximim_cost_per_bid}</p>}
                                                </div>
                                                <button
                                                    onClick={check_btn}
                                                    className="h-10 px-5 rounded-lg bg-[#161616] text-gray-200 text-sm font-semibold hover:-translate-y-0.5 transition-all duration-150"
                                                    style={{ border: `1px solid ${alpha(0.25)}` }}
                                                    onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 0 12px ${alpha(0.1)}`; }}
                                                    onMouseLeave={e => { e.currentTarget.style.borderColor = alpha(0.25); e.currentTarget.style.boxShadow = 'none'; }}
                                                >
                                                    Check
                                                </button>
                                            </div>
                                        </div>

                                        {budget && (
                                            <div>
                                                <p className="text-xs text-gray-600 uppercase tracking-widest mb-3">How much do you want to spend?</p>
                                                {errors.selected && <p className="mb-3 text-xs text-red-400 font-mono">{errors.selected}</p>}

                                                <div
                                                    className="p-4 rounded-xl bg-[#0d0d0d]"
                                                    style={{ border: `1px solid ${errors.selected ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.06)'}` }}
                                                >
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                                                        <BudgetCard id="low" label={`${formatSOL(Cost[0]?.weekly || 0)} SOL`} cost={Cost[0]} selected={selected} onSelect={setSelected} formatSOL={formatSOL} accent={accent} alpha={alpha} />
                                                        <BudgetCard id="medium" label={`${formatSOL(Cost[1]?.weekly || 0)} SOL`} cost={Cost[1]} isRecommended selected={selected} onSelect={setSelected} formatSOL={formatSOL} accent={accent} alpha={alpha} />
                                                        <BudgetCard id="high" label={`${formatSOL(Cost[2]?.weekly || 0)} SOL`} cost={Cost[2]} selected={selected} onSelect={setSelected} formatSOL={formatSOL} accent={accent} alpha={alpha} />
                                                        <BudgetCard id="custom" label="Set custom clicks" selected={selected} onSelect={setSelected} formatSOL={formatSOL} accent={accent} alpha={alpha}>
                                                            {selected === "custom" && (
                                                                <div className="mb-3" onClick={e => e.stopPropagation()}>
                                                                    <input
                                                                        type="number"
                                                                        value={Customclick || ""}
                                                                        onChange={(e) => setCustomclick(Number(e.target.value))}
                                                                        placeholder="Enter clicks"
                                                                        className="w-full bg-[#111111] border border-gray-800/60 rounded-lg px-3 py-2 text-sm text-gray-200 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none transition-colors duration-150"
                                                                        style={{ borderColor: errors.click ? 'rgba(239,68,68,0.5)' : undefined }}
                                                                        onFocus={e => e.currentTarget.style.borderColor = accent}
                                                                        onBlur={e => e.currentTarget.style.borderColor = errors.click ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}
                                                                    />
                                                                    {errors.click && <p className="mt-1.5 text-xs text-red-400 font-mono">{errors.click}</p>}
                                                                </div>
                                                            )}
                                                            <div className="border-t border-gray-800/50 pt-3">
                                                                <div className="grid grid-cols-3 gap-2 text-center">
                                                                    {[
                                                                        { label: 'Clicks', value: String(Customclick || 0) },
                                                                        { label: 'CPC', value: `${formatSOL(Number(maximim_cost_per_bid))} SOL` },
                                                                        { label: 'Cost', value: `${formatSOL(Number(Customclick) * Number(maximim_cost_per_bid))} SOL` },
                                                                    ].map(col => (
                                                                        <div key={col.label}>
                                                                            <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">{col.label}</p>
                                                                            <p className="text-sm font-bold text-gray-100 font-mono">{col.value}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </BudgetCard>

                                                    </div>
                                                </div>

                                                {budget && selected && (
                                                    <div className="rounded-xl mt-5 overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <div className="px-4 py-3" style={{ background: alpha(0.04) }}>
                                                            <p className="text-[10px] text-gray-600 uppercase tracking-[0.15em]">Payment Breakdown</p>
                                                        </div>
                                                        <div className="px-4 py-3 space-y-2.5 bg-[#0d0d0d]">
                                                            {(() => {
                                                                const clicks = selected === 'low' ? 200 : selected === 'medium' ? 400 : selected === 'high' ? 600 : Customclick;
                                                                const base = clicks * maximim_cost_per_bid;
                                                                const fee = base * 0.01;
                                                                const total = base + fee;
                                                                return (
                                                                    <>
                                                                        <div className="flex justify-between text-[11px]">
                                                                            <span className="text-gray-600">{clicks.toLocaleString()} clicks × {formatSOL(maximim_cost_per_bid)} SOL</span>
                                                                            <span className="text-gray-400 tabular-nums">{formatSOL(base)} SOL</span>
                                                                        </div>
                                                                        <div className="flex justify-between text-[11px]">
                                                                            <span className="text-gray-600">Platform fee (1%)</span>
                                                                            <span className="text-gray-500 tabular-nums">+{formatSOL(fee)} SOL</span>
                                                                        </div>
                                                                        <div className="border-t border-white/[0.04] pt-2.5 flex justify-between">
                                                                            <span className="text-[11px] text-gray-400 font-medium">You Pay</span>
                                                                            <span className="text-[11px] font-bold tabular-nums" style={{ color: accent }}>
                                                                                {formatSOL(total)} SOL
                                                                            </span>
                                                                        </div>
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                )}

                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="px-8 py-5 bg-[#0d0d0d] border-t border-gray-800/60 flex items-center justify-between">
                                <button
                                    onClick={back}
                                    className="px-5 py-2.5 rounded-lg bg-[#161616] border border-gray-800/60 text-gray-400 text-sm font-medium hover:text-gray-200 hover:border-gray-600 transition-all duration-150"
                                >
                                    ← Back
                                </button>
                                <button
                                    onClick={Initialize_and_Deposit}
                                    className="px-6 py-2.5 cursor-pointer rounded-lg bg-[#161616] text-gray-200 text-sm font-semibold hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                                    style={{ border: `1px solid ${alpha(0.25)}` }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 0 18px ${alpha(0.12)}`; e.currentTarget.style.color = '#ffffff'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = alpha(0.25); e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.color = ''; }}
                                >
                                    Initialize & Deposit →
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}