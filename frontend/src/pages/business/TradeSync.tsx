import { useEffect, useState } from "react";
import { useB2BStore } from "../../store/useB2BStore";
import { useAuthStore } from "../../store/useAuthStore";
import {
    Plus, Package, PackageSearch, ArrowUpRight, ArrowDownRight, Search,
    MapPin, Phone, Mail, MessageSquare, Send, Check, XCircle, X,
    Trash2, ShoppingCart, Eye, Clock, ChevronRight, Star, TrendingUp,
    Briefcase, Shield, User, ThumbsUp, ThumbsDown, Award
} from "lucide-react";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from "../../components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import type { MarketplaceListing, CounterOffer, CompanyProfile, ReviewData } from "../../services/api";
import { fetchCompanyProfile, createReviewForSeller } from "../../services/api";

const CATEGORIES = ["Textiles", "Electronics", "Agriculture", "Chemicals", "Metals", "Packaging", "Food & Beverage", "Other"] as const;

const categoryColors: Record<string, string> = {
    Textiles: "bg-indigo-50 text-indigo-700 border-indigo-200",
    Electronics: "bg-cyan-50 text-cyan-700 border-cyan-200",
    Agriculture: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Chemicals: "bg-amber-50 text-amber-700 border-amber-200",
    Metals: "bg-slate-100 text-slate-700 border-slate-300",
    Packaging: "bg-orange-50 text-orange-700 border-orange-200",
    "Food & Beverage": "bg-rose-50 text-rose-700 border-rose-200",
    Other: "bg-gray-50 text-gray-600 border-gray-200",
};

const statusColors: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    ACCEPTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    REJECTED: "bg-red-50 text-red-600 border-red-200",
    COUNTERED: "bg-blue-50 text-blue-700 border-blue-200",
};

type TabType = "inventory" | "marketplace" | "negotiations";

