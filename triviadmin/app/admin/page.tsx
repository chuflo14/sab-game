import { fetchMetrics } from '@/lib/actions';
import ResetDashboardButton from '@/components/ResetDashboardButton';
import {
    Gamepad2,
    TicketCheck,
    Ticket,
    MonitorCheck,
    MonitorOff,
    Trophy,
    TrendingUp
} from 'lucide-react';

export default async function AdminPage() {
    const metrics = await fetchMetrics();

    const gameStats = [
        { label: 'Trivia Riojana', count: metrics.gamesByType.trivia, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'La Ruleta del Chacho', count: metrics.gamesByType.ruleta, color: 'text-red-500', bg: 'bg-red-500/10' },
        { label: 'Dedo de Chango', count: metrics.gamesByType.chango, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    ];

    return (
        <div className="space-y-10">
            {/* Row 1: Main KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Juegos"
                    value={metrics.gamesByType.trivia + metrics.gamesByType.ruleta + metrics.gamesByType.chango}
                    icon={Gamepad2}
                    description="Partidas iniciadas hoy"
                    color="yellow"
                />
                <MetricCard
                    title="Premios Generados"
                    value={metrics.tickets.total}
                    icon={Ticket}
                    description="Tickets impresos/QR"
                    color="blue"
                />
                <MetricCard
                    title="Premios Reclamados"
                    value={metrics.tickets.redeemed}
                    icon={TicketCheck}
                    description={`${metrics.tickets.pending} pendientes de canje`}
                    color="green"
                />
                <MetricCard
                    title="Máquinas Online"
                    value={metrics.machines.operational}
                    icon={MonitorCheck}
                    description={`De un total de ${metrics.machines.total} máquinas`}
                    color="purple"
                    alert={metrics.machines.operational < metrics.machines.total}
                />
            </div>

            {/* Row 2: Charts / Details Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Distribution of Games */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Actividad por Juego</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 text-xs">Distribución de jugadas realizadas</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <ResetDashboardButton />
                            <Gamepad2 className="text-slate-200 w-10 h-10" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        {gameStats.map((stat) => (
                            <div key={stat.label} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-black text-slate-600 uppercase tracking-wider">{stat.label}</span>
                                    <span className="text-lg font-black text-slate-900">{stat.count} <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">Jugadas</span></span>
                                </div>
                                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ${stat.bg.replace('/10', '')}`}
                                        style={{ width: `${(stat.count / Math.max(...gameStats.map(s => s.count), 1)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Status Quick Look */}
                <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
                    <TrendingUp className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 group-hover:scale-110 transition-transform duration-700" />

                    <h3 className="text-xl font-black uppercase tracking-tight mb-8">Estado de Red</h3>

                    <div className="space-y-8 relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center">
                                <MonitorCheck className="text-green-500 w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-lg font-black leading-none">{metrics.machines.operational}</p>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Sistemas Operativos</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className={`w-12 h-12 ${metrics.machines.total - metrics.machines.operational > 0 ? 'bg-red-500/20' : 'bg-white/5'} rounded-2xl flex items-center justify-center transition-colors`}>
                                <MonitorOff className={`${metrics.machines.total - metrics.machines.operational > 0 ? 'text-red-500' : 'text-white/20'} w-6 h-6`} />
                            </div>
                            <div>
                                <p className="text-lg font-black leading-none">{metrics.machines.total - metrics.machines.operational}</p>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Sistemas Fuera de Línea</p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/10">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center">
                                    <Trophy className="text-yellow-500 w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-lg font-black leading-none">{metrics.tickets.total}</p>
                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Premios Totales Generados</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MetricCard({ title, value, icon: Icon, description, color, alert }: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const colorClasses: any = {
        yellow: 'text-yellow-500 bg-yellow-500/10',
        blue: 'text-blue-500 bg-blue-500/10',
        green: 'text-green-500 bg-green-500/10',
        purple: 'text-purple-500 bg-purple-500/10',
    };

    return (
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 ${colorClasses[color]} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
                    <Icon className="w-7 h-7" />
                </div>
                {alert && <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />}
            </div>
            <div className="space-y-1">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h4>
                <p className="text-3xl font-black text-slate-800 tracking-tighter">{value}</p>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">
                {description}
            </p>
        </div>
    );
}
