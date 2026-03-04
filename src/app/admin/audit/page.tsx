import { fetchAuditLogs, AuditLog } from "../../api/admin/actions";
import { formatDistanceToNow } from "date-fns";

export default async function AuditTrailPage() {
    const logs = await fetchAuditLogs();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">Audit Trail</h2>
                    <p className="text-slate-400">Recent system actions, logins, and navigations.</p>
                </div>
                <div className="mt-4 sm:mt-0 px-4 py-2 bg-slate-800 rounded-lg border border-slate-700 text-sm">
                    Showing last <span className="font-bold text-emerald-400">{logs.length}</span> events
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-800/50">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-700/50 text-slate-300">
                        <tr>
                            <th className="px-6 py-4 font-semibold">User</th>
                            <th className="px-6 py-4 font-semibold">Action</th>
                            <th className="px-6 py-4 font-semibold">Resource</th>
                            <th className="px-6 py-4 font-semibold">Details</th>
                            <th className="px-6 py-4 font-semibold text-right">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">
                                    No audit logs found.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log: AuditLog) => (
                                <tr key={log.id} className="hover:bg-slate-700/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            {/* We can display role pill here later if needed */}
                                            <span className="font-medium text-slate-200">
                                                {log.Users?.display_name || 'Unknown User'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${log.action === 'LOGIN' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                            log.action === 'PAGE_VIEW' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                                                'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-300 font-mono text-xs">
                                        {log.resource}
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 max-w-xs truncate" title={log.details || ''}>
                                        {log.details || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right text-slate-500 text-xs">
                                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
