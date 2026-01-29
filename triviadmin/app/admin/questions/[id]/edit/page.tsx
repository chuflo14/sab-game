'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchQuestions, updateQuestionAction } from '@/lib/actions';
import {
    ArrowLeft,
    Save,
    CheckCircle2,
    Edit3
} from 'lucide-react';
import Link from 'next/link';

export default function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState({ S: '', A: '', B: '' });
    const [correctKey, setCorrectKey] = useState<'S' | 'A' | 'B'>('S');
    const [active, setActive] = useState(true);

    const loadQuestion = useCallback(async () => {
        setIsLoading(true);
        const allQuestions = await fetchQuestions();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const q = allQuestions.find(item => item.id === id) as any; // Cast as any to handle legacy fields
        if (q) {
            // Support 'question' or 'text'
            setQuestion(q.question || q.text || '');

            // Support legacy array options or new S/A/B object
            if (Array.isArray(q.options)) {
                setOptions({
                    S: q.options[0] || '',
                    A: q.options[1] || '',
                    B: q.options[2] || ''
                });
            } else {
                setOptions(q.options || { S: '', A: '', B: '' });
            }

            // Support 'correctKey' or 'correctAnswer' (number index)
            if (q.correctKey) {
                setCorrectKey(q.correctKey);
            } else if (typeof q.correctAnswer === 'number') {
                const map: Record<number, 'S' | 'A' | 'B'> = { 0: 'S', 1: 'A', 2: 'B' };
                setCorrectKey(map[q.correctAnswer] || 'S');
            }

            setActive(q.active !== false);
        } else {
            router.push('/admin/questions');
        }
        setIsLoading(false);
    }, [id, router]);

    useEffect(() => {
        loadQuestion();
    }, [loadQuestion]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question || !options.S || !options.A || !options.B) {
            alert('Por favor complete todos los campos');
            return;
        }

        setIsSaving(true);
        try {
            await updateQuestionAction(id, {
                question,
                options,
                correctKey,
                active
            });
            router.push('/admin/questions');
        } catch (error) {
            console.error(error);
            alert('Eror al actualizar la pregunta');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return (
        <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Localizando Desafío...</p>
        </div>
    );

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
                    Editando Desafío
                </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />

                <form onSubmit={handleSubmit} className="p-12 space-y-12">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between gap-4 mb-2">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600">
                                    <Edit3 className="w-5 h-5" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Editar Contenido</h3>
                            </div>

                            <button
                                type="button"
                                onClick={() => setActive(!active)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'}`}
                            >
                                {active ? 'Publicado' : 'Borrador'}
                            </button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Enunciado de la Pregunta</label>
                            <textarea
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
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
                                            value={options[key] || ''}
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
