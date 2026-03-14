import { useEffect, useState } from "react";
import { useSocialStore } from "../../store/useSocialStore";
import { Send, TrendingUp, Users, Heart, MessageCircle, Trash2 } from "lucide-react";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";

import type { SocialFeedPost } from "../../services/api";

function PostCard({ post }: { post: SocialFeedPost }) {
    const { likePost, addReply, deletePost, deleteReply } = useSocialStore();
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [hasLiked, setHasLiked] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{
        type: "deletePost" | "deleteReply";
        replyId?: string;
    } | null>(null);

    const isOwnPost = post.authorName === "Sangam Textiles";

    const handleLike = () => {
        if (!hasLiked) {
            setHasLiked(true);
            likePost(post.id);
        }
    };

    const handleReply = (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyContent.trim()) return;
        addReply(post.id, replyContent);
        setReplyContent("");
    };

    return (
        <div className="bg-card rounded-[24px] border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
            <div className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-5">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border-2 border-white shadow-sm group-hover:bg-primary/10 transition-colors">
                        <Users className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1 pt-1.5">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">{post.authorName}</h3>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">
                                    {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            {isOwnPost && (
                                <button
                                    onClick={() => setConfirmAction({ type: "deletePost" })}
                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Post"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2 mt-2">
                            {post.tags.map(t => (
                                <span key={t} className="px-2.5 py-1 bg-primary/5 text-primary rounded-md text-[10px] font-black uppercase tracking-widest border border-primary/10 transition-colors cursor-pointer hover:bg-primary/10">{t}</span>
                            ))}
                        </div>
                    </div>
                </div>

                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap font-medium text-[15px] mb-6">
                    {post.content}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-6 border-t border-slate-100 pt-5 mt-2">
                    <button 
                        onClick={handleLike} 
                        className={`flex items-center gap-2 text-sm font-bold transition-colors ${hasLiked ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'}`}
                    >
                        <Heart className={`w-5 h-5 ${hasLiked ? 'fill-rose-500' : ''}`} />
                        <span>{post.likes || 0}</span>
                    </button>
                    <button 
                        onClick={() => setIsReplying(!isReplying)}
                        className={`flex items-center gap-2 text-sm font-bold transition-colors ${isReplying ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'}`}
                    >
                        <MessageCircle className="w-5 h-5" />
                        <span>{post.replies?.length || 0}</span>
                    </button>
                </div>

                {/* Replies Section */}
                {(post.replies?.length > 0 || isReplying) && (
                    <div className="mt-6 space-y-4 bg-slate-50/50 rounded-2xl p-5 border border-slate-100/80">
                        {post.replies?.map(reply => {
                            const isOwnReply = reply.authorName === "Sangam Textiles" || reply.authorName === "You (Mocked)";
                            
                            return (
                                <div key={reply.id} className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-1">
                                        <Users className="w-4 h-4 text-slate-500" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="bg-white p-3.5 rounded-2xl rounded-tl-sm border border-slate-100 shadow-sm inline-block min-w-[200px] max-w-full">
                                            <div className="flex justify-between items-start gap-4 mb-0.5">
                                                <span className="text-[13px] font-bold text-slate-900">{reply.authorName}</span>
                                            </div>
                                            <p className="text-sm text-slate-700 font-medium leading-relaxed">{reply.content}</p>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1.5 ml-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isOwnReply && (
                                                <button
                                                    onClick={() => setConfirmAction({ type: "deleteReply", replyId: reply.id })}
                                                    className="text-[10px] font-bold text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {isReplying && (
                            <form onSubmit={handleReply} className="flex gap-3 pt-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <Users className="w-4 h-4 text-primary" />
                                </div>
                                <div className="flex-1 relative">
                                    <Input 
                                        autoFocus
                                        placeholder="Write a reply..."
                                        value={replyContent}
                                        onChange={e => setReplyContent(e.target.value)}
                                        className="h-10 text-sm font-medium focus-visible:ring-primary border-slate-200 rounded-full bg-white pr-12 shadow-sm"
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={!replyContent.trim()}
                                        className="absolute right-1 top-1 w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full disabled:opacity-50 hover:bg-primary/90 transition-colors"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </div>

            {/* Confirmation Dialog */}
            <ConfirmDialog
                open={!!confirmAction}
                onOpenChange={(open) => !open && setConfirmAction(null)}
                title={confirmAction?.type === "deletePost" ? "Delete Post?" : "Delete Reply?"}
                description={
                    confirmAction?.type === "deletePost"
                        ? "This will permanently delete your post and all its replies. This cannot be undone."
                        : "This will permanently delete your reply. This cannot be undone."
                }
                confirmLabel="Delete"
                variant="danger"
                icon={Trash2}
                onConfirm={() => {
                    if (!confirmAction) return;
                    if (confirmAction.type === "deletePost") {
                        deletePost(post.id);
                    } else if (confirmAction.type === "deleteReply" && confirmAction.replyId) {
                        deleteReply(post.id, confirmAction.replyId);
                    }
                }}
            />
        </div>
    );
}

export default function UdhyaamNetwork() {
    const { feed, trendingTags, isLoading, loadFeed, loadTrendingTags, createPost } = useSocialStore();
    const [content, setContent] = useState("");
    const [tag, setTag] = useState("");
    const [activeFilter, setActiveFilter] = useState("ALL");

    useEffect(() => {
        loadFeed();
        loadTrendingTags();
    }, [loadFeed, loadTrendingTags]);

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content) return;

        await createPost({
            authorName: "Sangam Textiles", // Mocking current user
            content,
            tags: tag ? [`#${tag.replace('#', '')}`] : ["#B2BInsight"],
        });

        setContent("");
        setTag("");
    };

    return (
        <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-normal tracking-tight text-foreground mb-5">Udhyaam Network</h1>
                    <p className="text-slate-500 text-sm font-medium">
                        B2B insights, market trends, and supply chain updates.
                    </p>
                </div>
            </div>

            {/* Compose Box */}
            <div className="bg-card rounded-[24px] border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="h-2 w-full bg-primary/20 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[#356DDA]"></div>
                </div>
                <div className="p-8">
                    <form onSubmit={handlePost} className="space-y-6">
                        <textarea
                            className="w-full resize-none p-5 bg-slate-50/50 border border-slate-200 rounded-[20px] focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all text-slate-800 placeholder:text-slate-400 text-lg font-medium shadow-inner"
                            rows={3}
                            placeholder={activeFilter !== "ALL" ? `Share an insight about ${activeFilter}...` : "Share a market insight, price drop, or look for bulk buyers..."}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                        />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100/80">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Add Tags</span>
                                <Input
                                    placeholder="e.g. Textiles"
                                    value={tag}
                                    onChange={(e) => setTag(e.target.value)}
                                    className="h-10 text-sm font-bold focus-visible:ring-primary border-slate-200 rounded-full bg-slate-50 w-32 md:w-48 shadow-inner"
                                />
                            </div>
                            <Button type="submit" disabled={isLoading} className="bg-black hover:bg-slate-800 text-white rounded-full px-8 py-6 font-bold shadow-[0_4px_15px_rgb(0,0,0,0.1)] hover:-translate-y-0.5 transition-all w-full sm:w-auto text-xs uppercase tracking-widest">
                                {isLoading ? "Posting..." : (
                                    <>Post Insight <Send className="w-4 h-4 ml-2" /></>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Feed Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 px-2">
                        <h2 className="text-2xl font-black text-foreground flex items-center gap-3 tracking-tighter">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-primary" />
                            </div>
                            Latest Activity
                        </h2>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setActiveFilter("ALL")}
                                className={`px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-full cursor-pointer transition-colors shadow-sm ${activeFilter === "ALL" ? 'bg-black text-white' : 'bg-card text-slate-500 hover:bg-slate-50 border border-slate-200'}`}
                            >
                                All Posts
                            </button>
                            {trendingTags.slice(0, 3).map((t, idx) => (
                                <button
                                    key={t.tag}
                                    onClick={() => setActiveFilter(t.tag)}
                                    className={`px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-full cursor-pointer transition-colors shadow-sm ${idx >= 2 ? 'hidden sm:inline-block' : ''} ${activeFilter === t.tag ? 'bg-primary text-white' : 'bg-card text-slate-500 hover:bg-slate-50 border border-slate-200'}`}
                                >
                                    {t.tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {isLoading && feed.length === 0 ? (
                        <div className="py-16 text-center text-slate-500 font-medium">Syncing network feed...</div>
                    ) : (
                        feed
                        .filter(post => activeFilter === "ALL" || post.tags.includes(activeFilter))
                        .map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))
                    )}
                </div>

                {/* Right Sidebar */}
                <div className="space-y-8 lg:mt-16">
                    <div className="bg-card rounded-[24px] border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
                        <div className="pb-4 pt-8 px-8 border-b border-slate-100/80">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trending Network Tags</h3>
                        </div>
                        <div className="p-6 space-y-3">
                            {trendingTags.length > 0 ? (
                                trendingTags.map(t => (
                                    <div 
                                        key={t.tag}
                                        onClick={() => setActiveFilter(t.tag)}
                                        className="flex justify-between items-center p-4 rounded-xl hover:bg-slate-50/80 border border-transparent hover:border-slate-100 transition-all group cursor-pointer"
                                    >
                                        <span className="text-slate-600 font-bold group-hover:text-primary transition-colors text-sm">{t.tag}</span>
                                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{t.count} posts</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-slate-400 text-sm font-medium py-4">Loading tags...</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
