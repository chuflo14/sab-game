'use client';

import { createStore } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CreateStorePage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true);
        const name = formData.get('name') as string;
        const address = formData.get('address') as string;
        const whatsapp = formData.get('whatsapp') as string;
        const mapsUrl = formData.get('mapsUrl') as string;

        await createStore({
            id: crypto.randomUUID(),
            name,
            address,
            whatsapp,
            mapsUrl: mapsUrl || undefined,
            active: true
        });

        router.push('/admin/stores');
        router.refresh();
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Nueva Tienda</h1>

            <form action={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Tienda</label>
                    <input name="name" required className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej. Sucursal Centro" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Física</label>
                    <input name="address" required className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Av. Siempre Viva 123" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp (con código de país)</label>
                    <input name="whatsapp" required className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="5491122334455" />
                    <p className="text-xs text-gray-500 mt-1">Sin espacios ni guiones.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps URL (Opcional)</label>
                    <input name="mapsUrl" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://maps.app.goo.gl/..." />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => router.back()} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                    <button disabled={isSubmitting} type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                        {isSubmitting ? 'Guardando...' : 'Crear Tienda'}
                    </button>
                </div>
            </form>
        </div>
    );
}
