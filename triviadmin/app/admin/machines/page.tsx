'use client';

import { useState, useEffect } from 'react';
import { fetchMachines, createMachine, updateMachineAction } from '@/lib/actions';
import { Machine } from '@/lib/types';
import {
    Cpu,
    Plus,
    Activity,
    Trash2,
    Power,
    MapPin,
    AlertTriangle,
    Edit3,
    X,
    Smartphone
} from 'lucide-react';

export default function MachinesAdminPage() {
    const [machines, setMachines] = useState<Machine[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingMachineId, setEditingMachineId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        location: '',
        short_id: '',
        qr_enabled: true,
        tokenPrice: 1000
    });

    useEffect(() => {
        loadMachines();
    }, []);

    const loadMachines = async () => {
        setIsLoading(true);
        const data = await fetchMachines();
        setMachines(data);
        setIsLoading(false);
    };

    const generateCode = () => {
        return 'K' + Math.floor(100 + Math.random() * 9000);
    }

    const openCreateModal = () => {
        setEditingMachineId(null);
        setFormData({ name: '', location: '', short_id: generateCode(), qr_enabled: true, tokenPrice: 1000 });
        setIsModalOpen(true);
    };

    const openEditModal = (machine: Machine) => {
        setEditingMachineId(machine.id);
        setFormData({
            name: machine.name,
            location: machine.location || '',
            short_id: machine.short_id || '',
            qr_enabled: machine.qr_enabled !== false,
            tokenPrice: machine.tokenPrice || 1000
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;

        setIsSaving(true);
        if (editingMachineId) {
            await updateMachineAction(editingMachineId, {
                name: formData.name,
                location: formData.location || undefined,
                short_id: formData.short_id || undefined,
                qr_enabled: formData.qr_enabled,
                tokenPrice: formData.tokenPrice
            });
        } else {
            const newMachine: Machine = {
                id: crypto.randomUUID(),
                name: formData.name,
                location: formData.location || 'Sin ubicación',
                isOperational: true,
                qr_enabled: formData.qr_enabled,
                tokenPrice: formData.tokenPrice,
                lastSeenAt: new Date(),
                short_id: formData.short_id || generateCode()
            };
            await createMachine(newMachine);
        }

        setIsSaving(false);
        setIsModalOpen(false);
        loadMachines();
    };

    const handleDeleteMachine = async (id: string) => {
        const { deleteMachineAction } = await import('@/lib/actions');
        await deleteMachineAction(id);
        setShowDeleteConfirm(null);
        loadMachines();
    };

    const toggleStatus = async (machine: Machine) => {
        await updateMachineAction(machine.id, { isOperational: !machine.isOperational });
        loadMachines();
    };

    const toggleQr = async (machine: Machine) => {
        await updateMachineAction(machine.id, { qr_enabled: !machine.qr_enabled });
        loadMachines();
    };

    return (
        <div className="space-y-6 md:space-y-10 pb-20 px-4 md:px-0">
            {/* Header section with responsive layout */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm gap-4 md:gap-0">
                <div className="space-y-1">
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">Terminales Kiosco</h3>
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Monitoreo en tiempo real y gestión de red</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="w-full md:w-auto bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all shadow-xl shadow-slate-200 active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Nueva Terminal
                </button>
            </div>

            {/* Main grid for machine cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 animate-pulse space-y-6 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div className="w-14 h-14 bg-slate-50 rounded-2xl" />
                                <div className="w-20 h-6 bg-slate-50 rounded-full" />
                            </div>
                            <div className="space-y-3">
                                <div className="h-4 bg-slate-50 rounded w-2/3" />
                                <div className="h-3 bg-slate-50 rounded w-1/3" />
                            </div>
                            <div className="h-24 bg-slate-50/50 rounded-2xl" />
                        </div>
                    ))
                ) : machines.length === 0 ? (
                    <div className="col-span-full py-24 text-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                            <Cpu className="w-10 h-10" />
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">No hay terminales registradas en el sistema</p>
                    </div>
                ) : (
                    machines.map((m) => {
                        const isOnline = m.lastSeenAt && (Date.now() - new Date(m.lastSeenAt).getTime() < 120000);

                        return (
                            <div key={m.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden flex flex-col h-full group">
                                {/* Card Header with Status and Icon */}
                                <div className="p-8 pb-4">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`p-4 rounded-2xl transition-all duration-300 ${m.isOperational ? 'bg-indigo-50 text-indigo-600' : 'bg-red-50 text-red-500'}`}>
                                            <Cpu className="w-6 h-6" />
                                        </div>
                                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${isOnline ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-500'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                            {isOnline ? 'Online' : 'Offline'}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate leading-none">{m.name}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">ID: {m.short_id || '---'}</span>
                                            <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500">VALOR FICHA: ${m.tokenPrice || 1000}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Information Block */}
                                <div className="px-8 py-6 space-y-4">
                                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="truncate max-w-[120px]">{m.location || 'Sin ubicación'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Activity className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-slate-900 font-black">{m.games_counter || 0}</span>
                                        </div>
                                    </div>

                                    {/* Action Row - Toggle QR (Sleek pill style) */}
                                    <div className="flex items-center justify-between p-4 rounded-2xl border border-dashed border-slate-200 bg-white group-hover:bg-slate-50/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Smartphone className={`w-4 h-4 ${m.qr_enabled !== false ? 'text-amber-500' : 'text-slate-400'}`} />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">PAGOS QR</span>
                                        </div>
                                        <button
                                            onClick={() => toggleQr(m)}
                                            className={`relative w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${m.qr_enabled !== false ? 'bg-amber-500' : 'bg-slate-200'}`}
                                        >
                                            <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-300 ${m.qr_enabled !== false ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                </div>

                                {/* Card Footer Actions */}
                                <div className="mt-auto p-4 md:p-6 bg-slate-50/50 flex gap-2 md:gap-3 border-t border-slate-50 group-hover:bg-slate-50 transition-colors">
                                    <button
                                        onClick={() => openEditModal(m)}
                                        className="flex-1 py-3 md:py-4 bg-white hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all border border-slate-100 flex items-center justify-center font-black text-[9px] uppercase tracking-widest gap-2 shadow-sm"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                        <span className="hidden md:inline">Configurar</span>
                                    </button>
                                    <button
                                        onClick={() => toggleStatus(m)}
                                        className={`flex-[1.5] py-3 md:py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 ${m.isOperational ? 'bg-white text-slate-400 hover:text-red-500 border border-slate-100' : 'bg-green-500 text-white shadow-lg shadow-green-500/20'}`}
                                    >
                                        <Power className="w-3.5 h-3.5" />
                                        {m.isOperational ? 'Apagar' : 'Encender'}
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(m.id)}
                                        className="p-3 md:p-4 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl border border-slate-100 shadow-sm"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {!m.isOperational && (
                                    <div className="absolute top-0 right-0 p-2">
                                        <div className="bg-red-500 text-white text-[8px] font-black uppercase py-1 px-4 rounded-bl-xl shadow-lg animate-pulse">
                                            Fuera de Servicio
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal - Modern Design */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-500">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-3xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-500">
                        <div className="p-8 md:p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                            <div className="space-y-1">
                                <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">
                                    {editingMachineId ? 'Ajustar Terminal' : 'Registrar Terminal'}
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{editingMachineId ? 'ID: ' + editingMachineId.slice(0, 8) : 'Configura los parámetros de red'}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-6 md:space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] ml-2">Nombre / Ref</label>
                                    <div className="relative group">
                                        <input
                                            required
                                            type="text"
                                            placeholder="Ej: Sab K-05"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all uppercase placeholder:text-slate-300"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] ml-2">Código ID</label>
                                    <input
                                        type="text"
                                        placeholder="K001"
                                        value={formData.short_id}
                                        onChange={(e) => setFormData({ ...formData, short_id: e.target.value.toUpperCase() })}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all uppercase placeholder:text-slate-300"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] ml-2">Ubicación</label>
                                    <input
                                        type="text"
                                        placeholder="Hall Central"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all uppercase placeholder:text-slate-300"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] ml-2">VALOR FICHA ($)</label>
                                    <div className="relative">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</div>
                                        <input
                                            type="number"
                                            placeholder="1000"
                                            value={formData.tokenPrice}
                                            onChange={(e) => setFormData({ ...formData, tokenPrice: parseInt(e.target.value) || 0 })}
                                            className="w-full pl-10 pr-6 py-4 bg-indigo-50/50 border border-indigo-100 rounded-[1.25rem] text-sm font-black text-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-indigo-200"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-6 bg-slate-50/80 rounded-[1.8rem] border border-slate-100">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">HABILITAR PAGOS QR</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.1em]">Permite el uso de Mercado Pago</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, qr_enabled: !formData.qr_enabled })}
                                    className={`relative w-14 h-7 flex items-center rounded-full p-1 transition-colors duration-300 ${formData.qr_enabled ? 'bg-amber-500' : 'bg-slate-300'}`}
                                >
                                    <div className={`bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-300 ${formData.qr_enabled ? 'translate-x-7' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            <div className="flex flex-col md:flex-row gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="order-2 md:order-1 flex-1 px-8 py-5 border border-slate-200 rounded-[1.25rem] font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    Cerrar
                                </button>
                                <button
                                    disabled={isSaving}
                                    type="submit"
                                    className="order-1 md:order-2 flex-[2] px-8 py-5 bg-slate-900 hover:bg-black text-white rounded-[1.25rem] font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-2xl shadow-slate-200 active:scale-95 disabled:opacity-50"
                                >
                                    {isSaving ? 'Guardando...' : editingMachineId ? 'Actualizar Sistema' : 'Activar Terminal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm Delete - Premium Red Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-xs rounded-[2.5rem] shadow-3xl p-10 text-center animate-in zoom-in-95 duration-300">
                        <div className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center text-red-500 mx-auto mb-8 animate-bounce">
                            <AlertTriangle className="w-12 h-12" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">¿Confirmar Baja?</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-10 leading-relaxed">
                            Esta acción eliminará permanentemente la terminal del inventario activo.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => handleDeleteMachine(showDeleteConfirm)}
                                className="w-full py-5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-red-200 active:scale-95"
                            >
                                Sí, Eliminar
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="w-full py-5 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
