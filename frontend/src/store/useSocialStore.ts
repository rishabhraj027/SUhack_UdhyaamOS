import { create } from 'zustand';
import { fetchNetworkFeed, postInsight, likeInsight, replyToInsight, fetchTrendingTags, deletePost as apiDeletePost, deleteReply as apiDeleteReply } from '../services/api';
import type { SocialFeedPost, TrendingTag } from '../services/api';

interface SocialState {
    feed: SocialFeedPost[];
    trendingTags: TrendingTag[];
    isLoading: boolean;
    error: string | null;
    loadFeed: () => Promise<void>;
    loadTrendingTags: () => Promise<void>;
    createPost: (post: Omit<SocialFeedPost, "id" | "createdAt" | "likes" | "replies">) => Promise<void>;
    likePost: (postId: string) => Promise<void>;
    addReply: (postId: string, content: string) => Promise<void>;
    deletePost: (postId: string) => Promise<void>;
    deleteReply: (postId: string, replyId: string) => Promise<void>;
}

export const useSocialStore = create<SocialState>((set) => ({
    feed: [],
    trendingTags: [],
    isLoading: false,
    error: null,
    loadFeed: async () => {
        set({ isLoading: true, error: null });
        try {
            const data = await fetchNetworkFeed();
            set({ feed: data, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },
    loadTrendingTags: async () => {
        try {
            const data = await fetchTrendingTags();
            set({ trendingTags: data });
        } catch (err: any) {
            console.error("Failed to load trending tags", err);
        }
    },
    createPost: async (post) => {
        set({ isLoading: true, error: null });
        try {
            const newPost = await postInsight({ authorName: post.authorName, content: post.content, tags: post.tags });
            set((state) => ({ feed: [newPost, ...state.feed], isLoading: false }));
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },
    likePost: async (postId) => {
        try {
            const result = await likeInsight(postId);
            set((state) => ({
                feed: state.feed.map(post =>
                    post.id === postId
                        ? { ...post, likes: result.likes, liked: result.liked }
                        : post
                )
            }));
        } catch (err: any) {
            console.error(err);
        }
    },
    addReply: async (postId, content) => {
        try {
            const newReply = await replyToInsight(postId, content);
            set((state) => ({
                feed: state.feed.map(post => 
                    post.id === postId 
                        ? { ...post, replies: [...post.replies, newReply] } 
                        : post
                )
            }));
        } catch (err: any) {
            console.error(err);
        }
    },
    deletePost: async (postId) => {
        try {
            await apiDeletePost(postId);
            set((state) => ({
                feed: state.feed.filter(post => post.id !== postId)
            }));
        } catch (err: any) {
            console.error('Failed to delete post', err);
        }
    },
    deleteReply: async (postId, replyId) => {
        try {
            await apiDeleteReply(postId, replyId);
            set((state) => ({
                feed: state.feed.map(post => 
                    post.id === postId 
                        ? { ...post, replies: post.replies.filter(r => r.id !== replyId) } 
                        : post
                )
            }));
        } catch (err: any) {
            console.error('Failed to delete reply', err);
        }
    }
}));
