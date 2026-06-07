'use client'

import { useEffect, useRef, useState } from 'react';
import { Link2 } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import { useQuery } from '@tanstack/react-query';
import Chart from 'chart.js/auto';

type DashboardData = {
    active_websites: number;
    totalImpressions: number;
    totalEarnings: number;
    accent: string;
};

type Website = {
    name: string;
    website_name: string;
    publisher_url: string;
    impressions: number;
    clicks: number;
    ctr: number;
    earnings: number;
    revenue: number;
};

const DEFAULT_ACCENT = '#FFFFFF'; 

const hexToRgb = (hex: string) => {
    const safe = (hex ?? DEFAULT_ACCENT).replace(/[^0-9a-fA-F]/g, '').padEnd(6, '0');
    const full = safe.length >= 6 ? safe : DEFAULT_ACCENT.slice(1);
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return { r, g, b };
};
const generateMono = (count: number, accent: string): string[] => {
    if (count === 0) return [];
    const { r, g, b } = hexToRgb(accent ?? DEFAULT_ACCENT);
    return Array.from({ length: count }, (_, i) => {
        const t = count === 1 ? 1 : 1 - (i / (count - 1)) * 0.75;
        return `rgb(${Math.round(r * t)}, ${Math.round(g * t)}, ${Math.round(b * t)})`;
    });
};

const fetchDashboardData = async (): Promise<DashboardData> => {
    const res = await fetch("/api/crud/Publisher/Dashboard");
    if (!res.ok) throw new Error('Failed to fetch dashboard data');
    return res.json();
};
const fetchWebsites = async (): Promise<Website[]> => {
    const res = await fetch("/api/crud/Publisher/Websites");
    if (!res.ok) throw new Error('Failed to fetch websites');
    const data = await res.json();
    console.log('websites raw:', JSON.stringify(data).slice(0, 300));
    return Array.isArray(data) ? data : (Array.isArray(data?.sites) ? data.sites : []);
};

const DonutChart = ({ websites, total, accent }: { websites: Website[]; total: number; accent: string }) => {
    const MONO = generateMono(websites.length, accent);
    const r = 48;
    const cx = 60, cy = 60;
    const circumference = 2 * Math.PI * r;
    const gap = 3;
    const [hoveredSite, setHoveredSite] = useState<Website | null>(null);

    let offset = 0;

    return (
        <div className="relative flex items-center justify-center">
            <svg
                viewBox="0 0 120 120"
                className="w-36 h-36 -rotate-90"
                onMouseLeave={() => setHoveredSite(null)}
            >
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1a1a1a" strokeWidth="12" />
                {websites.map((site, idx) => {
                    const pct = total > 0 ? site.earnings / total : 0;
                    const dash = Math.max(0, pct * circumference - gap);
                    const color = MONO[idx];
                    const currentOffset = offset;
                    offset += pct;

                    return (
                        <circle
                            key={site.publisher_url}
                            cx={cx} cy={cy} r={r}
                            fill="none"
                            stroke={color}
                            strokeWidth={hoveredSite?.publisher_url === site.publisher_url ? 15 : 12}
                            strokeDasharray={`${dash} ${circumference - dash}`}
                            strokeDashoffset={-currentOffset * circumference}
                            strokeLinecap="butt"
                            className="cursor-pointer transition-all duration-150"
                            onMouseEnter={() => setHoveredSite(site)}
                        />
                    );
                })}
                <circle cx="60" cy="60" r="36" fill="#0a0a0a" />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {hoveredSite ? (
                    <>
                        <span className="text-[9px] text-gray-500 uppercase tracking-widest truncate max-w-[80px] text-center px-1 leading-tight">
                            {hoveredSite.website_name ?? hoveredSite.publisher_url}
                        </span>
                        <span className="text-base font-bold text-white leading-tight mt-0.5">
                            {total > 0 ? ((hoveredSite.earnings / total) * 100).toFixed(1) : '0'}%
                        </span>
                        <span className="text-[10px] text-gray-400 tabular-nums">
                            {hoveredSite.earnings.toFixed(4)}
                        </span>
                        <span className="text-[9px] text-gray-600">SOL</span>
                    </>
                ) : (
                    <>
                        <span className="text-[10px] text-gray-600 uppercase tracking-widest">Total</span>
                        <span className="text-lg font-bold text-white leading-tight">{total.toFixed(3)}</span>
                        <span className="text-[10px] text-gray-500">SOL</span>
                    </>
                )}
            </div>
        </div>
    );
};

