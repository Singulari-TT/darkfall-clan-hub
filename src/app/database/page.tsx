export default function DatabasePage() {
    return (
        <div className="p-8 h-full flex flex-col justify-center items-center text-center space-y-6">
            <div className="w-24 h-24 bg-[#5865F2]/10 rounded-full flex items-center justify-center border border-[#5865F2]/30 mb-4 shadow-[0_0_30px_rgba(88,101,242,0.15)] ring-1 ring-white/10 backdrop-blur-sm">
                <span className="text-4xl">📚</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-wider">
                THE ARCHIVES
            </h2>
            <p className="max-w-md text-gray-400 font-sans">
                Select a category from the archives to view live data retrieved directly from the Guild&apos;s records.
            </p>
        </div>
    );
}
