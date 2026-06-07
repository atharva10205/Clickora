'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Target, Wallet, BarChart3, Settings, HelpCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SidebarProps {
  activeTab: string;
  SidebarAccent?: string;
}

interface SidebarData {
  email: string;
  image: string | null;
  name: string;
  accent: string;
}

const Sidebar = ({ activeTab, SidebarAccent }: SidebarProps) => {
  const router = useRouter();
  const [sidebarData, setSidebarData] = useState<SidebarData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/crud/Advertiser/Sidebar');
        const result = await res.json();
        setSidebarData(result.data);
      } catch (err) {
        console.error('Sidebar fetch error:', err);
      }
    };
    fetchData();
  }, []);

  const Accent: string = SidebarAccent ?? sidebarData?.accent ?? '#ffffff';

  const hR = parseInt(Accent.slice(1, 3), 16);
  const hG = parseInt(Accent.slice(3, 5), 16);
  const hB = parseInt(Accent.slice(5, 7), 16);
  const hAlpha = (op: number) => `rgba(${hR},${hG},${hB},${op})`;

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, route: '/Advertiser/Dashboard' },
    { name: 'Campaigns', icon: Target, route: '/Advertiser/Campaigns' },
    { name: 'Wallet', icon: Wallet, route: '/Advertiser/Wallet' },
    { name: 'Analytics', icon: BarChart3, route: '/Advertiser/Analytics' },
  ];

  const bottomNavItems = [
    { name: 'Settings', icon: Settings, route: '/Advertiser/Settings' },
    { name: 'Help Center', icon: HelpCircle, route: '/Advertiser/Help' },
  ];

  const socialLinks: { label: string; href: string; icon: React.ReactNode }[] = [
    {
      label: 'X', href: 'https://x.com/AtharvaPandhar4', icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
      )
    },
    {
      label: 'GitHub', href: 'https://github.com/atharva10205', icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
      )
    },
    {
      label: 'LinkedIn', href: 'https://www.linkedin.com/in/atharva-pandhare-50636027a/', icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
      )
    },
    {
      label: 'Instagram', href: 'https://www.instagram.com/atharva_pandhare/', icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
      )
    },
  ];

  const NavBtn = ({ item }: { item: { name: string; icon: any; route: string } }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.name;

    return (
      <button
        onClick={() => router.push(item.route)}
        className="w-full cursor-pointer flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 text-sm font-medium"
        style={{
          background: isActive ? '#1c1c1c' : 'transparent',
          color: isActive ? '#ffffff' : '',
          border: '1px solid transparent',
        }}
        onMouseEnter={e => {
          if (!isActive) {
            e.currentTarget.style.border = `1px solid ${Accent}`;
            e.currentTarget.style.boxShadow = `0 0 10px ${hAlpha(0.12)}`;
            e.currentTarget.style.background = '#161616';
            e.currentTarget.style.color = '#e5e7eb';
          }
        }}
        onMouseLeave={e => {
          if (!isActive) {
            e.currentTarget.style.border = '1px solid transparent';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '';
          }
        }}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span>{item.name}</span>
      </button>
    );
  };

  return (
    <aside className="w-56 bg-[#0c0c0c] border-r border-[#1f1f1f] flex flex-col flex-shrink-0">

      <div className="px-4 py-4 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center overflow-hidden flex-shrink-0">
            {sidebarData?.image ? (
              <img
                src={sidebarData.image}
                alt={sidebarData.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-gray-300">
                {sidebarData?.name ? getInitials(sidebarData.name) : '#'}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <span className="text-sm font-semibold text-white block leading-tight truncate">
              {sidebarData?.name ?? '—'}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0" style={{ background: Accent }} />
              <span className="text-[10px] text-gray-500 truncate">
                {sidebarData?.email ?? '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-2 overflow-y-auto">
        {navItems.map(item => <NavBtn key={item.name} item={item} />)}
      </nav>

      <div className="px-2 py-3 border-t border-[#1a1a1a] space-y-1">
        {bottomNavItems.map(item => <NavBtn key={item.name} item={item} />)}
        <div className="flex items-center justify-between px-3 pt-2">
          {socialLinks.map(s => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              title={s.label}
              className="text-gray-600 transition-colors duration-150"
              style={{ lineHeight: 0 }}
              onMouseEnter={e => { e.currentTarget.style.color = Accent; }}
              onMouseLeave={e => { e.currentTarget.style.color = ''; }}
            >
              {s.icon}
            </a>
          ))}
        </div>
      </div>

    </aside>
  );
};

export default Sidebar;