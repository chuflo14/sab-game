'use client';

import { useState, useEffect } from 'react';
import { fetchQuestions, updateQuestionAction, deleteQuestionAction, fetchChangoConfig, updateChangoConfigAction } from '@/lib/actions';
import { TriviaQuestion, ChangoConfig } from '@/lib/types';
import Link from 'next/link';
import MusicUploadButton from '@/components/admin/MusicUploadButton';
import {
    Plus,
    HelpCircle,
    Brain,
    Trash2,
    Edit2,
    Check,
    Music
} from 'lucide-react';

export default function QuestionsAdminPage() {
    const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [config, setConfig] = useState<ChangoConfig | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [questionsData, configData] = await Promise.all([
            fetchQuestions(),
            fetchChangoConfig()
        ]);
        setQuestions(questionsData);
        setConfig(configData);
        setIsLoading(false);
    };

    const updateConfig = async (key: keyof ChangoConfig, value: any) => {
        const newData = { [key]: value };
        setConfig(prev => prev ? { ...prev, ...newData } : null);
        await updateChangoConfigAction(newData);
    };

    const loadQuestions = async () => {
        const data = await fetchQuestions();
        setQuestions(data);
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar esta pregunta?')) {
            await deleteQuestionAction(id);
            loadQuestions();
        }
    };

    const toggleStatus = async (q: TriviaQuestion) => {
        await updateQuestionAction(q.id, { active: !q.active });
        loadQuestions();
    };

    const updateCorrectKey = async (q: TriviaQuestion, key: 'S' | 'A' | 'B') => {
        await updateQuestionAction(q.id, { correctKey: key });
        loadQuestions();
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Banco de Preguntas</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Desafíos para el modo Trivia Riojana</p>
                </div>
                <Link
                    href="/admin/questions/create"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Nueva Pregunta
                </Link>
            </div>

            <div className="space-y-6">
                {isLoading ? (
                    <div className="p-20 flex flex-col items-center justify-center space-y-4 bg-white rounded-[2rem] border border-slate-200">
                        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Cargando Trivia...</p>
                    </div>
                ) : questions.length === 0 ? (
                    <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs bg-white rounded-[2rem] border border-slate-200">
                        No hay preguntas registradas
                    </div>
                ) : (
                    questions.map((q) => (
                        <div key={q.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden group hover:border-blue-500 transition-all duration-300">
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600">
                                            <HelpCircle className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none mb-2">{q.question}</h4>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pregunta Interactiva</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleStatus(q)}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${q.active ? 'bg-green-500/10 text-green-600' : 'bg-slate-100 text-slate-400'}`}
                                        >
                                            {q.active ? 'Publicado' : 'Borrador'}
                                        </button>
                                        <Link
                                            href={`/admin/questions/${q.id}/edit`}
                                            className="p-2 text-slate-300 hover:text-blue-500 rounded-xl transition-colors"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(q.id)}
                                            className="p-2 text-slate-300 hover:text-red-500 rounded-xl transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {(['S', 'A', 'B'] as const).map((key) => {
                                        const isCorrect = q.correctKey === key;
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => updateCorrectKey(q, key)}
                                                className={`p-6 rounded-3xl border-2 transition-all text-left relative group/opt ${isCorrect ? 'border-green-500 bg-green-50/50 shadow-lg shadow-green-500/5' : 'border-slate-100 bg-slate-50 hover:border-blue-500 hover:bg-white'}`}
                                            >
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm absolute top-4 right-4 transition-colors ${isCorrect ? 'bg-green-500 text-white' : 'bg-white text-slate-400 group-hover/opt:bg-blue-500 group-hover/opt:text-white'}`}>
                                                    {isCorrect ? <Check className="w-4 h-4" /> : key}
                                                </div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Opción {key}</p>
                                                <p className={`font-black uppercase tracking-tight ${isCorrect ? 'text-green-700' : 'text-slate-600'}`}>{q.options[key]}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="bg-slate-800 p-10 rounded-[2.5rem] flex items-center gap-10 text-white shadow-2xl relative overflow-hidden">
                <Brain className="absolute -bottom-10 -left-10 w-64 h-64 text-white/5" />
                <div className="flex-1 space-y-4 relative z-10">
                    <h4 className="text-2xl font-black uppercase tracking-tight leading-none">Consejo de Trivia</h4>
                    <p className="text-xs font-bold leading-relaxed text-white/40 uppercase tracking-[0.1em]">
                        Las preguntas con opciones claras y relacionadas a la cultura local de La Rioja tienen mejor aceptación entre los usuarios. Asegúrate de marcar siempre una respuesta correcta.
                    </p>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-center min-w-[150px] relative z-10">
                    <p className="text-5xl font-black text-white leading-none">{questions.length}</p>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-2 px-1 leading-tight">Total Desafíos</p>
                </div>
            </div>

            {/* Music Configuration */}
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
                        <Music className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">Música de Fondo</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ambienta el juego de Trivia</p>
                    </div>
                </div>

                <div className="max-w-md">
                    <MusicUploadButton
                        currentUrl={config?.trivia_music_url}
                        onUpload={(url) => updateConfig('trivia_music_url', url)}
                        label="Subir Música Trivia"
                    />
                </div>
            </div>
        </div>
    );
}
