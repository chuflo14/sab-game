-- Games Table
CREATE TABLE IF NOT EXISTS public.games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    route TEXT NOT NULL,
    image_url TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Machine Games Relation
-- machines.id is TEXT, so machine_id must be TEXT
CREATE TABLE IF NOT EXISTS public.machine_games (
    machine_id TEXT REFERENCES public.machines(id) ON DELETE CASCADE,
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (machine_id, game_id)
);

-- Seed Games
INSERT INTO public.games (slug, name, description, route, image_url, active) VALUES
('trivia', 'Trivia Riojana', 'El desafío mental con identidad local', '/play/trivia', '/media/games/trivia.png', TRUE),
('ruleta', 'La Ruleta', 'El azar puro con un toque divertido', '/play/azar', '/media/games/ruleta.png', TRUE),
('chango', 'Dedo de Chango', '¡Inflá el globo lo más rápido posible!', '/play/suerte', '/media/games/chango.png', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Enable all games for existing machines
INSERT INTO public.machine_games (machine_id, game_id, active)
SELECT m.id, g.id, TRUE
FROM public.machines m
CROSS JOIN public.games g
ON CONFLICT (machine_id, game_id) DO NOTHING;
