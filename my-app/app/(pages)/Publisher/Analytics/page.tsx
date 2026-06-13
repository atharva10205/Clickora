'use client'

import { Download, TrendingUp, Globe, MousePointer, Eye, Wallet, BarChart2 } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import { useEffect, useState } from 'react';

interface WebsiteStat {
    name: string;
    url: string;
    status: string;
    impressions: number;
    totalClicks: number;
    claimedClicks: number;
    unclaimedClicks: number;
    totalEarnings: number;
    claimedEarnings: number;
    ctr: number;
}

interface Totals {
    totalImpressions: number;
    totalClicks: number;
    totalEarnings: number;
    totalClaimed: number;
    avgCtr: string;
    activeWebsites: number;
}

interface ClicksChart {
    date: string;
    count: number;
}

interface ImpressionsChart {
    date: string;
    count: number;
}


const ClicksAreaChart = ({
    clicksChart,
    maxClicks,
    accent,
}: {
    clicksChart: ClicksChart[];
    maxClicks: number;
    accent: string;
}) => {
    const ACCENT = accent;
    const accentAlpha = (opacity: number) => {
        const r = parseInt(ACCENT.slice(1, 3), 16);
        const g = parseInt(ACCENT.slice(3, 5), 16);
        const b = parseInt(ACCENT.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${opacity})`;
    };

    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    const W = 700;
    const H = 180;
    const padL = 10;
    const padR = 10;
    const padT = 24;
    const padB = 32;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    const totalClicks = clicksChart.reduce((s, c) => s + c.count, 0);
    const peakClicks = Math.max(maxClicks, 1);
    const gridLines = 4;

    const xOf = (i: number) => padL + (i / Math.max(clicksChart.length - 1, 1)) * chartW;
    const yOfClick = (v: number) => padT + chartH - (v / peakClicks) * chartH;

    const clickPoints = clicksChart.map((c, i) => ({ x: xOf(i), y: yOfClick(c.count) }));

    const toPath = (pts: { x: number; y: number }[], close = false) => {
        if (pts.length < 2) return '';
        let d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 0; i < pts.length - 1; i++) {
            const cp1x = pts[i].x + (pts[i + 1].x - pts[i].x) * 0.4;
            const cp1y = pts[i].y;
            const cp2x = pts[i].x + (pts[i + 1].x - pts[i].x) * 0.6;
            const cp2y = pts[i + 1].y;
            d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pts[i + 1].x} ${pts[i + 1].y}`;
        }
        if (close) {
            d += ` L ${pts[pts.length - 1].x} ${padT + chartH} L ${pts[0].x} ${padT + chartH} Z`;
        }
        return d;
    };

    const clickLinePath = toPath(clickPoints);
    const clickAreaPath = toPath(clickPoints, true);

    return (
        <div className="bg-[#111111] border border-gray-800/70 p-4 sm:p-6 rounded-xl mb-5">
            <div className="flex items-center justify-between mb-1">
                <div>
                    <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-widest">Clicks — Last 7 Days</h2>
                    <p className="text-xs text-gray-600 mt-0.5">Daily click activity</p>
                    <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1.5 text-xs text-gray-500 font-mono">
                            <span className="inline-block w-2 h-2 rounded-sm" style={{ background: ACCENT }} />
                            Clicks
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-xl font-bold font-mono" style={{ color: ACCENT }}>{totalClicks.toLocaleString()}</span>
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
                        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.12" />
                            <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2.5" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {Array.from({ length: gridLines + 1 }).map((_, i) => {
                        const y = padT + (i / gridLines) * chartH;
                        const clickVal = Math.round(peakClicks * (1 - i / gridLines));
                        return (
                            <g key={i}>
                                <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#1f1f1f" strokeWidth="1" />
                                {i < gridLines && (
                                    <text x={padL} y={y - 4} fill="#444" fontSize="9" fontFamily="monospace">{clickVal}</text>
                                )}
                            </g>
                        );
                    })}

                    <path d={clickAreaPath} fill="url(#areaFill)" />
                    <path
                        d={clickLinePath}
                        fill="none"
                        stroke={accentAlpha(0.4)}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#glow)"
                    />
                    <path
                        d={clickLinePath}
                        fill="none"
                        stroke={ACCENT}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {hoveredIdx !== null && (
                        <line
                            x1={clickPoints[hoveredIdx].x} y1={padT}
                            x2={clickPoints[hoveredIdx].x} y2={padT + chartH}
                            stroke="#444" strokeWidth="1" strokeDasharray="3 3"
                        />
                    )}

                    {clickPoints.map((pt, i) => (
                        <g key={i}>
                            <rect
                                x={pt.x - 30} y={padT} width={60} height={chartH}
                                fill="transparent"
                                onMouseEnter={() => setHoveredIdx(i)}
                                onMouseLeave={() => setHoveredIdx(null)}
                                style={{ cursor: 'crosshair' }}
                            />
                            <circle
                                cx={pt.x} cy={pt.y} r={hoveredIdx === i ? 4 : 2.5}
                                fill={hoveredIdx === i ? ACCENT : accentAlpha(0.4)}
                                stroke={hoveredIdx === i ? accentAlpha(0.3) : 'none'}
                                strokeWidth="6"
                                style={{ transition: 'r 0.15s, fill 0.15s' }}
                                pointerEvents="none"
                            />

                            {hoveredIdx === i && (() => {
                                const tipW = 108;
                                const tipH = 38;
                                let tx = pt.x - tipW / 2;
                                if (tx < 2) tx = 2;
                                if (tx + tipW > W - 2) tx = W - tipW - 2;
                                const ty = pt.y - tipH - 12;
                                return (
                                    <g pointerEvents="none">
                                        <rect x={tx} y={ty} width={tipW} height={tipH} rx="5" fill="#1e1e1e" stroke="#333" strokeWidth="1" />
                                        <text x={tx + tipW / 2} y={ty + 13} textAnchor="middle" fill="#aaa" fontSize="9" fontFamily="monospace">
                                            {clicksChart[i].date}
                                        </text>
                                        <circle cx={tx + 14} cy={ty + 27} r="3" fill={ACCENT} />
                                        <text x={tx + 22} y={ty + 31} fill={ACCENT} fontSize="11" fontWeight="700" fontFamily="monospace">
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
                                style={{ transition: 'fill 0.15s' }}
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

const Analytics = () => {
    const activeTab = 'Analytics';
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [websiteStats, setWebsiteStats] = useState<WebsiteStat[]>([]);
    const [totals, setTotals] = useState<Totals | null>(null);
    const [clicksChart, setClicksChart] = useState<ClicksChart[]>([]);
    const [impressionsChart, setImpressionsChart] = useState<ImpressionsChart[]>([]);
    const [loading, setLoading] = useState(true);
    const [accent, setAccent] = useState('#ffffff');

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch("/api/crud/Publisher/Analytics");
                const data = await res.json();
                setWebsiteStats(data.websiteStats ?? []);
                setTotals(data.totals ?? null);
                setClicksChart(data.clicksChart ?? []);
                setImpressionsChart(data.impressionsChart ?? []);
                setAccent(data.accent ?? '#ffffff');
            } catch (err) {
                console.error("Failed to fetch analytics", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    const maxClicks = Math.max(...clicksChart.map(c => c.count), 1);
    const ACCENT_COLOR = accent;

    const statCards = totals ? [
        { label: 'Total Impressions', value: totals.totalImpressions.toLocaleString(), icon: Eye, accent: 'text-gray-100', border: 'border-gray-700/60', bg: 'bg-[#161616]' },
        { label: 'Total Clicks', value: totals.totalClicks.toLocaleString(), icon: MousePointer, accent: 'text-gray-200', border: 'border-gray-700/60', bg: 'bg-[#161616]' },
        { label: 'Avg. CTR', value: `${totals.avgCtr}%`, icon: TrendingUp, accent: 'text-gray-300', border: 'border-gray-700/60', bg: 'bg-[#161616]' },
        { label: 'Active Websites', value: totals.activeWebsites.toString(), icon: Globe, accent: 'text-gray-200', border: 'border-gray-700/60', bg: 'bg-[#161616]' },
        { label: 'Total Earnings', value: `${totals.totalEarnings.toFixed(4)} SOL`, icon: Wallet, accent: 'accent', border: 'border-gray-600/80', bg: 'bg-[#1c1c1c]' },
        { label: 'Total Claimed', value: `${totals.totalClaimed.toFixed(4)} SOL`, icon: BarChart2, accent: 'accent', border: 'border-gray-600/80', bg: 'bg-[#1c1c1c]' },
    ] : [];

    return (
        <div className="flex h-screen bg-[#0a0a0a] text-gray-300">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <Sidebar activeTab={activeTab} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="flex-1 p-4 sm:p-8 font-mono overflow-y-auto min-w-0">
                <div className="max-w-6xl">

                    <div className="flex items-center justify-between mb-8 sm:mb-10">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden flex flex-col gap-1 p-1.5 rounded-md hover:bg-[#161616] transition-colors flex-shrink-0"
                            >
                                <span className="w-4 h-px bg-gray-400" />
                                <span className="w-4 h-px bg-gray-400" />
                                <span className="w-4 h-px bg-gray-400" />
                            </button>
                            <div>
                                <h1 className="text-lg sm:text-3xl font-bold mb-0.5 text-white tracking-tight">Analytics</h1>
                                <p className="text-gray-600 text-xs sm:text-sm hidden sm:block">Detailed performance insights</p>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="w-8 h-8 border-2 border-gray-700 border-t-gray-300 rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-6 sm:mb-8">
                                {statCards.map((card) => (
                                    <div
                                        key={card.label}
                                        className={`${card.bg} border ${card.border} p-3 sm:p-5 rounded-xl hover:border-gray-500 hover:-translate-y-0.5 transition-all duration-200`}
                                    >
                                        <div className="flex items-center justify-between mb-2 sm:mb-4">
                                            <p className="text-[10px] sm:text-xs text-gray-600 uppercase tracking-widest font-medium leading-tight">{card.label}</p>
                                            <card.icon
                                                className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0"
                                                style={{ color: card.accent === 'accent' ? ACCENT_COLOR : undefined }}
                                            />
                                        </div>
                                        <p
                                            className={`text-base sm:text-2xl font-bold tabular-nums ${card.accent !== 'accent' ? card.accent : ''}`}
                                            style={card.accent === 'accent' ? { color: ACCENT_COLOR } : undefined}
                                        >
                                            {card.value}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <ClicksAreaChart
                                clicksChart={clicksChart}
                                impressionsChart={impressionsChart}
                                maxClicks={maxClicks}
                                accent={accent}
                            />

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

                                <div className="bg-[#111111] border border-gray-800/70 rounded-xl flex flex-col" style={{ height: '320px' }}>
                                    <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b border-gray-800/60 flex-shrink-0">
                                        <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-widest">Earnings by Website</h2>
                                    </div>
                                    {websiteStats.length === 0 ? (
                                        <div className="flex-1 flex items-center px-6">
                                            <p className="text-gray-600 text-sm">No website data yet.</p>
                                        </div>
                                    ) : (
                                        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-5 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                                            {websiteStats.map((site) => (
                                                <div key={site.url}>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-sm text-gray-300 truncate max-w-[140px] sm:max-w-none">{site.name}</span>
                                                        <span className="text-sm font-semibold font-mono flex-shrink-0 ml-2" style={{ color: ACCENT_COLOR }}>{site.totalEarnings.toFixed(4)} SOL</span>
                                                    </div>
                                                    <div className="relative h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-500"
                                                            style={{
                                                                width: `${Math.min(site.ctr, 100)}%`,
                                                                background: `linear-gradient(to right, ${ACCENT_COLOR}66, ${ACCENT_COLOR})`,
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between mt-1.5">
                                                        <span className="text-xs text-gray-700">{site.impressions.toLocaleString()} impressions</span>
                                                        <span className="text-xs text-gray-500 font-mono">{site.ctr}% CTR</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-[#111111] border border-gray-800/70 rounded-xl flex flex-col" style={{ height: '320px' }}>
                                    <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b border-gray-800/60 flex-shrink-0">
                                        <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-widest">Website Performance</h2>
                                    </div>
                                    {websiteStats.length === 0 ? (
                                        <div className="flex-1 flex items-center px-6">
                                            <p className="text-gray-600 text-sm">No data yet.</p>
                                        </div>
                                    ) : (
                                        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                                            {websiteStats.map((site) => (
                                                <div key={site.url} className="p-3 sm:p-4 bg-[#0d0d0d] border border-gray-800/50 rounded-lg">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <p className="text-sm font-medium text-gray-200 truncate max-w-[120px] sm:max-w-[160px]">{site.name}</p>
                                                        <span
                                                            className={`text-xs px-2 py-0.5 rounded font-mono tracking-wide border flex-shrink-0 ml-2 ${site.status === 'ACTIVE' ? 'text-black border-black' : 'bg-amber-300 text-black border-black'}`}
                                                            style={site.status === 'ACTIVE' ? { background: ACCENT_COLOR.toLowerCase() === '#ffffff' ? '#4ADE80' : ACCENT_COLOR } : undefined}
                                                        >
                                                            {site.status}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
                                                        <div className="bg-[#111111] rounded p-2">
                                                            <p className="text-[10px] sm:text-xs text-gray-600 mb-1 uppercase tracking-wider">Clicks</p>
                                                            <p className="text-xs sm:text-sm font-semibold text-gray-200 font-mono">{site.totalClicks}</p>
                                                        </div>
                                                        <div className="bg-[#111111] rounded p-2">
                                                            <p className="text-[10px] sm:text-xs text-gray-600 mb-1 uppercase tracking-wider">Claimed</p>
                                                            <p className="text-xs sm:text-sm font-semibold font-mono" style={{ color: ACCENT_COLOR }}>{site.claimedClicks}</p>
                                                        </div>
                                                        <div className="bg-[#111111] rounded p-2">
                                                            <p className="text-[10px] sm:text-xs text-gray-600 mb-1 uppercase tracking-wider">Pending</p>
                                                            <p className="text-xs sm:text-sm font-semibold text-gray-400 font-mono">{site.unclaimedClicks}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Analytics;