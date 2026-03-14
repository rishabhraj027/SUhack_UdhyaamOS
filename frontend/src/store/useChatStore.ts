import { create } from 'zustand';
import { fetchChatConversations, fetchChatMessages, sendChatMessage } from '../services/api';
import type { ChatConversation, ChatMessage } from '../services/api';

interface ChatState {
    conversations: ChatConversation[];
    messages: Record<string, ChatMessage[]>;
    activeConversationId: string | null;
    isLoading: boolean;
    error: string | null;
    loadConversations: () => Promise<void>;
    loadMessages: (conversationId: string) => Promise<void>;
    sendMessage: (conversationId: string, content: string, senderId: string, senderName: string, senderRole: "Business" | "JuniorPro", imageUrl?: string) => Promise<void>;
    setActiveConversation: (id: string | null) => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
    conversations: [],
    messages: {},
    activeConversationId: null,
    isLoading: false,
    error: null,

    loadConversations: async () => {
        set({ isLoading: true, error: null });
        try {
            const data = await fetchChatConversations();
            set({ conversations: data, isLoading: false });
        } catch (err: unknown) {
            set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
        }
    },

    loadMessages: async (conversationId: string) => {
        set({ isLoading: true, error: null });
        try {
            const msgs = await fetchChatMessages(conversationId);
            set((state) => ({
                messages: { ...state.messages, [conversationId]: msgs },
                isLoading: false,
            }));
        } catch (err: unknown) {
            set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
        }
    },

    sendMessage: async (conversationId, content, senderId, senderName, senderRole, imageUrl?) => {
        try {
            const newMsg = await sendChatMessage(conversationId, content, senderId, senderName, senderRole, imageUrl);
            set((state) => {
                const existing = state.messages[conversationId] || [];
                const updatedConversations = state.conversations.map(c =>
                    c.id === conversationId
                        ? { ...c, lastMessage: content || (imageUrl ? '📷 Photo' : ''), lastMessageTime: newMsg.timestamp }
                        : c
                );
                return {
                    messages: { ...state.messages, [conversationId]: [...existing, newMsg] },
                    conversations: updatedConversations,
                };
            });
        } catch (err: unknown) {
            set({ error: err instanceof Error ? err.message : String(err) });
        }
    },

    setActiveConversation: (id) => {
        set({ activeConversationId: id });
        if (id) {
            set((state) => ({
                conversations: state.conversations.map(c =>
                    c.id === id ? { ...c, unreadCount: 0 } : c
                ),
            }));
            const state = get();
            if (!state.messages[id] || state.messages[id].length === 0) {
                get().loadMessages(id);
            }
        }
    },
}));
