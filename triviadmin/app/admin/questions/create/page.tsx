'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createQuestion } from '@/lib/actions';
import { TriviaQuestion } from '@/lib/types';
import {
    ArrowLeft,
    Save,
    HelpCircle,
    CheckCircle2,
    Settings2
} from 'lucide-react';
import Link from 'next/link';

export default function CreateQuestionPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState({ S: '', A: '', B: '' });
    const [correctKey, setCorrectKey] = useState<'S' | 'A' | 'B'>('S');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question || !options.S || !options.A || !options.B) {
            alert('Por favor complete todos los campos');
            return;
        }

        setIsLoading(true);
        try {
            const newQ: TriviaQuestion = {
                id: crypto.randomUUID(),
                question,
                options,
                correctKey,
                active: true
            };
            await createQuestion(newQ);
            router.push('/admin/questions');
        } catch (error) {
            console.error(error);
            alert('Eror al crear la pregunta');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-20">
            <div className="flex items-center justify-between">
                <Link
                    href="/admin/questions"
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-800 font-black text-xs uppercase tracking-widest transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Volver al Listado
                </Link>

                <div className="px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Nueva Pregunta
                </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />

                <form onSubmit={handleSubmit} className="p-12 space-y-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600">
                                <HelpCircle className="w-5 h-5" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Contenido del Desafío</h3>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Enunciado de la Pregunta</label>
                            <textarea
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="Ej: ¿En qué año se fundó la ciudad de La Rioja?"
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-xl font-black text-slate-800 tracking-tight focus:ring-4 focus:ring-blue-500/10 outline-none transition-all min-h-[140px]"
                            />
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-600">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Opciones de Respuesta</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {(['S', 'A', 'B'] as const).map((key) => (
                                <div key={key} className={`p-6 rounded-[2rem] border-2 transition-all flex items-center gap-6 ${correctKey === key ? 'border-green-500 bg-green-50/50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}>
                                    <div
                                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black transition-all shrink-0 ${correctKey === key ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-white text-slate-300 border border-slate-200'}`}
                                    >
                                        {key}
                                    </div>

                                    <div className="flex-1 space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Respuesta para la tecla {key}</p>
                                        <input
                                            type="text"
                                            value={options[key]}
                                            onChange={(e) => setOptions(prev => ({ ...prev, [key]: e.target.value }))}
                                            placeholder={`Escriba la opción ${key}...`}
                                            className="w-full bg-transparent border-none p-0 text-xl font-black text-slate-800 uppercase tracking-tight outline-none placeholder:text-slate-200"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setCorrectKey(key)}
                                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${correctKey === key ? 'bg-green-500 text-white' : 'bg-white text-slate-400 border border-slate-200 hover:border-green-500 hover:text-green-600'}`}
                                    >
                                        {correctKey === key ? 'ES LA CORRECTA' : 'MARCAR CORRECTA'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-2xl py-6 font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl transition-all active:scale-95"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Crear Desafío
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-blue-600 p-8 rounded-[2rem] flex items-center gap-6 text-white shadow-xl shadow-blue-600/20">
                <Settings2 className="w-10 h-10 opacity-50" />
                <p className="text-xs font-bold leading-relaxed uppercase tracking-wider">
                    RECUERDE QUE LA TECLA PRESIONADA POR EL USUARIO DEBE COINCIDIR CON LA LETRA DE LA OPCIÓN QUE USTED MARQUE COMO CORRECTA.
                </p>
            </div>
        </div>
    );
}
