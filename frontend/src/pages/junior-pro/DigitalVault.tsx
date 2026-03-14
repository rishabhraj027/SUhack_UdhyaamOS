import { useEffect } from "react";
import { useBountyStore } from "../../store/useBountyStore";
import { CheckCircle2, Hexagon, Star, MessageSquare } from "lucide-react";
import { getCategoryColor } from "./BiddingModal";
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

    useEffect(() => {
        loadBounties();
    }, [loadBounties]);

    const completedBounties = bounties.filter((b) => b.status === "COMPLETED");

    return (
        <div className="w-full space-y-2 animate-in fade-in zoom-in-95 duration-700 max-w-[1400px] mx-auto pb-20 px-4 md:px-8">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 pb-0 border-b border-white/40 pt-12">
                <div className="max-w-4xl">
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-2 uppercase leading-none tracking-tight">
                        Digital Vault
                    </h1>
                    <p className="text-white/60 text-lg uppercase tracking-widest font-medium mb-8">Your Past Completed Missions</p>
                </div>
            </div>

            <div className="space-y-8 mt-8">
                {isLoading && completedBounties.length === 0 ? (
                    <div className="py-32 text-center flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-[#B9A1E0] flex items-center justify-center text-black mb-6 animate-pulse">
                            <Hexagon className="w-8 h-8 animate-spin-slow" />
                        </div>
                        <p className="text-white/40 uppercase tracking-widest text-sm">Loading Vault</p>
                    </div>
                ) : (
                    completedBounties.map((bounty) => {
                        const bgColor = getCategoryColor(bounty.category ?? "Miscellaneous");

                        return (
                            <div
                                key={bounty.id}
                                className="text-black rounded-[32px] overflow-hidden p-8 md:p-10 shadow-xl"
                                style={{ backgroundColor: bgColor }}
                            >
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1 flex flex-col min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-4">
                                            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/10 text-black">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Completed Mission
                                            </span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-black/80 px-3 py-1.5 rounded-full bg-black/10">{bounty.category}</span>
                                        </div>
                                        <h3 className="text-2xl md:text-3xl font-bold leading-tight tracking-tight max-w-2xl text-black mb-4">
                                            {bounty.title}
                                        </h3>
                                        <div className="flex items-center gap-3 text-sm font-bold tracking-wide uppercase text-black mb-4">
                                            <span className="font-bold text-lg">Earned: ₹{bounty.price.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Final Submission */}
                                    {(bounty.submissionLink || bounty.submissionScreenshotUrl) && (
                                        <div className="w-full md:w-auto shrink-0 bg-white/50 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20 flex items-center justify-center">
                                            <SubmissionModal
                                                submissionLink={bounty.submissionLink}
                                                submissionScreenshotUrl={bounty.submissionScreenshotUrl}
                                                triggerLabel="View Your Submission"
                                                triggerVariant="dark"
                                                theme="dark"
                                                modalBgColor={bgColor}
                                                title="Your Submission"
                                            />
                                        </div>
                                    )}

                                    {bounty.review && (
                                        <div className="w-full md:w-[350px] shrink-0 bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                    <MessageSquare className="w-4 h-4" /> Founder Review
                                                </h4>
                                                <StarRating rating={bounty.review.rating} />
                                            </div>
                                            <p className="text-sm font-medium italic">"{bounty.review.comment}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}

                {completedBounties.length === 0 && !isLoading && (
                    <div className="col-span-full border border-white/10 rounded-[40px] bg-white/5 p-16 text-center">
                        <div className="inline-flex p-6 rounded-full bg-white/10 mb-6">
                            <CheckCircle2 className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl text-white mb-3 font-medium">VAULT EMPTY</h3>
                        <p className="text-white/50 text-sm max-w-sm mx-auto tracking-wide">You have not completed any missions yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
