export default function DatabasePage() {
    return (
        <div className="p-8 h-full flex flex-col justify-center items-center text-center space-y-6">
            <div className="w-24 h-24 bg-red-900/20 rounded-full flex items-center justify-center border border-red-900/50 mb-4 shadow-[0_0_30px_rgba(220,38,38,0.15)] ring-1 ring-amber-500/20">
                <span className="text-4xl">📚</span>
            </div>
            <h2 className="text-3xl font-heading font-black text-gray-200 tracking-wider">
                THE ARCHIVES
            </h2>
            <p className="max-w-md text-gray-400">
                Select a category from the archives to view live data retrieved directly from the Guild&apos;s records.
            </p>
        </div>
    );
}
