import Link from "next/link";
import { BookOpen, Scroll, Skull, Home, Map } from "lucide-react";

export default function DatabaseLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const tabs = [
        { name: "Overview", href: "/database", icon: BookOpen },
        { name: "Bestiary", href: "/database/bestiary", icon: Skull },
        { name: "Crafting & Alchemy", href: "/database/crafting", icon: Scroll },
        { name: "Dungeons", href: "/database/dungeons", icon: Map },
        { name: "Housing Modules", href: "/database/housing", icon: Home },
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a] bg-[url('/noise.png')] bg-repeat text-gray-200 p-4 sm:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="relative border border-red-900/40 bg-black/60 backdrop-blur-md p-6 sm:p-8 rounded-lg overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 via-transparent to-black/80 pointer-events-none" />
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-900/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10">
                        <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500 tracking-wider font-heading uppercase">
                            Knowledge Base
                        </h1>
                        <p className="mt-2 text-gray-400 max-w-2xl text-sm sm:text-base">
                            A comprehensive archive of world data including beast weaknesses, transmutation recipes, dungeon locations, and structural costs. Live updated from the Guild Archives.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar Navigation */}
                    <div className="lg:w-64 flex-shrink-0 space-y-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <Link
                                    key={tab.name}
                                    href={tab.href}
                                    className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all bg-black/40 border border-white/5 hover:border-red-900/50 hover:bg-red-950/30 text-gray-400 hover:text-amber-500 group"
                                >
                                    <Icon className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:text-red-500 transition-colors" />
                                    {tab.name}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 bg-black/30 border border-white/5 rounded-lg p-1 min-h-[500px]">
                        {children}
                    </div>
                </div>

            </div>
        </div>
    );
}
