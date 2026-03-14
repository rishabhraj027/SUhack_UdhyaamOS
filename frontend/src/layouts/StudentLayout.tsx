import { NavLink, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { TerminalSquare, Compass, ShieldAlert, Target, LogOut, Flame } from "lucide-react";

export default function StudentLayout() {
    const { user, logout } = useAuthStore();
    const links = [
        { to: ".", label: "Quests", icon: <Compass className="w-5 h-5" /> },
        { to: "tasks", label: "Runtime", icon: <Target className="w-5 h-5" /> },
        { to: "profile", label: "Stats", icon: <ShieldAlert className="w-5 h-5" /> },
    ];

    return (
        <div className="flex w-full min-h-[100dvh] bg-[#111111] overflow-hidden font-data text-white">
            {/* Pop-Art Brutalist Sidebar */}
            <aside className="w-72 flex-shrink-0 bg-[#0A0A0A] border-r-[4px] border-[#222222] p-8 flex flex-col relative z-20">
                <div className="flex items-center gap-3 mb-12">
                    <div className="w-12 h-12 bg-white text-[#0A0A0A] rounded-xl flex items-center justify-center border-[3px] border-[#222222] shadow-[4px_4px_0_0_#A3E635]">
                        <TerminalSquare className="w-7 h-7" strokeWidth={2.5} />
                    </div>
                    <span className="font-black text-2xl tracking-tighter uppercase text-white">Junior-Pro</span>
                </div>

                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4 px-3">Terminal</div>

                <nav className="flex-1 flex flex-col gap-2">
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end={link.to === "."}
                            className={({ isActive }) =>
                                `flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border-[3px] ${isActive
                                    ? "bg-[#A3E635] text-[#0A0A0A] border-[#0A0A0A] shadow-[4px_4px_0_0_#A78BFA]"
                                    : "bg-transparent text-white/70 border-transparent hover:border-[#333333] hover:bg-[#1A1A1A]"
                                }`
                            }
                        >
                            {link.icon}
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="mt-8 pt-8 border-t-[3px] border-[#222222]">
                    <div className="flex items-center gap-3 mb-6 bg-[#222222] p-3 rounded-xl border-[3px] border-[#111111]">
                        <div className="w-10 h-10 rounded-lg bg-[#FFDE59] text-[#0A0A0A] flex items-center justify-center font-black text-lg border-2 border-[#0A0A0A]">
                            {user?.name?.charAt(0)}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <div className="font-black tracking-tight text-white truncate text-sm">{user?.name}</div>
                            <div className="text-xs text-[#A3E635] font-bold tracking-widest uppercase">Rank: Novice</div>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-transparent hover:bg-[#FF5757] text-white hover:text-[#0A0A0A] font-black uppercase tracking-widest text-xs rounded-xl border-[3px] border-[#222222] hover:border-[#0A0A0A] transition-all"
                    >
                        <LogOut className="w-4 h-4" strokeWidth={3} />
                        Abort Uplink
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative h-[100dvh]">
                {/* Decorative dots */}
                <div className="absolute inset-0 opacity-5 pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(white 2px, transparent 2px)', backgroundSize: '30px 30px' }} />

                <header className="h-24 px-12 flex items-center justify-between border-b-[4px] border-[#222222] relative z-10 bg-[#111111]/80 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="w-4 h-4 rounded-full bg-[#FF5757] animate-pulse border-2 border-[#0A0A0A]" />
                        <h2 className="text-xl font-black text-white tracking-tighter uppercase flex items-center gap-2">
                            Global Feed <Flame className="w-5 h-5 text-[#FFDE59]" />
                        </h2>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8 md:p-12 relative z-10 hide-scrollbar">
                    <div className="max-w-6xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>

            <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
        </div>
    );
}
