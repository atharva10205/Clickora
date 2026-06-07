"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Target, TrendingUp } from 'lucide-react';

export default function RoleSelection() {
    const router = useRouter();
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const roles = [
        {
            id: "advertiser",
            title: "Advertiser",
            description: "Create ads, set budgets, and track performance with real-time analytics.",
            icon: Target,
            tag: "LAUNCH ADS",
        },
        {
            id: "publisher",
            title: "Publisher",
            description: "Show ads on your website and earn revenue from genuine engagement.",
            icon: TrendingUp,
            tag: "EARN REVENUE",
        },
    ];

    const handleRoleSelect = async (role: string) => {
        setLoading(true);
        const res = await fetch("/api/crud/role_update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role }),
        });

        if (!res.ok) {
            setLoading(false);
            return;
        }

        router.push(role === "advertiser" ? "/Advertiser/Dashboard" : "/Publisher/Dashboard");
    };

    return (
        <>
            {/* ── Loading overlay ── */}
            {loading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]">
                    <div className="flex flex-col items-center gap-4 bg-[#0d0d0d] border border-[#1c1c1c] rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
                        <div className="w-10 h-10 border-2 border-[#1e1e1e] border-t-white rounded-full animate-spin" />
                        <p className="text-xs text-[#555] font-mono uppercase tracking-widest">
                            Setting up account…
                        </p>
                    </div>
                </div>
            )}

            <div className="min-h-screen bg-[#0a0a0a] text-gray-200 font-mono flex flex-col">

                {/* ── Header ── */}
                <header className="flex items-center justify-between px-8 py-5 border-b border-[#1c1c1c]">
                    <span className="text-base font-bold text-white tracking-wider">AdFlow</span>
                    <span className="text-[10px] text-[#2a2a2a] uppercase tracking-widest">Role setup</span>
                </header>

                {/* ── Main ── */}
                <main className="flex-1 flex items-center justify-center px-6 py-16">
                    <div className="w-full max-w-xl">

                        {/* Heading */}
                        <div className="mb-10">
                            <div className="inline-flex items-center gap-2 bg-[#111] border border-[#1e1e1e] text-[#444] text-[10px] px-3 py-1.5 rounded-full mb-6 uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
                                Step 1 of 1
                            </div>
                            <h1 className="text-3xl font-bold text-white leading-tight mb-3">
                                Choose your role.
                            </h1>
                            <p className="text-xs text-[#3a3a3a] leading-relaxed">
                                Select how you want to use the platform. You can switch roles later in account settings.
                            </p>
                        </div>

                        {/* Role cards */}
                        <div className="space-y-3">
                            {roles.map((role) => {
                                const Icon = role.icon;
                                const isHovered = hoveredCard === role.id;

                                return (
                                    <button
                                        key={role.id}
                                        onClick={() => handleRoleSelect(role.id)}
                                        onMouseEnter={() => setHoveredCard(role.id)}
                                        onMouseLeave={() => setHoveredCard(null)}
                                        className="w-full text-left cursor-pointer focus:outline-none group"
                                    >
                                        <div
                                            className="relative bg-[#0d0d0d] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-all duration-200"
                                            style={{
                                                border: isHovered ? '1px solid #2e2e2e' : '1px solid #1c1c1c',
                                            }}
                                        >
                                            {/* Active indicator bar */}
                                            <div
                                                className="absolute left-0 top-4 bottom-4 w-px rounded-full transition-all duration-200"
                                                style={{ background: isHovered ? '#fff' : '#1a1a1a' }}
                                            />

                                            <div className="flex items-start gap-5 px-6 py-6">
                                                {/* Icon */}
                                                <div
                                                    className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border transition-all duration-200"
                                                    style={{
                                                        background: isHovered ? '#161616' : '#111',
                                                        borderColor: isHovered ? '#333' : '#1e1e1e',
                                                    }}
                                                >
                                                    <Icon className="w-4 h-4 text-[#666]" />
                                                </div>

                                                {/* Text */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-sm font-semibold text-white">
                                                            {role.title}
                                                        </span>
                                                        <span
                                                            className="text-[9px] uppercase tracking-widest transition-colors duration-200"
                                                            style={{ color: isHovered ? '#555' : '#222' }}
                                                        >
                                                            {role.tag}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-[#333] leading-relaxed">
                                                        {role.description}
                                                    </p>
                                                </div>

                                                {/* Arrow */}
                                                <div
                                                    className="flex-shrink-0 self-center transition-all duration-200"
                                                    style={{
                                                        opacity: isHovered ? 1 : 0,
                                                        transform: isHovered ? 'translateX(0)' : 'translateX(-4px)',
                                                    }}
                                                >
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                    </svg>
                                                </div>
                                            </div>

                                            {/* Bottom progress bar */}
                                            <div className="absolute bottom-0 left-0 right-0 h-px overflow-hidden rounded-b-2xl">
                                                <div
                                                    className="h-full bg-white transition-all duration-300 origin-left"
                                                    style={{ transform: isHovered ? 'scaleX(1)' : 'scaleX(0)' }}
                                                />
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Footer note */}
                        <p className="text-center text-[10px] text-[#2a2a2a] mt-8 uppercase tracking-widest">
                            You can switch roles later in account settings
                        </p>
                    </div>
                </main>

                {/* ── Footer ── */}
                <footer className="border-t border-[#141414] px-8 py-5 flex items-center justify-between">
                    <span className="text-[10px] text-[#2a2a2a]">© 2025 AdFlow · Built on Solana</span>
                    <div className="flex gap-5">
                        {['Privacy', 'Terms', 'Docs'].map(l => (
                            <span key={l} className="text-[10px] text-[#2a2a2a] hover:text-[#555] cursor-pointer transition-colors">{l}</span>
                        ))}
                    </div>
                </footer>

            </div>
        </>
    );
}