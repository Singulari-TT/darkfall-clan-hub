import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface PatchNote {
    id: string;
    title: string;
    version: string;
    category: 'Feature' | 'Bugfix' | 'Security' | 'Maintenance';
    content: string;
    created_at: string;
}

export default async function PatchNotesPage() {
    const { data: notes, error } = await supabase
        .from('patch_notes')
        .select('*')
        .order('created_at', { ascending: false });

    const getCategoryStyles = (category: string) => {
        switch (category) {
            case 'Feature': return 'bg-social-cobalt-dim text-social-cobalt border-social-cobalt-border';
            case 'Bugfix': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
            case 'Security': return 'bg-command-blood-dim text-command-blood border-command-blood-border';
            case 'Maintenance': return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
            default: return 'bg-white/5 text-gray-400 border-white/10';
        }
    };

    return (
        <div className="min-h-screen bg-transparent text-gray-300 p-4 sm:p-8 font-sans selection:bg-social-cobalt-dim">
            <div className="max-w-4xl mx-auto space-y-12 relative z-10">

                <header className="border-b border-surface-border pb-8 text-center sm:text-left">
                    <h1 className="text-4xl md:text-5xl font-black font-heading text-white tracking-widest mb-3 drop-shadow-md uppercase">
                        Patch <span className="text-social-cobalt">Notes</span>
                    </h1>
                    <p className="text-gray-500 font-sans text-lg">Chronological logs of the Dreadkrew Hub's evolution and maintenance.</p>
                </header>

                <div className="space-y-12 relative">
                    {/* Vertical Timeline Line */}
                    <div className="absolute left-0 sm:left-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-surface-border via-social-cobalt-dim to-transparent hidden sm:block transform -translate-x-1/2"></div>

                    {notes && notes.length > 0 ? (
                        notes.map((note: PatchNote, index: number) => (
                            <div key={note.id} className={`relative flex flex-col sm:flex-row items-center justify-between gap-8 ${index % 2 === 0 ? 'sm:flex-row-reverse' : ''}`}>

                                {/* Timeline Dot */}
                                <div className="absolute left-0 sm:left-1/2 w-4 h-4 bg-social-cobalt rounded-full border-4 border-black shadow-[0_0_10px_rgba(88,101,242,0.8)] z-20 hidden sm:block transform -translate-x-1/2"></div>

                                {/* Content Card */}
                                <div className="w-full sm:w-[45%] bg-surface border border-surface-border rounded-card p-6 backdrop-blur-[--blur-glass] shadow-xl hover:border-social-cobalt-border hover:shadow-social-cobalt-dim/20 transition-all duration-500 group">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded border ${getCategoryStyles(note.category)}`}>
                                            {note.category}
                                        </span>
                                        <span className="text-xs font-mono text-gray-500 font-bold">{note.version}</span>
                                    </div>

                                    <h2 className="text-xl font-bold text-white mb-4 group-hover:text-social-cobalt transition-colors">{note.title}</h2>

                                    <div className="prose prose-invert prose-sm max-w-none text-gray-400 font-sans space-y-2">
                                        {/* Simple formatting for display, real markdown would use react-markdown */}
                                        {note.content.split('\n').map((line, i) => (
                                            <p key={i}>{line.replace(/^-\s/, '• ')}</p>
                                        ))}
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-surface-border flex justify-between items-center whitespace-nowrap overflow-hidden">
                                        <span className="text-[10px] text-gray-600 font-mono uppercase">{new Date(note.created_at).toLocaleDateString()}</span>
                                        <div className="h-px bg-surface-border flex-1 mx-4"></div>
                                    </div>
                                </div>

                                {/* Placeholder for opposite side spacing */}
                                <div className="hidden sm:block w-[45%]"></div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-surface border border-surface-border rounded-card p-12 text-center backdrop-blur-[--blur-glass]">
                            <p className="text-gray-500 italic mb-2">The archives are currently being compiled.</p>
                            <p className="text-xs text-social-cobalt uppercase font-bold tracking-widest">Awaiting Deployment Logs</p>
                        </div>
                    )}
                </div>

                <footer className="pt-12 text-center">
                    <Link href="/" className="text-xs text-gray-600 uppercase tracking-widest hover:text-social-cobalt transition-colors font-bold">
                        ← Return to Command Center
                    </Link>
                </footer>
            </div>
        </div>
    );
}
