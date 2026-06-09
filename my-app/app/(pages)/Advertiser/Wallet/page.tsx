'use client';

import { useEffect, useState, useCallback } from 'react';
import { Copy, Check, Loader2, TrendingUp, RefreshCw, MousePointerClick, Wallet2, TrendingDown } from 'lucide-react';
import Sidebar from '../Sidebar/Sidebar';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdTransaction {
  id: string;
  type: 'spend';
  adTitle: string;
  clicks: number;
  cpc: string;
  amount: string;
  rawAmount: number;
  date: string;
  status: 'Active' | 'Inactive';
}

interface WalletData {
  walletAddress: string | null;
  availableBalance: number;
  totalSpent: number;
  totalClicks: number;
  transactions: AdTransaction[];
  accent: string; // ← from backend
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

function shortenAddress(addr: string): string {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

const Wallet = () => {
  const activeTab = 'Wallet';

  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [accent, setAccent] = useState('#ffffff');

  // Derived color helpers — always in sync with accent state
  const alpha = (op: number) => `rgba(255,255,255,${op})`;
  const hR = parseInt(accent.slice(1, 3), 16);
  const hG = parseInt(accent.slice(3, 5), 16);
  const hB = parseInt(accent.slice(5, 7), 16);
  const hAlpha = (op: number) => `rgba(${hR},${hG},${hB},${op})`;

  const fetchWallet = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch('/api/crud/Advertiser/Wallet');
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Failed to fetch wallet data');
      }
      const json: WalletData = await res.json();
      setData(json);
      setAccent(json.accent ?? '#ffffff'); // ← set from backend
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  const handleCopy = () => {
    if (data?.walletAddress) {
      navigator.clipboard.writeText(data.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen bg-[#0a0a0a] text-gray-200">
        <Sidebar activeTab={activeTab} />
        <main className="flex-1 p-8 overflow-y-auto flex flex-col gap-6">
          <div className="h-10 w-48 bg-[#161616] rounded-xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[0, 1, 2].map(i => <div key={i} className="h-36 bg-[#111111] border border-gray-800/50 rounded-xl animate-pulse" />)}
          </div>
          <div className="h-96 bg-[#111111] border border-gray-800/50 rounded-xl animate-pulse" />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-[#0a0a0a] text-gray-200">
        <Sidebar activeTab={activeTab} />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button
              onClick={() => fetchWallet()}
              className="px-5 py-2.5 rounded-xl bg-[#161616] border border-gray-800/60 text-gray-200 text-sm hover:border-gray-600 transition-all duration-150"
            >
              Try again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-gray-300">
      <Sidebar activeTab={activeTab} />

      <main className="flex-1 p-8 overflow-y-auto">

        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-1 text-white tracking-tight">Wallet</h1>
            <p className="text-gray-600 text-sm">Manage your funds and transactions</p>
          </div>
         
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

          <div
            className="bg-[#111111] p-6 rounded-xl transition-all duration-200"
            style={{ border: `1px solid ${alpha(0.08)}` }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = accent;
              (e.currentTarget as HTMLElement).style.boxShadow = `0 0 28px ${hAlpha(0.1)}`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = alpha(0.08);
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
          >
            <div className="flex items-center gap-2 text-gray-600 text-xs uppercase tracking-widest mb-3">
              <TrendingUp className="w-4 h-4" />
              Total Spent
            </div>
            <p className="text-3xl font-bold font-mono tabular-nums" style={{ color: accent }}>
              {(data?.totalSpent ?? 0).toFixed(4)}
              <span className="text-lg text-gray-500 ml-1.5">SOL</span>
            </p>
          </div>

          <div
            className="bg-[#111111] p-6 rounded-xl transition-all duration-200"
            style={{ border: `1px solid ${alpha(0.08)}` }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = accent;
              (e.currentTarget as HTMLElement).style.boxShadow = `0 0 28px ${hAlpha(0.1)}`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = alpha(0.08);
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
          >
            <div className="flex items-center gap-2 text-gray-600 text-xs uppercase tracking-widest mb-3">
              <TrendingDown className="w-4 h-4" />
              Available Balance
            </div>
            <p className="text-3xl font-bold font-mono tabular-nums" style={{ color: accent }}>
              {((data?.availableBalance ?? 0) / 1e9).toFixed(4)}
              <span className="text-lg text-gray-500 ml-1.5">SOL</span>
            </p>
          </div>

          <div
            className="bg-[#111111] p-6 rounded-xl transition-all duration-200"
            style={{ border: `1px solid ${alpha(0.08)}` }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = accent;
              (e.currentTarget as HTMLElement).style.boxShadow = `0 0 28px ${hAlpha(0.1)}`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = alpha(0.08);
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
          >
            <div className="flex items-center gap-2 text-gray-600 text-xs uppercase tracking-widest mb-3">
              <Wallet2 className="w-4 h-4" />
              Wallet Address
            </div>
            {data?.walletAddress ? (
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm flex-1 truncate" style={{ color: accent }} title={data.walletAddress}>
                  {shortenAddress(data.walletAddress)}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg bg-[#161616] border border-gray-800/60 text-gray-500 hover:text-gray-200 hover:border-gray-600 transition-all duration-150 flex-shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-gray-300" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-600 italic">No wallet linked</p>
            )}
          </div>

        </div>

        {/* Transaction History */}
        <div className="bg-[#111111] border border-gray-800/70 rounded-xl overflow-hidden">

          <div className="px-6 py-5 border-b border-gray-800/60">
            <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-widest">Transaction History</h2>
            <p className="text-xs text-gray-600 mt-0.5">Ad spend breakdown — Clicks × CPC per ad</p>
          </div>

          {!data?.transactions?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-700">
              <Loader2 className="w-8 h-8 mb-3 opacity-40" />
              <p className="text-sm">No transactions yet</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs text-gray-600 uppercase tracking-widest border-b border-gray-800/40">
                <div className="col-span-4">Ad</div>
                <div className="col-span-2 text-right">Clicks</div>
                <div className="col-span-2 text-right">CPC</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-2 text-right">Status</div>
              </div>

              <div className="divide-y divide-gray-800/40">
                {data.transactions.map((tx) => (
                  <div key={tx.id} className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-[#161616]/60 transition-colors duration-150">

                    <div className="col-span-4 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#161616] border border-gray-800/60 flex-shrink-0">
                        <MousePointerClick className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-200 truncate">{tx.adTitle}</p>
                        <p className="text-xs text-gray-600 font-mono">{timeAgo(tx.date)}</p>
                      </div>
                    </div>

                    <div className="col-span-2 text-right">
                      <span className="font-mono text-sm text-gray-300 tabular-nums">{tx.clicks.toLocaleString()}</span>
                    </div>

                    <div className="col-span-2 text-right">
                      <span className="font-mono text-sm text-gray-500 tabular-nums">{tx.cpc} SOL</span>
                    </div>

                    <div className="col-span-2 text-right">
                      <span className="font-mono text-sm font-semibold tabular-nums" style={{ color: accent }}>{tx.amount} SOL</span>
                    </div>

                    <div className="col-span-2 text-right">
                      <span className={`text-xs px-2 py-0.5 rounded font-mono tracking-wide border ${tx.status === 'Active'
                        ? 'bg-gray-800 text-gray-300 border-gray-700'
                        : 'bg-[#1a1a1a] text-gray-500 border-gray-800'
                        }`}>
                        {tx.status}
                      </span>
                    </div>

                  </div>
                ))}
              </div>

              <div className="grid grid-cols-12 gap-4 px-6 py-4 border-t border-gray-800/60 bg-[#0d0d0d]">
                <div className="col-span-4 text-xs text-gray-600 uppercase tracking-widest">Total</div>
                <div className="col-span-2 text-right font-mono text-sm text-gray-300 tabular-nums">
                  {(data.totalClicks ?? 0).toLocaleString()}
                </div>
                <div className="col-span-2" />
                <div className="col-span-2 text-right font-mono text-sm font-bold tabular-nums" style={{ color: accent }}>
                  {(data.totalSpent ?? 0).toFixed(6)} SOL
                </div>
                <div className="col-span-2" />
              </div>
            </>
          )}
        </div>

      </main>
    </div>
  );
};

export default Wallet;