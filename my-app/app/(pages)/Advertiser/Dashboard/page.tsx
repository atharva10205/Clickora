'use client'

import { useRouter } from 'next/navigation';
import { Target, MousePointerClick, DollarSign, Plus } from 'lucide-react';
import Sidebar from '../Sidebar/Sidebar';
import { useSession } from "next-auth/react";
import { useRef, useEffect, useState } from 'react';
import Chart from 'chart.js/auto';

type Campaign = {
    name: string;
    clicks: number;
    cpc: string;
    status: 'Active' | 'Paused';
    performance: number;
    spend: number;
};
type DashboardData = {
    activeCampaigns: number;
    totalClicks: number;
    totalSpend: number;
    accent: string;
    campaigns: Campaign[];
    dailySpend: { day: string; spend: number }[];
};

const DEFAULT_ACCENT = '#FFFFFF';

const fetchDashboardData = async (): Promise<DashboardData> => {
    const res = await fetch("/api/crud/Advertiser/Dashboard");
    if (!res.ok) throw new Error('Failed to fetch dashboard data');
    return res.json();
};



const BarChart = ({
    campaigns,
    metric,
    label,
    color,
    formatValue,
    overrideTotal,
}: {
    campaigns: Campaign[];
    metric: 'clicks' | 'spend' | 'performance';
    label: string;
    color: string;
    formatValue?: (v: number) => string;
    overrideTotal?: number;
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<any>(null);


    useEffect(() => {
        if (!canvasRef.current) return;
        chartRef.current?.destroy();

        const data = campaigns.map(c => c[metric]);
        const labels = campaigns.map(c => c.name.split(' ').slice(0, 2).join(' '));

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
                            label: (ctx: any) => formatValue ? ` ${formatValue(ctx.raw)}` : ` ${ctx.raw}`,
                        },
                    },
                },
                scales: {
                    x: {
                        ticks: { color: '#444', font: { size: 10, family: 'monospace' }, maxRotation: 30, autoSkip: false },
                        grid: { color: '#161616' },
                        border: { color: '#1e1e1e' },
                    },
                    y: {
                        ticks: {
                            color: '#444',
                            font: { size: 10 },
                            callback: (v: any) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v,
                        },
                        grid: { color: '#161616' },
                        border: { color: '#1e1e1e' },
                    },
                },
            },
        });

        return () => chartRef.current?.destroy();
    }, [campaigns, metric, color]);

    const total = overrideTotal ?? campaigns.reduce((a, c) => a + Number(c[metric]), 0);

    return (
        <div className="bg-[#0d0d0d] border border-[#1c1c1c] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.5)] flex-shrink-0 w-full">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#1a1a1a]">
                <div>
                    <h2 className="text-sm font-semibold font-mono text-white">{label}</h2>
                    <p className="text-xs text-gray-600 font-mono mt-0.5">Per-campaign</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums" style={{ color }}>
                        {formatValue ? formatValue(total) : total >= 1000 ? `${(total / 1000).toFixed(1)}K` : total}
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
const LineChart = ({ color, dailySpend }: { color: string; dailySpend: { day: string; spend: number }[] }) => {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    const days = dailySpend.map(d => d.day);
    const spendData = dailySpend.map(d => d.spend);
    const totalSpend = spendData.reduce((a, b) => a + b, 0);
    const ACCENT = color;
    const accentAlpha = (opacity: number) => {
        const r = parseInt(ACCENT.slice(1, 3), 16);
        const g = parseInt(ACCENT.slice(3, 5), 16);
        const b = parseInt(ACCENT.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${opacity})`;
    };

    const W = 700;
    const H = 180;
    const padL = 10;
    const padR = 10;
    const padT = 24;
    const padB = 32;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    const peak = Math.max(...spendData, 0.001);
    const gridLines = 4;

    const xOf = (i: number) => padL + (i / (spendData.length - 1)) * chartW;
    const yOf = (v: number) => padT + chartH - (v / peak) * chartH;

    const points = spendData.map((v, i) => ({ x: xOf(i), y: yOf(v) }));

    const toPath = (pts: { x: number; y: number }[], close = false) => {
        if (pts.length < 2) return '';
        let d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 0; i < pts.length - 1; i++) {
            const cp1x = pts[i].x + (pts[i + 1].x - pts[i].x) * 0.4;
            const cp2x = pts[i].x + (pts[i + 1].x - pts[i].x) * 0.6;
            d += ` C ${cp1x} ${pts[i].y}, ${cp2x} ${pts[i + 1].y}, ${pts[i + 1].x} ${pts[i + 1].y}`;
        }
        if (close) {
            d += ` L ${pts[pts.length - 1].x} ${padT + chartH} L ${pts[0].x} ${padT + chartH} Z`;
        }
        return d;
    };

    const linePath = toPath(points);
    const areaPath = toPath(points, true);

    return (
        <div className="bg-[#0d0d0d] border border-[#1c1c1c] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.5)] w-full">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#1a1a1a]">
                <div>
                    <h2 className="text-sm font-semibold font-mono text-white">Daily Spend</h2>
                    <p className="text-xs text-gray-600 font-mono mt-0.5">Last 7 days</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums font-mono" style={{ color }}>{totalSpend.toFixed(4)}</p>
                    <p className="text-xs text-gray-600">SOL</p>
                </div>
            </div>

            <div className="px-4 pt-3 pb-2 relative w-full" style={{ paddingBottom: '28%' }}>
                <svg
                    viewBox={`0 0 ${W} ${H}`}
                    className="absolute inset-0 w-full h-full overflow-visible"
                    preserveAspectRatio="none"
                >
                    <defs>
                        <linearGradient id="spendAreaFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.12" />
                            <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
                        </linearGradient>
                        <filter id="spendGlow">
                            <feGaussianBlur stdDeviation="2.5" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {Array.from({ length: gridLines + 1 }).map((_, i) => {
                        const y = padT + (i / gridLines) * chartH;
                        const val = peak * (1 - i / gridLines);
                        return (
                            <g key={i}>
                                <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#1f1f1f" strokeWidth="1" />
                                {i < gridLines && (
                                    <text x={padL} y={y - 4} fill="#444" fontSize="9" fontFamily="monospace">
                                        {val.toFixed(4)}
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    <path d={areaPath} fill="url(#spendAreaFill)" />

                    <path d={linePath} fill="none" stroke={accentAlpha(0.4)} strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round" filter="url(#spendGlow)" />

                    <path d={linePath} fill="none" stroke={ACCENT} strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round" />

                    {hoveredIdx !== null && (
                        <line
                            x1={points[hoveredIdx].x} y1={padT}
                            x2={points[hoveredIdx].x} y2={padT + chartH}
                            stroke="#444" strokeWidth="1" strokeDasharray="3 3"
                        />
                    )}

                    {points.map((pt, i) => {
                        const isHovered = hoveredIdx === i;
                        const tipW = 130;
                        const tipH = 22;
                        let tx = pt.x - tipW / 2;
                        if (tx < 2) tx = 2;
                        if (tx + tipW > W - 2) tx = W - tipW - 2;
                        const ty = pt.y - tipH - 12;

                        return (
                            <g key={i}>
                                <rect
                                    x={pt.x - 30} y={padT} width={60} height={chartH}
                                    fill="transparent"
                                    onMouseEnter={() => setHoveredIdx(i)}
                                    onMouseLeave={() => setHoveredIdx(null)}
                                    style={{ cursor: 'crosshair' }}
                                />

                                <circle
                                    cx={pt.x} cy={pt.y}
                                    r={isHovered ? 4 : 2.5}
                                    fill={isHovered ? ACCENT : accentAlpha(0.4)}
                                    stroke={isHovered ? accentAlpha(0.3) : 'none'}
                                    strokeWidth="6"
                                    style={{ transition: 'r 0.15s, fill 0.15s' }}
                                    pointerEvents="none"
                                />

                                {isHovered && (
                                    <g pointerEvents="none">
                                        <rect x={tx} y={ty} width={tipW} height={tipH}
                                            rx="4" fill="#1e1e1e" stroke="#333" strokeWidth="1" />
                                        <circle cx={tx + 10} cy={ty + 11} r="2.5" fill={ACCENT} />
                                        <text x={tx + 18} y={ty + 15}
                                            fill="#888" fontSize="9" fontFamily="monospace">
                                            {days[i]}
                                        </text>
                                        <text x={tx + 42} y={ty + 15}
                                            fill={ACCENT} fontSize="9" fontWeight="700" fontFamily="monospace">
                                            {spendData[i].toFixed(4)} SOL
                                        </text>
                                    </g>
                                )}

                                <text
                                    x={pt.x} y={padT + chartH + 18}
                                    textAnchor="middle"
                                    fill={isHovered ? '#888' : '#3a3a3a'}
                                    fontSize="9" fontFamily="monospace"
                                    style={{ transition: 'fill 0.15s' }}
                                >
                                    {days[i]}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};


const StatusDonut = ({ campaigns, accent }: { campaigns: Campaign[]; accent: string }) => {
    const active = campaigns.filter(c => c.status === 'Active').length;
    const paused = campaigns.filter(c => c.status === 'Paused').length;
    const total = campaigns.length;
    const r = 48, cx = 60, cy = 60;
    const circumference = 2 * Math.PI * r;
    const activeDash = total > 0 ? Math.max(0, (active / total) * circumference - 3) : 0;
    const pausedDash = total > 0 ? Math.max(0, (paused / total) * circumference - 3) : 0;

    return (
        <div className="relative flex items-center justify-center flex-shrink-0 w-32 h-32">
            <svg viewBox="0 0 120 120" className="w-32 h-32 -rotate-90">
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1a1a1a" strokeWidth="12" />
                {active > 0 && (
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke={accent} strokeWidth="12"
                        strokeDasharray={`${activeDash} ${circumference - activeDash}`}
                        strokeDashoffset={0} strokeLinecap="butt" />
                )}
                {paused > 0 && (
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="#3f3f46" strokeWidth="12"
                        strokeDasharray={`${pausedDash} ${circumference - pausedDash}`}
                        strokeDashoffset={-(active / total) * circumference}
                        strokeLinecap="butt" />
                )}
                <circle cx="60" cy="60" r="36" fill="#0a0a0a" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-gray-600 uppercase tracking-widest">Active</span>
                <span className="text-lg font-bold text-white leading-tight">{active}</span>
                <span className="text-[10px] text-gray-500">of {total}</span>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, sub, icon: Icon, accent }: {
    label: string; value: string; sub?: string; icon: React.ElementType; accent?: string;
}) => (
    <div className="bg-[#0d0d0d] border border-[#1c1c1c] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.5)] p-5 flex items-center gap-4">
        <div className="p-2.5 rounded-xl bg-[#161616] border border-[#222] flex-shrink-0">
            <Icon className="w-4 h-4 text-gray-400" />
        </div>
        <div className="min-w-0">
            <p className="text-xs text-gray-600 font-mono uppercase tracking-widest mb-0.5">{label}</p>
            <p className="text-xl font-bold tabular-nums font-mono leading-tight"
                style={{ color: accent ?? 'white' }}>
                {value}
            </p>
            {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
        </div>
    </div>
);

const Dashboard = () => {
    const activeTab = 'Dashboard';
    const router = useRouter();
    const { status } = useSession();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (status !== 'authenticated') return;
        const fetch = async () => {
            try {
                const res = await fetchDashboardData();
                setData(res);
            } catch {
                setError(true);
            } finally {
                setIsLoading(false);
            }
        };
        fetch();
    }, [status]);
    const accent = data?.accent ?? DEFAULT_ACCENT;
    const campaigns: Campaign[] = data?.campaigns ?? [];

    if (isLoading) {
        return (
            <div className="flex h-screen bg-[#0a0a0a] text-gray-200">
                <Sidebar activeTab={activeTab} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <main className="flex-1 p-6 overflow-auto">
                    <div className="animate-pulse space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                            {[0, 1, 2].map(i => <div key={i} className="h-24 bg-[#111] rounded-2xl border border-[#1a1a1a]" />)}
                        </div>
                        <div className="h-64 bg-[#111] rounded-2xl border border-[#1a1a1a]" />
                        <div className="flex gap-3">
                            <div className="h-56 flex-1 bg-[#111] rounded-2xl border border-[#1a1a1a]" />
                            <div className="h-56 flex-1 bg-[#111] rounded-2xl border border-[#1a1a1a]" />
                        </div>
                        <div className="h-56 bg-[#111] rounded-2xl border border-[#1a1a1a]" />
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen bg-[#0a0a0a] text-gray-200">
                <Sidebar activeTab={activeTab} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <main className="flex-1 p-6 overflow-auto">
                    <p className="text-red-500 text-sm font-mono">Error loading data. Please try again.</p>
                </main>
            </div>
        );
    }

    const activeCampaigns = data?.activeCampaigns ?? 0;
    const totalClicks = data?.totalClicks ?? 0;
    const totalSpend = data?.totalSpend ?? 0;
    const totalCampaignSpend = campaigns.reduce((a, c) => a + c.spend, 0);

    return (
        <div className="flex h-screen bg-[#0a0a0a] text-gray-200 font-sans">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <Sidebar activeTab={activeTab} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="flex-1 font-mono overflow-auto min-w-0">
                <div className="p-4 sm:p-6 space-y-3">

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden flex flex-col gap-1 p-1.5 rounded-md hover:bg-[#161616] transition-colors"
                            >
                                <span className="w-4 h-px bg-gray-400" />
                                <span className="w-4 h-px bg-gray-400" />
                                <span className="w-4 h-px bg-gray-400" />
                            </button>
                            <div>
                                <h1 className="text-sm font-semibold text-white">Dashboard</h1>
                                <p className="text-xs text-gray-600 mt-0.5">Campaign overview</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/Advertiser-campaign')}
                            className="flex cursor-pointer items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            style={{ background: accent, color: '#000000' }}
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">New Campaign</span>
                            <span className="sm:hidden">New</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <StatCard label="Active Campaigns" value={String(activeCampaigns)} icon={Target} />
                        <StatCard
                            label="Total Clicks"
                            value={totalClicks >= 1000 ? `${(totalClicks / 1000).toFixed(1)}K` : String(totalClicks)}
                            icon={MousePointerClick}
                        />
                        <StatCard
                            label="Total Spend"
                            value={totalSpend.toFixed(4)}
                            sub="SOL"
                            icon={DollarSign}
                            accent={accent}
                        />
                    </div>

                    <div className="bg-[#0d0d0d] border border-[#1c1c1c] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
                        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#1a1a1a]">
                            <div>
                                <h2 className="text-sm font-semibold font-mono text-white">Campaigns</h2>
                                <p className="text-xs text-gray-600 font-mono mt-0.5">Spend breakdown</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-600">{campaigns.length} campaigns</p>
                                <p className="text-sm font-semibold tabular-nums" style={{ color: accent }}>
                                    {totalCampaignSpend.toFixed(4)}{' '}
                                    <span className="text-xs text-gray-500 font-normal">SOL</span>
                                </p>
                            </div>
                        </div>

                        {campaigns.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <p className="text-sm text-gray-600 font-mono">No campaigns yet</p>
                                <p className="text-xs text-gray-700 mt-1">Create your first campaign to see data here</p>
                            </div>
                        ) : (
                            <div className="p-5">
                                <div className="flex flex-col lg:flex-row gap-6">
                                    <div className="flex-shrink-0 flex flex-col items-center">
                                        <StatusDonut campaigns={campaigns} accent={accent} />
                                        <div className="flex gap-6 mt-3">
                                            <div className="text-center">
                                                <p className="text-xs text-gray-600 mb-0.5">Active</p>
                                                <p className="text-base font-bold font-mono tabular-nums" style={{ color: accent }}>
                                                    {campaigns.filter(c => c.status === 'Active').length}
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-gray-600 mb-0.5">Paused</p>
                                                <p className="text-base font-bold font-mono tabular-nums text-zinc-500">
                                                    {campaigns.filter(c => c.status === 'Paused').length}
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-gray-600 mb-0.5">Total</p>
                                                <p className="text-base font-bold font-mono tabular-nums text-white">
                                                    {campaigns.length}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="space-y-3 overflow-y-auto w-full"
                                            style={{ maxHeight: '14rem', scrollbarWidth: 'thin', scrollbarColor: '#2a2a2a transparent' }}>
                                            {campaigns.map((c, idx) => {
                                                const sharePct = totalCampaignSpend > 0 ? (c.spend / totalCampaignSpend) * 100 : 0;
                                                const isActive = c.status === 'Active';
                                                return (
                                                    <div key={c.name} className="w-full">
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <div className="flex items-center gap-2 min-w-0 flex-1 mr-4">
                                                                <span className="text-xs text-gray-700 tabular-nums w-4 flex-shrink-0">{idx + 1}</span>
                                                                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                                    style={{ background: isActive ? accent : '#52525b' }} />
                                                                <span className="text-sm text-gray-200 font-medium truncate flex-1">{c.name}</span>
                                                                <span className="text-[10px] flex-shrink-0 px-1.5 py-0.5 rounded font-mono"
                                                                    style={{
                                                                        background: isActive ? `${accent}18` : '#27272a',
                                                                        color: isActive ? accent : '#71717a'
                                                                    }}>
                                                                    {c.status}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                                <span className="text-xs text-gray-600 tabular-nums hidden sm:inline">{c.clicks.toLocaleString()} clicks</span>
                                                                <span className="text-sm font-semibold tabular-nums font-mono w-24 text-right" style={{ color: accent }}>
                                                                    {c.spend.toFixed(4)}
                                                                    <span className="text-[10px] text-gray-600 font-normal ml-0.5">SOL</span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="h-1 w-full bg-[#1a1a1a] rounded-full overflow-hidden">
                                                            <div className="h-full rounded-full transition-all duration-700"
                                                                style={{
                                                                    width: `${sharePct}%`,
                                                                    background: isActive ? accent : '#3f3f46',
                                                                    opacity: 0.7,
                                                                }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-[#1a1a1a] mt-4" />
                            </div>
                        )}
                    </div>

                    {campaigns.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <BarChart
                                campaigns={campaigns}
                                metric="clicks"
                                label="Clicks"
                                color="#EDEDED"
                                overrideTotal={totalClicks}
                                formatValue={v => v >= 1000 ? `${(v / 1000).toFixed(1)}K clicks` : `${v} clicks`}
                            />
                            <BarChart
                                campaigns={campaigns}
                                metric="spend"
                                label="Spend"
                                color={accent}
                                overrideTotal={totalSpend}
                                formatValue={v => `${Number(v).toFixed(4)} SOL`}
                            />
                        </div>
                    )}
                    <LineChart color={accent} dailySpend={data?.dailySpend ?? []} />

                    <div className="bg-[#0d0d0d] border border-[#1c1c1c] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                        <div className="px-5 py-4 border-b border-[#1a1a1a] flex items-center justify-between">
                            <div>

                                <h2 className="text-sm font-semibold text-white">All Campaigns</h2>
                                <p className="text-xs text-gray-600 mt-0.5">Detailed stats</p>
                            </div>
                            <button onClick={() => router.push('/campaigns')}
                                className="text-xs cursor-pointer text-gray-500 hover:text-gray-300 transition-colors">
                                View all →
                            </button>
                        </div>

                        {campaigns.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <p className="text-sm text-gray-600 font-mono">No campaigns yet</p>
                                <p className="text-xs text-gray-700 mt-1">Click "New Campaign" to get started</p>
                            </div>
                        ) : (
                            <>
                                <div className="hidden sm:block overflow-y-auto"
                                    style={{ maxHeight: '16rem', scrollbarWidth: 'thin', scrollbarColor: '#2a2a2a transparent' }}>
                                    <table className="w-full">
                                        <thead className="sticky top-0 bg-[#0d0d0d] z-10">
                                            <tr className="text-xs text-gray-600 border-b border-[#1a1a1a] uppercase tracking-widest">
                                                <th className="text-left px-5 py-2.5 font-medium">#</th>
                                                <th className="text-left px-5 py-2.5 font-medium">Campaign</th>
                                                <th className="text-right px-5 py-2.5 font-medium">Clicks</th>
                                                <th className="text-right px-5 py-2.5 font-medium">CPC</th>
                                                <th className="text-right px-5 py-2.5 font-medium">Performance</th>
                                                <th className="text-right px-5 py-2.5 font-medium">Spend</th>
                                                <th className="text-right px-5 py-2.5 font-medium">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {campaigns.map((c, idx) => (
                                                <tr key={c.name}
                                                    onClick={() => router.push('/Advertiser/Campaigns')}
                                                    className="border-t border-[#141414] hover:bg-[#111] transition-colors cursor-pointer">
                                                    <td className="px-5 py-3.5 text-xs text-gray-700 tabular-nums">{idx + 1}</td>
                                                    <td className="px-5 py-3.5 text-sm font-medium text-gray-200 max-w-[160px] truncate">{c.name}</td>
                                                    <td className="px-5 py-3.5 text-right text-sm text-gray-400 tabular-nums">
                                                        {c.clicks >= 1000 ? `${(c.clicks / 1000).toFixed(1)}K` : c.clicks}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right text-sm text-gray-400 tabular-nums font-mono">{c.cpc}</td>
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <div className="w-16 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                                                                <div className="h-full rounded-full"
                                                                    style={{ width: `${c.performance}%`, background: accent, opacity: 0.65 }} />
                                                            </div>
                                                            <span className="text-xs text-gray-500 tabular-nums w-7 text-right">{c.performance}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right text-sm font-semibold tabular-nums" style={{ color: accent }}>
                                                        {c.spend.toFixed(4)}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right">
                                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold"
                                                            style={{ color: c.status === 'Active' ? accent : '#71717a' }}>
                                                            <span className="w-1.5 h-1.5 rounded-full"
                                                                style={{ background: c.status === 'Active' ? accent : '#52525b' }} />
                                                            {c.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="sm:hidden divide-y divide-[#141414] overflow-y-auto"
                                    style={{ maxHeight: '20rem', scrollbarWidth: 'thin', scrollbarColor: '#2a2a2a transparent' }}>
                                    {campaigns.map((c, idx) => (
                                        <div key={c.name}
                                            onClick={() => router.push('/Advertiser/Campaigns')}
                                            className="px-4 py-3.5 hover:bg-[#111] transition-colors cursor-pointer">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-xs text-gray-700 tabular-nums w-4 flex-shrink-0">{idx + 1}</span>
                                                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                        style={{ background: c.status === 'Active' ? accent : '#52525b' }} />
                                                    <span className="text-sm font-medium text-gray-200 truncate">{c.name}</span>
                                                </div>
                                                <span className="text-xs font-semibold flex-shrink-0 ml-2"
                                                    style={{ color: c.status === 'Active' ? accent : '#71717a' }}>
                                                    {c.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full"
                                                        style={{ width: `${c.performance}%`, background: accent, opacity: 0.65 }} />
                                                </div>
                                                <span className="text-xs text-gray-600 tabular-nums flex-shrink-0">{c.performance}%</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-gray-600">
                                                        {c.clicks >= 1000 ? `${(c.clicks / 1000).toFixed(1)}K` : c.clicks} clicks
                                                    </span>
                                                    <span className="text-xs text-gray-600">CPC {c.cpc}</span>
                                                </div>
                                                <span className="text-sm font-semibold tabular-nums" style={{ color: accent }}>
                                                    {c.spend.toFixed(4)} <span className="text-[10px] text-gray-600 font-normal">SOL</span>
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
};

export default Dashboard;