import { getTicket, getStoreDetails, fetchChangoConfig } from '@/lib/actions';
import ResultDisplay from '@/components/ResultDisplay';

export default async function ResultPage({
  searchParams,
}: {
  searchParams: Promise<{ ticketId: string }>
}) {
  const { ticketId } = await searchParams;
  const ticket = await getTicket(ticketId);
  const config = await fetchChangoConfig();

  if (!ticket) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="bg-red-900/50 p-8 rounded border border-red-700">
          Error: Ticket no encontrado.
        </div>
      </div>
    );
  }

  const store = ticket.storeId ? await getStoreDetails(ticket.storeId) : undefined;

  return <ResultDisplay ticket={ticket} store={store} config={config} />;
}
