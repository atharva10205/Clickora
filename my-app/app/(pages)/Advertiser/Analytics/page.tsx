'use client';

import { Download } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import Sidebar from '../Sidebar/Sidebar';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';

type AnalyticsData = {
   summary: {
    totalImpressions: number;
    totalClicks: number;
    ctr: number;
    totalSpend: number;
};
    chartData: { date: string; impressions: number; clicks: number }[];
    topSites: { name: string; impressions: number; clicks: number; ctr: number }[];
    accent: string;
};

const fetchAnalytics = async (): Promise<AnalyticsData> => {
    const res = await fetch('/api/crud/Advertiser/Analytics');
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
};


const Analytics = () => {
    const activeTab = 'Analytics';
    const { status } = useSession();

    const { data, isLoading, error } = useQuery({
        queryKey: ['analytics'],
        queryFn: fetchAnalytics,
        enabled: status === 'authenticated',
    });

    const accent = data?.accent ?? '#FFFFFF';
    const summary = data?.summary;
    const chartData = data?.chartData ?? [];
    const topSites = data?.topSites ?? [];
    const maxClicks = Math.max(...topSites.map(s => s.clicks), 1);

    const summaryCards = summary ? [
        {
            metric: 'Total Impressions',
            value: summary.totalImpressions >= 1000
                ? `${(summary.totalImpressions / 1000).toFixed(1)}K`
                : String(summary.totalImpressions)
        },
        {
            metric: 'Click-Through Rate',
            value: `${summary.ctr}%`
        },
        {
            metric: 'Total Clicks',
            value: summary.totalClicks >= 1000
                ? `${(summary.totalClicks / 1000).toFixed(1)}K`
                : String(summary.totalClicks)
        },
        { metric: 'Total Spend', value: `${summary.totalSpend.toFixed(4)} SOL` },
    ] : [];

    if (isLoading) {
        return (
            <div className="flex h-screen bg-[#0a0a0a] text-gray-200">
                <Sidebar activeTab={activeTab} />
                <main className="flex-1 p-8 overflow-auto">
                    <div className="animate-pulse space-y-4">
                        <div className="h-10 w-48 bg-[#111] rounded-xl" />
                        <div className="grid grid-cols-4 gap-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-28 bg-[#111] rounded-2xl border border-[#1a1a1a]" />
                            ))}
                        </div>
                        <div className="h-72 bg-[#111] rounded-2xl border border-[#1a1a1a]" />
                        <div className="h-56 bg-[#111] rounded-2xl border border-[#1a1a1a]" />
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen bg-[#0a0a0a] text-gray-200">
                <Sidebar activeTab={activeTab} />
                <main className="flex-1 p-8">
                    <p className="text-red-500 text-sm">Error loading analytics. Please try again.</p>
                </main>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#0a0a0a] text-gray-200">
            <Sidebar activeTab={activeTab} />

            <main className="flex-1 p-6 overflow-y-auto font-mono">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-semibold text-white">Analytics</h1>
                        <p className="text-xs text-gray-600 mt-0.5">Campaign performance insights</p>
                    </div>
                    <button className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0d0d0d] border border-[#1c1c1c] hover:bg-[#161616] flex items-center gap-2 text-gray-400 transition-colors">
                        <Download className="w-3.5 h-3.5" />
                        Export
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    {summaryCards.map((item) => (
                        <div
                            key={item.metric}
                            className="bg-[#0d0d0d] border border-[#1c1c1c] p-5 rounded-2xl"
                        >
                            <p className="text-xs text-gray-600 mb-2">{item.metric}</p>
                            <p
                                className="text-2xl font-semibold tabular-nums"
                               style={{ color: item.metric === 'Total Spend' ? accent : 'white' }}
                            >
                                {item.value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Chart */}
                <div className="bg-[#0d0d0d] border border-[#1c1c1c] rounded-2xl p-5 mb-4">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-sm font-semibold text-white">Performance Trends</h2>
                            <p className="text-xs text-gray-600 mt-0.5">Last 7 days</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                            <span className="flex items-center gap-1.5">
                                <span
                                    className="w-5 inline-block"
                                    style={{ borderTop: `1.5px solid ${accent}` }}
                                />
                                Clicks
                            </span>
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#161616" />
                            <XAxis
                                dataKey="date"
                                stroke="#2a2a2a"
                                tick={{ fill: '#444', fontSize: 10, fontFamily: 'monospace' }}
                                tickFormatter={d => {
                                    const date = new Date(d);
                                    return `${date.getMonth() + 1}/${date.getDate()}`;
                                }}
                            />
                            <YAxis
                                stroke="#2a2a2a"
                                tick={{ fill: '#444', fontSize: 10 }}
                                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#111',
                                    border: '1px solid #222',
                                    borderRadius: '8px',
                                    color: '#e5e7eb',
                                    fontSize: '11px',
                                    fontFamily: 'monospace'
                                }}
                                labelFormatter={d => {
                                    const date = new Date(d);
                                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="clicks"
                                stroke={accent}
                                strokeWidth={1.5}
                                dot={false}
                                activeDot={{ r: 4, fill: accent }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Sites */}
                <div className="bg-[#0d0d0d] border border-[#1c1c1c] rounded-2xl p-5">
                    <h2 className="text-sm font-semibold text-white mb-4">Top Sites</h2>
                    {topSites.length === 0 ? (
                        <p className="text-xs text-gray-700 italic">No site data yet</p>
                    ) : (
                        <div className="space-y-5">
                            {topSites.map((site) => (
                                <div key={site.name}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-300 truncate max-w-[200px]">
                                            {site.name}
                                        </span>
                                        <div className="flex items-center gap-4 text-xs text-gray-500 tabular-nums flex-shrink-0 ml-4">
                                            <span>
                                                {site.impressions >= 1000
                                                    ? `${(site.impressions / 1000).toFixed(1)}K`
                                                    : site.impressions} impr
                                            </span>
                                            <span>{site.clicks} clicks</span>
                                            <span style={{ color: accent }}>{site.ctr}% CTR</span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-[#161616] rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{
                                                width: `${Math.min(site.ctr, 100)}%`,
                                                background: accent,
                                                opacity: 0.8
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
};

export default Analytics;