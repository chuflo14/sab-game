import Link from 'next/link';
import { LogOut, LayoutDashboard, MonitorPlay } from 'lucide-react';
import { logout } from '@/lib/actions';

export default function AliadoLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-slate-900 text-white p-4 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-slate-900 font-black">
                            SAB
                        </div>
                        <div>
                            <h1 className="text-sm font-black uppercase tracking-tight">Panel de Aliado</h1>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">SAB Game System</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/aliado" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:text-green-400 transition-colors">
                            <LayoutDashboard className="w-4 h-4" />
                            <span className="hidden md:inline">Dashboard</span>
                        </Link>

                        <Link href="/admin/ads" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:text-green-400 transition-colors">
                            <MonitorPlay className="w-4 h-4" />
                            <span className="hidden md:inline">Publicidad</span>
                        </Link>

                        <form action={async () => {
                            'use server';
                            await logout();
                        }}>
                            <button className="flex items-center gap-2 bg-white/10 hover:bg-red-500/20 hover:text-red-400 px-4 py-2 rounded-lg transition-all text-xs font-bold uppercase tracking-widest">
                                <LogOut className="w-4 h-4" />
                                <span className="hidden md:inline">Salir</span>
                            </button>
                        </form>
                    </div>
                </div>
            </header>
            <main className="flex-1 p-6 md:p-10">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
