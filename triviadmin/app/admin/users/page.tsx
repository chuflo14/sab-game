'use client';

import { useState, useEffect } from 'react';
import { fetchUsers, updateUserAction, deleteUserAction } from '@/lib/actions';
import { User } from '@/lib/types';
import Link from 'next/link';
import {
    UserPlus,
    ShieldCheck,
    Edit2,
    CheckCircle2,
    XCircle,
    UserCog,
    Trash
} from 'lucide-react';

export default function UsersAdminPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setIsLoading(true);
        const data = await fetchUsers();
        setUsers(data);
        setIsLoading(false);
    };

    const toggleStatus = async (user: User) => {
        await updateUserAction(user.id, { active: !user.active });
        loadUsers();
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 gap-4 md:gap-0">
                <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Gestión de Personal</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Control de Administradores y Canjeadores</p>
                </div>
                <Link
                    href="/admin/users/create"
                    className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-yellow-500/20 active:scale-95"
                >
                    <UserPlus className="w-4 h-4" />
                    Nuevo Usuario
                </Link>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto custom-scrollbar">
                    <div className="min-w-[800px] grid grid-cols-12 bg-slate-50 border-b border-slate-200 px-8 py-4">
                        <div className="col-span-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</div>
                        <div className="col-span-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario</div>
                        <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol</div>
                        <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">PIN / Acceso</div>
                        <div className="col-span-2 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</div>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {isLoading ? (
                            <div className="p-20 flex flex-col items-center justify-center space-y-4">
                                <div className="w-10 h-10 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Cargando Personal...</p>
                            </div>
                        ) : users.length === 0 ? (
                            <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                No hay usuarios registrados
                            </div>
                        ) : (
                            users.map((user) => (
                                <div key={user.id} className="min-w-[800px] grid grid-cols-12 px-8 py-6 items-center hover:bg-slate-50 transition-colors">
                                    <div className="col-span-1">
                                        {user.active ? (
                                            <CheckCircle2 className="text-green-500 w-5 h-5" />
                                        ) : (
                                            <XCircle className="text-slate-300 w-5 h-5" />
                                        )}
                                    </div>
                                    <div className="col-span-4 flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${user.role === 'ADMIN' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                            {user.username[0].toUpperCase()}
                                        </div>
                                        <span className="font-black text-slate-800 uppercase tracking-tight">{user.username}</span>
                                    </div>
                                    <div className="col-span-3">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${user.role === 'ADMIN' ? 'bg-indigo-500/10 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                            {user.role}
                                        </span>
                                    </div>
                                    <div className="col-span-2 font-mono text-sm text-slate-400">
                                        {user.pin || 'SIN PIN'}
                                    </div>
                                    <div className="col-span-2 flex justify-end gap-2">
                                        <button
                                            onClick={() => toggleStatus(user)}
                                            className={`p-2 rounded-lg transition-colors ${user.active ? 'text-slate-300 hover:text-red-500 hover:bg-red-500/5' : 'text-slate-300 hover:text-green-500 hover:bg-green-500/5'}`}
                                            title={user.active ? "Desactivar Usuaro" : "Activar Usuario"}
                                        >
                                            <ShieldCheck className="w-5 h-5" />
                                        </button>
                                        <Link
                                            href={`/admin/users/${user.id}/edit`}
                                            className="p-2 rounded-lg text-slate-300 hover:text-yellow-600 hover:bg-yellow-500/5 transition-colors"
                                            title="Editar Usuario"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </Link>
                                        <form action={async () => {
                                            if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
                                                await deleteUserAction(user.id);
                                                loadUsers();
                                            }
                                        }}>
                                            <button className="p-2 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-500/5 transition-colors" title="Eliminar Usuario">
                                                <Trash className="w-5 h-5" />
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-indigo-600 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
                    <ShieldCheck className="absolute -bottom-10 -right-10 w-48 h-48 text-white/10" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Nivel Admin</h4>
                    <p className="text-3xl font-black tracking-tighter mb-4">{users.filter(u => u.role === 'ADMIN').length}</p>
                    <p className="text-xs font-bold leading-relaxed opacity-60 uppercase tracking-widest">Control total sobre anuncios, preguntas y configuración.</p>
                </div>
                <div className="bg-slate-800 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
                    <UserCog className="absolute -bottom-10 -right-10 w-48 h-48 text-white/10" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Nivel Redeemer</h4>
                    <p className="text-3xl font-black tracking-tighter mb-4">{users.filter(u => u.role === 'REDEEMER').length}</p>
                    <p className="text-xs font-bold leading-relaxed opacity-60 uppercase tracking-widest">Acceso limitado al escaneo y canje de premios.</p>
                </div>
            </div>
        </div>
    );
}
