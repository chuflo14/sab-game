'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchUsers, updateUserAction, fetchMachines } from '@/lib/actions';
import { Machine } from '@/lib/types';
import {
    UserPlus,
    ArrowLeft,
    Save,
    ShieldCheck,
    KeyRound,
    User as UserIcon,
    Lock
} from 'lucide-react';
import Link from 'next/link';

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [username, setUsername] = useState('');
    const [pin, setPin] = useState('');
    const [role, setRole] = useState<'ADMIN' | 'REDEEMER' | 'ALIADO'>('REDEEMER');
    const [machines, setMachines] = useState<Machine[]>([]);
    const [selectedMachineIds, setSelectedMachineIds] = useState<string[]>([]);

    useEffect(() => {
        fetchMachines().then(setMachines);
    }, []);

    const loadUser = useCallback(async () => {
        setIsLoading(true);
        const users = await fetchUsers();
        const user = users.find(u => u.id === id);

        if (user) {
            setUsername(user.username);
            setPin(user.pin || '');
            setRole(user.role as 'ADMIN' | 'REDEEMER' | 'ALIADO');
            setSelectedMachineIds(user.machineIds || []);
        } else {
            router.push('/admin/users');
        }
        setIsLoading(false);
    }, [id, router]);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !pin) {
            alert('Por favor complete todos los campos');
            return;
        }

        setIsSaving(true);
        try {
            await updateUserAction(id, {
                username,
                pin,
                role,
                machineIds: role === 'ALIADO' ? selectedMachineIds : undefined // Update or clear
            });
            router.push('/admin/users');
        } catch (error) {
            console.error(error);
            alert('Error al actualizar el usuario');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return (
        <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Cargando Usuario...</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-20">
            <div className="flex items-center justify-between">
                <Link
                    href="/admin/users"
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-800 font-black text-xs uppercase tracking-widest transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Volver al Listado
                </Link>

                <div className="px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Editando Usuario
                </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-yellow-500" />

                <form onSubmit={handleSubmit} className="p-12 space-y-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-600">
                                <UserIcon className="w-5 h-5" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Ficha Personal</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nombre de Usuario</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="ej: canje_norte"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-lg font-black text-slate-800 tracking-tight focus:ring-4 focus:ring-yellow-500/10 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">PIN de Acceso</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value)}
                                        placeholder="••••"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-lg font-black text-slate-800 tracking-tight focus:ring-4 focus:ring-yellow-500/10 outline-none transition-all pl-12"
                                    />
                                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Nivel de Acceso</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button
                                type="button"
                                onClick={() => setRole('REDEEMER')}
                                className={`p-6 rounded-[2rem] border-2 transition-all flex items-start gap-4 text-left ${role === 'REDEEMER' ? 'border-yellow-500 bg-yellow-50/50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0 ${role === 'REDEEMER' ? 'bg-yellow-500 text-white' : 'bg-white text-slate-300 border border-slate-200'}`}>
                                    <UserPlus className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <span className={`block font-black uppercase tracking-tight ${role === 'REDEEMER' ? 'text-slate-800' : 'text-slate-500'}`}>Canjeador</span>
                                    <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wide">
                                        Puede escanear tickets y marcar premios como entregados. No accede a configuración.
                                    </p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setRole('ADMIN')}
                                className={`p-6 rounded-[2rem] border-2 transition-all flex items-start gap-4 text-left ${role === 'ADMIN' ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0 ${role === 'ADMIN' ? 'bg-indigo-500 text-white' : 'bg-white text-slate-300 border border-slate-200'}`}>
                                    <Lock className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <span className={`block font-black uppercase tracking-tight ${role === 'ADMIN' ? 'text-slate-800' : 'text-slate-500'}`}>Administrador</span>
                                    <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wide">
                                        Control total del sistema, usuarios, juegos y métricas.
                                    </p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setRole('ALIADO')}
                                className={`p-6 rounded-[2rem] border-2 transition-all flex items-start gap-4 text-left ${role === 'ALIADO' ? 'border-green-500 bg-green-50/50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0 ${role === 'ALIADO' ? 'bg-green-500 text-white' : 'bg-white text-slate-300 border border-slate-200'}`}>
                                    <UserIcon className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <span className={`block font-black uppercase tracking-tight ${role === 'ALIADO' ? 'text-slate-800' : 'text-slate-500'}`}>Aliado</span>
                                    <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wide">
                                        Socio comercial. Solo ve estadísticas de sus kioscos asignados.
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {role === 'ALIADO' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-600">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Asignar Kioscos</h3>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Selecciona los kioscos visibles para este Aliado:</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {machines.map(m => {
                                        const isSelected = selectedMachineIds.includes(m.id);
                                        return (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setSelectedMachineIds(prev => prev.filter(id => id !== m.id));
                                                    } else {
                                                        setSelectedMachineIds(prev => [...prev, m.id]);
                                                    }
                                                }}
                                                className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${isSelected
                                                    ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:border-green-300'
                                                    }`}
                                            >
                                                <div>
                                                    <div className="text-xs font-black uppercase tracking-tight truncate">{m.name}</div>
                                                    <div className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isSelected ? 'text-green-100' : 'text-slate-400'}`}>
                                                        {m.location || 'Sin Ubicación'}
                                                    </div>
                                                </div>
                                                {isSelected && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                                            </button>
                                        );
                                    })}
                                    {machines.length === 0 && <p className="text-xs text-slate-400 col-span-full">No hay máquinas registradas.</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-6 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-2xl py-6 font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl transition-all active:scale-95"
                        >
                            {isSaving ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Guardar Cambios
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
