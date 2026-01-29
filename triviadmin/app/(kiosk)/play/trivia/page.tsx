import { fetchRandomQuestions } from '@/lib/actions';
import TriviaGame from '@/components/TriviaGame';

export const dynamic = 'force-dynamic';

export default async function TriviaPage() {
    const questions = await fetchRandomQuestions(3);

    return <TriviaGame questions={questions} />;
}

