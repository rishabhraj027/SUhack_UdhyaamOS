import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { loginWithEmail, handleGoogleOAuth, registerWithEmail } from '../services/api';
import type { User } from '../services/api';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    login: (email: string, pass: string, role: "Business" | "JuniorPro") => Promise<void>;
    register: (name: string, email: string, pass: string, role: "Business" | "JuniorPro") => Promise<void>;
    googleLogin: (role: "Business" | "JuniorPro") => Promise<void>;
    setAuth: (user: User, token: string) => void;
    logout: () => void;
    updateProfile: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isLoading: false,
            error: null,
            login: async (email, pass, _role) => {
                set({ isLoading: true, error: null });
                try {
                    const { token, user } = await loginWithEmail(email, pass);
                    localStorage.setItem('token', token);
                    localStorage.setItem('user', JSON.stringify(user));
                    set({ user, isLoading: false });
                } catch (err: any) {
                    const msg = err?.response?.data?.error || err.message || "Failed to login";
                    set({ error: msg, isLoading: false });
                }
            },
            register: async (name, email, pass, role) => {
                set({ isLoading: true, error: null });
                try {
                    const { token, user } = await registerWithEmail(name, email, pass, role);
                    localStorage.setItem('token', token);
                    localStorage.setItem('user', JSON.stringify(user));
                    set({ user, isLoading: false });
                } catch (err: any) {
                    const msg = err?.response?.data?.error || err.message || "Failed to register";
                    set({ error: msg, isLoading: false });
                }
            },
            googleLogin: async (role) => {
                set({ isLoading: true, error: null });
                try {
                    set({ isLoading: false });
                    await handleGoogleOAuth(role);
                } catch (err: any) {
                    const msg = err?.response?.data?.error || err.message || "Google login failed";
                    set({ error: msg, isLoading: false });
                }
            },
            setAuth: (user, token) => {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                set({ user, isLoading: false });
            },
            logout: () => {
                // Clear ONLY auth persisted store on logout to allow mock data integration between roles
                localStorage.removeItem('udyaam-auth');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                set({ user: null });
            },
            updateProfile: (updates) => {
                set((state) => ({
                    user: state.user ? { ...state.user, ...updates } : null
                }));
            }
        }),
        {
            name: 'udyaam-auth',
            partialize: (state) => ({ user: state.user }),
        }
    )
);
