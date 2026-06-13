'use client'

import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { ArrowRight, Zap, Shield, Droplets, CornerDownLeft, Sparkles, TrendingUp, MousePointer } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
const STEPS = [
    { num: '01', phase: 'SETUP', title: 'Create campaign', desc: 'Target, budget in SOL, creative. Three fields.' },
    { num: '02', phase: 'LIVE', title: 'Serve & track', desc: 'Ads hit network. Every click hits the ledger.' },
    { num: '03', phase: 'SETTLE', title: 'Pay for results', desc: 'SOL moves per verified click. No click, no spend.' },
    { num: '04', phase: 'OPTIMIZE', title: 'Iterate & scale', desc: 'Real data. Real decisions. Real ROI.' },
];

const FEATURES = [
    { icon: Shield, title: 'Verified', desc: 'Every click on Solana. Go ahead, audit it.', color: '#3b82f6' },
    { icon: Zap, title: 'Real-time', desc: 'Dashboards update live. No waiting for reports.', color: '#eab308' },
    { icon: Droplets, title: 'SOL native', desc: 'No wrapped tokens. No bridges. Just Solana.', color: '#14b8a6' },
];

const FLOATING_ICONS = [TrendingUp, MousePointer, Zap, Sparkles];

export default function GetStarted() {
    const router = useRouter();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [clickCount, setClickCount] = useState(0);
    const [particles, setParticles] = useState([]);

    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === 'loading') return;
        if (session?.user) {
            const role = (session.user as any).role;
            if (!role) {
                window.location.href = '/Role';
            } else if (role === 'advertiser') {
                window.location.href = '/Advertiser/Dashboard';
            } else if (role === 'publisher') {
                window.location.href = '/Publisher/Dashboard';
            }
        }
    }, [session, status]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleParticleClick = (e) => {
        const newParticle = {
            id: Date.now(),
            x: e.clientX,
            y: e.clientY,
        };
        setParticles(prev => [...prev, newParticle]);
        setTimeout(() => {
            setParticles(prev => prev.filter(p => p.id !== newParticle.id));
        }, 1000);
        setClickCount(prev => prev + 1);
    };

    return (
        <div className="min-h-screen bg-black text-white font-mono overflow-x-hidden relative" onClick={handleParticleClick}>

            {/* Floating particles */}
            {particles.map(particle => (
                <div
                    key={particle.id}
                    className="fixed pointer-events-none animate-float-particle"
                    style={{
                        left: particle.x,
                        top: particle.y,
                        position: 'fixed',
                    }}
                >
                    <MousePointer className="w-4 h-4 text-green-500" />
                </div>
            ))}

            <div
                className="fixed pointer-events-none w-96 h-96 rounded-full blur-[100px] opacity-20"
                style={{
                    background: 'radial-gradient(circle, #3b82f6, #14b8a6, #eab308)',
                    left: mousePosition.x - 192,
                    top: mousePosition.y - 192,
                }}
            />

            <div className="fixed inset-0 pointer-events-none opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
                    backgroundSize: '50px 50px',
                    animation: 'scrollGrid 20s linear infinite',
                }} />
            </div>


            <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-black/50 backdrop-blur-sm sticky top-0">
                <div
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 cursor-pointer group"
                >
                    <Image src="/icon.png" alt="Clickora" width={28} height={28} className="rounded-sm group-hover:rotate-12 transition-transform" />
                    <span className="text-lg font-bold tracking-tighter group-hover:text-zinc-300 transition">clickora</span>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => signIn('google')}
                        className="text-sm cursor-pointer  text-zinc-500 hover:text-zinc-300 transition relative group"
                    >
                        sign in
                        <span className="absolute -bottom-1 left-0 w-0 h-px bg-zinc-500 group-hover:w-full transition-all" />
                    </button>
                    <button
                        onClick={() => signIn('google')}
                        className="text-sm cursor-pointer px-4 py-1.5 bg-white text-black font-medium hover:bg-zinc-200 transition transform hover:scale-105 active:scale-95"
                    >
                        launch →
                    </button>
                </div>
            </header>

            <main className="relative z-10">

                <section className="px-4 sm:px-6 py-16 sm:py-24 border-b border-zinc-900">
                    <div className="max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 text-xs text-zinc-600 mb-6 sm:mb-8 animate-pulse">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                            SOLANA · ON-CHAIN ADS
                            <Sparkles className="w-3 h-3 ml-1 animate-spin-slow" />
                        </div>
                        <h1 className="text-4xl sm:text-7xl font-bold tracking-tighter leading-[1.1] mb-5">
                            pay for<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-teal-500 to-yellow-500 animate-gradient">
                                real clicks.
                            </span>
                        </h1>
                        <p className="text-sm sm:text-base text-zinc-500 max-w-md mb-8 leading-relaxed animate-fade-in">
                            Campaigns settle in SOL. Every click verified. Zero bullshit.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => signIn('google')}
                                className="flex cursor-pointer items-center justify-center gap-2 px-6 py-3 bg-white text-black text-sm font-medium hover:bg-zinc-200 transition transform hover:scale-105 active:scale-95 group w-full sm:w-auto"
                            >
                                start campaign
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
                                className="px-6 py-3 border border-zinc-800 text-sm text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition relative overflow-hidden group w-full sm:w-auto text-center"
                            >
                                <span className="relative z-10">how it works</span>
                                <span className="absolute cursor-pointer inset-0 bg-zinc-800 translate-x-[-100%] group-hover:translate-x-0 transition-transform" />
                            </button>
                        </div>
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 hidden xl:block">
                            {FLOATING_ICONS.map((Icon, i) => (
                                <div
                                    key={i}
                                    className="absolute animate-float"
                                    style={{
                                        animationDelay: `${i * 1}s`,
                                        left: `${-60 - i * 20}px`,
                                    }}
                                >
                                    <Icon className="w-6 h-6 text-zinc-700 opacity-50" />
                                </div>
                            ))}
                        </div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden xl:block">
                            {FLOATING_ICONS.map((Icon, i) => (
                                <div
                                    key={i}
                                    className="absolute animate-float-delayed"
                                    style={{
                                        animationDelay: `${i * 1.2}s`,
                                        right: `${-60 - i * 20}px`,
                                    }}
                                >
                                    <Icon className="w-6 h-6 text-zinc-700 opacity-50" />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="features" className="px-4 sm:px-6 py-16 sm:py-24 border-b border-zinc-900">
                    <div className="max-w-4xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                            {FEATURES.map(({ icon: Icon, title, desc, color }, idx) => (
                                <div
                                    key={title}
                                    className="border-l border-zinc-800 pl-5 hover:border-l-4 transition-all group cursor-pointer transform hover:-translate-y-1"
                                    style={{ '--hover-color': color }}
                                >
                                    <div className="relative">
                                        <Icon className="w-5 h-5 text-zinc-600 mb-4 group-hover:scale-110 transition-transform" style={{ color: `var(--hover-color)` }} />
                                        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition">
                                            <Sparkles className="w-3 h-3 text-yellow-500" />
                                        </div>
                                    </div>
                                    <h3 className="text-base font-bold uppercase tracking-wide mb-2 group-hover:text-white transition">{title}</h3>
                                    <p className="text-sm text-zinc-500 leading-relaxed group-hover:text-zinc-400 transition">{desc}</p>
                                    <div className="w-0 h-px bg-current mt-3 group-hover:w-full transition-all duration-300" style={{ color }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="how" className="px-4 sm:px-6 py-16 sm:py-24 border-b border-zinc-900">
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-8 sm:mb-12">
                            <p className="text-xs text-zinc-600 mb-2 flex items-center gap-2">
                                <Zap className="w-3 h-3 animate-pulse" />
                                THE CYCLE
                            </p>
                            <h2 className="text-3xl font-bold tracking-tighter">from launch<br />to settlement</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                            {STEPS.map((step, i) => (
                                <div key={step.num} className="flex gap-5 group cursor-pointer">
                                    <div className="flex-shrink-0 relative">
                                        <div className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center group-hover:border-zinc-600 transition-all group-hover:scale-110 group-hover:shadow-lg">
                                            <span className="text-xs text-zinc-500 group-hover:text-white transition">{step.num}</span>
                                        </div>
                                        {i < STEPS.length - 1 && (
                                            <div className="w-px h-8 bg-zinc-800 mx-auto mt-2 hidden md:block group-hover:bg-zinc-600 transition" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1 group-hover:text-zinc-400 transition flex items-center gap-1">
                                            {step.phase}
                                            <ArrowRight className="w-2 h-2 opacity-0 group-hover:opacity-100 transition" />
                                        </div>
                                        <div className="text-base font-bold mb-1 group-hover:text-white transition">{step.title}</div>
                                        <div className="text-sm text-zinc-500 group-hover:text-zinc-400 transition">{step.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="px-4 sm:px-6 py-20 sm:py-32 relative overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-blue-500/10 to-teal-500/10 rounded-full blur-3xl animate-pulse" />
                    </div>
                    <div className="max-w-2xl mx-auto text-center relative">
                        <div className="inline-block animate-bounce mb-6">
                            <CornerDownLeft className="w-6 h-6 text-zinc-700" />
                        </div>
                        <h2 className="text-4xl font-bold tracking-tighter mb-4 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                            stop wasting budget.
                        </h2>
                        <p className="text-zinc-500 mb-8 max-w-sm mx-auto">
                            Connect wallet. Set budget. Go live in minutes.
                        </p>
                        <button
                            onClick={() => signIn('google')}
                            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-black text-sm font-medium hover:bg-zinc-200 transition transform hover:scale-105 active:scale-95 group relative overflow-hidden"
                        >
                            <span className="relative z-10">launch campaign</span>
                            <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                            <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-teal-500 translate-x-[-100%] group-hover:translate-x-0 transition-transform" />
                        </button>

                        {/* Fun mouse trail effect for this button */}
                        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-[10px] text-zinc-800 whitespace-nowrap animate-pulse">
                            ⚡ click anywhere for particle effect ⚡
                        </div>
                    </div>
                </section>

            </main>

            <footer className="relative z-10 border-t border-zinc-900 px-4 sm:px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-zinc-700 text-center">
                <span className="hover:text-zinc-500 transition">clickora © 2025</span>
                <div className="flex gap-6">
                    {['privacy', 'terms', 'docs', 'github'].map(item => (
                        <span
                            key={item}
                            className="hover:text-zinc-400 cursor-pointer transition relative group"
                        >
                            {item}
                            <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-zinc-500 group-hover:w-full transition-all" />
                        </span>
                    ))}
                </div>
            </footer>

            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
                @keyframes float-delayed {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(20px); }
                }
                @keyframes scrollGrid {
                    0% { transform: translate(0, 0); }
                    100% { transform: translate(50px, 50px); }
                }
                @keyframes gradient {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes floatParticle {
                    0% { opacity: 1; transform: scale(1) translateY(0); }
                    100% { opacity: 0; transform: scale(0) translateY(-50px); }
                }
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
                .animate-float-delayed {
                    animation: float-delayed 3.5s ease-in-out infinite;
                }
                .animate-gradient {
                    background-size: 200% auto;
                    animation: gradient 3s linear infinite;
                }
                .animate-fade-in {
                    animation: fadeIn 0.8s ease-out;
                }
                .animate-float-particle {
                    animation: floatParticle 1s ease-out forwards;
                }
                .animate-spin-slow {
                    animation: spin 3s linear infinite;
                }
            `}</style>
        </div>
    );
}