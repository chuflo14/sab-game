import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUsers, getMachines } from '@/lib/dal';
import { getAliadoStats } from '@/lib/actions';
import {
    MonitorSmartphone,
    Gamepad2,
    DollarSign,
    Signal,
    SignalZero,
    MonitorPlay
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AliadoPage() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('sb_session');

    if (!sessionCookie) {
        redirect('/login');
    }

    const session = JSON.parse(sessionCookie.value);

    // Fetch fresh user data to get machineIds
    const allUsers = await getUsers();
    const currentUser = allUsers.find(u => u.id === session.userId);

    if (!currentUser || currentUser.role !== 'ALIADO') {
        redirect('/login');
    }

    const assignedMachineIds = currentUser.machineIds || [];
    const allMachines = await getMachines();
    const myMachines = allMachines.filter(m => assignedMachineIds.includes(m.id));

    // Get stats
    const stats = await getAliadoStats(assignedMachineIds);

    return (
        <div className="space-y-8 pb-20">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Bienvenido, {currentUser.username}</h2>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Tienes {myMachines.length} kiosco(s) asignado(s)
                    </p>
                    <Link
                        href="/admin/ads"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 w-full md:w-auto"
                    >
                        <MonitorPlay className="w-4 h-4" />
                        Gestionar Publicidad
                    </Link>
                </div>
            </div>

            {myMachines.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                    <MonitorSmartphone className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="uppercase tracking-widest font-black text-sm">No tienes máquinas asignadas</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-8">
                    {myMachines.map(machine => {
                        const s = stats.find(s => s.machineId === machine.id) || { triviaCount: 0, ruletaCount: 0, changoCount: 0, totalPlays: 0, totalRevenue: 0 };

                        return (
                            <div key={machine.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-xl hover:shadow-2xl transition-all group">
                                <div className="p-8 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${machine.isOperational ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                            {machine.isOperational ? <Signal className="w-6 h-6" /> : <SignalZero className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-800 uppercase tracking-tight text-xl">{machine.name}</h3>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                {machine.location || 'Sin Ubicación'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-emerald-50 border border-emerald-100 px-6 py-3 rounded-xl flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                            <DollarSign className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60">Recaudado</p>
                                            <p className="text-2xl font-black tracking-tighter loading-none text-emerald-900">
                                                ${s.totalRevenue.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                                            <div className="flex items-center gap-2 text-indigo-400 mb-2">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Trivia</span>
                                            </div>
                                            <p className="text-3xl font-black text-indigo-900 tracking-tighter">{s.triviaCount}</p>
                                        </div>

                                        <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                                            <div className="flex items-center gap-2 text-purple-400 mb-2">
                                                <div className="w-2 h-2 rounded-full bg-purple-500" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Ruleta</span>
                                            </div>
                                            <p className="text-3xl font-black text-purple-900 tracking-tighter">{s.ruletaCount}</p>
                                        </div>

                                        <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                                            <div className="flex items-center gap-2 text-orange-400 mb-2">
                                                <div className="w-2 h-2 rounded-full bg-orange-500" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Chango</span>
                                            </div>
                                            <p className="text-3xl font-black text-orange-900 tracking-tighter">{s.changoCount}</p>
                                        </div>

                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <div className="flex items-center gap-2 text-slate-400 mb-2">
                                                <Gamepad2 className="w-3 h-3" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Total</span>
                                            </div>
                                            <p className="text-3xl font-black text-slate-800 tracking-tighter">{s.totalPlays}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