const MetricChart = ({
    websites,
    metric,
    label,
    color,
}: {
    websites: Website[];
    metric: 'impressions' | 'clicks';
    label: string;
    color: string;
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<any>(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        if (chartRef.current) chartRef.current.destroy();

        const data = websites.map(s => s[metric]);
        const labels = websites.map(s => s.website_name ?? s.publisher_url ?? '?');

        chartRef.current = new Chart(canvasRef.current, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label,
                    data,
                    backgroundColor: color,
                    borderRadius: 3,
                    barPercentage: 0.6,
                    categoryPercentage: 0.5,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#111',
                        borderColor: '#222',
                        borderWidth: 1,
                        titleColor: '#aaa',
                        bodyColor: '#ddd',
                        callbacks: {
                            label: (ctx: any) =>
                                metric === 'impressions'
                                    ? ` ${ctx.raw >= 1000 ? (ctx.raw / 1000).toFixed(1) + 'K' : ctx.raw} impr`
                                    : ` ${ctx.raw} clicks`,
                        },
                    },
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#444',
                            font: { size: 10, family: 'monospace' },
                            autoSkip: false,
                            maxRotation: 30,
                        },
                        grid: { color: '#161616' },
                        border: { color: '#1e1e1e' },
                    },
                    y: {
                        ticks: {
                            color: '#444',
                            font: { size: 10 },
                            callback: (v: any) => v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v,
                        },
                        grid: { color: '#161616' },
                        border: { color: '#1e1e1e' },
                    },
                },
            },
        });

        return () => chartRef.current?.destroy();
    }, [websites, metric, color]);

    const total = websites.reduce((a, s) => a + s[metric], 0);

    return (
        <div className="bg-[#0d0d0d] border border-[#1c1c1c] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.5)] flex-shrink-0 w-full">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#1a1a1a]">
                <div>
                    <h2 className="text-sm font-semibold font-mono text-white">{label}</h2>
                    <p className="text-xs text-gray-600 font-mono mt-0.5">Per-site</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums" style={{ color }}>
                        {total >= 1000 ? `${(total / 1000).toFixed(1)}K` : total}
                    </p>
                    <p className="text-xs text-gray-600">total</p>
                </div>
            </div>
            <div className="p-4" style={{ height: '180px', position: 'relative' }}>
                <canvas ref={canvasRef} />
            </div>
        </div>
    );
};

const SiteSpark = ({ site, maxEarnings, totalEarnings, maxCtr, idx, color }: {
    site: Website;
    maxEarnings: number;
    totalEarnings: number;
    maxCtr: number;
    idx: number;
    color: string;
}) => {
    const computedCtr = site.impressions > 0 ? (site.clicks / site.impressions) * 100 : 0;
    const ctrPct = Math.min(computedCtr, 100);
    const sharePct = totalEarnings > 0 ? ((site.earnings / totalEarnings) * 100) : 0;
    const label = site.website_name ?? site.publisher_url ?? '?';
    const hasActivity = site.impressions > 0 || site.clicks > 0;

    return (
        <div className="group">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs text-gray-600 w-4 flex-shrink-0 tabular-nums">{idx + 1}</span>
                    <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: color, boxShadow: idx === 0 ? `0 0 5px ${color}` : 'none' }}
                    />
                    <span className="text-sm text-gray-200 truncate max-w-[150px] font-medium">{label}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                    <span className="text-xs text-gray-500 tabular-nums">{sharePct.toFixed(0)}%</span>
                    <span className="text-sm font-semibold tabular-nums" style={{ color }}>
                        {site.earnings.toFixed(4)}
                        <span className="text-[10px] text-gray-600 font-normal ml-0.5">SOL</span>
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1 h-2 bg-[#161616] rounded-sm overflow-hidden">
                    <div
                        className="absolute inset-y-0 left-0 rounded-sm transition-all duration-700"
                        style={{
                            width: `${ctrPct}%`,
                            background: idx === 0 ? `linear-gradient(90deg, rgba(0,0,0,0.3), ${color})` : color,
                            opacity: 0.85
                        }}
                    />
                </div>
                <span className="text-xs text-gray-500 tabular-nums flex-shrink-0 w-20 text-right whitespace-nowrap">
                    {computedCtr > 0 ? `${computedCtr.toFixed(2)}% CTR` : <span className="text-gray-700">—</span>}
                </span>
            </div>

            <div className="flex items-center gap-3 mt-1.5">
                {site.impressions > 0 && (
                    <span className="text-xs text-gray-500">
                        {site.impressions >= 1000
                            ? `${(site.impressions / 1000).toFixed(1)}K`
                            : site.impressions} impr
                    </span>
                )}
                {site.clicks > 0 && (
                    <span className="text-xs text-gray-500">
                        {site.clicks.toLocaleString()} clicks
                    </span>
                )}
                {!hasActivity && (
                    <span className="text-xs text-gray-700 italic">No activity yet</span>
                )}
            </div>
        </div>
    );
};

