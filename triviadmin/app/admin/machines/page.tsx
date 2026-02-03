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
    X
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
        location: ''
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

    const openCreateModal = () => {
        setEditingMachineId(null);
        setFormData({ name: '', location: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (machine: Machine) => {
        setEditingMachineId(machine.id);
        setFormData({
            name: machine.name,
            location: machine.location || ''
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
                location: formData.location || undefined
            });
        } else {
            const newMachine: Machine = {
                id: crypto.randomUUID(),
                name: formData.name,
                location: formData.location || 'Sin ubicación',
                isOperational: true,
                lastSeenAt: new Date()
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

    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-slate-200">
                <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Terminales Kiosco</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Monitoreo y gestión de unidades físicas</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-black/20 active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Registrar Terminal
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 animate-pulse space-y-6">
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl" />
                            <div className="h-4 bg-slate-100 rounded w-1/2" />
                            <div className="h-20 bg-slate-50 rounded-2xl" />
                        </div>
                    ))
                ) : machines.length === 0 ? (
                    <div className="col-span-full p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                        No hay máquinas registradas
                    </div>
                ) : (
                    machines.map((m) => (
                        <div key={m.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 group relative">
                            {/* Operational Status Dot */}
                            <div className={`absolute top-8 right-8 w-3 h-3 rounded-full ${m.isOperational ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse'}`} />

                            <div className="p-10 space-y-8">
                                <div className="space-y-4">
                                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center border transition-colors ${m.isOperational ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-red-500/10 border-red-500/20 text-red-600'}`}>
                                        <Cpu className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">{m.name}</h4>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(m.id);
                                                    alert('ID copiado al portapapeles');
                                                }}
                                                className="p-1 text-slate-300 hover:text-indigo-500 transition-colors"
                                                title="Copiar ID"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Show ID in small text for reference */}
                                            <span className="text-[9px] font-mono text-slate-300 bg-slate-100 px-1 rounded truncate max-w-[100px] block" title={m.id}>{m.id}</span>
                                        </div>

                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${m.isOperational ? 'text-green-600' : 'text-red-500'}`}>
                                                {m.isOperational ? 'OPERATIVA' : 'FUERA DE SERVICIO'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100 group-hover:bg-white transition-colors">
                                    <div className="flex items-center gap-3">
                                        <MapPin className="text-slate-400 w-4 h-4" />
                                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">{m.location || 'SIN UBICACIÓN'}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Activity className="text-slate-400 w-4 h-4" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Ping: {m.lastSeenAt ? new Date(m.lastSeenAt).toLocaleTimeString() : 'NUNCA'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-slate-100">
                                    <button
                                        onClick={() => openEditModal(m)}
                                        className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => toggleStatus(m)}
                                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${m.isOperational ? 'bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white' : 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20'}`}
                                    >
                                        <Power className="w-3.5 h-3.5" />
                                        {m.isOperational ? 'Apagar' : 'Encender'}
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(m.id)}
                                        className="p-3 bg-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all border border-slate-200/50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                {!m.isOperational && (
                                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-2xl border border-red-100">
                                        <AlertTriangle className="text-red-500 w-4 h-4" />
                                        <p className="text-[9px] font-black text-red-600 uppercase tracking-widest leading-tight">Acción requerida: La unidad no responde</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Method Modal */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                                        {editingMachineId ? 'Editar Terminal' : 'Nuevo Terminal'}
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                        {editingMachineId ? 'Modifica los datos del punto de acceso' : 'Registra un nuevo punto de acceso físico'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-3 hover:bg-slate-200 rounded-2xl transition-colors text-slate-400"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Identificador / Nombre</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Ej: Terminal K-05"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all uppercase"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Ubicación Física</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Hall Central - Ala Norte"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all uppercase"
                                    />
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-6 py-4 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        disabled={isSaving}
                                        type="submit"
                                        className="flex-[2] px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-50"
                                    >
                                        {isSaving ? 'Guardando...' : editingMachineId ? 'Guardar Cambios' : 'Registrar Terminal'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Delete Confirmation Modal */}
            {
                showDeleteConfirm && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 text-center animate-in zoom-in-95 duration-300">
                            <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-6">
                                <AlertTriangle className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">¿Eliminar Terminal?</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8 leading-relaxed">
                                Esta acción borrará permanentemente el registro de este terminal.
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleDeleteMachine(showDeleteConfirm)}
                                    className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-red-500/20"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