export default function TradeSync() {
    const { user } = useAuthStore();
    const {
        myListings, marketplace, negotiations, isLoading,
        loadMarketplace, loadNegotiations, addListing, removeListing,
        sendCounterOffer, respondToOffer,
    } = useB2BStore();

    const sellerName = user?.name || "My Business";
    const sellerPhone = user?.contactPhone || "";
    const sellerEmail = user?.officialEmail || "";

    const [activeTab, setActiveTab] = useState<TabType>("inventory");
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [detailModal, setDetailModal] = useState<MarketplaceListing | null>(null);
    const [offerModal, setOfferModal] = useState<MarketplaceListing | null>(null);
    const [contactReveal, setContactReveal] = useState<Record<string, boolean>>({});
    const [counterModal, setCounterModal] = useState<CounterOffer | null>(null);
    const [profileUserId, setProfileUserId] = useState<string | null>(null);
    const [profileData, setProfileData] = useState<CompanyProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);

    // Review state
    const [reviewModal, setReviewModal] = useState<CounterOffer | null>(null);
    const [reviewForm, setReviewForm] = useState({ rating: 0, deliveredOnTime: true, comment: "" });
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

    // Search & filter
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

    // Add listing form
    const [form, setForm] = useState({ itemName: "", description: "", category: "Textiles" as string, bulkQuantity: "", pricePerUnit: "", minOrderQty: "", location: "" });

    // Offer form
    const [offerForm, setOfferForm] = useState({ price: "", quantity: "", message: "" });

    // Confirmation state
    const [confirmAction, setConfirmAction] = useState<{
        type: "accept" | "reject" | "delete";
        id: string;
        label?: string;
    } | null>(null);

    // Counter form
    const [counterForm, setCounterForm] = useState({ price: "", message: "" });

    useEffect(() => { loadMarketplace(); loadNegotiations(); }, [loadMarketplace, loadNegotiations]);

    const resetForm = () => setForm({ itemName: "", description: "", category: "Textiles", bulkQuantity: "", pricePerUnit: "", minOrderQty: "", location: "" });

    const handleAddListing = async (e: React.FormEvent) => {
        e.preventDefault();
        await addListing({
            itemName: form.itemName, description: form.description,
            category: form.category as MarketplaceListing["category"],
            bulkQuantity: form.bulkQuantity, pricePerUnit: Number(form.pricePerUnit),
            minOrderQty: form.minOrderQty, location: form.location,
            sellerName, status: "ACTIVE", isOwn: true,
            sellerContact: { phone: sellerPhone, email: sellerEmail },
        });
        setAddModalOpen(false);
        resetForm();
    };

    const handleSendOffer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!offerModal) return;
        await sendCounterOffer({
            listingId: offerModal.id, listingItemName: offerModal.itemName,
            fromBuyer: sellerName, toSeller: offerModal.sellerName,
            originalPrice: offerModal.pricePerUnit, offerPrice: Number(offerForm.price),
            quantity: offerForm.quantity, message: offerForm.message,
        });
        setOfferModal(null);
        setOfferForm({ price: "", quantity: "", message: "" });
        setActiveTab("negotiations");
    };

    const handleRespond = async (offerId: string, action: "ACCEPTED" | "REJECTED") => {
        await respondToOffer(offerId, action);
    };

    const handleCounterRespond = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!counterModal) return;
        await respondToOffer(counterModal.id, "REJECTED", Number(counterForm.price), counterForm.message);
        setCounterModal(null);
        setCounterForm({ price: "", message: "" });
    };

    const openProfile = async (userId: string) => {
        setProfileUserId(userId);
        setProfileLoading(true);
        try {
            const data = await fetchCompanyProfile(userId);
            setProfileData(data);
        } catch { setProfileData(null); }
        setProfileLoading(false);
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reviewModal || reviewForm.rating === 0) return;
        setReviewSubmitting(true);
        try {
            await createReviewForSeller({
                negotiationId: reviewModal.id,
                rating: reviewForm.rating,
                deliveredOnTime: reviewForm.deliveredOnTime,
                comment: reviewForm.comment,
            });
            setReviewedIds(prev => new Set(prev).add(reviewModal.id));
            setReviewModal(null);
            setReviewForm({ rating: 0, deliveredOnTime: true, comment: "" });
            loadNegotiations();
        } catch (err: any) {
            alert(err?.response?.data?.error || "Failed to submit review");
        }
        setReviewSubmitting(false);
    };

    const userId = user?.id || "";

    // IDs of listings the user already has pending/countered offers on
    const offeredListingIds = new Set(
        negotiations.filter(n => n.fromBuyer === userId && (n.status === "PENDING" || n.status === "COUNTERED")).map(n => n.listingId)
    );

    const filteredMarketplace = marketplace.filter(item => {
        const matchesSearch = !searchQuery || item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) || item.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === "ALL" || item.category === categoryFilter;
        const notAlreadyOffered = !offeredListingIds.has(item.id);
        return matchesSearch && matchesCategory && notAlreadyOffered;
    });

    const sentOffers = negotiations.filter(n => n.fromBuyer === userId);
    const receivedOffers = negotiations.filter(n => n.toSeller === userId);

    const tabs: { key: TabType; label: string; count?: number }[] = [
        { key: "inventory", label: "My Listings", count: myListings.length },
        { key: "marketplace", label: "Marketplace", count: marketplace.length },
        { key: "negotiations", label: "Negotiations", count: negotiations.filter(n => n.status === "PENDING" || n.status === "COUNTERED").length },
    ];

    return (
        <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-normal tracking-tight text-foreground mb-5">TradeSync</h1>
                    <p className="text-slate-500 text-sm font-medium">Buy and sell bulk materials. Negotiate deals. Grow your supply chain.</p>
                </div>
                {activeTab === "inventory" && (
                    <button onClick={() => setAddModalOpen(true)} className="bg-black hover:bg-slate-800 text-white rounded-full px-8 py-6 font-bold shadow-[0_4px_15px_rgb(0,0,0,0.1)] hover:-translate-y-0.5 transition-all flex items-center shrink-0 text-xs uppercase tracking-widest">
                        <Plus className="w-4 h-4 mr-2" /> Add Listing
                    </button>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 px-2">
                {tabs.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={`px-6 py-3 text-[11px] font-bold uppercase tracking-widest rounded-full transition-all shadow-sm flex items-center gap-2 ${activeTab === tab.key ? 'bg-primary text-white shadow-md' : 'bg-card text-muted-foreground hover:bg-secondary border border-border/50'}`}>
                        {tab.label}
                        {(tab.count ?? 0) > 0 && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-secondary text-muted-foreground'}`}>{tab.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)] bg-card rounded-[20px]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 pt-8 px-8">
                        <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">My Listings</CardTitle>
                        <div className="w-10 h-10 rounded-[12px] bg-secondary flex items-center justify-center"><Package className="h-5 w-5 text-primary" /></div>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                        <div className="text-4xl font-black tracking-tight text-foreground">{myListings.length}</div>
                        <p className="text-xs font-bold text-emerald-600 flex items-center mt-4 bg-emerald-500/10 w-fit px-3 py-1.5 rounded-full">
                            <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> Active items
                        </p>
                    </CardContent>
                </Card>
                <Card className="border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)] bg-card rounded-[20px]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 pt-8 px-8">
                        <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Marketplace</CardTitle>
                        <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center"><ShoppingCart className="h-5 w-5 text-primary" /></div>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                        <div className="text-4xl font-black tracking-tight text-foreground">{marketplace.length}</div>
                        <p className="text-xs font-medium text-muted-foreground mt-4 pt-1">Available listings from sellers</p>
                    </CardContent>
                </Card>
                <Card className="border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)] bg-card rounded-[20px]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 pt-8 px-8">
                        <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Pending Offers</CardTitle>
                        <div className="w-10 h-10 rounded-[12px] bg-orange-500/10 flex items-center justify-center"><PackageSearch className="h-5 w-5 text-orange-500" /></div>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                        <div className="text-4xl font-black tracking-tight text-foreground">{negotiations.filter(n => n.status === "PENDING" || n.status === "COUNTERED").length}</div>
                        <p className="text-xs font-bold text-orange-600 flex items-center mt-4 bg-orange-500/10 w-fit px-3 py-1.5 rounded-full">
                            <ArrowDownRight className="w-3.5 h-3.5 mr-1" /> Requires action
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tab Content */}
            {activeTab === "inventory" && <InventoryTab listings={myListings} isLoading={isLoading} onDelete={(id, name) => setConfirmAction({ type: "delete", id, label: name })} />}
            {activeTab === "marketplace" && (
                <MarketplaceTab listings={filteredMarketplace} isLoading={isLoading} searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}
                    onViewDetail={setDetailModal} onMakeOffer={setOfferModal} contactReveal={contactReveal}
                    onRevealContact={(id) => setContactReveal(prev => ({ ...prev, [id]: true }))}
                    onViewSellerProfile={openProfile} />
            )}
            {activeTab === "negotiations" && (
                <NegotiationsTab sent={sentOffers} received={receivedOffers} isLoading={isLoading}
                    onAccept={(id) => setConfirmAction({ type: "accept", id })} onReject={(id) => setConfirmAction({ type: "reject", id })}
                    onCounter={setCounterModal} onViewProfile={openProfile}
                    onReview={(o) => { setReviewModal(o); setReviewForm({ rating: 0, deliveredOnTime: true, comment: "" }); }}
                    reviewedIds={reviewedIds} />
            )}

            {/* Add Listing Modal */}
            <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
                <DialogContent className="sm:max-w-[520px] rounded-[24px] border-border/50 shadow-2xl p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold tracking-tight">New Marketplace Listing</DialogTitle>
                        <DialogDescription className="text-sm pt-2">List your product for B2B buyers to discover.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddListing} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Item Name</label>
                            <Input required placeholder="e.g. Premium Cotton Yarn" value={form.itemName} onChange={e => setForm({ ...form, itemName: e.target.value })} className="h-12 rounded-xl bg-secondary/50 border-border/50" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Description</label>
                            <textarea required placeholder="Describe your product, specifications, certifications..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                className="force-rectangle w-full p-4 bg-secondary/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 text-sm font-medium text-foreground placeholder:text-muted-foreground transition-all" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Category</label>
                                <select required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="force-rectangle w-full h-12 bg-secondary/50 border border-border/50 text-sm font-medium px-4 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground">
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Location</label>
                                <Input required placeholder="e.g. Mumbai, MH" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="h-12 rounded-xl bg-secondary/50 border-border/50" />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Quantity</label>
                                <Input required placeholder="e.g. 500kg" value={form.bulkQuantity} onChange={e => setForm({ ...form, bulkQuantity: e.target.value })} className="h-12 rounded-xl bg-secondary/50 border-border/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Price/Unit (₹)</label>
                                <Input required type="number" min="1" placeholder="250" value={form.pricePerUnit} onChange={e => setForm({ ...form, pricePerUnit: e.target.value })} className="h-12 rounded-xl bg-secondary/50 border-border/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Min Order</label>
                                <Input required placeholder="e.g. 100kg" value={form.minOrderQty} onChange={e => setForm({ ...form, minOrderQty: e.target.value })} className="h-12 rounded-xl bg-secondary/50 border-border/50" />
                            </div>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="submit" disabled={isLoading} className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-md">
                                {isLoading ? "Publishing..." : "Publish Listing"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Detail Modal */}
            <Dialog open={!!detailModal} onOpenChange={() => setDetailModal(null)}>
                {detailModal && (
                    <DialogContent className="sm:max-w-[600px] rounded-[24px] border-border/50 shadow-2xl p-0 overflow-hidden">
                        <div className="p-8 space-y-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${categoryColors[detailModal.category]}`}>{detailModal.category}</span>
                                    <h2 className="text-2xl font-bold tracking-tight mt-3">{detailModal.itemName}</h2>
                                    <p className="text-sm text-muted-foreground font-medium mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{detailModal.location}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-black text-primary">₹{detailModal.pricePerUnit}</div>
                                    <span className="text-xs text-muted-foreground font-medium">per unit</span>
                                </div>
                            </div>
                            <p className="text-sm text-foreground/80 leading-relaxed font-medium">{detailModal.description}</p>
                            <div className="grid grid-cols-3 gap-4">
                                {[["Available", detailModal.bulkQuantity], ["Min Order", detailModal.minOrderQty], ["Seller", detailModal.sellerName]].map(([label, value]) => (
                                    <div key={label} className="bg-secondary/50 rounded-xl p-4 text-center border border-border/30">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{label}</div>
                                        <div className="text-sm font-bold text-foreground">{value}</div>
                                    </div>
                                ))}
                            </div>
                            {/* Contact Info */}
                            {contactReveal[detailModal.id] ? (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Seller Contact Info</div>
                                    <div className="flex flex-col gap-2">
                                        <span className="flex items-center gap-2 text-sm font-medium"><Phone className="w-4 h-4 text-emerald-600" />{detailModal.sellerContact.phone}</span>
                                        <span className="flex items-center gap-2 text-sm font-medium"><Mail className="w-4 h-4 text-emerald-600" />{detailModal.sellerContact.email}</span>

                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => setContactReveal(prev => ({ ...prev, [detailModal.id]: true }))}
                                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
                                    <Eye className="w-4 h-4" /> Reveal Contact Info
                                </button>
                            )}
                            <div className="flex gap-3">
                                <button onClick={() => { setDetailModal(null); setOfferModal(detailModal); }}
                                    className="flex-1 py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
                                    <Send className="w-4 h-4" /> Make an Offer
                                </button>
                                <button onClick={() => { setDetailModal(null); if (detailModal.sellerId) openProfile(detailModal.sellerId); }}
                                    className="py-4 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 border border-slate-200">
                                    <User className="w-4 h-4" /> View Profile
                                </button>
                            </div>
                        </div>
                    </DialogContent>
                )}
            </Dialog>

            {/* Make Offer Modal */}
            <Dialog open={!!offerModal} onOpenChange={() => setOfferModal(null)}>
                {offerModal && (
                    <DialogContent className="sm:max-w-[480px] rounded-[24px] border-border/50 shadow-2xl p-8">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold tracking-tight">Make an Offer</DialogTitle>
                            <DialogDescription className="text-sm pt-1">
                                <span className="font-semibold text-foreground">{offerModal.itemName}</span> · Listed at <span className="font-bold text-primary">₹{offerModal.pricePerUnit}/unit</span> by {offerModal.sellerName}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSendOffer} className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Your Price (₹/unit)</label>
                                    <Input required type="number" min="1" placeholder="e.g. 160" value={offerForm.price} onChange={e => setOfferForm({ ...offerForm, price: e.target.value })} className="h-12 rounded-xl bg-secondary/50 border-border/50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Quantity Needed</label>
                                    <Input required placeholder="e.g. 2000kg" value={offerForm.quantity} onChange={e => setOfferForm({ ...offerForm, quantity: e.target.value })} className="h-12 rounded-xl bg-secondary/50 border-border/50" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Message</label>
                                <textarea required placeholder="Tell the seller why they should accept..." value={offerForm.message} onChange={e => setOfferForm({ ...offerForm, message: e.target.value })}
                                    className="force-rectangle w-full p-4 bg-secondary/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-medium text-foreground placeholder:text-muted-foreground transition-all" />
                            </div>
                            <DialogFooter className="pt-2">
                                <Button type="submit" disabled={isLoading} className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-md">
                                    {isLoading ? "Sending..." : "Send Offer"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                )}
            </Dialog>

            {/* Counter Offer Modal */}
            <Dialog open={!!counterModal} onOpenChange={() => setCounterModal(null)}>
                {counterModal && (
                    <DialogContent className="sm:max-w-[480px] rounded-[24px] border-border/50 shadow-2xl p-8">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold tracking-tight">Counter Offer</DialogTitle>
                            <DialogDescription className="text-sm pt-1">
                                Respond to <span className="font-semibold text-foreground">{counterModal.fromBuyerName || counterModal.fromBuyer}</span>'s offer of <span className="font-bold text-primary">₹{counterModal.offerPrice}/unit</span> for {counterModal.listingItemName}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCounterRespond} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Your Counter Price (₹/unit)</label>
                                <Input required type="number" min="1" value={counterForm.price} onChange={e => setCounterForm({ ...counterForm, price: e.target.value })} className="h-12 rounded-xl bg-secondary/50 border-border/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Message</label>
                                <textarea required placeholder="Explain your pricing..." value={counterForm.message} onChange={e => setCounterForm({ ...counterForm, message: e.target.value })}
                                    className="force-rectangle w-full p-4 bg-secondary/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-medium text-foreground placeholder:text-muted-foreground transition-all" />
                            </div>
                            <DialogFooter className="pt-2">
                                <Button type="submit" disabled={isLoading} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md">
                                    {isLoading ? "Sending..." : "Send Counter Offer"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                )}
            </Dialog>

            {/* ===== CONFIRMATION DIALOG ===== */}
            <ConfirmDialog
                open={!!confirmAction}
                onOpenChange={(open) => !open && setConfirmAction(null)}
                title={
                    confirmAction?.type === "accept"
                        ? "Accept Offer?"
                        : confirmAction?.type === "reject"
                        ? "Reject Offer?"
                        : "Delete Listing?"
                }
                description={
                    confirmAction?.type === "accept"
                        ? "This will finalize the deal and accept the buyer's offer. This cannot be undone."
                        : confirmAction?.type === "reject"
                        ? "This will reject the offer. This action cannot be undone."
                        : `This will permanently remove "${confirmAction?.label || "this listing"}" from the marketplace.`
                }
                confirmLabel={
                    confirmAction?.type === "accept"
                        ? "Accept Offer"
                        : confirmAction?.type === "reject"
                        ? "Reject Offer"
                        : "Delete Listing"
                }
                variant={confirmAction?.type === "accept" ? "default" : "danger"}
                icon={confirmAction?.type === "accept" ? Check : confirmAction?.type === "reject" ? XCircle : Trash2}
                onConfirm={() => {
                    if (!confirmAction) return;
                    if (confirmAction.type === "accept") handleRespond(confirmAction.id, "ACCEPTED");
                    else if (confirmAction.type === "reject") handleRespond(confirmAction.id, "REJECTED");
                    else if (confirmAction.type === "delete") removeListing(confirmAction.id);
                }}
            />

            {/* Company Profile Modal */}
            <Dialog open={!!profileUserId} onOpenChange={(open) => { if (!open) { setProfileUserId(null); setProfileData(null); } }}>
                <DialogContent className="sm:max-w-[640px] border-none rounded-[24px] shadow-2xl p-0 overflow-hidden max-h-[85vh]">
                    {profileLoading ? (
                        <div className="p-16 text-center"><div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4 mx-auto" /><span className="text-sm font-medium text-muted-foreground">Loading profile...</span></div>
                    ) : profileData ? (
                        <div className="bg-white overflow-y-auto max-h-[85vh]">
                            <div className="h-24 bg-gradient-to-r from-primary to-indigo-600"></div>
                            <div className="px-6 pb-6">
                                <div className="flex justify-between items-end -mt-10 mb-3">
                                    <div className="w-20 h-20 rounded-full border-4 border-white bg-primary/10 shadow-md flex items-center justify-center text-primary text-2xl font-black">
                                        {profileData.user.name?.charAt(0)?.toUpperCase() || "?"}
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="text-center bg-amber-50 rounded-xl px-4 py-2 border border-amber-100 shadow-sm">
                                            <div className="flex items-center gap-1 justify-center text-amber-500 mb-0.5">
                                                <Star className="w-4 h-4 fill-amber-500" />
                                                <span className="font-bold text-sm text-amber-700">{profileData.stats.avgRating || "N/A"}</span>
                                            </div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700/60">Rating</p>
                                        </div>
                                        <div className="text-center bg-emerald-50 rounded-xl px-4 py-2 border border-emerald-100 shadow-sm">
                                            <div className="font-black text-lg text-emerald-600 leading-tight">{profileData.stats.reliabilityScore}</div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/60">Reliability</p>
                                        </div>
                                    </div>
                                </div>

                                <h2 className="text-xl font-black text-slate-900 mb-0.5">{profileData.user.name}</h2>
                                <p className="text-sm text-slate-500 mb-1 font-medium">{profileData.user.companyDescription || profileData.user.bio || "No description provided"}</p>
                                <div className="flex items-center gap-3 text-xs text-slate-400 font-bold mb-4 flex-wrap">
                                    {profileData.user.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{profileData.user.address}</span>}
                                    {profileData.user.industry && <><span>·</span><span>{profileData.user.industry}</span></>}
                                    <span>·</span>
                                    <span>Member since {new Date(profileData.user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                                </div>

                                {/* Stats Cards */}
                                <div className="grid grid-cols-4 gap-2 mb-4">
                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
                                        <Shield className="w-3.5 h-3.5 text-emerald-500 mb-0.5" />
                                        <span className="text-base font-black text-slate-800 leading-none mb-0.5">{profileData.stats.reliabilityScore}</span>
                                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Reliability</span>
                                    </div>
                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
                                        <TrendingUp className="w-3.5 h-3.5 text-blue-500 mb-0.5" />
                                        <span className="text-base font-black text-slate-800 leading-none mb-0.5">{profileData.stats.onTimePercent}%</span>
                                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">On-Time</span>
                                    </div>
                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
                                        <Briefcase className="w-3.5 h-3.5 text-amber-500 mb-0.5" />
                                        <span className="text-base font-black text-slate-800 leading-none mb-0.5">{profileData.stats.totalDeals}</span>
                                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Deals</span>
                                    </div>
                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
                                        <Star className="w-3.5 h-3.5 text-purple-500 mb-0.5" />
                                        <span className="text-base font-black text-slate-800 leading-none mb-0.5">{profileData.stats.totalReviews}</span>
                                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Reviews</span>
                                    </div>
                                </div>

                                {/* Company Details */}
                                {(profileData.user.gstin || profileData.user.yearEstablished || profileData.user.website || profileData.user.officialEmail) && (
                                    <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100 space-y-2">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Company Details</h3>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            {profileData.user.gstin && <div><span className="text-slate-400 text-xs font-bold">GSTIN:</span> <span className="font-medium text-slate-700">{profileData.user.gstin}</span></div>}
                                            {profileData.user.yearEstablished && <div><span className="text-slate-400 text-xs font-bold">Est:</span> <span className="font-medium text-slate-700">{profileData.user.yearEstablished}</span></div>}
                                            {profileData.user.website && <div><span className="text-slate-400 text-xs font-bold">Web:</span> <span className="font-medium text-slate-700">{profileData.user.website}</span></div>}
                                            {profileData.user.officialEmail && <div><span className="text-slate-400 text-xs font-bold">Email:</span> <span className="font-medium text-slate-700">{profileData.user.officialEmail}</span></div>}
                                        </div>
                                    </div>
                                )}

                                {/* Reviews Section */}
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Reviews ({profileData.reviews.length})</h3>
                                    {profileData.reviews.length === 0 ? (
                                        <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 text-center text-sm text-slate-400 font-medium">No reviews yet</div>
                                    ) : (
                                        <div className="space-y-3 max-h-[200px] overflow-y-auto">
                                            {profileData.reviews.map((review: ReviewData) => (
                                                <div key={review.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-sm text-slate-700">{review.reviewerName}</span>
                                                            <div className="flex items-center gap-0.5">
                                                                {Array.from({ length: 5 }).map((_, i) => (
                                                                    <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2 py-0.5 ${review.deliveredOnTime ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                                                            {review.deliveredOnTime ? <ThumbsUp className="w-2.5 h-2.5" /> : <ThumbsDown className="w-2.5 h-2.5" />}
                                                            {review.deliveredOnTime ? "On Time" : "Late"}
                                                        </span>
                                                    </div>
                                                    {review.comment && <p className="text-sm text-slate-600 font-medium">"{review.comment}"</p>}
                                                    <span className="text-[10px] text-slate-400 font-bold mt-1 block">{new Date(review.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                                    <Button onClick={() => { setProfileUserId(null); setProfileData(null); }} className="rounded-full px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold">
                                        Close Profile
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-16 text-center text-sm text-muted-foreground font-medium">Profile not found</div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Leave Review Modal */}
            <Dialog open={!!reviewModal} onOpenChange={(open) => { if (!open) setReviewModal(null); }}>
                {reviewModal && (
                    <DialogContent className="sm:max-w-[480px] rounded-[24px] border-border/50 shadow-2xl p-8">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold tracking-tight flex items-center gap-2"><Award className="w-6 h-6 text-amber-500" /> Leave a Review</DialogTitle>
                            <DialogDescription className="text-sm pt-1">
                                Review your deal for <span className="font-semibold text-foreground">{reviewModal.listingItemName}</span> with <span className="font-bold">{reviewModal.toSellerName || reviewModal.toSeller}</span>
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmitReview} className="space-y-5 pt-4">
                            {/* Star Rating */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Rating</label>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button key={star} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                            className="p-1 transition-transform hover:scale-110">
                                            <Star className={`w-8 h-8 ${star <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 hover:text-amber-200'} transition-colors`} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Delivered on time */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Delivered on Time?</label>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setReviewForm({ ...reviewForm, deliveredOnTime: true })}
                                        className={`flex-1 py-3 rounded-xl text-sm font-bold tracking-wide flex items-center justify-center gap-2 transition-all border ${reviewForm.deliveredOnTime ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-secondary text-muted-foreground border-border/50 hover:bg-emerald-50'}`}>
                                        <ThumbsUp className="w-4 h-4" /> Yes, On Time
                                    </button>
                                    <button type="button" onClick={() => setReviewForm({ ...reviewForm, deliveredOnTime: false })}
                                        className={`flex-1 py-3 rounded-xl text-sm font-bold tracking-wide flex items-center justify-center gap-2 transition-all border ${!reviewForm.deliveredOnTime ? 'bg-red-500 text-white border-red-500' : 'bg-secondary text-muted-foreground border-border/50 hover:bg-red-50'}`}>
                                        <ThumbsDown className="w-4 h-4" /> No, Late
                                    </button>
                                </div>
                            </div>
                            {/* Comment */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Comment</label>
                                <textarea placeholder="How was your experience with this seller?" value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                    className="force-rectangle w-full p-4 bg-secondary/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-medium text-foreground placeholder:text-muted-foreground transition-all" />
                            </div>
                            <DialogFooter className="pt-2">
                                <Button type="submit" disabled={reviewSubmitting || reviewForm.rating === 0} className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl shadow-md">
                                    {reviewSubmitting ? "Submitting..." : "Submit Review"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    );
}

/* ─── Inventory Tab ─── */
function InventoryTab({ listings, isLoading, onDelete }: { listings: MarketplaceListing[]; isLoading: boolean; onDelete: (id: string, name: string) => void }) {
    const [invSearch, setInvSearch] = useState("");
    const [invCategory, setInvCategory] = useState("ALL");

    const filtered = listings.filter(item => {
        const matchesSearch = !invSearch || item.itemName.toLowerCase().includes(invSearch.toLowerCase()) || item.description.toLowerCase().includes(invSearch.toLowerCase());
        const matchesCat = invCategory === "ALL" || item.category === invCategory;
        return matchesSearch && matchesCat;
    });

    if (isLoading && listings.length === 0) {
        return <div className="p-16 text-center text-muted-foreground"><div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4 mx-auto" /><span className="text-sm font-medium">Loading inventory...</span></div>;
    }

    return (
        <div className="space-y-6">
            {/* Search & Filters */}
            <div className="bg-card rounded-[20px] border border-border/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                        <Input placeholder="Search your listings..." value={invSearch} onChange={e => setInvSearch(e.target.value)}
                            className="force-rectangle h-12 bg-secondary/50 border-border/50 font-medium" style={{ paddingLeft: '2.75rem', paddingRight: '2.5rem', borderRadius: '0.75rem' }} />
                        {invSearch && (
                            <button onClick={() => setInvSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-muted-foreground/10 hover:bg-muted-foreground/20 text-muted-foreground transition-colors z-10">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <button onClick={() => setInvCategory("ALL")} className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all ${invCategory === "ALL" ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary/80 border border-border/50'}`}>All</button>
                        {CATEGORIES.map(c => (
                            <button key={c} onClick={() => setInvCategory(c)} className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all ${invCategory === c ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary/80 border border-border/50'}`}>{c}</button>
                        ))}
                    </div>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="bg-card rounded-[20px] border border-border/50 p-16 text-center">
                    <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-foreground mb-2">{listings.length === 0 ? "No listings yet" : "No matching listings"}</h3>
                    <p className="text-sm text-muted-foreground">{listings.length === 0 ? 'Click "Add Listing" to publish your first product.' : "Try adjusting your search or filters."}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(item => (
                        <div key={item.id} className="bg-card rounded-[20px] border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 p-6 group relative">
                            <div className="flex items-start justify-between mb-4">
                                <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${categoryColors[item.category]}`}>{item.category}</span>
                                <button onClick={() => onDelete(item.id, item.itemName)} className="p-2 text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-2 tracking-tight">{item.itemName}</h3>
                            <p className="text-xs text-muted-foreground font-medium line-clamp-2 mb-4">{item.description}</p>
                            <div className="flex items-end justify-between pt-4 border-t border-border/30">
                                <div>
                                    <div className="text-2xl font-black text-primary">₹{item.pricePerUnit}</div>
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">per unit</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-foreground">{item.bulkQuantity}</div>
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">available</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground font-medium">
                                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{item.location}</span>
                                <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{new Date(item.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─── Marketplace Tab ─── */
function MarketplaceTab({ listings, isLoading, searchQuery, setSearchQuery, categoryFilter, setCategoryFilter, onViewDetail, onMakeOffer, contactReveal, onRevealContact, onViewSellerProfile }: {
    listings: MarketplaceListing[]; isLoading: boolean; searchQuery: string; setSearchQuery: (v: string) => void;
    categoryFilter: string; setCategoryFilter: (v: string) => void; onViewDetail: (l: MarketplaceListing) => void;
    onMakeOffer: (l: MarketplaceListing) => void; contactReveal: Record<string, boolean>; onRevealContact: (id: string) => void;
    onViewSellerProfile: (userId: string) => void;
}) {
    return (
        <div className="space-y-6">
            {/* Search & Filters */}
            <div className="bg-card rounded-[20px] border border-border/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                        <Input placeholder="Search products, sellers, materials..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            className="force-rectangle h-12 bg-secondary/50 border-border/50 font-medium" style={{ paddingLeft: '2.75rem', paddingRight: '2.5rem', borderRadius: '0.75rem' }} />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-muted-foreground/10 hover:bg-muted-foreground/20 text-muted-foreground transition-colors z-10">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <button onClick={() => setCategoryFilter("ALL")} className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all ${categoryFilter === "ALL" ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary/80 border border-border/50'}`}>All</button>
                        {CATEGORIES.map(c => (
                            <button key={c} onClick={() => setCategoryFilter(c)} className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all ${categoryFilter === c ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary/80 border border-border/50'}`}>{c}</button>
                        ))}
                    </div>
                </div>
            </div>

            {isLoading && listings.length === 0 ? (
                <div className="p-16 text-center text-muted-foreground"><div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4 mx-auto" /><span className="text-sm font-medium">Loading marketplace...</span></div>
            ) : listings.length === 0 ? (
                <div className="bg-card rounded-[20px] border border-border/50 p-16 text-center">
                    <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-foreground mb-2">No listings found</h3>
                    <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.map(item => (
                        <div key={item.id} className="bg-card rounded-[20px] border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 overflow-hidden group cursor-pointer" onClick={() => onViewDetail(item)}>
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-3">
                                    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${categoryColors[item.category]}`}>{item.category}</span>
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(item.createdAt).toLocaleDateString()}</span>
                                </div>
                                <h3 className="text-lg font-bold text-foreground mb-1 tracking-tight group-hover:text-primary transition-colors">{item.itemName}</h3>
                                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1 mb-3">
                                    <MapPin className="w-3 h-3" />{item.location} ·{' '}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); if (item.sellerId) onViewSellerProfile(item.sellerId); }}
                                        className="text-primary hover:text-primary/80 hover:underline cursor-pointer font-bold"
                                    >
                                        {item.sellerName}
                                    </button>
                                </p>
                                <p className="text-xs text-foreground/60 font-medium line-clamp-2 mb-4">{item.description}</p>
                                <div className="flex items-end justify-between pt-4 border-t border-border/30">
                                    <div>
                                        <div className="text-2xl font-black text-primary">₹{item.pricePerUnit}</div>
                                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">per unit</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-foreground">{item.bulkQuantity}</div>
                                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">available</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => onMakeOffer(item)} className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-1.5">
                                        <Send className="w-3.5 h-3.5" /> Make Offer
                                    </button>
                                    <button onClick={() => contactReveal[item.id] ? null : onRevealContact(item.id)}
                                        className={`py-2.5 px-4 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center gap-1.5 ${contactReveal[item.id] ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-secondary hover:bg-secondary/80 text-muted-foreground border border-border/50'}`}>
                                        {contactReveal[item.id] ? <><Phone className="w-3.5 h-3.5" />{item.sellerContact.phone}</> : <><Eye className="w-3.5 h-3.5" />Contact</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─── Negotiations Tab ─── */
function NegotiationsTab({ sent, received, isLoading, onAccept, onReject, onCounter, onViewProfile, onReview, reviewedIds }: {
    sent: CounterOffer[]; received: CounterOffer[]; isLoading: boolean;
    onAccept: (id: string) => void; onReject: (id: string) => void; onCounter: (o: CounterOffer) => void;
    onViewProfile: (userId: string) => void; onReview: (o: CounterOffer) => void; reviewedIds: Set<string>;
}) {
    const renderOffer = (offer: CounterOffer, type: "sent" | "received") => (
        <div key={offer.id} className="bg-card rounded-[20px] border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-all p-6">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-base font-bold text-foreground tracking-tight">{offer.listingItemName}</h3>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                        <button onClick={() => onViewProfile(type === "sent" ? offer.toSeller : offer.fromBuyer)}
                            className="hover:text-primary hover:underline transition-colors inline-flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {type === "sent" ? `To: ${offer.toSellerName || offer.toSeller}` : `From: ${offer.fromBuyerName || offer.fromBuyer}`}
                        </button>
                    </p>
                </div>
                <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${statusColors[offer.status]}`}>{offer.status}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-secondary/50 rounded-xl p-3 text-center border border-border/30">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Listed</div>
                    <div className="text-sm font-bold">₹{offer.originalPrice}</div>
                </div>
                <div className="bg-primary/5 rounded-xl p-3 text-center border border-primary/20">
                    <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-0.5">Offered</div>
                    <div className="text-sm font-bold text-primary">₹{offer.offerPrice}</div>
                </div>
                <div className="bg-secondary/50 rounded-xl p-3 text-center border border-border/30">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Qty</div>
                    <div className="text-sm font-bold">{offer.quantity}</div>
                </div>
            </div>
            <div className="bg-secondary/30 rounded-xl p-4 mb-4 border border-border/20">
                <p className="text-sm text-foreground/80 font-medium leading-relaxed">"{offer.message}"</p>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-2 block">{new Date(offer.createdAt).toLocaleDateString()}</span>
            </div>
            {offer.counterResponse && (
                <div className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200 animate-in fade-in duration-300">
                    <div className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-2 flex items-center gap-1"><ChevronRight className="w-3 h-3" />Counter Response</div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-black text-blue-700">₹{offer.counterResponse.price}/unit</span>
                    </div>
                    <p className="text-sm text-blue-800/80 font-medium">"{offer.counterResponse.message}"</p>
                </div>
            )}
            {type === "received" && offer.status === "PENDING" && (
                <div className="flex gap-2 pt-2">
                    <button onClick={() => onAccept(offer.id)} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 transition-all">
                        <Check className="w-4 h-4" /> Accept
                    </button>
                    <button onClick={() => onCounter(offer)} className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 transition-all">
                        <Send className="w-4 h-4" /> Counter
                    </button>
                    <button onClick={() => onReject(offer.id)} className="py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 transition-all border border-red-200">
                        <XCircle className="w-4 h-4" />
                    </button>
                </div>
            )}
            {type === "sent" && offer.status === "COUNTERED" && offer.counterResponse && (
                <div className="flex gap-2 pt-2">
                    <button onClick={() => onAccept(offer.id)} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 transition-all">
                        <Check className="w-4 h-4" /> Accept ₹{offer.counterResponse.price}
                    </button>
                    <button onClick={() => onReject(offer.id)} className="py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 transition-all border border-red-200">
                        <XCircle className="w-4 h-4" /> Decline
                    </button>
                </div>
            )}
            {type === "sent" && offer.status === "ACCEPTED" && !offer.hasReview && !reviewedIds.has(offer.id) && (
                <div className="pt-2">
                    <button onClick={() => onReview(offer)} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 transition-all">
                        <Star className="w-4 h-4" /> Leave a Review
                    </button>
                </div>
            )}
            {(offer.hasReview || reviewedIds.has(offer.id)) && offer.status === "ACCEPTED" && (
                <div className="pt-2 flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-xl px-4 py-2.5 border border-emerald-200">
                    <Check className="w-3.5 h-3.5" /> Review submitted
                </div>
            )}
        </div>
    );

    if (isLoading && sent.length === 0 && received.length === 0) {
        return <div className="p-16 text-center text-muted-foreground"><div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4 mx-auto" /><span className="text-sm font-medium">Loading negotiations...</span></div>;
    }

    return (
        <div className="space-y-8">
            {/* Received Offers */}
            <div>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center"><ArrowDownRight className="w-4 h-4 text-orange-500" /></div>
                    Offers Received
                    {received.filter(o => o.status === "PENDING").length > 0 && <span className="text-[10px] font-bold bg-orange-500 text-white px-2.5 py-1 rounded-full">{received.filter(o => o.status === "PENDING").length} new</span>}
                </h2>
                {received.length === 0 ? (
                    <div className="bg-card rounded-[20px] border border-border/50 p-12 text-center text-sm text-muted-foreground font-medium">No offers received yet</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{received.map(o => renderOffer(o, "received"))}</div>
                )}
            </div>
            {/* Sent Offers */}
            <div>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><ArrowUpRight className="w-4 h-4 text-primary" /></div>
                    Offers Sent
                </h2>
                {sent.length === 0 ? (
                    <div className="bg-card rounded-[20px] border border-border/50 p-12 text-center text-sm text-muted-foreground font-medium">No offers sent yet. Browse the marketplace to find deals.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{sent.map(o => renderOffer(o, "sent"))}</div>
                )}
            </div>
        </div>
    );
}
