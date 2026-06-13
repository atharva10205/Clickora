'use client'

import { User, RefreshCw, Target, TrendingUp, Palette, Check, Trash2, X, AlertTriangle } from 'lucide-react';
import Sidebar from '../Sidebar/Sidebar';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';


const alpha = (op: number) => `rgba(255,255,255,${op})`;
const PALETTE = [
    '#FFFFFF', '#5B9BD5', '#E07B54', '#9B59B6', '#27AE60', '#E74C3C',
    '#F39C12', '#16A085', '#2C3E50', '#C0392B', '#8E44AD', '#1ABC9C',
    '#3498DB', '#2ECC71', '#E67E22', '#34495E', '#FFD166', '#06D6A0',
    '#118AB2', '#EF476F', '#8338EC', '#FF9F1C'
];

const Settings = () => {
    const activeTab = 'Settings';
    const [isSwitching, setIsSwitching] = useState(false);
    const [userName, setUserName] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [accent, setAccent] = useState('#FFFFFF');
    const [savingAccent, setSavingAccent] = useState(false);
    const [accentSaved, setAccentSaved] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteEmailInput, setDeleteEmailInput] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const ACCENT = accent;

    const hAlpha = (op: number) => {
        const r = parseInt(ACCENT.slice(1, 3), 16);
        const g = parseInt(ACCENT.slice(3, 5), 16);
        const b = parseInt(ACCENT.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${op})`;
    };

    const session = useSession();
    const sessionRole = (session?.data?.user as { role?: string })?.role as 'advertiser' | 'publisher' | undefined;
    const [currentRole, setCurrentRole] = useState<'advertiser' | 'publisher'>(sessionRole ?? 'advertiser');

    useEffect(() => {
        if (sessionRole) setCurrentRole(sessionRole);
    }, [sessionRole]);

    useEffect(() => {
        const get_user_data = async () => {
            const res = await fetch("/api/crud/Advertiser/Settings");
            const data = await res.json();
            if (data?.res) {
                setUserName(data.res.name ?? "");
                setUserEmail(data.res.email ?? "");
                setAccent(data.res.accent ?? '#FFFFFF');
            }
        };
        get_user_data();
    }, []);

    const handleSaveProfile = async () => {
        const res = await fetch("/api/crud/Advertiser/Settings", {
            method: "POST",
            body: JSON.stringify({ name: userName, email: userEmail }),
        });
        const data = await res.json();
    };

    const handleRoleSwitch = async (newRole: 'advertiser' | 'publisher') => {
        if (newRole === currentRole) return;
        setIsSwitching(true);
        try {
            const res = await fetch("/api/crud/role_update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole }),
            });
            if (res.ok) {
                await fetch('/api/auth/session', { method: 'GET' });
                window.location.href = newRole === 'advertiser' ? '/Advertiser/Dashboard' : '/Publisher/Dashboard';
            }
        } catch (error) {
            console.error('Failed to switch role:', error);
        } finally {
            setIsSwitching(false);
        }
    };

    const handleSaveAccent = async (color: string) => {
        setSavingAccent(true);
        setAccent(color);
        try {
            await fetch("/api/crud/Advertiser/Settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accent: color }),
            });
            setAccentSaved(true);
            setTimeout(() => setAccentSaved(false), 2000);
        } catch (err) {
            console.error("Failed to save accent", err);
        } finally {
            setSavingAccent(false);
        }
    };

    const handleDeleteAccount = async () => {
        console.log("delete account");
    };

    const SaveBtn = ({ onClick, label }: { onClick: () => void; label: string }) => (
        <button
            onClick={onClick}
            className="px-6 py-2.5 rounded-xl font-mono cursor-pointer bg-[#161616] text-gray-200 text-sm font-semibold hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            style={{ border: `1px solid ${alpha(0.18)}` }}
            onMouseEnter={e => {
                e.currentTarget.style.borderColor = ACCENT;
                e.currentTarget.style.boxShadow = `0 0 18px ${hAlpha(0.2)}`;
                e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.borderColor = alpha(0.18);
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.color = '';
            }}
        >
            {label}
        </button>
    );

    const emailMatches = deleteEmailInput.trim().toLowerCase() === userEmail.trim().toLowerCase();

    return (
        <div className="flex h-screen bg-[#0a0a0a] text-gray-300">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <Sidebar activeTab={activeTab} SidebarAccent={accent} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
                <div className="max-w-6xl">

                    <div className="mb-8 sm:mb-10 flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden flex flex-col gap-1 p-1.5 rounded-md hover:bg-[#161616] transition-colors flex-shrink-0"
                        >
                            <span className="w-4 h-px bg-gray-400" />
                            <span className="w-4 h-px bg-gray-400" />
                            <span className="w-4 h-px bg-gray-400" />
                        </button>
                        <div>
                            <h1 className="text-lg sm:text-3xl font-bold mb-0.5 font-mono text-white tracking-tight">Settings</h1>
                            <p className="text-gray-600 font-mono text-xs sm:text-sm hidden sm:block">Manage your advertiser account</p>
                        </div>
                    </div>

                    <div className="grid gap-5">

                        {/* ── Account Role ── */}
                        <div className="bg-[#111111] border border-gray-800/70 rounded-xl overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-800/60 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-[#161616] border border-gray-800/60">
                                    <RefreshCw className="w-4 h-4 text-gray-400" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold text-gray-200 font-mono uppercase tracking-widest">Account Role</h2>
                                    <p className="text-xs text-gray-600 font-mono mt-0.5">Switch between Advertiser and Publisher</p>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleRoleSwitch('advertiser')}
                                        disabled={isSwitching}
                                        className="relative p-4 sm:p-6 rounded-xl font-mono text-left transition-all duration-200 hover:-translate-y-0.5" style={{
                                            background: '#0d0d0d',
                                            border: `1px solid ${currentRole === 'advertiser' ? ACCENT : alpha(0.15)}`,
                                            boxShadow: currentRole === 'advertiser' ? `0 0 24px ${hAlpha(0.12)}` : 'none',
                                            opacity: isSwitching ? 0.5 : 1,
                                            cursor: isSwitching ? 'not-allowed' : 'pointer',
                                        }}
                                        onMouseEnter={e => { if (currentRole !== 'advertiser') (e.currentTarget as HTMLElement).style.borderColor = alpha(0.2); }}
                                        onMouseLeave={e => { if (currentRole !== 'advertiser') (e.currentTarget as HTMLElement).style.borderColor = alpha(0.08); }}
                                    >
                                        {currentRole === 'advertiser' && (
                                            <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                                                <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-3">
                                            <div className="p-2.5 rounded-lg bg-[#161616] border border-gray-800/60 w-fit">
                                                <Target className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold text-white mb-1">Advertiser</h3>
                                                <p className="text-xs text-gray-600 hidden sm:block">Create ads, set budgets, and track campaign performance</p>
                                            </div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => handleRoleSwitch('publisher')}
                                        disabled={isSwitching}
                                        className="relative p-4 sm:p-6 rounded-xl text-left font-mono transition-all duration-200 hover:-translate-y-0.5" style={{
                                            background: '#0d0d0d',
                                            border: `1px solid ${currentRole === 'publisher' ? ACCENT : alpha(0.15)}`,
                                            boxShadow: currentRole === 'publisher' ? `0 0 24px ${hAlpha(0.12)}` : 'none',
                                            opacity: isSwitching ? 0.5 : 1,
                                            cursor: isSwitching ? 'not-allowed' : 'pointer',
                                        }}
                                        onMouseEnter={e => { if (currentRole !== 'publisher') (e.currentTarget as HTMLElement).style.borderColor = alpha(0.2); }}
                                        onMouseLeave={e => { if (currentRole !== 'publisher') (e.currentTarget as HTMLElement).style.borderColor = alpha(0.08); }}
                                    >
                                        {currentRole === 'publisher' && (
                                            <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                                                <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-3">
                                            <div className="p-2.5 rounded-lg bg-[#161616] border border-gray-800/60 w-fit">
                                                <TrendingUp className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold text-white mb-1">Publisher</h3>
                                                <p className="text-xs text-gray-600 hidden sm:block">Display ads on your site and earn revenue from clicks</p>
                                            </div>
                                        </div>
                                    </button>
                                </div>

                                {isSwitching && (
                                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-600">
                                        <div className="w-3.5 h-3.5 border border-gray-700 border-t-gray-300 rounded-full animate-spin" />
                                        Switching role…
                                    </div>
                                )}

                                <div className="mt-4 p-4 bg-[#0d0d0d] border border-gray-800/50 rounded-lg">
                                    <p className="text-xs text-gray-600">
                                        <span className="text-gray-400 font-medium">Note:</span> Switching roles will redirect you to the appropriate dashboard. Your data will be preserved.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ── Profile Settings ── */}
                        <div className="bg-[#111111] border border-gray-800/70 rounded-xl overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-800/60 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-[#161616] border border-gray-800/60">
                                    <User className="w-4 h-4 text-gray-400" />
                                </div>
                                <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-widest">Profile Settings</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-xs text-gray-600 uppercase tracking-widest mb-2 block">Advertiser Name</label>
                                    <input
                                        type="text"
                                        value={userName}
                                        onChange={(e) => setUserName(e.target.value)}
                                        className="w-full bg-[#0d0d0d] border border-gray-800/60 rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-700 font-mono focus:outline-none transition-colors duration-150"
                                        onFocus={e => e.currentTarget.style.borderColor = ACCENT}
                                        onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600 uppercase tracking-widest mb-2 block">Email Address</label>
                                    <input
                                        type="email"
                                        value={userEmail}
                                        onChange={(e) => setUserEmail(e.target.value)}
                                        className="w-full bg-[#0d0d0d] border border-gray-800/60 rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-700 font-mono focus:outline-none transition-colors duration-150"
                                        onFocus={e => e.currentTarget.style.borderColor = ACCENT}
                                        onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                                    />
                                </div>
                                <SaveBtn onClick={handleSaveProfile} label="Save Changes" />
                            </div>
                        </div>

                        <div className="bg-[#111111] border border-gray-800/70 rounded-xl overflow-hidden">
                            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-800/60 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-2 rounded-lg bg-[#161616] border border-gray-800/60">
                                        <Palette className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-semibold text-gray-200 font-mono uppercase tracking-widest">Accent Colour</h2>
                                        <p className="text-xs text-gray-600 font-mono mt-0.5">Choose your dashboard highlight colour</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {accentSaved && (
                                        <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                                            <Check className="w-3 h-3" />
                                            <span className="hidden sm:inline">Saved</span>
                                        </span>
                                    )}
                                    <div className="w-5 h-5 rounded border border-gray-700 flex-shrink-0" style={{ background: ACCENT }} />
                                    <span className="text-xs text-gray-500 font-mono hidden sm:inline">{ACCENT}</span>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex flex-wrap gap-3">
                                    {PALETTE.map((color) => {
                                        const isSelected = ACCENT.toLowerCase() === color.toLowerCase();
                                        return (
                                            <button
                                                key={color}
                                                onClick={() => handleSaveAccent(color)}
                                                disabled={savingAccent}
                                                className="flex flex-col items-center gap-1 group"
                                                title={color}
                                            >
                                                <div
                                                    className="w-9 h-9 rounded-md relative transition-all duration-150"
                                                    style={{
                                                        background: color,
                                                        outline: isSelected ? `2px solid ${color}` : '2px solid transparent',
                                                        outlineOffset: '3px',
                                                        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                                                        boxShadow: isSelected ? `0 0 14px ${color}55` : 'none',
                                                    }}
                                                >
                                                    {isSelected && (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-[9px] text-gray-700 font-mono group-hover:text-gray-400 transition-colors">
                                                    {color}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#111111] border border-gray-800/70 rounded-xl overflow-hidden">
                            <div className="p-4 sm:p-6 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-sm text-gray-300 font-medium">Sign Out</p>
                                    <p className="text-xs text-gray-600 mt-0.5 hidden sm:block">Sign out of your account on this device</p>
                                </div>
                                <button
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                    className="flex-shrink-0 flex cursor-pointer items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg bg-[#161616] border border-gray-800/60 text-gray-300 text-sm font-semibold hover:border-gray-600 hover:text-white transition-all duration-150 whitespace-nowrap"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Sign Out
                                </button>
                            </div>
                        </div>


                        <div className="bg-[#111111] border border-red-900/30 rounded-xl overflow-hidden">
                            <div className="px-6 py-5 border-b border-red-900/20 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-red-950/40 border border-red-900/30">
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold text-red-400 uppercase tracking-widest">Danger Zone</h2>
                                    <p className="text-xs text-gray-600 mt-0.5">Irreversible actions — proceed with caution</p>
                                </div>
                            </div>
                            <div className="p-4 sm:p-6 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-sm text-gray-300 font-medium">Delete Account</p>
                                    <p className="text-xs text-gray-600 mt-0.5 hidden sm:block">Permanently delete your account and all associated data</p>
                                </div>
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="flex-shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg bg-red-950/40 border border-red-900/40 text-red-400 text-sm font-semibold hover:bg-red-950/70 hover:border-red-800/60 transition-all duration-150 whitespace-nowrap"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="hidden sm:inline">Delete Account</span>
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            {/* ── Delete Confirmation Modal ── */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() => { setShowDeleteModal(false); setDeleteEmailInput(""); }}
                    />
                    <div className="relative z-10 bg-[#111111] border border-red-900/40 rounded-xl w-full max-w-md mx-4 p-6 shadow-2xl">
                        <button
                            onClick={() => { setShowDeleteModal(false); setDeleteEmailInput(""); }}
                            className="absolute top-4 right-4 text-gray-600 hover:text-gray-300 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="w-10 h-10 rounded-full bg-red-950/50 border border-red-900/40 flex items-center justify-center mb-4">
                            <Trash2 className="w-5 h-5 text-red-500" />
                        </div>

                        <h3 className="text-base font-semibold text-white mb-1">Delete Account</h3>
                        <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                            This action is <span className="text-red-400 font-medium">permanent and irreversible</span>. All your ads, campaigns, wallet data and settings will be deleted.
                        </p>

                        <div className="p-3 bg-[#0d0d0d] border border-gray-800/50 rounded-lg mb-4">
                            <p className="text-xs text-gray-600 mb-1">Account to be deleted</p>
                            <p className="text-sm text-gray-200 font-mono">{userEmail}</p>
                        </div>

                        <div className="mb-5">
                            <label className="text-xs text-gray-600 uppercase tracking-widest mb-2 block">
                                Type your email to confirm
                            </label>
                            <input
                                type="email"
                                value={deleteEmailInput}
                                onChange={(e) => setDeleteEmailInput(e.target.value)}
                                placeholder={userEmail}
                                className="w-full bg-[#0d0d0d] border border-gray-800/60 rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-700 font-mono focus:outline-none transition-colors duration-150"
                                onFocus={e => e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)'}
                                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowDeleteModal(false); setDeleteEmailInput(""); }}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-[#161616] border border-gray-800/60 text-gray-300 text-sm font-medium hover:border-gray-600 transition-all duration-150"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={!emailMatches}
                                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2"
                                style={{
                                    background: emailMatches ? 'rgba(127,29,29,0.6)' : 'rgba(30,30,30,1)',
                                    border: emailMatches ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.06)',
                                    color: emailMatches ? '#f87171' : '#4b5563',
                                    cursor: emailMatches ? 'pointer' : 'not-allowed',
                                }}
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Settings;