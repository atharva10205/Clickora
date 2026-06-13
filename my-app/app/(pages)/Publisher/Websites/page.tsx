'use client'

import { Plus, BarChart3, Code, Copy, Edit, Link, Trash2, RefreshCw, Check, MoreHorizontal } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const alpha = (op: number) => `rgba(255,255,255,${op})`;

const Websites = () => {
    const activeTab = 'Websites';
    const router = useRouter();

    const [websites, setWebsites] = useState([]);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const [accent, setAccent] = useState('#10B981');
    const [sortKey, setSortKey] = useState<'name' | 'earnings' | 'impressions' | 'clicks' | 'date'>('date');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const Get_websites = async () => {
            try {
                const res = await fetch("/api/crud/Publisher/Websites");
                const data = await res.json();

                setAccent(data.accent ?? '#10B981');

                const websitesWithMetrics = (data.sites ?? []).map(site => ({
                    ...site,
                    ctr: site.impressions > 0
                        ? ((site.clicks / site.impressions) * 100).toFixed(2)
                        : '0.00',
                    formattedEarnings: site.earnings
                        ? `${Number(site.earnings).toFixed(4)} SOL`
                        : '0.0000 SOL',
                    rpm: site.impressions > 0
                        ? ((site.earnings / site.impressions) * 1000).toFixed(4)
                        : '0.0000'
                }));

                setWebsites(websitesWithMetrics);
            } catch (error) {
                console.error("Error fetching websites:", error);
            }
        };

        Get_websites();
    }, []);

    const handleCopy = (publisherUrl: string) => {
        const code = `<div id="my-widget"></div>\n<script src="https://clickora-seven.vercel.app/my-widget.js" data-id="${publisherUrl}"></script>`;
        navigator.clipboard.writeText(code);
        setCopiedUrl(publisherUrl);
        setTimeout(() => setCopiedUrl(null), 2000);
    };

    const toggleSort = (key: 'name' | 'earnings' | 'impressions' | 'clicks' | 'date') => {
        if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
        else { setSortKey(key); setSortDir('desc'); }
    };

    const sorted = [...websites].sort((a, b) => {
        let diff = 0;
        if (sortKey === 'name') diff = a.website_name.localeCompare(b.website_name);
        if (sortKey === 'earnings') diff = a.earnings - b.earnings;
        if (sortKey === 'impressions') diff = a.impressions - b.impressions;
        if (sortKey === 'clicks') diff = a.clicks - b.clicks;
        if (sortKey === 'date') diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        return sortDir === 'desc' ? -diff : diff;
    });

    return (
        <div className="flex h-screen bg-[#0a0a0a] text-gray-300 overflow-hidden">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            <Sidebar activeTab={activeTab} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="flex-1 overflow-y-auto min-w-0">
                <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl mx-auto">

                    {/* Header */}
                    <div className="flex items-center font-mono justify-between mb-8 sm:mb-10 gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            {/* Mobile sidebar toggle */}
                            <button
                                className="lg:hidden p-2 rounded-lg bg-[#161616] border border-white/10 text-gray-400 hover:text-gray-200 shrink-0"
                                onClick={() => setSidebarOpen(true)}
                                aria-label="Open sidebar"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            <div className="min-w-0">
                                <h1 className="text-2xl sm:text-3xl font-bold mb-0.5 text-white tracking-tight truncate">
                                    Websites
                                </h1>
                                <p className="text-gray-600 text-xs sm:text-sm hidden sm:block">
                                    Manage your publishing properties
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => router.push("/Publisher-campaign")}
                            className="flex shrink-0 cursor-pointer items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[#161616] text-gray-200 text-sm font-semibold hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
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
                            <Plus className="w-4 h-4 shrink-0" />
                            <span className="hidden sm:inline">Add Website</span>
                            <span className="sm:hidden">Add</span>
                        </button>
                    </div>

                    {/* Sort controls — scrollable on mobile */}
                    <div
                        className="flex items-center gap-2 mb-6 font-mono overflow-x-auto"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        <span className="text-xs text-gray-600 mr-1 shrink-0">Sort:</span>
                        {(['date', 'name', 'earnings', 'impressions', 'clicks'] as const).map(key => (
                            <button
                                key={key}
                                onClick={() => toggleSort(key)}
                                className="flex shrink-0 cursor-pointer items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-all duration-150 border"
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

                    {/* Website cards */}
                    <div className="grid gap-4">
                        {websites.length === 0 ? (
                            <div className="flex items-center justify-center py-24 text-gray-600 text-sm">
                                No websites found.
                            </div>
                        ) : (
                            sorted.map((site) => {
                                const isCopied = copiedUrl === site.publisher_url;

                                return (
                                    <div
                                        key={site.website_name}
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
                                        <div className="p-4 sm:p-6">

                                            {/* Card header */}
                                            <div className="flex items-start justify-between mb-5 sm:mb-6 gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                        <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight truncate">
                                                            {site.website_name}
                                                        </h3>
                                                        <span className={`text-xs px-2 py-0.5 rounded font-mono tracking-wide border shrink-0 ${site.status === 'ACTIVE'
                                                            ? 'bg-gray-800 text-gray-300 border-gray-700'
                                                            : 'bg-[#1a1a1a] text-gray-500 border-gray-800'
                                                            }`}>
                                                            {site.status === 'ACTIVE' && (
                                                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-300 mr-1.5 align-middle animate-pulse" />
                                                            )}
                                                            {site.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 flex items-center gap-1.5 font-mono truncate">
                                                        <Link className="w-3.5 h-3.5 shrink-0" />
                                                        <span className="truncate">{site.publisher_url}</span>
                                                    </p>
                                                </div>

                                                <div className="flex gap-2 shrink-0">
                                                    {site.status === 'REVIEW' && (
                                                        <button
                                                            className="p-2 rounded-lg bg-[#161616] border border-gray-800/60 text-gray-500 hover:text-gray-200 hover:border-gray-600 transition-all duration-150"
                                                            title="Refresh"
                                                        >
                                                            <RefreshCw className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => router.push(`/Publisher/Publisher_website/${site.publisher_url}`)}
                                                        className="p-2 rounded-lg cursor-pointer bg-[#161616] border border-gray-800/60 text-gray-500 hover:text-gray-200 hover:border-gray-600 transition-all duration-150"
                                                        title="More options"
                                                    >
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Metrics grid — 2 cols on mobile, 5 on md+ */}
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 mb-5 sm:mb-6">
                                                {[
                                                    { label: 'Impressions', value: site.status === 'REVIEW' ? '0' : site.impressions.toLocaleString(), accent: false },
                                                    { label: 'Clicks', value: site.status === 'REVIEW' ? '0' : site.clicks.toLocaleString(), accent: false },
                                                    { label: 'CTR', value: site.status === 'REVIEW' ? '0%' : `${site.ctr}%`, accent: false },
                                                    { label: 'Earnings', value: site.status === 'REVIEW' ? '0.0000 SOL' : site.formattedEarnings, accent: true },
                                                    { label: 'RPM', value: site.status === 'REVIEW' ? '0.0000 SOL' : `${site.rpm} SOL`, accent: false },
                                                ].map((metric) => (
                                                    <div key={metric.label} className="bg-[#0d0d0d] border border-gray-800/50 p-3 sm:p-4 rounded-lg">
                                                        <p className="text-[10px] sm:text-xs text-gray-600 uppercase tracking-widest mb-1 sm:mb-1.5">
                                                            {metric.label}
                                                        </p>
                                                        <p
                                                            className="text-sm sm:text-base font-semibold font-mono tabular-nums truncate"
                                                            style={{ color: metric.accent ? accent : undefined }}
                                                        >
                                                            {metric.value}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Ad code block */}
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] sm:text-xs text-gray-600 uppercase tracking-widest">
                                                    Ad Code Integration
                                                </span>
                                                <button
                                                    onClick={() => handleCopy(site.publisher_url)}
                                                    className="flex items-center gap-1.5 text-xs font-mono transition-all duration-200 text-gray-500 hover:text-gray-200"
                                                >
                                                    <span className={`flex items-center cursor-pointer gap-1.5 transition-all duration-200 ${isCopied ? 'scale-105' : 'scale-100'}`}>
                                                        {isCopied ? (
                                                            <>
                                                                <Check className="w-3 h-3 text-gray-300" />
                                                                <span className="text-gray-300">Copied</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="w-3 h-3" />
                                                                Copy Code
                                                            </>
                                                        )}
                                                    </span>
                                                </button>
                                            </div>

                                            <div
                                                className="bg-[#0d0d0d] rounded-lg p-3 sm:p-4 flex flex-col gap-1.5 transition-all duration-300 overflow-x-auto"
                                                style={{
                                                    border: `1px solid ${isCopied ? alpha(0.35) : alpha(0.06)}`,
                                                    boxShadow: isCopied ? `0 0 16px ${alpha(0.08)}` : 'none',
                                                }}
                                            >
                                                <code className="text-[11px] sm:text-xs font-mono leading-relaxed text-gray-500 whitespace-nowrap">
                                                    &lt;div id="my-widget"&gt;&lt;/div&gt;
                                                </code>
                                                <code className="text-[11px] sm:text-xs font-mono leading-relaxed whitespace-nowrap">
                                                    <span className="text-gray-500">&lt;script src="https://clickora-seven.vercel.app/my-widget.js" data-id="</span>
                                                    <span style={{ color: accent }}>{site.publisher_url}</span>
                                                    <span className="text-gray-500">"&gt;&lt;/script&gt;</span>
                                                </code>
                                            </div>

                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
};

export default Websites;