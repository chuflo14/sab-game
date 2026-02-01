'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QrCode, Smartphone, ChevronRight, Loader2 } from 'lucide-react';
import ReactQRCode from 'react-qr-code';
import { fetchChangoConfig } from '@/lib/actions';



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
            router.push('/');
        }, config.timeout * 1000);

        return () => clearTimeout(timer);
    }, [status, config.timeout, router]);

    // 1. Create Payment Preference on Mount
    useEffect(() => {
        const createPayment = async () => {
            try {
                const res = await fetch('/api/payment/create', { method: 'POST', body: '{}' });
                const data = await res.json();

                if (res.ok && data.init_point && data.external_reference) {
                    setPaymentUrl(data.init_point);
                    setExternalRef(data.external_reference);
                    if (data.amount) setAmount(data.amount);
                    setStatus('scanning');
                } else {
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
            try {
                const res = await fetch(`/api/payment/status?external_reference=${externalRef}`);
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
                <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

                    {/* Left Side: Explainer */}
                    <div className="space-y-8 order-2 md:order-1">
                        <div>
                            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-wider leading-tight mb-4">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                                    Para Jugar
                                </span>
                                <br />
                                Escanea el QR
                            </h1>
                            <p className="text-xl text-white/60 leading-relaxed">
                                Solo aceptamos pagos con Mercado Pago.
                                <br />
                                {status === 'loading' ? (
                                    <span className="text-white/50 text-sm animate-pulse">Cargando precio...</span>
                                ) : (
                                    <span className="text-white font-bold">Valor de la ficha: ${amount.toLocaleString('es-AR')}</span>
                                )}
                            </p>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                                    <Smartphone className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-bold text-lg">Abre Mercado Pago</p>
                                    <p className="text-sm text-white/50">Escanea el QR para pagar</p>
                                </div>
                            </div>
                        </div>
                        {/* Hidden Dev Bypass removed. Use secret gesture if needed or rely on error screen fallback. */}
                    </div>

                    {/* Right Side: QR Display */}
                    <div className="flex justify-center order-1 md:order-2">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-[2.5rem] blur-xl opacity-50 transition-opacity" />
                            <div className="relative bg-white p-6 rounded-[2rem] shadow-2xl min-w-[350px] min-h-[450px] flex flex-col items-center justify-center gap-6">

                                {status === 'loading' ? (
                                    <div className="flex flex-col items-center gap-4 py-20">
                                        <Loader2 className="w-12 h-12 text-slate-300 animate-spin" />
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Generando QR...</p>
                                    </div>
                                ) : paymentUrl ? (
                                    <>
                                        <div className="bg-white p-2 rounded-xl">
                                            <ReactQRCode value={paymentUrl} size={256} />
                                        </div>
                                        <div className="flex flex-col items-center text-slate-800">
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Total a Pagar</p>
                                            <p className="text-5xl font-black text-slate-900">${amount.toLocaleString('es-AR')}</p>
                                        </div>
                                    </>
                                ) : null}

                            </div>
                        </div>
                    </div>

                </div>
            )}
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

