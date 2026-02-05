'use client';

import { useState, useEffect } from 'react';
import { fetchGames } from '@/lib/actions';
import { Game } from '@/lib/types';
import { Layers, Activity } from 'lucide-react';

export default function GamesPage() {
    const [games, setGames] = useState<Game[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadGames();
    }, []);

    const loadGames = async () => {
        setIsLoading(true);
        const data = await fetchGames();
        setGames(data);
        setIsLoading(false);
    };

    return (
        <div className="space-y-6 md:space-y-10 pb-20 px-4 md:px-0">
            <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">Juegos Disponibles</h3>
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Configuración global del catálogo</p>
                </div>
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                    <Layers className="w-6 h-6" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 animate-pulse h-48" />
                    ))
                ) : games.map(game => (
                    <div key={game.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-4 mb-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={game.imageUrl || '/placeholder.png'}
                                alt={game.name}
                                className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-slate-100"
                                onError={(e) => e.currentTarget.style.display = 'none'}
                            />
                            <div>
                                <h4 className="font-black text-slate-900 uppercase text-lg leading-none mb-1">{game.name}</h4>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest">{game.slug}</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mb-6 font-medium leading-relaxed min-h-[3em]">{game.description}</p>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${game.active ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${game.active ? 'text-green-600' : 'text-red-500'}`}>
                                    {game.active ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                            <div className="px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Global
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
