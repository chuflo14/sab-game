'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Smartphone, ChevronRight, Loader2 } from 'lucide-react';
import ReactQRCode from 'react-qr-code';
import { fetchChangoConfig } from '@/lib/actions';
import { sendJoystickEvent } from '@/lib/realtime';
import { LegalFooter } from '@/components/LegalFooter';



import { Suspense } from 'react';

function PaymentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const nextRoute = searchParams.get('next') || '/play';
    const [status, setStatus] = useState<'loading' | 'pending' | 'scanning' | 'approved'>('loading');
    const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
    const [externalRef, setExternalRef] = useState<string | null>(null);
    const [amount, setAmount] = useState<number>(1000); // Default to 1000
    const [error, setError] = useState<string | null>(null);
    const [clickCount, setClickCount] = useState(0);
    const [config, setConfig] = useState<{ timeout: number, success: number }>({ timeout: 60, success: 3 });

    // Load Config
    useEffect(() => {
        fetchChangoConfig().then(c => {
            if (c) {
                setConfig({
                    timeout: c.paymentTimeoutSeconds || 60,
                    success: c.paymentSuccessSeconds || 3
                });
            }
        });
    }, []);

    // Timeout Logic
    useEffect(() => {
        if (status === 'approved' || status === 'loading') return;

        console.log('PaymentPage: Starting timeout timer:', config.timeout);
        const timer = setTimeout(() => {
            console.log('PaymentPage: Timeout reached, redirecting to home');
            const mId = localStorage.getItem('MACHINE_ID');
            if (mId) {
                sendJoystickEvent(mId, { type: 'TIMEOUT' });
            }
            router.push('/');
        }, config.timeout * 1000);

        return () => clearTimeout(timer);
    }, [status, config.timeout, router]);

    // 1. Create Payment Preference on Mount
    useEffect(() => {
        const createPayment = async () => {
            try {
                const mId = localStorage.getItem('MACHINE_ID');
                const res = await fetch('/api/payment/create', {
                    method: 'POST',
                    body: JSON.stringify({ machineId: mId })
                });
                const data = await res.json();

                if (res.ok && data.init_point && data.external_reference) {
                    console.log('DEBUG: Payment created', { id: data.id, ref: data.external_reference });
                    setPaymentUrl(data.init_point);
                    setExternalRef(data.external_reference);
                    if (data.amount) setAmount(data.amount);
                    setStatus('scanning');

                    // Report state to joystick
                    if (mId) {
                        sendJoystickEvent(mId, {
                            type: 'STATE_CHANGE',
                            state: 'PAYING',
                            paymentUrl: data.init_point
                        });
                    }
                } else {
                    console.error('DEBUG: Payment creation failed data:', data);
                    const errorMsg = data.error || 'Error al generar el pago.';
                    const errorCode = data.code ? ` (${data.code})` : '';
                    setError(`${errorMsg}${errorCode} - Verifica tu cuenta de Mercado Pago.`);
                }
            } catch (err) {
                console.error(err);
                setError('Error de conexión con el servidor.');
            }
        };

        createPayment();
    }, []);

    // 2. Poll for Status
    useEffect(() => {
        if (!externalRef || status === 'approved') return;

        const checkStatus = async () => {
            console.log('DEBUG: Polling status for ref:', externalRef);
            try {
                const res = await fetch(`/api/payment/status?external_reference=${externalRef}`, { cache: 'no-store' });
                const data = await res.json();

                if (data.status === 'approved') {
                    setStatus('approved');
                    setTimeout(() => {
                        router.push(nextRoute); // Go to game selection or next route
                    }, config.success * 1000);
                }
            } catch (err) {
                console.error("Polling error", err);
            }
        };

        const interval = setInterval(checkStatus, 3000); // Check every 3 seconds
        return () => clearInterval(interval);
    }, [externalRef, status, router, nextRoute]);


    // Dev Bypass
    const handleSimulatePayment = () => {
        setStatus('approved');
        setTimeout(() => {
            router.push(nextRoute);
        }, config.success * 1000);
    };

    if (error) {
        return (
            <div className="h-screen w-screen bg-black text-white flex flex-col items-center justify-center p-8">
                {/* Secret Click Area on Error Text */}
                <div
                    onClick={() => {
                        const newCount = (clickCount + 1);
                        setClickCount(newCount);
                        if (newCount >= 5) {
                            handleSimulatePayment();
                            setClickCount(0);
                        }
                    }}
                    className="select-none cursor-default"
                >
                    <p className="text-red-500 font-bold mb-4 text-center max-w-2xl">{error}</p>
                </div>

                <div className="flex gap-4">
                    <button onClick={() => window.location.reload()} className="bg-white/10 px-4 py-2 rounded hover:bg-white/20 transition-colors">
                        Reintentar
                    </button>
                    {/* Dev button removed for security. Tap 5 times on error text to bypass. */}
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-black text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">

            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />

            {status === 'approved' ? (
                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
                    <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.5)] mb-8">
                        <ChevronRight className="w-16 h-16 text-black" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-widest text-green-500 mb-4">¡Pago Exitoso!</h1>
                    <p className="text-xl text-white/70">Redirigiendo a los juegos...</p>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-between h-full max-h-[90vh] w-full max-w-lg py-8 animate-in fade-in zoom-in duration-500 relative z-10">

                    {/* TOP: Header */}
                    <div className="text-center space-y-4">
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                            Para Jugar
                        </h1>
                        <div className="flex items-center justify-center gap-3 text-white/80">
                            <Smartphone className="w-8 h-8 text-blue-400" />
                            <h2 className="text-2xl md:text-3xl font-bold tracking-wider uppercase">
                                Escanea el QR
                            </h2>
                        </div>
                    </div>

                    {/* CENTER: QR Code */}
                    <div className="relative group my-4">
                        {/* Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-[2.5rem] blur-2xl opacity-60 animate-pulse" />

                        {/* QR Card */}
                        <div className="relative bg-white p-6 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center gap-4 border-4 border-white/10 w-[380px] h-[480px]">

                            {status === 'loading' ? (
                                <div className="flex flex-col items-center gap-6">
                                    <Loader2 className="w-16 h-16 text-slate-300 animate-spin" />
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Generando QR...</p>
                                </div>
                            ) : paymentUrl ? (
                                <>
                                    <div className="bg-white p-2 rounded-xl">
                                        <ReactQRCode value={paymentUrl} size={300} />
                                    </div>
                                    <div className="w-full h-px bg-slate-200" />
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Mercado Pago</span>
                                    </div>
                                </>
                            ) : (
                                <p className="text-red-500 font-bold text-center">No se pudo cargar el QR</p>
                            )}
                        </div>
                    </div>

                    {/* BOTTOM: Price and Info */}
                    <div className="text-center space-y-4 bg-black/40 p-6 rounded-3xl border border-white/10 backdrop-blur-md w-full">
                        <div>
                            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">Valor de la Ficha</p>
                            {status === 'loading' ? (
                                <div className="h-10 w-32 bg-white/10 rounded animate-pulse mx-auto" />
                            ) : (
                                <p className="text-5xl font-black text-white drop-shadow-lg">
                                    ${amount.toLocaleString('es-AR')}
                                </p>
                            )}
                        </div>
                        <p className="text-white/40 text-sm max-w-xs mx-auto leading-relaxed">
                            Al pagar, se acreditará un crédito para jugar inmediatamente.
                        </p>
                    </div>

                </div>
            )}

            <LegalFooter />
        </div>
    );
}

export default function PaymentPage() {
    return (
        <Suspense fallback={<div className="h-screen bg-black" />}>
            <PaymentContent />
        </Suspense>
    );
}