const Dashboard = () => {
    const activeTab = 'Home';
    const router = useRouter();
    const { status } = useSession();

    const dashboardQuery = useQuery({
        queryKey: ['dashboard'],
        queryFn: fetchDashboardData,
        enabled: status === 'authenticated',
    });

    const websitesQuery = useQuery({
        queryKey: ['websites'],
        queryFn: fetchWebsites,
        enabled: status === 'authenticated',
    });

    const accent = dashboardQuery.data?.accent ?? DEFAULT_ACCENT;
    const websites = Array.isArray(websitesQuery.data) ? websitesQuery.data : [];
    const isLoading = dashboardQuery.isLoading || websitesQuery.isLoading;
    const hasError = dashboardQuery.error || websitesQuery.error;

    if (isLoading) {
        return (
            <div className="flex h-screen bg-[#0a0a0a] text-gray-200">
                <Sidebar activeTab={activeTab} />
                <main className="flex-1 p-6 overflow-auto">
                    <div className="animate-pulse space-y-4">
                        <div className="h-72 bg-[#111] rounded-2xl border border-[#1a1a1a]" />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="h-48 bg-[#111] rounded-2xl border border-[#1a1a1a]" />
                            <div className="h-48 bg-[#111] rounded-2xl border border-[#1a1a1a]" />
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (hasError) {
        return (
            <div className="flex h-screen bg-[#0a0a0a] text-gray-200">
                <Sidebar activeTab={activeTab} />
                <main className="flex-1 p-6 overflow-auto">
                    <div className="text-red-500 text-sm">Error loading data. Please try again.</div>
                </main>
            </div>
        );
    }

    const MONO = generateMono(websites.length, accent);
    const maxEarnings = Math.max(...websites.map(s => s.earnings), 0.0001);
    const totalEarningsSum = websites.reduce((a, s) => a + s.earnings, 0);
    const maxCtr = Math.max(...websites.map(s => s.impressions > 0 ? (s.clicks / s.impressions) * 100 : 0), 0.0001);

    return (
        <div className="flex h-screen bg-[#0a0a0a] text-gray-200 font-sans">
            <Sidebar activeTab={activeTab} />

            <main className="flex-1 font-mono overflow-auto">
                <div className="p-6 space-y-3">

                    <div className="bg-[#0d0d0d] border border-[#1c1c1c] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
                        {websites.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
                                <div className="w-12 h-12 rounded-full bg-[#161616] border border-[#222] flex items-center justify-center mb-4">
                                    <Link2 className="w-5 h-5 text-gray-500" />
                                </div>
                                <p className="text-sm font-semibold text-white mb-1">No sites yet</p>
                                <p className="text-xs text-gray-600 mb-5 max-w-xs">Add your first property to start tracking earnings</p>
                                <button
                                    onClick={() => router.push("/Publisher-campaign")}
                                    className="px-4 py-2 cursor-pointer rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                                    style={{ background: accent, color: '#000000' }}
                                >
                                    Add Site
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#1a1a1a]">
                                    <div>
                                        <h2 className="text-sm font-semibold font-mono text-white">Revenue</h2>
                                        <p className="text-xs text-gray-600 font-mono mt-0.5">Per-site breakdown</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-600">{websites.length} {websites.length === 1 ? 'site' : 'sites'}</p>
                                        <p className="text-sm font-semibold text-white tabular-nums">{totalEarningsSum.toFixed(4)} <span className="text-xs text-gray-500 font-normal">SOL</span></p>
                                    </div>
                                </div>

                                <div className="flex gap-6 p-5" style={{ maxHeight: '20rem' }}>
                                    <div
                                        className="flex-1 min-w-10 overflow-y-auto space-y-5 pr-2"
                                        style={{ scrollbarWidth: 'thin', scrollbarColor: '#2a2a2a transparent' }}
                                    >
                                        {websites.map((site, idx) => (
                                            <SiteSpark
                                                key={site.publisher_url}
                                                site={site}
                                                maxEarnings={maxEarnings}
                                                totalEarnings={totalEarningsSum}
                                                maxCtr={maxCtr}
                                                idx={idx}
                                                color={MONO[idx]}
                                            />
                                        ))}
                                    </div>

                                    <div className="w-px self-stretch bg-[#1c1c1c] flex-shrink-0" />

                                    {totalEarningsSum > 0 && (
                                        <div className="flex-shrink-0 flex flex-col items-center gap-3 w-36">
                                            <DonutChart websites={websites} total={totalEarningsSum} accent={accent} />
                                            <div
                                                className="w-full space-y-2 overflow-y-auto"
                                                style={{ maxHeight: '8rem', scrollbarWidth: 'none' }}
                                            >
                                                {websites.map((site, idx) => {
                                                    const pct = ((site.earnings / totalEarningsSum) * 100).toFixed(0);
                                                    return (
                                                        <div key={site.publisher_url} className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                <span className="w-1 h-3 rounded-sm flex-shrink-0" style={{ background: MONO[idx] }} />
                                                                <span className="text-xs text-gray-500 truncate max-w-[72px]">
                                                                    {(site.website_name ?? site.publisher_url ?? '?').slice(0, 10)}
                                                                </span>
                                                            </div>
                                                            <span className="text-xs font-semibold tabular-nums" style={{ color: MONO[idx] }}>
                                                                {pct}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {websites.length > 0 && (
                        <div
                            className="flex gap-3 overflow-x-auto pb-1"
                            style={{ scrollbarWidth: 'thin', scrollbarColor: '#2a2a2a transparent' }}
                        >
                            <div className="min-w-[340px] flex-1">
                                <MetricChart websites={websites} metric="impressions" label="Impressions" color="#EDEDED" />
                            </div>
                            <div className="min-w-[340px] flex-1">
                                <MetricChart websites={websites} metric="clicks" label="Clicks" color={accent} />
                            </div>
                        </div>
                    )}

                    {websites.length > 0 && (
                        <div className="bg-[#0d0d0d] border border-[#1c1c1c] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                            <div className="px-5 py-4 border-b border-[#1a1a1a]">
                                <h2 className="text-sm font-semibold text-white">Sites</h2>
                            </div>
                            <div
                                className="overflow-y-auto"
                                style={{ maxHeight: '16rem', scrollbarWidth: 'thin', scrollbarColor: '#2a2a2a transparent' }}
                            >
                                <table className="w-full">
                                    <thead className="sticky top-0 bg-[#0d0d0d] z-10">
                                        <tr className="text-xs text-gray-600 border-b border-[#1a1a1a] uppercase tracking-widest">
                                            <th className="text-left px-5 py-2.5 font-medium">#</th>
                                            <th className="text-left px-5 py-2.5 font-medium">Site</th>
                                            <th className="text-right px-5 py-2.5 font-medium">Impr</th>
                                            <th className="text-right px-5 py-2.5 font-medium">Clicks</th>
                                            <th className="text-right px-5 py-2.5 font-medium">CTR</th>
                                            <th className="text-right px-5 py-2.5 font-medium">SOL</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {websites.map((site, index) => (
                                            <tr
                                                key={`website-${site.name}-${index}`}
                                                className="border-t border-[#141414] hover:bg-[#111] transition-colors cursor-pointer"
                                            >
                                                <td className="px-5 py-3.5 text-xs text-gray-700 tabular-nums">{index + 1}</td>
                                                <td className="px-5 py-3.5">
                                                    <p className="text-sm font-medium text-gray-200">{site.website_name}</p>
                                                    <p className="text-xs text-gray-600 truncate max-w-[180px]">{site.publisher_url}</p>
                                                </td>
                                                <td className="px-5 py-3.5 text-right text-sm text-gray-400 tabular-nums">
                                                    {site.impressions > 0
                                                        ? site.impressions >= 1000
                                                            ? `${(site.impressions / 1000).toFixed(1)}K`
                                                            : site.impressions
                                                        : <span className="text-gray-700">—</span>}
                                                </td>
                                                <td className="px-5 py-3.5 text-right text-sm text-gray-400 tabular-nums">
                                                    {site.clicks > 0 ? site.clicks.toLocaleString() : <span className="text-gray-700">—</span>}
                                                </td>
                                                <td className="px-5 py-3.5 text-right text-sm text-gray-400 tabular-nums">
                                                    {site.impressions > 0 && site.clicks > 0
                                                        ? `${((site.clicks / site.impressions) * 100).toFixed(2)}%`
                                                        : <span className="text-gray-700">—</span>}
                                                </td>
                                                <td className="px-5 py-3.5 text-right text-sm font-semibold tabular-nums" style={{ color: accent }}>
                                                    {site.earnings.toFixed(4)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};

export default Dashboard;