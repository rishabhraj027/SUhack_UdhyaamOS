import { useState, useRef, useEffect } from "react";
import { Search, Send, ImagePlus, ArrowLeft, X, MessageSquare } from "lucide-react";
import type { ChatConversation, ChatMessage } from "../../services/api";

interface ChatWindowProps {
    theme: "business" | "junior-pro";
    conversations: ChatConversation[];
    messages: ChatMessage[];
    activeConversationId: string | null;
    currentUserId: string;
    isLoading: boolean;
    onSelectConversation: (id: string) => void;
    onBack: () => void;
    onSendMessage: (content: string, imageUrl?: string) => void;
}

export function ChatWindow({
    theme,
    conversations,
    messages,
    activeConversationId,
    currentUserId,
    isLoading,
    onSelectConversation,
    onBack,
    onSendMessage,
}: ChatWindowProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [messageInput, setMessageInput] = useState("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isBiz = theme === "business";

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const filteredConversations = conversations.filter(c => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const otherName = currentUserId === c.founderId ? c.juniorProName : c.founderName;
        return otherName.toLowerCase().includes(q) || c.bountyTitle.toLowerCase().includes(q);
    });

    const activeConversation = conversations.find(c => c.id === activeConversationId);

    const handleSend = () => {
        if (!messageInput.trim() && !imagePreview) return;
        onSendMessage(messageInput.trim(), imagePreview || undefined);
        setMessageInput("");
        setImagePreview(null);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const formatMessageTime = (ts: string) => {
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const formatConversationTime = (ts?: string) => {
        if (!ts) return "";
        const d = new Date(ts);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
        return d.toLocaleDateString([], { month: "short", day: "numeric" });
    };

    const getDateSeparator = (ts: string, prevTs?: string) => {
        const d = new Date(ts);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (prevTs) {
            const prevD = new Date(prevTs);
            if (d.toDateString() === prevD.toDateString()) return null;
        }

        if (d.toDateString() === today.toDateString()) return "Today";
        if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
        return d.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
    };

    // ─── CONVERSATION LIST ───
    const renderConversationList = () => (
        <div className={`chat-list-panel flex flex-col h-full overflow-hidden ${
            isBiz
                ? 'bg-card rounded-2xl border border-slate-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
                : 'bg-[#111111] rounded-2xl border border-[#333333]'
        }`}>
            {/* Search Header */}
            <div className={`p-4 ${isBiz ? 'border-b border-slate-100' : 'border-b border-[#333333]'}`}>
                <div className={`flex items-center gap-2.5 px-4 py-2.5 ${
                    isBiz
                        ? 'bg-slate-100 rounded-full border border-slate-200'
                        : 'bg-[#1A1A1A] rounded-full border border-[#333333]'
                }`}>
                    <Search className={`w-4 h-4 shrink-0 ${isBiz ? 'text-slate-400' : 'text-gray-400'}`} />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`flex-1 bg-transparent text-sm outline-none ${
                            isBiz
                                ? 'text-slate-700 placeholder:text-slate-400 font-medium'
                                : 'text-white placeholder:text-gray-500 font-bold uppercase tracking-wider text-xs'
                        }`}
                    />
                </div>
            </div>

            {/* Conversation Items */}
            <div className="flex-1 overflow-y-auto chat-messages-scroll">
                {isLoading && conversations.length === 0 ? (
                    <div className="flex items-center justify-center h-32">
                        <div className={`w-6 h-6 border-2 border-t-transparent rounded-full animate-spin ${
                            isBiz ? 'border-[#356DDA]' : 'border-white'
                        }`} />
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className={`p-8 text-center ${isBiz ? 'text-slate-400' : 'text-white/30'}`}>
                        <p className="text-sm font-medium">No conversations found</p>
                    </div>
                ) : (
                    filteredConversations.map((conv) => {
                        const isActive = conv.id === activeConversationId;
                        const otherName = currentUserId === conv.founderId ? conv.juniorProName : conv.founderName;
                        const otherAvatar = currentUserId === conv.founderId ? conv.juniorProAvatarUrl : conv.founderAvatarUrl;

                        return (
                            <div
                                key={conv.id}
                                onClick={() => onSelectConversation(conv.id)}
                                role="button"
                                tabIndex={0}
                                className={`chat-conv-btn w-full flex items-start gap-3 p-4 transition-all duration-200 text-left cursor-pointer ${
                                    isActive
                                        ? isBiz
                                            ? 'bg-[#356DDA]/5'
                                            : 'bg-white/5'
                                        : isBiz
                                            ? 'hover:bg-slate-50'
                                            : 'hover:bg-white/[0.03]'
                                }`}
                            >
                                <img
                                    src={otherAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${otherName}`}
                                    alt={otherName}
                                    className={`w-11 h-11 shrink-0 object-cover rounded-full ${
                                        isBiz ? 'border border-slate-200' : 'border border-[#333333]'
                                    }`}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className={`text-sm font-bold truncate ${
                                            isBiz
                                                ? (isActive ? 'text-[#356DDA]' : 'text-slate-800')
                                                : (isActive ? 'text-white' : 'text-white/80')
                                        }`}>
                                            {otherName}
                                        </span>
                                        <span className={`text-[10px] font-medium shrink-0 ml-2 ${
                                            isBiz ? 'text-slate-400' : 'text-gray-500'
                                        }`}>
                                            {formatConversationTime(conv.lastMessageTime)}
                                        </span>
                                    </div>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
                                        isBiz ? 'text-slate-400' : 'text-gray-500'
                                    }`}>
                                        {conv.bountyTitle}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <p className={`text-xs truncate ${isBiz ? 'text-slate-500' : 'text-gray-400'}`}>
                                            {conv.lastMessage || "No messages yet"}
                                        </p>
                                        {conv.unreadCount > 0 && (
                                            <span
                                                className={`chat-unread-badge shrink-0 ml-2 min-w-[20px] h-5 px-1.5 text-[10px] font-bold flex items-center justify-center ${
                                                    isBiz
                                                        ? 'bg-[#356DDA] text-white'
                                                        : 'bg-white text-black'
                                                }`}
                                            >
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );

    // ─── CHAT AREA ───
    const renderChatArea = () => {
        if (!activeConversation) {
            return (
                <div className={`flex-1 flex flex-col items-center justify-center ${
                    isBiz
                        ? 'bg-card rounded-2xl border border-slate-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
                        : 'bg-[#111111] rounded-2xl border border-[#333333]'
                }`}>
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
                        isBiz ? 'bg-blue-50' : 'bg-white/5'
                    }`}>
                        <MessageSquare className={`w-8 h-8 ${isBiz ? 'text-[#356DDA]' : 'text-white/30'}`} />
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${isBiz ? 'text-slate-900' : 'text-white uppercase tracking-wider'}`}>
                        {isBiz ? "Select a Conversation" : "SELECT A THREAD"}
                    </h3>
                    <p className={`text-sm max-w-xs text-center ${isBiz ? 'text-slate-500' : 'text-gray-500'}`}>
                        Choose a conversation from the list to start chatting with your {isBiz ? "Junior Pro" : "Founder"}
                    </p>
                </div>
            );
        }

        const otherName = currentUserId === activeConversation.founderId
            ? activeConversation.juniorProName
            : activeConversation.founderName;
        const otherAvatar = currentUserId === activeConversation.founderId
            ? activeConversation.juniorProAvatarUrl
            : activeConversation.founderAvatarUrl;

        return (
            <div className={`flex-1 flex flex-col h-full overflow-hidden ${
                isBiz
                    ? 'bg-card rounded-2xl border border-slate-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
                    : 'bg-[#111111] rounded-2xl border border-[#333333]'
            }`}>
                {/* Chat Header */}
                <div className={`flex items-center gap-3 px-5 py-3.5 shrink-0 ${
                    isBiz ? 'border-b border-slate-100' : 'border-b border-[#333333]'
                }`}>
                    <button
                        onClick={onBack}
                        className={`md:hidden p-1.5 rounded-full transition-colors ${
                            isBiz ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-white/10 text-gray-400'
                        }`}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <img
                        src={otherAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${otherName}`}
                        alt={otherName}
                        className={`w-10 h-10 rounded-full object-cover ${
                            isBiz ? 'border-2 border-slate-200' : 'border-2 border-[#333333]'
                        }`}
                    />
                    <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-bold truncate ${isBiz ? 'text-slate-900' : 'text-white'}`}>{otherName}</h4>
                        <p className={`text-[10px] font-bold uppercase tracking-widest truncate ${
                            isBiz ? 'text-slate-400' : 'text-gray-500'
                        }`}>
                            {activeConversation.bountyTitle}
                        </p>
                    </div>
                    <div className={`chat-role-badge px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                        isBiz
                            ? 'bg-blue-50 text-[#356DDA] rounded-lg'
                            : 'bg-white/5 text-gray-400 border border-[#333333] rounded-lg'
                    }`}>
                        {currentUserId === activeConversation.founderId ? "Junior Pro" : "Founder"}
                    </div>
                </div>

                {/* Messages Area */}
                <div className={`flex-1 overflow-y-auto px-5 py-4 space-y-1 chat-messages-scroll ${
                    isBiz ? 'bg-slate-50/50' : 'bg-black/20'
                }`}>
                    {isLoading && messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className={`w-6 h-6 border-2 border-t-transparent rounded-full animate-spin ${
                                isBiz ? 'border-[#356DDA]' : 'border-white'
                            }`} />
                        </div>
                    ) : (
                        messages.map((msg, idx) => {
                            const isMine = msg.senderId === currentUserId;
                            const prevMsg = idx > 0 ? messages[idx - 1] : undefined;
                            const dateSep = getDateSeparator(msg.timestamp, prevMsg?.timestamp);

                            return (
                                <div key={msg.id}>
                                    {dateSep && (
                                        <div className="flex items-center gap-3 my-4">
                                            <div className={`flex-1 h-px ${isBiz ? 'bg-slate-200' : 'bg-[#333333]'}`} />
                                            <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                                                isBiz
                                                    ? 'text-slate-400 bg-slate-100 border border-slate-200'
                                                    : 'text-gray-500 bg-[#1A1A1A] border border-[#333333]'
                                            }`}>
                                                {dateSep}
                                            </span>
                                            <div className={`flex-1 h-px ${isBiz ? 'bg-slate-200' : 'bg-[#333333]'}`} />
                                        </div>
                                    )}
                                    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2 chat-msg-appear`}>
                                        <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>
                                            <div
                                                className={`px-4 py-3 text-sm font-medium leading-relaxed ${
                                                    isMine
                                                        ? isBiz
                                                            ? 'rounded-[20px] rounded-br-[6px] bg-[#356DDA] text-white'
                                                            : 'rounded-[24px] rounded-br-[6px] bg-white text-black'
                                                        : isBiz
                                                            ? 'rounded-[20px] rounded-bl-[6px] bg-white text-slate-800 border border-slate-100 shadow-sm'
                                                            : 'rounded-[24px] rounded-bl-[6px] bg-[#1A1A1A] text-white/90 border border-[#333333]'
                                                }`}
                                            >
                                                {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                                                {msg.imageUrl && (
                                                    <button
                                                        onClick={() => setLightboxImage(msg.imageUrl || null)}
                                                        className="mt-2 block rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                                                    >
                                                        <img
                                                            src={msg.imageUrl}
                                                            alt="Shared"
                                                            className="max-w-full max-h-[250px] rounded-xl object-cover"
                                                        />
                                                    </button>
                                                )}
                                            </div>
                                            <p className={`text-[10px] mt-1 px-1 ${isMine ? 'text-right' : 'text-left'} ${
                                                isBiz ? 'text-slate-400' : 'text-gray-600'
                                            }`}>
                                                {formatMessageTime(msg.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Image Preview */}
                {imagePreview && (
                    <div className={`px-5 py-2 ${isBiz ? 'bg-white border-t border-slate-100' : 'bg-[#111111] border-t border-[#333333]'}`}>
                        <div className="relative inline-block">
                            <img src={imagePreview} alt="Preview" className="h-20 rounded-xl object-cover" />
                            <button
                                onClick={() => setImagePreview(null)}
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Message Input */}
                <div className={`px-4 py-3 shrink-0 ${
                    isBiz ? 'border-t border-slate-100' : 'border-t border-[#333333]'
                }`}>
                    <div className={`flex items-center gap-2 px-3 py-2 ${
                        isBiz
                            ? 'bg-slate-100 rounded-full border border-slate-200'
                            : 'bg-[#1A1A1A] rounded-full border border-[#333333]'
                    }`}>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className={`p-2 rounded-full shrink-0 transition-colors ${
                                isBiz ? 'hover:bg-slate-200 text-slate-400' : 'hover:bg-white/10 text-gray-500'
                            }`}
                            title="Attach photo"
                        >
                            <ImagePlus className="w-5 h-5" />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                        <textarea
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder={isBiz ? "Type a message..." : "TYPE A MESSAGE..."}
                            rows={1}
                            className={`flex-1 bg-transparent text-sm outline-none resize-none max-h-24 py-2 ${
                                isBiz
                                    ? 'text-slate-700 placeholder:text-slate-400 font-medium'
                                    : 'text-white placeholder:text-gray-500 font-bold tracking-wider text-xs'
                            }`}
                            style={{ minHeight: "20px" }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!messageInput.trim() && !imagePreview}
                            className={`p-2.5 rounded-full shrink-0 transition-all duration-200 ${
                                messageInput.trim() || imagePreview
                                    ? isBiz
                                        ? 'bg-[#356DDA] text-white shadow-lg hover:bg-[#2563EB] hover:scale-105'
                                        : 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:scale-105'
                                    : isBiz
                                        ? 'bg-slate-200 text-slate-400'
                                        : 'bg-[#333333] text-gray-500'
                            }`}
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className={`chat-container flex h-full gap-4 overflow-hidden`}>
                {/* Conversation List — hidden on mobile when a chat is open */}
                <div className={`chat-list-wrapper w-full md:w-[340px] lg:w-[380px] shrink-0 ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
                    {renderConversationList()}
                </div>

                {/* Chat Area — hidden on mobile when no chat is open */}
                <div className={`chat-area-wrapper flex-1 min-w-0 ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
                    {renderChatArea()}
                </div>
            </div>

            {/* Lightbox for images */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
                    onClick={() => setLightboxImage(null)}
                >
                    <button
                        onClick={() => setLightboxImage(null)}
                        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <img
                        src={lightboxImage}
                        alt="Full size"
                        className="max-w-[90vw] max-h-[85vh] rounded-2xl object-contain shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
}
