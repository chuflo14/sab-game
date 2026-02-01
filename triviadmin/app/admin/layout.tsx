'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    MonitorPlay,
    Settings,
    Store,
    Cpu,
    Gamepad2,
    CircleEllipsis,
    LogOut,
    Clock,
    Flame
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Usuarios', href: '/admin/users', icon: Users },
    { label: 'Publicidad', href: '/admin/ads', icon: MonitorPlay },
    { label: 'Trivia', href: '/admin/questions', icon: Gamepad2 },
    { label: 'Ruleta', href: '/admin/wheel', icon: CircleEllipsis },
    { label: 'Globo (Chango)', href: '/admin/chango', icon: Flame },
    { label: 'Tiendas', href: '/admin/stores', icon: Store },
    { label: 'Máquinas', href: '/admin/machines', icon: Cpu },
    { label: 'Tiempos', href: '/admin/times', icon: Clock },
    { label: 'Configuración', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = () => {
        document.cookie = "sb_session=; path=/; max-age=0";
        window.location.href = '/';
    };

    return (
        <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed lg:static inset-y-0 left-0 z-40 w-72 bg-slate-900 text-white flex flex-col shadow-2xl transition-transform duration-300 lg:translate-x-0",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                            <Gamepad2 className="text-black w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tighter uppercase">SAB <span className="text-yellow-500">GAME</span></h1>
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-0.5">Admin Dashboard</p>
                        </div>
                    </div>
                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden p-2 text-white/50 hover:text-white"
                    >
                        <LogOut className="w-5 h-5 rotate-180" />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsSidebarOpen(false)}
                                className={cn(
                                    "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-yellow-500 text-black font-bold shadow-lg shadow-yellow-500/20"
                                        : "text-white/60 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <Icon className={cn("w-5 h-5", isActive ? "text-black" : "text-white/40 group-hover:text-white")} />
                                <span className="text-sm uppercase tracking-wide">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 border-t border-white/5 space-y-4">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-4 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-colors group"
                    >
                        <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        <span className="text-sm font-bold uppercase tracking-wider">Cerrar Sesión</span>
                    </button>
                    <div className="px-4 text-[10px] text-white/20 font-medium uppercase tracking-[0.2em]">
                        v2.1.0 • SAB GAME LR
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden w-full">
                {/* Top bar */}
                <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-10 shrink-0 shadow-sm relative z-10">
                    <div className="flex items-center gap-4">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                        >
                            <LayoutDashboard className="w-6 h-6" />
                        </button>

                        <div className="min-w-0">
                            <h2 className="text-[8px] lg:text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Sección</h2>
                            <h3 className="text-sm lg:text-2xl font-black text-slate-800 uppercase tracking-tight truncate max-w-[120px] sm:max-w-[200px] lg:max-w-none">
                                {navItems.find(i => i.href === pathname)?.label || 'Gestión'}
                            </h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-2 pl-4 bg-slate-100 rounded-2xl border border-slate-200">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-black text-slate-800 uppercase">Admin Principal</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Activo ahora</p>
                        </div>
                        <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center font-black text-black">A</div>
                    </div>
                </header>

                {/* Content with scroll padding */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-10 bg-slate-50 relative custom-scrollbar">
                    {children}
                </div>
            </main>
        </div>
    );
}
