import fs from 'fs';

const content = fs.readFileSync('/home/rishabh/webdev/bhalu/src/pages/business/TalentBridge.tsx', 'utf8');

const startStr = `            {/* Bounty Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBounties.map((bounty) => {
                    const isExpanded = expandedBountyId === bounty.id;
                    const bgColor = getCategoryColor(bounty.category);
                    const isInReview = bounty.status === "REVIEW";
                    const isRevisionRequested = bounty.status === "REVISION_REQUESTED";
                    const isCompleted = bounty.status === "COMPLETED";

                    // ===== COLLAPSED CARD — Plain light theme with colored accent =====
                    if (!isExpanded) {`;

const endStr = `                    );
                })}

                {filteredBounties.length === 0`;

let startIndex = content.indexOf(startStr);
if (startIndex === -1) {
    console.error("COULD NOT FIND START");
    process.exit(1);
}

const rest = content.slice(startIndex);
let endIdx = rest.indexOf(endStr);
if (endIdx === -1) {
    console.error("COULD NOT FIND END");
    process.exit(1);
}

const theEndIdx = startIndex + endIdx + endStr.length;

const insideLoop = rest.slice(0, rest.indexOf(endStr));
const rightPanel = insideLoop.split('{/* Right — White Details Panel */}')[1].split('                            </div>\n                        </div>\n                    );\n')[0];

const newStr = `            {/* Bounty Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBounties.map((bounty) => {
                    const bgColor = getCategoryColor(bounty.category);

                    return (
                        <div
                            key={bounty.id}
                            className="bg-card rounded-[24px] border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                        >
                            <div className="p-5 md:p-6">
                                <div className="flex justify-between items-start mb-3">
                                    <span className={\`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border \${getStatusColor(bounty.status)}\`}>
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: bgColor }} />
                                        {bounty.status.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{bounty.category}</span>
                                </div>

                                <h3 className="text-lg font-bold leading-tight tracking-tight text-slate-900 mb-2 line-clamp-2">
                                    {bounty.title}
                                </h3>

                                <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                                    {bounty.description}
                                </p>

                                <div className="flex items-center justify-between text-sm font-bold border-t border-slate-100 pt-4 mt-2">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center text-slate-400">
                                            <Timer className="w-3.5 h-3.5 mr-1" />
                                            <span className="text-xs">48H</span>
                                        </div>
                                        {bounty.bids.length > 0 && (
                                            <span className="px-2.5 py-0.5 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500">
                                                {bounty.bids.length} BID{bounty.bids.length !== 1 ? 'S' : ''}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xl font-black tracking-tight text-slate-900">₹{bounty.price.toLocaleString()}</span>
                                </div>

                                <button
                                    onClick={() => setExpandedBountyId(bounty.id)}
                                    className="w-full mt-5 flex items-center justify-center gap-2 px-4 py-4 rounded-full text-xs font-bold uppercase tracking-widest transition-all hover:scale-[1.02]"
                                    style={{ backgroundColor: "#111111", color: '#ffffff' }}
                                >
                                    View Details
                                    <ArrowUpRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ===== DIALOG FOR EXPANDED BOUNTY ===== */}
            <Dialog open={!!expandedBountyId} onOpenChange={(open) => !open && setExpandedBountyId(null)}>
                <DialogContent className="p-0 border-none shadow-2xl max-w-5xl rounded-[24px] overflow-hidden bg-transparent [&>button]:hidden">
                    {(() => {
                        const bounty = bounties.find(b => b.id === expandedBountyId);
                        if (!bounty) return null;
                        const bgColor = getCategoryColor(bounty.category);
                        const isInReview = bounty.status === "REVIEW";
                        const isRevisionRequested = bounty.status === "REVISION_REQUESTED";
                        const isCompleted = bounty.status === "COMPLETED";

                        return (
                            <div className="flex flex-col lg:flex-row bg-white w-full max-h-[90vh]">
                                {/* Left — Colored Summary Panel */}
                                <div
                                    className="lg:w-[45%] p-6 md:p-8 flex flex-col justify-between text-black overflow-y-auto"
                                    style={{ backgroundColor: bgColor }}
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/10">
                                                <span className="w-2 h-2 rounded-full bg-black" />
                                                {bounty.status.replace(/_/g, ' ')}
                                            </span>
                                            <span className="text-xs font-bold uppercase tracking-widest text-black/50">{bounty.category}</span>
                                        </div>

                                        <h3 className="text-2xl md:text-3xl font-bold leading-tight tracking-tight mb-4">
                                            {bounty.title}
                                        </h3>
                                        <p className="text-sm font-medium text-black/60 leading-relaxed mb-6">
                                            {bounty.description}
                                        </p>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between text-sm font-bold border-t border-black/10 pt-5 mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center">
                                                    <Timer className="w-4 h-4 mr-1.5" />
                                                    <span>48H LEFT</span>
                                                </div>
                                                {bounty.bids.length > 0 && (
                                                    <span className="px-3 py-1 bg-black/10 rounded-full text-xs font-bold">
                                                        {bounty.bids.length} BID{bounty.bids.length !== 1 ? 'S' : ''}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-2xl md:text-3xl font-bold tracking-tight">₹{bounty.price.toLocaleString()}</span>
                                        </div>

                                        <button
                                            onClick={() => setExpandedBountyId(null)}
                                            className="flex items-center justify-center w-full gap-2 px-5 py-4 rounded-full bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-black/80 transition-all hover:scale-[1.02]"
                                        >
                                            Close Details
                                            <ArrowUpRight className="w-4 h-4 rotate-90 transition-transform" />
                                        </button>
                                    </div>
                                </div>

                                {/* Right — White Details Panel */}
                                <div className="lg:w-[55%] bg-white p-6 md:p-8 space-y-4 overflow-y-auto max-h-[90vh]" style={{ scrollbarWidth: 'thin' }}>
${rightPanel}
                                </div>
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBounties.length === 0`;

const newContent = content.slice(0, startIndex) + newStr + content.slice(theEndIdx);
fs.writeFileSync('/home/rishabh/webdev/bhalu/src/pages/business/TalentBridge.tsx', newContent);
console.log("SUCCESS");
