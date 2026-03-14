import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useBountyStore } from "../../store/useBountyStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";
import { CheckCircle2, Timer, Hexagon, ListTodo, ArrowRight, Filter, MessageSquare, Send, Plus, X, ChevronRight } from "lucide-react";
import { getCategoryColor } from "./BiddingModal";
import { formatTimeRemaining } from "../../services/api";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { ImageUpload } from "../../components/ui/image-upload";
import { SubmissionModal } from "../../components/ui/submission-modal";

export default function ActiveTasks() {
    const { bounties, isLoading, loadBounties, submitWork, respondToCounterOffer, resubmitWork, respondToPoc, submitPoc, addMilestone, updateMilestoneStatus } = useBountyStore();
    const { user } = useAuthStore();
    const { conversations } = useChatStore();
    const currentStudentId = user?.id || "";
    const navigate = useNavigate();

    const [counterOfferingFor, setCounterOfferingFor] = useState<string | null>(null);
    const [counterPrice, setCounterPrice] = useState("");
    const [counterMsg, setCounterMsg] = useState("");

    // Resubmit form state
    const [resubmitLinks, setResubmitLinks] = useState<string[]>(['']);
    const [resubmitMessage, setResubmitMessage] = useState("");
    const [resubmitScreenshot, setResubmitScreenshot] = useState<string | null>(null);

    // Submission form state
    const [submitLinks, setSubmitLinks] = useState<{ [bountyId: string]: string[] }>({});
    const [submitScreenshots, setSubmitScreenshots] = useState<{ [bountyId: string]: string | null }>({});
    
    // POC form state
    const [pocLinks, setPocLinks] = useState<{ [bountyId: string]: string[] }>({});
    const [pocScreenshots, setPocScreenshots] = useState<{ [bountyId: string]: string | null }>({});

    // Milestone form state
    const [milestoneFormOpen, setMilestoneFormOpen] = useState<{ [bountyId: string]: boolean }>({});
    const [milestoneTitle, setMilestoneTitle] = useState<{ [bountyId: string]: string }>({});
    const [milestoneDesc, setMilestoneDesc] = useState<{ [bountyId: string]: string }>({});

    const location = useLocation();

    useEffect(() => {
        loadBounties();
    }, [loadBounties]);

    const [activeFilter, setActiveFilter] = useState<"IN_PROGRESS" | "REVIEW" | "SUBMITTED_BIDS" | "REVISION_REQUESTED">("IN_PROGRESS");

    useEffect(() => {
        setActiveFilter("IN_PROGRESS");
    }, [location.key]);

    // Filter bounties where the current student has placed a bid
    const activeBounties = useMemo(() => {
        const filtered = bounties.filter(b => {
            const hasBid = b.bids.some(bid => bid.studentId === currentStudentId || bid.studentId === "stu_789");
            if (!hasBid) return false;

            if (activeFilter === "SUBMITTED_BIDS") {
                return b.status === "OPEN" || b.status === "BIDDING";
            }
            return b.status === activeFilter;
        });

        // Sort: bounties with founder counter-offers on top
        if (activeFilter === "SUBMITTED_BIDS") {
            filtered.sort((a, b) => {
                const aHasResponse = a.bids.some(bid => (bid.studentId === currentStudentId || bid.studentId === "stu_789") && bid.counterOfferMessage);
                const bHasResponse = b.bids.some(bid => (bid.studentId === currentStudentId || bid.studentId === "stu_789") && bid.counterOfferMessage);
                if (aHasResponse && !bHasResponse) return -1;
                if (!aHasResponse && bHasResponse) return 1;
                return 0;
            });
        }

        return filtered;
    }, [bounties, currentStudentId, activeFilter]);

    const handleSubmit = async (e: React.FormEvent, id: string) => {
        e.preventDefault();
        const links = (submitLinks[id] || ['']).filter(l => l.trim());
        const screenshotUrl = submitScreenshots[id] || undefined;

        if (links.length === 0 && !screenshotUrl) return;

        const finalUrl = links.join(' | ');
        await submitWork(id, finalUrl || 'Screenshot only', screenshotUrl);
        setSubmitLinks(prev => ({ ...prev, [id]: [''] }));
        setSubmitScreenshots(prev => ({ ...prev, [id]: null }));
    };

    const handleResubmit = (bountyId: string) => {
        const links = resubmitLinks.filter(l => l.trim());
        if (links.length === 0 && !resubmitScreenshot) return;
        const finalUrl = links.join(' | ') || 'Screenshot only';
        resubmitWork(bountyId, resubmitMessage || "Resubmitted with requested changes.", finalUrl, resubmitScreenshot || undefined);
        setResubmitLinks(['']);
        setResubmitMessage("");
        setResubmitScreenshot(null);
    };

    const handlePocSubmit = async (e: React.FormEvent, id: string, studentId: string) => {
        e.preventDefault();
        const links = (pocLinks[id] || ['']).filter(l => l.trim());
        const screenshotUrl = pocScreenshots[id] || undefined;
        if (links.length === 0 && !screenshotUrl) return;
        const finalUrl = links.join(' | ') || 'Screenshot only';
        
        await submitPoc(id, studentId, finalUrl, screenshotUrl);
        setPocLinks(prev => ({ ...prev, [id]: [''] }));
        setPocScreenshots(prev => ({ ...prev, [id]: null }));
    };

    return (
        <div className="w-full space-y-2 animate-in fade-in zoom-in-95 duration-700 max-w-[1400px] mx-auto pb-20 px-4 md:px-8">
            {/* Coucher Massive Header Section */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 pb-0 border-b border-white/40 pt-12">
                <div className="max-w-4xl">
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 uppercase leading-none tracking-tight">
                        Active<br />Workspace
                    </h1>
                </div>
            </div>

            {/* Filters Section */}
            <div className="flex flex-wrap items-center gap-4 my-8">
                <div className="filter-pill flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] rounded-full border border-[#333333]">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Filter By Status:</span>
                </div>
                <div className="filter-pill flex flex-wrap gap-2">
                    {([
                        { key: "IN_PROGRESS", label: "IN PROGRESS" },
                        { key: "REVIEW", label: "UNDER REVIEW" },
                        { key: "SUBMITTED_BIDS", label: "SUBMITTED BIDS" },
                        { key: "REVISION_REQUESTED", label: "CHANGES REQUESTED" },
                    ] as const).map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setActiveFilter(key)}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all uppercase tracking-wider ${activeFilter === key
                                ? 'bg-white text-black scale-105 shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                                : 'bg-[#111111] text-gray-400 border border-[#333333] hover:border-gray-500 hover:text-white'
                                }`}
                        >
                            {label}
                            {key === "SUBMITTED_BIDS" && (() => {
                                const count = bounties.filter(b =>
                                    (b.status === "OPEN" || b.status === "BIDDING") &&
                                    b.bids.some(bid => (bid.studentId === currentStudentId || bid.studentId === "stu_789") && bid.counterOfferPrice)
                                ).length;
                                return count > 0 ? (
                                    <span className="ml-2 w-5 h-5 bg-yellow-400 text-black text-[10px] font-black rounded-full inline-flex items-center justify-center">
                                        {count}
                                    </span>
                                ) : null;
                            })()}
                            {key === "REVISION_REQUESTED" && bounties.filter(b => b.status === "REVISION_REQUESTED" && b.bids.some(bid => bid.studentId === currentStudentId || bid.studentId === "stu_789")).length > 0 && (
                                <span className="ml-2 w-5 h-5 bg-orange-500 text-white text-[10px] font-black rounded-full inline-flex items-center justify-center">
                                    {bounties.filter(b => b.status === "REVISION_REQUESTED" && b.bids.some(bid => bid.studentId === currentStudentId || bid.studentId === "stu_789")).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-8">
                {isLoading && activeBounties.length === 0 ? (
                    <div className="py-32 text-center flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-[#B9A1E0] flex items-center justify-center text-black mb-6 animate-pulse">
                            <Hexagon className="w-8 h-8 animate-spin-slow" />
                        </div>
                        <p className="text-white/40 uppercase tracking-widest text-sm">Loading Workspace</p>
                    </div>
                ) : (
                    activeBounties.map((bounty) => {
                        const bgColor = getCategoryColor(bounty.category ?? "Miscellaneous");
                        const isRevisionRequested = bounty.status === "REVISION_REQUESTED";

                        return (
                            <div
                                key={bounty.id}
                                className={`text-black rounded-[32px] overflow-hidden transition-transform hover:-translate-y-2 duration-500 ${isRevisionRequested ? 'p-5 md:p-6 max-h-[680px]' : 'p-8 md:p-10'}`}
                                style={{ backgroundColor: bgColor }}
                            >

                                <div className={`flex flex-col xl:flex-row gap-4 lg:gap-6 relative z-10 h-full ${isRevisionRequested ? 'max-h-[620px]' : ''}`}>
                                    {/* Details Block */}
                                    <div className="flex-1 flex flex-col justify-between min-w-0">
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/10 text-black">
                                                    <span className="w-2 h-2 rounded-full bg-black"></span>
                                                    {isRevisionRequested ? 'Revision Needed' : 'Mission Active'}
                                                </span>
                                                <span className="text-xs font-bold uppercase tracking-widest text-black/50">{bounty.category}</span>
                                            </div>
                                            <h3 className="text-2xl md:text-3xl font-bold leading-tight tracking-tight max-w-2xl text-black mb-6">
                                                {bounty.title}
                                            </h3>
                                        </div>
                                        <div className={`flex items-center gap-4 text-sm font-bold tracking-wide uppercase border-t border-black/10 text-black ${isRevisionRequested ? 'mt-4 pt-3' : 'mt-12 pt-8'}`}>
                                            <span className="flex items-center"><Timer className="w-4 h-4 mr-1.5" /> {formatTimeRemaining(bounty.deadline)} LEFT</span>
                                            <span className="font-bold text-lg">₹{bounty.price.toLocaleString()}</span>
                                        </div>

                                        {/* Feedback History */}
                                        {bounty.feedbackHistory.length > 0 && (
                                            <div className="mt-4 space-y-2 min-h-0 flex flex-col">
                                                <h4 className="text-xs font-black uppercase tracking-widest text-black flex items-center gap-2 mb-1 shrink-0">
                                                    <MessageSquare className="w-4 h-4" /> Feedback History
                                                </h4>
                                                <div className="space-y-2 overflow-y-auto max-h-[180px] pr-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                                    {bounty.feedbackHistory.map((fb) => (
                                                        <div key={fb.id} className={`p-4 flex flex-col gap-2 justify-center rounded-2xl shadow-md ${fb.sender === 'founder' ? 'bg-white/80 text-black' : 'bg-black text-white'}`}>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${fb.sender === 'founder' ? 'bg-[#FF5E00] text-white' : 'bg-white/20 text-white'}`}>
                                                                    {fb.sender === 'founder' ? 'Founder Feedback' : 'Your Submission'}
                                                                </span>
                                                                <span className={`text-[10px] font-bold ${fb.sender === 'founder' ? 'text-black/50' : 'text-white/50'}`}>{new Date(fb.timestamp).toLocaleString()}</span>
                                                            </div>
                                                            <p className={`text-[13px] font-bold leading-snug ${fb.sender === 'founder' ? 'text-black' : 'text-white'}`}>{fb.message}</p>
                                                            {fb.screenshotUrl && (
                                                                <div className="mt-1 rounded-xl overflow-hidden max-w-xs w-full bg-black/5">
                                                                    <img src={fb.screenshotUrl} alt="Feedback screenshot" className="w-full h-auto object-cover" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Milestones Section for IN_PROGRESS tasks */}
                                        {(bounty.status === 'IN_PROGRESS' || bounty.status === 'REVIEW' || bounty.status === 'REVISION_REQUESTED') && (
                                            <div className="mt-6 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-xs font-black uppercase tracking-widest text-black flex items-center gap-2">
                                                        <ListTodo className="w-4 h-4" /> Milestones
                                                    </h4>
                                                    {bounty.status === 'IN_PROGRESS' && (
                                                        <button
                                                            onClick={() => setMilestoneFormOpen(prev => ({ ...prev, [bounty.id]: !prev[bounty.id] }))}
                                                            className="text-[10px] font-black uppercase tracking-widest text-black/50 hover:text-black flex items-center gap-1 transition-colors px-2.5 py-1 rounded-full bg-black/5 hover:bg-black/10"
                                                        >
                                                            <Plus className="w-3 h-3" /> Add
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Add Milestone Form */}
                                                {milestoneFormOpen[bounty.id] && (
                                                    <div className="p-4 rounded-2xl bg-black/10 space-y-2">
                                                        <Input
                                                            placeholder="Milestone title..."
                                                            value={milestoneTitle[bounty.id] || ''}
                                                            onChange={(e) => setMilestoneTitle(prev => ({ ...prev, [bounty.id]: e.target.value }))}
                                                            className="h-10 rounded-xl px-4 text-sm bg-white/50 text-black border-black/20 shadow-none font-bold placeholder:text-black/30"
                                                        />
                                                        <Input
                                                            placeholder="Description (optional)"
                                                            value={milestoneDesc[bounty.id] || ''}
                                                            onChange={(e) => setMilestoneDesc(prev => ({ ...prev, [bounty.id]: e.target.value }))}
                                                            className="h-10 rounded-xl px-4 text-sm bg-white/50 text-black border-black/20 shadow-none font-bold placeholder:text-black/30"
                                                        />
                                                        <div className="flex gap-2 pt-1">
                                                            <Button
                                                                onClick={() => {
                                                                    const title = milestoneTitle[bounty.id]?.trim();
                                                                    if (!title) return;
                                                                    addMilestone(bounty.id, title, milestoneDesc[bounty.id]?.trim() || undefined);
                                                                    setMilestoneTitle(prev => ({ ...prev, [bounty.id]: '' }));
                                                                    setMilestoneDesc(prev => ({ ...prev, [bounty.id]: '' }));
                                                                    setMilestoneFormOpen(prev => ({ ...prev, [bounty.id]: false }));
                                                                }}
                                                                disabled={!(milestoneTitle[bounty.id]?.trim())}
                                                                className="flex-1 bg-black text-white hover:bg-black/80 rounded-xl h-9 text-[10px] font-bold uppercase tracking-widest"
                                                            >
                                                                <Plus className="w-3.5 h-3.5 mr-1" /> Add Milestone
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                onClick={() => setMilestoneFormOpen(prev => ({ ...prev, [bounty.id]: false }))}
                                                                className="rounded-xl h-9 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-black/5"
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Milestones List */}
                                                {(bounty.milestones || []).length > 0 ? (
                                                    <div className="space-y-1.5">
                                                        {(bounty.milestones || []).map((ms) => {
                                                            const nextStatus = ms.status === 'PENDING' ? 'IN_PROGRESS' : ms.status === 'IN_PROGRESS' ? 'COMPLETED' : 'PENDING';
                                                            return (
                                                                <button
                                                                    key={ms.id}
                                                                    onClick={() => bounty.status === 'IN_PROGRESS' && updateMilestoneStatus(bounty.id, ms.id, nextStatus as any)}
                                                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group ${
                                                                        bounty.status === 'IN_PROGRESS' ? 'hover:bg-black/10 cursor-pointer' : 'cursor-default'
                                                                    } bg-black/5`}
                                                                >
                                                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 transition-all ${
                                                                        ms.status === "COMPLETED" ? "bg-emerald-400 text-black" :
                                                                        ms.status === "IN_PROGRESS" ? "bg-blue-400 text-black" :
                                                                        "bg-black/20 text-black/40"
                                                                    }`}>
                                                                        {ms.status === "COMPLETED" ? "✓" : ms.status === "IN_PROGRESS" ? "◉" : "○"}
                                                                    </span>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className={`text-sm font-bold ${ms.status === "COMPLETED" ? "text-black/40 line-through" : "text-black"}`}>{ms.title}</p>
                                                                        {ms.description && <p className="text-xs text-black/40 mt-0.5 truncate">{ms.description}</p>}
                                                                    </div>
                                                                    {bounty.status === 'IN_PROGRESS' && (
                                                                        <ChevronRight className="w-4 h-4 text-black/20 group-hover:text-black/50 transition-colors shrink-0" />
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-black/40 font-bold italic pl-1">No milestones yet — tap "Add" above to track your progress</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Block */}
                                    <div className={`w-full xl:w-[420px] rounded-[24px] bg-black/5 shrink-0 flex flex-col justify-center ${isRevisionRequested ? 'p-5 overflow-y-auto max-h-[480px]' : 'p-8 md:p-10'}`} style={isRevisionRequested ? { scrollbarWidth: 'none', msOverflowStyle: 'none' } : undefined}>
                                        {activeFilter === 'SUBMITTED_BIDS' ? (
                                            (() => {
                                                const myBid = bounty.bids.find(b => b.studentId === currentStudentId || b.studentId === "stu_789");

                                                if (counterOfferingFor === bounty.id) {
                                                    return (
                                                        <div className="flex flex-col text-left space-y-4">
                                                            <p className="font-bold text-sm tracking-widest uppercase text-black">Your Counter-Offer</p>
                                                            <Input
                                                                type="number"
                                                                placeholder="New Price (₹)"
                                                                value={counterPrice}
                                                                onChange={e => setCounterPrice(e.target.value)}
                                                                className="h-12 rounded-md bg-white/50 border-black/20 text-black placeholder:text-black/50 border-black"
                                                            />
                                                            <Input
                                                                placeholder="Message to founder"
                                                                value={counterMsg}
                                                                onChange={e => setCounterMsg(e.target.value)}
                                                                className="h-12 rounded-md bg-white/50 border-black/20 text-black placeholder:text-black/50 border-black"
                                                            />
                                                            <div className="flex gap-2 pt-2">
                                                                <Button
                                                                    onClick={() => {
                                                                        respondToCounterOffer(bounty.id, 'COUNTER', currentStudentId || 'stu_789', Number(counterPrice), counterMsg);
                                                                        setCounterOfferingFor(null);
                                                                    }}
                                                                    className="flex-1 bg-black text-white hover:bg-black/80 rounded-md h-10 uppercase text-xs font-bold"
                                                                >
                                                                    Submit
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    onClick={() => setCounterOfferingFor(null)}
                                                                    className="flex-1 border border-black/20 rounded-md h-10 uppercase text-xs font-bold text-black"
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                if (myBid?.counterOfferMessage) {
                                                    return (
                                                        <div className="flex flex-col text-left space-y-4 max-h-[460px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center">
                                                                    <Hexagon className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-sm tracking-widest uppercase text-black">Founder Counter-Offer</p>
                                                                    <p className="font-black text-2xl tracking-tight text-black">₹{myBid.counterOfferPrice}</p>
                                                                </div>
                                                            </div>
                                                            <p className="text-sm font-medium opacity-80 italic border-l-4 border-black/20 pl-4 py-1 text-black">"{myBid.counterOfferMessage}"</p>
                                                            <div className="flex flex-col gap-2 pt-2">
                                                                <div className="flex gap-2">
                                                                    <Button onClick={() => respondToCounterOffer(bounty.id, 'ACCEPT', currentStudentId || 'stu_789')} className="flex-1 bg-black text-white hover:bg-black/80 rounded-md h-10 uppercase tracking-widest font-bold shadow-none">Accept</Button>
                                                                    <Button onClick={() => respondToCounterOffer(bounty.id, 'DECLINE', currentStudentId || 'stu_789')} variant="ghost" className="flex-1 border border-black/20 rounded-md h-10 uppercase tracking-widest font-bold hover:bg-black/5 text-black">Decline</Button>
                                                                </div>
                                                                <Button
                                                                    onClick={() => {
                                                                        setCounterOfferingFor(bounty.id);
                                                                        setCounterPrice(myBid.bidPrice.toString());
                                                                        setCounterMsg("");
                                                                    }}
                                                                    variant="ghost"
                                                                    className="w-full border border-black/20 rounded-md h-10 uppercase tracking-widest font-bold hover:bg-black/5 text-black"
                                                                >
                                                                    Counter Offer
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )
                                                }

                                                return (
                                                    <div className="flex flex-col text-center space-y-4 max-h-[460px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                                        <div className="flex flex-col items-center justify-center mb-2">
                                                            <Timer className="w-10 h-10 opacity-30 text-black mb-4" />
                                                            <p className="font-bold text-xl tracking-tight uppercase text-black">Awaiting Award</p>
                                                            <p className="opacity-60 text-sm tracking-wider uppercase text-black">Bid: ₹{myBid?.bidPrice}</p>
                                                        </div>
                                                        
                                                        {/* POC Area for Junior Pro */}
                                                        {myBid?.pocRequested && (
                                                            <div className="mt-4 p-4 rounded-xl border border-purple-900/10 bg-purple-900/5 text-left">
                                                                <div className="flex items-center gap-2 mb-3 border-b border-purple-900/10 pb-2">
                                                                    <Hexagon className="w-4 h-4 text-purple-700" />
                                                                    <h4 className="text-xs font-black uppercase tracking-widest text-purple-900">Proof of Concept</h4>
                                                                </div>
                                                                
                                                                {myBid.pocStatus === 'PENDING' && (
                                                                    <div className="space-y-3">
                                                                        <p className="text-xs font-bold text-purple-800 leading-snug">
                                                                            The Founder wants you to submit a quick Proof of Concept before awarding the bid.
                                                                        </p>
                                                                        <div className="flex gap-2 pt-1">
                                                                            <Button onClick={() => respondToPoc(bounty.id, myBid?.studentId || 'def', 'ACCEPT')} className="flex-1 bg-purple-600 text-white hover:bg-purple-700 h-8 rounded-lg text-[10px] font-bold uppercase tracking-widest">Accept</Button>
                                                                            <Button onClick={() => respondToPoc(bounty.id, myBid?.studentId || 'def', 'DECLINE')} variant="outline" className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50 h-8 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-transparent shadow-none">Decline</Button>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {myBid.pocStatus === 'DECLINED' && (
                                                                    <p className="text-xs font-bold text-red-700">You respectfully declined this POC request.</p>
                                                                )}
                                                                
                                                                {myBid.pocStatus === 'SUBMITTED' && (
                                                                    <p className="text-xs font-bold text-emerald-700">POC accurately submitted! Waiting for the Founder.</p>
                                                                )}

                                                                {myBid.pocStatus === 'ACCEPTED' && (
                                                                    <form onSubmit={(e) => handlePocSubmit(e, bounty.id, myBid?.studentId || 'def')} className="space-y-3 w-full text-left">
                                                                        <p className="text-[11px] font-bold text-black/60">Awesome, submit your POC work here:</p>
                                                                        <div className="space-y-1">
                                                                            {(pocLinks[bounty.id] || ['']).map((link, idx) => (
                                                                                <div key={idx} className="flex gap-1.5 items-center">
                                                                                    <Input
                                                                                        value={link}
                                                                                        onChange={(e) => {
                                                                                            const current = pocLinks[bounty.id] || [''];
                                                                                            const next = [...current];
                                                                                            next[idx] = e.target.value;
                                                                                            setPocLinks(prev => ({ ...prev, [bounty.id]: next }));
                                                                                        }}
                                                                                        placeholder="Figma, GitHub..."
                                                                                        className="h-10 rounded-md px-3 text-xs bg-white/50 text-black border-purple-900/20 shadow-none font-bold"
                                                                                    />
                                                                                </div>
                                                                            ))}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const current = pocLinks[bounty.id] || [''];
                                                                                    setPocLinks(prev => ({ ...prev, [bounty.id]: [...current, ''] }));
                                                                                }}
                                                                                className="text-[9px] font-black uppercase tracking-widest text-purple-900/50 hover:text-purple-900 flex items-center gap-1 transition-colors pt-1"
                                                                            >
                                                                                <Plus className="w-3 h-3" /> Add link
                                                                            </button>
                                                                        </div>
                                                                        <ImageUpload
                                                                            value={pocScreenshots[bounty.id] || null}
                                                                            onImageChange={(url) => setPocScreenshots(prev => ({ ...prev, [bounty.id]: url }))}
                                                                            label="Attach POC Image"
                                                                            variant="dark"
                                                                        />
                                                                        <Button type="submit" disabled={!pocLinks[bounty.id]?.[0] && !pocScreenshots[bounty.id]} className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg h-10 text-xs font-bold uppercase tracking-widest">
                                                                            Submit Proof
                                                                        </Button>
                                                                    </form>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()
                                        ) : bounty.status === 'REVIEW' ? (
                                            <div className="flex flex-col items-center justify-center text-center space-y-6">
                                                <div className="w-20 h-20 rounded-full flex items-center justify-center border border-dashed border-black/20">
                                                    <CheckCircle2 className="w-10 h-10 opacity-50 text-black" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-2xl tracking-tight mb-3 uppercase text-black">Under Review</p>
                                                    <p className="opacity-60 text-sm tracking-wider uppercase text-black">Business is verifying output.</p>
                                                </div>
                                                {(bounty.submissionLink || bounty.submissionScreenshotUrl) && (
                                                    <SubmissionModal
                                                        submissionLink={bounty.submissionLink}
                                                        submissionScreenshotUrl={bounty.submissionScreenshotUrl}
                                                        triggerLabel="View Your Submission"
                                                        triggerVariant="dark"
                                                        theme="dark"
                                                        modalBgColor={bgColor}
                                                        title="Your Submission"
                                                    />
                                                )}
                                            </div>
                                        ) : isRevisionRequested ? (
                                            /* ===== RESUBMIT FORM ===== */
                                            <div className="flex flex-col justify-start gap-2.5">
                                                <div className="mb-1">
                                                    <h3 className="font-black text-lg uppercase tracking-tight text-black mb-0.5">Submit Revision</h3>
                                                    <p className="text-[12px] text-black/60 font-medium">Add your links and/or screenshot below.</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-black/50 block">Project Links</label>
                                                    {resubmitLinks.map((link, idx) => (
                                                        <div key={idx} className="flex gap-1.5 items-center">
                                                            <Input
                                                                value={link}
                                                                onChange={(e) => {
                                                                    const next = [...resubmitLinks];
                                                                    next[idx] = e.target.value;
                                                                    setResubmitLinks(next);
                                                                }}
                                                                placeholder={idx === 0 ? "GitHub, Figma, Drive..." : "Another link..."}
                                                                className="h-10 rounded-md px-4 text-sm bg-white/50 text-black border-black/20 border-black focus-visible:ring-1 focus-visible:ring-black/20 transition-all font-bold placeholder:text-black/30 shadow-none"
                                                            />
                                                            {resubmitLinks.length > 1 && (
                                                                <button onClick={() => setResubmitLinks(resubmitLinks.filter((_, i) => i !== idx))} className="p-1.5 rounded-lg hover:bg-black/10 text-black/40 hover:text-red-500 transition-colors shrink-0">
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => setResubmitLinks([...resubmitLinks, ''])}
                                                        className="text-[10px] font-black uppercase tracking-widest text-black/50 hover:text-black flex items-center gap-1 mt-1 transition-colors"
                                                    >
                                                        <Plus className="w-3 h-3" /> Add another link
                                                    </button>
                                                </div>
                                                <ImageUpload
                                                    value={resubmitScreenshot}
                                                    onImageChange={setResubmitScreenshot}
                                                    label="Attach Screenshot"
                                                    variant="dark"
                                                />
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-black/50 block">Message (Optional)</label>
                                                    <Textarea
                                                        value={resubmitMessage}
                                                        onChange={(e) => setResubmitMessage(e.target.value)}
                                                        placeholder="Detail your changes..."
                                                        className="rounded-md px-4 py-2.5 text-sm bg-white/50 text-black border-black/20 border-black resize-none min-h-[60px] focus-visible:ring-1 focus-visible:ring-black/20 transition-all font-bold placeholder:text-black/30 shadow-none"
                                                    />
                                                </div>
                                                <Button
                                                    onClick={() => handleResubmit(bounty.id)}
                                                    disabled={resubmitLinks.every(l => !l.trim()) && !resubmitScreenshot}
                                                    className="w-full group font-bold tracking-widest uppercase h-10 shadow-none transition-all duration-300 bg-black text-white hover:bg-black/90 rounded-xl"
                                                >
                                                    <Send className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" /> Resubmit Work
                                                </Button>
                                            </div>
                                        ) : (
                                            <form onSubmit={(e) => handleSubmit(e, bounty.id)} className="space-y-4">
                                                {/* Go to Comms button for IN_PROGRESS */}
                                                {bounty.status === "IN_PROGRESS" && (() => {
                                                    const conv = conversations.find(c =>
                                                        c.bountyId === bounty.id &&
                                                        (c.juniorProId === currentStudentId || c.juniorProId === "stu_789")
                                                    );
                                                    return conv ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => navigate("/junior-pro/messages")}
                                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#804CE4] text-white font-bold uppercase tracking-widest text-xs hover:bg-[#6B3FBF] transition-all hover:scale-[1.02] mb-2"
                                                        >
                                                            <MessageSquare className="w-4 h-4" />
                                                            Go to Comms
                                                        </button>
                                                    ) : null;
                                                })()}
                                                <label className="text-xs font-bold uppercase tracking-widest opacity-60 block text-black">Submission Gateway</label>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-black/50 block">Project Links</label>
                                                    {(submitLinks[bounty.id] || ['']).map((link, idx) => (
                                                        <div key={idx} className="flex gap-1.5 items-center">
                                                            <Input
                                                                value={link}
                                                                onChange={(e) => {
                                                                    const current = submitLinks[bounty.id] || [''];
                                                                    const next = [...current];
                                                                    next[idx] = e.target.value;
                                                                    setSubmitLinks(prev => ({ ...prev, [bounty.id]: next }));
                                                                }}
                                                                placeholder={idx === 0 ? "GitHub, Figma, Drive..." : "Another link..."}
                                                                className="h-12 rounded-md px-4 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-black focus-visible:ring-offset-0 bg-white/50 border-black/20 text-black placeholder:text-black/50 border-black"
                                                            />
                                                            {(submitLinks[bounty.id] || ['']).length > 1 && (
                                                                <button type="button" onClick={() => {
                                                                    const current = submitLinks[bounty.id] || [''];
                                                                    setSubmitLinks(prev => ({ ...prev, [bounty.id]: current.filter((_, i) => i !== idx) }));
                                                                }} className="p-1.5 rounded-lg hover:bg-black/10 text-black/40 hover:text-red-500 transition-colors shrink-0">
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const current = submitLinks[bounty.id] || [''];
                                                            setSubmitLinks(prev => ({ ...prev, [bounty.id]: [...current, ''] }));
                                                        }}
                                                        className="text-[10px] font-black uppercase tracking-widest text-black/50 hover:text-black flex items-center gap-1 mt-1 transition-colors"
                                                    >
                                                        <Plus className="w-3 h-3" /> Add another link
                                                    </button>
                                                </div>
                                                <ImageUpload
                                                    value={submitScreenshots[bounty.id] || null}
                                                    onImageChange={(url) => setSubmitScreenshots(prev => ({ ...prev, [bounty.id]: url }))}
                                                    label="Attach Screenshot"
                                                    variant="dark"
                                                />
                                                <Button type="submit" className="w-full font-bold tracking-widest uppercase rounded-md h-14 mt-2 shadow-none transition-all duration-300 bg-black text-white hover:bg-black/80">
                                                    Submit Mission Outcome <ArrowRight className="w-5 h-5 ml-2" />
                                                </Button>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}

                {activeBounties.length === 0 && !isLoading && (
                    <div className="col-span-full border border-white/10 rounded-[40px] bg-white/5 p-16 text-center">
                        <div className="inline-flex p-6 rounded-full bg-white/10 mb-6">
                            <ListTodo className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl text-white mb-3 font-medium">WORKSPACE EMPTY</h3>
                        <p className="text-white/50 text-sm max-w-sm mx-auto tracking-wide">You have no active missions. Head to the Mission Board to bid securely.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
