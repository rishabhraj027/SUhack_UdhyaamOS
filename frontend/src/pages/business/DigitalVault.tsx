import { useEffect, useState } from "react";
import { useBountyStore } from "../../store/useBountyStore";
import { CheckCircle2, ShieldCheck, Star, ArrowUpRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { getCategoryColor } from "../junior-pro/BiddingModal";
import { SubmissionModal } from "../../components/ui/submission-modal";

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    style={{ width: size, height: size }}
                    fill={rating >= star ? "#F59E0B" : "none"}
                    stroke={rating >= star ? "#F59E0B" : "#D1D5DB"}
                    strokeWidth={1.5}
                />
            ))}
        </div>
    );
}

export default function DigitalVault() {
    const { bounties, isLoading, loadBounties } = useBountyStore();
    const [selectedBountyId, setSelectedBountyId] = useState<string | null>(null);

    useEffect(() => {
        loadBounties();
    }, [loadBounties]);

    const completedBounties = bounties.filter((b) => b.status === "COMPLETED");

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 md:p-8 max-w-[1400px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-normal tracking-tight text-foreground mb-5">Digital Vault</h1>
                    <p className="text-slate-500 text-sm font-medium">
                        Securely stored records of all completed and paid bounties.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
                {isLoading && completedBounties.length === 0 ? (
                    <div className="col-span-full py-20 text-center flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin mb-4" />
                        <span className="text-sm font-medium text-slate-500">Decrypting records...</span>
                    </div>
                ) : (
                    completedBounties.map((bounty) => {
                        const bgColor = getCategoryColor(bounty.category ?? "Miscellaneous");
                        return (
                            <div
                                key={bounty.id}
                                className="bg-card rounded-[24px] border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                            >
                                <div className="p-5 md:p-6">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-slate-100 bg-slate-50 text-slate-600">
                                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: bgColor }} />
                                            COMPLETED
                                        </span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{bounty.category}</span>
                                    </div>

                                    <h3 className="text-lg font-bold leading-tight tracking-tight text-slate-900 mb-2 line-clamp-2">
                                        {bounty.title}
                                    </h3>

                                    <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                                        {bounty.description || "Archived and successfully completed bounty."}
                                    </p>

                                    <div className="flex items-center justify-between text-sm font-bold border-t border-slate-100 pt-4 mt-2">
                                        <div className="text-left">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Paid</p>
                                            <span className="text-xl font-black tracking-tight text-slate-900">₹{bounty.price.toLocaleString()}</span>
                                        </div>
                                        {bounty.review && (
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Rating</p>
                                                <StarRating rating={bounty.review.rating} />
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => setSelectedBountyId(bounty.id)}
                                        className="w-full mt-5 flex items-center justify-center gap-2 px-4 py-4 rounded-full text-xs font-bold uppercase tracking-widest transition-all hover:scale-[1.02]"
                                        style={{ backgroundColor: "#111111", color: '#ffffff' }}
                                    >
                                        View Details
                                        <ArrowUpRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )
                    })
                )}

                {completedBounties.length === 0 && !isLoading && (
                    <div className="col-span-full p-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                        <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                            <CheckCircle2 className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Vault Empty</h3>
                        <p className="text-slate-500 mt-2 text-sm font-medium">No completed bounties have been archived yet.</p>
                    </div>
                )}
            </div>

            <Dialog open={!!selectedBountyId} onOpenChange={(open) => !open && setSelectedBountyId(null)}>
                <DialogContent className="sm:max-w-[600px] border-none rounded-2xl shadow-xl">
                    {(() => {
                        const bounty = completedBounties.find(b => b.id === selectedBountyId);
                        if (!bounty) return null;

                        return (
                            <>
                                <DialogHeader>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                                            <ShieldCheck className="w-3.5 h-3.5" /> Verified Completion
                                        </span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{bounty.category}</span>
                                    </div>
                                    <DialogTitle className="text-2xl font-bold text-slate-900 leading-tight">
                                        {bounty.title}
                                    </DialogTitle>
                                    <DialogDescription className="text-slate-500 mt-2">
                                        Archived from TalentBridge. Escrow successfully released.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6 pt-4">
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Investment</p>
                                            <p className="text-2xl font-black tracking-tight text-slate-900">₹{bounty.price.toLocaleString()}</p>
                                        </div>
                                        {bounty.submissionLink && (
                                            <div className="text-right">
                                                <SubmissionModal
                                                    submissionLink={bounty.submissionLink}
                                                    submissionScreenshotUrl={bounty.submissionScreenshotUrl}
                                                    triggerLabel="View Deliverable"
                                                    title="Final Deliverable"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    {/* Screenshot only (no link) */}
                                    {!bounty.submissionLink && bounty.submissionScreenshotUrl && (
                                        <SubmissionModal
                                            submissionScreenshotUrl={bounty.submissionScreenshotUrl}
                                            triggerLabel="View Screenshot"
                                            title="Submission Screenshot"
                                        />
                                    )}

                                    {bounty.review && (
                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Your Review of Junior Pro</h4>
                                            <div className="bg-card border border-slate-200 rounded-xl p-5 shadow-sm">
                                                <div className="flex justify-between items-start mb-3">
                                                    <StarRating rating={bounty.review.rating} size={18} />
                                                    <span className="text-[10px] text-slate-400 font-medium">{new Date(bounty.review.timestamp).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-sm text-slate-700 italic border-l-2 border-amber-200 pl-3 py-1">"{bounty.review.comment}"</p>
                                                {bounty.review.screenshotUrl && (
                                                    <div className="mt-4 rounded-lg overflow-hidden border border-slate-100">
                                                        <img src={bounty.review.screenshotUrl} alt="Review attachment" className="w-full h-auto object-cover max-h-48" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        );
                    })()}
                </DialogContent>
            </Dialog>
        </div>
    );
}
