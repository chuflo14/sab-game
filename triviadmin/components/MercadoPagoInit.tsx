'use client';

import { initMercadoPago } from '@mercadopago/sdk-react';
import { useEffect } from 'react';

export default function MercadoPagoInit() {
    useEffect(() => {
        initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || '', {
            locale: 'es-AR'
        });
        console.log("MercadoPago SDK Initialized");
    }, []);

    return null;
}
