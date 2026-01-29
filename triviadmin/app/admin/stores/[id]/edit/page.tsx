'use client';

import { getStoreDetails, updateStoreAction } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Store } from '@/lib/types';
import { use } from 'react';

export default function EditStorePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [store, setStore] = useState<Store | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getStoreDetails(id).then((data) => {
            setStore(data);
            setLoading(false);
        });
    }, [id]);

    async function handleSubmit(formData: FormData) {
        if (!store) return;

        const name = formData.get('name') as string;
        const address = formData.get('address') as string;
        const whatsapp = formData.get('whatsapp') as string;
        const mapsUrl = formData.get('mapsUrl') as string;

        await updateStoreAction(store.id, {
            name,
            address,
            whatsapp,
            mapsUrl: mapsUrl || undefined
        });

        router.push('/admin/stores');
        router.refresh();
    }

    if (loading) return <div>Cargando...</div>;
    if (!store) return <div>Tienda no encontrada</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Editar Tienda</h1>

            <form action={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Tienda</label>
                    <input name="name" defaultValue={store.name} required className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Física</label>
                    <input name="address" defaultValue={store.address} required className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp (con código de país)</label>
                    <input name="whatsapp" defaultValue={store.whatsapp} required className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps URL (Opcional)</label>
                    <input name="mapsUrl" defaultValue={store.mapsUrl} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => router.back()} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        Guardar Cambios
                    </button>
                </div>
            </form>
        </div>
    );
}
