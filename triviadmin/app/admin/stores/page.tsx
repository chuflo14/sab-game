'use client';

import { useState, useEffect } from 'react';
import { fetchStores, createStore, updateStoreAction } from '@/lib/actions';
import { Store as StoreType } from '@/lib/types';
import {
    Store,
    Plus,
    Smartphone,
    MapPin,
    ExternalLink,
    Edit3,
    Trash2,
    X,
    AlertTriangle
} from 'lucide-react';

export default function StoresAdminPage() {
    const [stores, setStores] = useState<StoreType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        whatsapp: '',
        mapsUrl: '',
        probability: 1
    });

    useEffect(() => {
        loadStores();
    }, []);

    const loadStores = async () => {
        setIsLoading(true);
        const data = await fetchStores();
        setStores(data);
        setIsLoading(false);
    };

    const openCreateModal = () => {
        setEditingStoreId(null);
        setFormData({ name: '', address: '', whatsapp: '', mapsUrl: '', probability: 1 });
        setIsModalOpen(true);
    };

    const openEditModal = (store: StoreType) => {
        setEditingStoreId(store.id);
        setFormData({
            name: store.name,
            address: store.address,
            whatsapp: store.whatsapp,
            mapsUrl: store.mapsUrl || '',
            probability: store.probability || 1
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.address || !formData.whatsapp) return;

        setIsSaving(true);
        if (editingStoreId) {
            await updateStoreAction(editingStoreId, {
                name: formData.name,
                address: formData.address,
                whatsapp: formData.whatsapp,
                mapsUrl: formData.mapsUrl || undefined,
                probability: Number(formData.probability)
            });
        } else {
            const newStore: StoreType = {
                id: crypto.randomUUID(),
                name: formData.name,
                address: formData.address,
                whatsapp: formData.whatsapp,
                mapsUrl: formData.mapsUrl || undefined,
                probability: Number(formData.probability),
                active: true
            };
            await createStore(newStore);
        }

        setIsSaving(false);
        setIsModalOpen(false);
        setIsModalOpen(false);
        setFormData({ name: '', address: '', whatsapp: '', mapsUrl: '', probability: 1 });
        loadStores();
    };

    const handleDeleteStore = async (id: string) => {
        const { deleteStoreAction } = await import('@/lib/actions');
        await deleteStoreAction(id);
        setShowDeleteConfirm(null);
        loadStores();
    };

    const toggleStatus = async (store: StoreType) => {
        await updateStoreAction(store.id, { active: !store.active });
        loadStores();
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-slate-200">
                <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Puntos de Retiro</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Gestión de sucursales activas para canje</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-green-500/20 active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Añadir Sucursal
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {isLoading ? (
                    Array(2).fill(0).map((_, i) => (
                        <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 animate-pulse space-y-4">
                            <div className="h-4 bg-slate-100 rounded w-1/3" />
                            <div className="h-4 bg-slate-100 rounded w-1/2" />
                            <div className="h-20 bg-slate-50 rounded-2xl" />
                        </div>
                    ))
                ) : stores.length === 0 ? (
                    <div className="col-span-full p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                        No hay tiendas registradas
                    </div>
                ) : (
                    stores.map((s) => (
                        <div key={s.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 group">
                            <div className="p-10 space-y-8">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-600 border border-green-500/20">
                                            <Store className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">{s.name}</h4>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Sucursal Operativa</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleStatus(s)}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${s.active ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'}`}
                                    >
                                        {s.active ? 'ONLINE' : 'OFFLINE'}
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-white transition-colors">
                                        <MapPin className="text-blue-500 w-5 h-5 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Dirección</p>
                                            <p className="text-sm font-bold text-slate-600 truncate uppercase">{s.address}</p>
                                        </div>
                                        {s.mapsUrl && (
                                            <a href={s.mapsUrl} target="_blank" className="p-2 text-slate-300 hover:text-blue-500 transition-colors">
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-white transition-colors">
                                        <div className="w-5 h-5 flex items-center justify-center font-bold text-slate-400 border border-slate-300 rounded-full text-[10px] shrink-0">
                                            %
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Probabilidad</p>
                                            <p className="text-sm font-bold text-slate-600 truncate">{s.probability || 1}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-white transition-colors">
                                        <Smartphone className="text-green-500 w-5 h-5 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">WhatsApp de Canje</p>
                                            <p className="text-sm font-bold text-slate-600 truncate">{s.whatsapp}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-slate-100">
                                    <button
                                        onClick={() => openEditModal(s)}
                                        className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                        Editar Local
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(s.id)}
                                        className="p-3 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-500/10"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Store Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                                    {editingStoreId ? 'Editar Sucursal' : 'Nueva Sucursal'}
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    {editingStoreId ? 'Modifica los datos del punto de retiro' : 'Completa los datos del punto de retiro'}
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
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nombre de la Sucursal</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Ej: Sabores Riojanos - Centro"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all uppercase"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Dirección Física</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Ej: Av. Rivadavia 123"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all uppercase"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">WhatsApp</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="5493804..."
                                        value={formData.whatsapp}
                                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Google Maps (Opcional)</label>
                                    <input
                                        type="url"
                                        placeholder="https://maps..."
                                        value={formData.mapsUrl}
                                        onChange={(e) => setFormData({ ...formData, mapsUrl: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Probabilidad (Total 100%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    required
                                    placeholder="%"
                                    value={formData.probability}
                                    onChange={(e) => {
                                        const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                                        setFormData({ ...formData, probability: val });
                                    }}
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                                <p className="text-[10px] font-medium text-slate-400 ml-2">Al cambiar este valor, el resto se ajustará automáticamente.</p>
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
                                    className="flex-[2] px-6 py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-green-500/20 active:scale-95 disabled:opacity-50"
                                >
                                    {isSaving ? 'Guardando...' : editingStoreId ? 'Guardar Cambios' : 'Confirmar Sucursal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div >
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
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">¿Eliminar Sucursal?</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8 leading-relaxed">
                                Esta acción no se puede deshacer. Se borrará permanentemente de la base de datos.
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleDeleteStore(showDeleteConfirm)}
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
