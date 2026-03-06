import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase';

// This assumes you will use the Bank_Ledger table which the NodeJS script feeds.
// For a "raw scrape history" you could also create a dedicated Vault_History table.
// We will query the Bank_Ledger for the stats since it contains the parsed XML.

async function fetchVaultStats() {
    const { data, error } = await supabase
        .from('Bank_Ledger')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100); // Pagination could be added later

    if (error) {
        console.error("Error fetching vault stats:", error);
        return [];
    }
    return data;
}

export default async function VaultStatsPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'Admin') {
        redirect('/');
    }

    const ledgerEntries = await fetchVaultStats();

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-gray-900/50 p-6 rounded-lg border border-gray-800 backdrop-blur-sm">
                <div>
                    <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
                        <span className="text-4xl text-blue-500">📊</span>
                        Vault Statistics
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Comprehensive history of all Clan Vault transactions, automatically synced via intelligence scrapers.
                    </p>
                </div>
            </div>

            <div className="xl:col-span-2 space-y-6">
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 backdrop-blur-sm">
                    <h2 className="text-xl font-bold text-gray-100 mb-6 flex items-center gap-2">
                        <span className="text-yellow-500">📜</span> Automatic Scrape Log
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-800">
                            <thead>
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Member</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Item</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {ledgerEntries.map((entry: any) => (
                                    <tr key={entry.id} className="hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {new Date(entry.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-200">{entry.source}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-300">{entry.item_name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${entry.quantity > 0
                                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                }`}>
                                                {entry.quantity > 0 ? '+' : ''}{entry.quantity}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {ledgerEntries.length === 0 && (
                            <div className="text-center py-12">
                                <span className="text-4xl block mb-4">📭</span>
                                <p className="text-gray-400">The intelligence scrapers have not logged any vault history yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
