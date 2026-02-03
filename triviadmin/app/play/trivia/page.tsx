import { fetchRandomQuestions, fetchChangoConfig } from '@/lib/actions';
import TriviaGame from '@/components/TriviaGame';
import BackgroundMusic from '@/components/BackgroundMusic';

export const dynamic = 'force-dynamic';

export default async function TriviaPage() {
    const questions = await fetchRandomQuestions(3);
    const config = await fetchChangoConfig();

    return (
        <>
            <BackgroundMusic src={config?.trivia_music_url} />
            <TriviaGame questions={questions} />
        </>
    );
}

