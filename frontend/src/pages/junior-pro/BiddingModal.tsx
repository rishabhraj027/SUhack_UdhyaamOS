import { useState } from "react";
import type { Bounty } from "../../services/api";
import { useAuthStore } from "../../store/useAuthStore";
import {
    Dialog,
    DialogContent,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";

// Category → Hex color map
const CATEGORY_COLORS: Record<string, string> = {
    "Design": "#F87D3F",
    "Development": "#FFD166",
    "Writing": "#E5E5E5",
    "Social Media": "#B9A1E0",
    "Video/Animation": "#804CE4",
    "Marketing": "#E4F241",
    "Miscellaneous": "#E8D754",
};

export const getCategoryColor = (category?: string): string =>
    CATEGORY_COLORS[category || ""] || "#E5E5E5";

interface BiddingModalProps {
    bounty: Bounty | null;
    theme: { bg: string, text: string } | null;
    isOpen: boolean;
    onClose: () => void;
    onSubmitBid: (bountyId: string, bid: { bidPrice: number; message?: string }) => void;
    isLoading: boolean;
}

export function BiddingModal({ bounty, theme, isOpen, onClose, onSubmitBid, isLoading }: BiddingModalProps) {
    const { user } = useAuthStore();
    const [bidPrice, setBidPrice] = useState("");
    const [message, setMessage] = useState("");

    if (!bounty) return null;

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user || !bidPrice) return;

        onSubmitBid(bounty.id, {
            bidPrice: Number(bidPrice),
            message,
        });

        setBidPrice("");
        setMessage("");
    };

    // Use the category hex color for the background via inline style
    const bgColor = theme?.bg || getCategoryColor(bounty.category ?? "Miscellaneous");

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                showCloseButton={false}
                className={`sm:max-w-[700px] border-none p-0 shadow-2xl gap-0 outline-none w-[95vw] md:w-[600px] max-h-[90vh] overflow-y-auto text-black rounded-[32px] flex flex-col`}
                style={{ backgroundColor: bgColor, scrollbarWidth: 'none' }}
            >
                {/* Top Section (Category-colored Background) */}
                <div className="flex flex-col px-8 pt-8 pb-4 relative">
                    {/* Top Row: Budget & Category */}
                    <div className="flex justify-between items-center mb-10">
                        <span className="font-semibold text-[10px] uppercase tracking-[0.1em] text-black/50 flex items-center gap-1">
                            ₹{bounty.price.toLocaleString()} BUDGET
                        </span>
                    </div>

                    {/* Title */}
                    <div className="mb-8">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-black leading-none pr-4">
                            {bounty.title}
                        </h2>
                    </div>

                </div>

                {/* Bottom Section (White Block) */}
                <div className="bg-white px-8 py-8 w-full flex flex-col gap-6 rounded-b-[32px] relative z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.04)]">
                    <div className="text-black text-[14px] leading-relaxed font-medium opacity-70">
                        {bounty.description}
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-black/40">Your Bid (₹)</label>
                            <Input
                                required
                                type="number"
                                min="1"
                                value={bidPrice}
                                onChange={(e) => setBidPrice(e.target.value)}
                                placeholder={`e.g. ${Math.floor(bounty.price * 0.9)}`}
                                className="force-rectangle h-12 bg-[#F9F9F9] border border-black/5 text-black text-base font-medium px-4 focus-visible:ring-1 focus-visible:ring-black/20 focus-visible:bg-white transition-all shadow-none"
                            />
                            <p className="text-[10px] text-black/40 pt-1 lowercase">Set a competitive price to win the bid.</p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-black/40">Why are you the best fit?</label>
                            <Textarea
                                required
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Detail your approach and relevant experience..."
                                className="force-rectangle bg-[#F9F9F9] border border-black/5 text-black text-base font-medium resize-none !p-4 focus-visible:ring-1 focus-visible:ring-black/20 focus-visible:bg-white transition-all shadow-none"
                            />
                            <p className="text-[10px] text-black/40 pt-1 lowercase">Explain why you're perfect for this task. Include links to past work.</p>
                        </div>

                        <div className="pt-2 flex w-full items-center justify-between">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onClose}
                                className="px-6 h-12 hover:bg-black/5 text-black/40 hover:text-black rounded-xl font-semibold text-xs uppercase tracking-widest transition-all"
                            >
                                Cancel
                            </Button>

                            {/* The black pill button from the screenshot */}
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="h-12 bg-[#111111] hover:bg-black text-white px-10 rounded-xl font-semibold text-xs uppercase tracking-[0.1em] shadow-lg hover:shadow-xl hover:-translate-y-[1px] transition-all"
                            >
                                {isLoading ? "Submitting..." : "Submit Bid"}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
