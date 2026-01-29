'use client';

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
    Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Usuarios', href: '/admin/users', icon: Users },
    { label: 'Publicidad', href: '/admin/ads', icon: MonitorPlay },
    { label: 'Trivia', href: '/admin/questions', icon: Gamepad2 },
    { label: 'Ruleta', href: '/admin/wheel', icon: CircleEllipsis },
    { label: 'Globo (Chango)', href: '/admin/chango', icon: Settings },
    { label: 'Tiendas', href: '/admin/stores', icon: Store },
    { label: 'Máquinas', href: '/admin/machines', icon: Cpu },
    { label: 'Tiempos', href: '/admin/times', icon: Clock },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const handleLogout = () => {
        document.cookie = "sb_session=; path=/; max-age=0";
        window.location.href = '/';
    };

    return (
        <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-72 bg-slate-900 text-white flex flex-col shadow-2xl relative z-20">
                <div className="p-8 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                            <Gamepad2 className="text-black w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tighter uppercase">SAB <span className="text-yellow-500">GAME</span></h1>
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-0.5">Admin Dashboard</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
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
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* Top bar (Optional, can be used for contextual breadcrumbs or search) */}
                <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shrink-0 shadow-sm relative z-10">
                    <div>
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Sección</h2>
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                            {navItems.find(i => i.href === pathname)?.label || 'Gestión'}
                        </h3>
                    </div>

                    <div className="flex items-center gap-4 p-2 pl-4 bg-slate-100 rounded-2xl border border-slate-200">
                        <div className="text-right">
                            <p className="text-xs font-black text-slate-800 uppercase">Admin Principal</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Activo ahora</p>
                        </div>
                        <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center font-black text-black">A</div>
                    </div>
                </header>

                {/* Content with scroll padding */}
                <div className="flex-1 overflow-y-auto p-10 bg-slate-50 relative custom-scrollbar">
                    {children}
                </div>
            </main>
        </div>
    );
}
