import { supabase } from "@/lib/supabase";

export default async function Vault() {
    const { data: inventory, error } = await supabase
        .from("Bank_Inventory")
        .select("*")
        .eq("is_visible", true)
        .order("target_quantity", { ascending: false });

    if (error) {
        console.error("Error fetching inventory:", error);
        return <div className="p-8 text-red-500 text-center">Failed to load the Vault.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-950 text-gray-200 p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-10">
                <header className="border-b border-gray-800 pb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-5xl font-black bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 text-transparent bg-clip-text drop-shadow-sm tracking-tight">The Vault</h1>
                        <p className="text-gray-400 mt-3 text-lg font-medium">Clan Treasury and Current Material Goals</p>
                    </div>
                    <div className="text-sm px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-500 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Live Synchronization
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {inventory?.map((item: any) => {
                        const hasTarget = item.target_quantity && item.target_quantity > 0;
                        const progressRaw = hasTarget ? (item.current_quantity / item.target_quantity) * 100 : 0;
                        const progress = Math.min(Math.max(progressRaw, 0), 100); // Clamp between 0 and 100

                        // Progress bar color based on completion
                        let progressColor = "bg-indigo-500";
                        if (progress >= 100) progressColor = "bg-emerald-500";
                        else if (progress > 75) progressColor = "bg-teal-400";
                        else if (progress < 25) progressColor = "bg-rose-500";

                        return (
                            <div
                                key={item.id}
                                className="bg-gray-900 border border-gray-800 rounded-2xl p-6 relative overflow-hidden group hover:border-gray-600 transition-all duration-300 shadow-xl"
                            >
                                {/* Subtle gradient background effect on hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                <div className="relative z-10 space-y-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-bold text-gray-100 truncate" title={item.item_name}>
                                                {item.item_name}
                                            </h3>
                                            <div className="mt-1 flex items-baseline gap-2">
                                                <span className="text-2xl font-black text-white">{item.current_quantity.toLocaleString()}</span>
                                                {hasTarget && (
                                                    <span className="text-sm font-medium text-gray-500">/ {item.target_quantity.toLocaleString()}</span>
                                                )}
                                            </div>
                                        </div>
                                        {/* Placeholder for actual game icon */}
                                        <div className="w-14 h-14 bg-gray-800 rounded-xl border border-gray-700 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                                            {item.icon_path ? (
                                                <img src={item.icon_path} alt={item.item_name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-gray-600 text-xs font-bold uppercase">No Icon</span>
                                            )}
                                        </div>
                                    </div>

                                    {hasTarget && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-xs font-semibold">
                                                <span className="text-gray-400 uppercase tracking-widest">Goal Status</span>
                                                <span className={`${progress >= 100 ? 'text-emerald-400' : 'text-gray-300'}`}>
                                                    {progress.toFixed(0)}%
                                                </span>
                                            </div>
                                            <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden shadow-inner relative">
                                                {/* The actual progress fill */}
                                                <div
                                                    className={`h-full ${progressColor} transition-all duration-1000 ease-out`}
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                                {/* Shine effect on progress bar */}
                                                {progress > 0 && progress < 100 && (
                                                    <div className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" style={{ width: '200%' }}></div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {!hasTarget && (
                                        <div className="pt-2">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-400 border border-gray-700">
                                                No Target Set
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {(!inventory || inventory.length === 0) && (
                        <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-800 rounded-2xl">
                            <svg className="mx-auto h-12 w-12 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-400">The Vault is Empty</h3>
                            <p className="mt-1 text-sm text-gray-500">No items are currently visible in the treasury.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
