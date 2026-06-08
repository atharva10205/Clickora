'use client'

import { Plus, BarChart3, Code, Copy, Edit, Link, Trash2, RefreshCw, Check } from 'lucide-react';
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
        const code = `<div id="my-widget"></div>\n<script src="https://clickora-seven.vercel.app//my-widget.js" data-id="${publisherUrl}"></script>`;
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
        <div className="flex h-screen bg-[#0a0a0a] text-gray-300">
            <Sidebar activeTab={activeTab} />

            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-6xl">

                    {/* Header */}
                    <div className="flex items-center font-mono justify-between mb-10">
                        <div>
                            <h1 className="text-3xl font-bold mb-1 text-white tracking-tight">Websites</h1>
                            <p className="text-gray-600 text-sm">Manage your publishing properties</p>
                        </div>

                        <button
                            onClick={() => router.push("/Publisher-campaign")}
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
                            <Plus className="w-4 h-4" />
                            Add Website
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-6 font-mono">
                    <span className="text-xs text-gray-600 mr-1">Sort:</span>
                    {(['date', 'name', 'earnings', 'impressions', 'clicks'] as const).map(key => (
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
                                    <div className="p-6">

                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1.5">
                                                    <h3 className="text-lg font-semibold text-white tracking-tight">{site.website_name}</h3>
                                                    <span className={`text-xs px-2 py-0.5 rounded font-mono tracking-wide border ${site.status === 'ACTIVE'
                                                        ? 'bg-gray-800 text-gray-300 border-gray-700'
                                                        : 'bg-[#1a1a1a] text-gray-500 border-gray-800'
                                                        }`}>
                                                        {site.status === 'ACTIVE' && (
                                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-300 mr-1.5 align-middle animate-pulse" />
                                                        )}
                                                        {site.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 flex items-center gap-1.5 font-mono">
                                                    <Link className="w-3.5 h-3.5" />
                                                    {site.publisher_url}
                                                </p>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2">
                                                {site.status !== 'REVIEW' && (
                                                    <>
                                                        <button className="p-2 rounded-lg bg-[#161616] border border-gray-800/60 text-gray-500 hover:text-gray-200 hover:border-gray-600 transition-all duration-150" title="Get Code">
                                                            <Code className="w-4 h-4" />
                                                        </button>
                                                        <button className="p-2 rounded-lg bg-[#161616] border border-gray-800/60 text-gray-500 hover:text-gray-200 hover:border-gray-600 transition-all duration-150" title="Edit">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button className="p-2 rounded-lg bg-[#161616] border border-gray-800/60 text-gray-500 hover:text-gray-200 hover:border-gray-600 transition-all duration-150" title="View Stats">
                                                            <BarChart3 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                {site.status === 'REVIEW' && (
                                                    <button className="p-2 rounded-lg bg-[#161616] border border-gray-800/60 text-gray-500 hover:text-gray-200 hover:border-gray-600 transition-all duration-150" title="Refresh">
                                                        <RefreshCw className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button className="p-2 rounded-lg bg-[#161616] border border-gray-800/60 text-gray-500 hover:text-red-400 hover:border-red-900/60 transition-all duration-150" title="Remove">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Metrics Row */}
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                                            {[
                                                { label: 'Impressions', value: site.status === 'REVIEW' ? '0' : site.impressions.toLocaleString(), accent: false },
                                                { label: 'Clicks', value: site.status === 'REVIEW' ? '0' : site.clicks.toLocaleString(), accent: false },
                                                { label: 'CTR', value: site.status === 'REVIEW' ? '0%' : `${site.ctr}%`, accent: false },
                                                { label: 'Earnings', value: site.status === 'REVIEW' ? '0.0000 SOL' : site.formattedEarnings, accent: true },
                                                { label: 'RPM', value: site.status === 'REVIEW' ? '0.0000 SOL' : `${site.rpm} SOL`, accent: false },
                                            ].map((metric) => (
                                                <div key={metric.label} className="bg-[#0d0d0d] border border-gray-800/50 p-4 rounded-lg">
                                                    <p className="text-xs text-gray-600 uppercase tracking-widest mb-1.5">{metric.label}</p>
                                                    <p
                                                        className="text-base font-semibold font-mono tabular-nums"
                                                        style={{ color: metric.accent ? accent : undefined }}
                                                    >
                                                        {metric.value}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Ad Code Block */}
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-gray-600 uppercase tracking-widest">Ad Code Integration</span>

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
                                            className="bg-[#0d0d0d] rounded-lg p-4 flex flex-col gap-1.5 transition-all duration-300"
                                            style={{
                                                border: `1px solid ${isCopied ? alpha(0.35) : alpha(0.06)}`,
                                                boxShadow: isCopied ? `0 0 16px ${alpha(0.08)}` : 'none',
                                            }}
                                        >
                                            <code className="text-xs font-mono leading-relaxed text-gray-500">
                                                &lt;div id="my-widget"&gt;&lt;/div&gt;
                                            </code>
                                            <code className="text-xs font-mono leading-relaxed">
                                                <span className="text-gray-500">&lt;script src="http://localhost:3000/my-widget.js" data-id="</span>
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
            </main>
        </div>
    );
};

export default Websites;