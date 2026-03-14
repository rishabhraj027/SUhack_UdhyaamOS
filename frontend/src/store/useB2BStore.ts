import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    fetchBusinessCatalog,
    postNewInventory,
    fetchMarketplaceListings,
    postMarketplaceListing,
    deleteMarketplaceListing,
    fetchNegotiations,
    submitCounterOffer as apiSubmitCounterOffer,
    respondToCounterOffer as apiRespondToCounterOffer,
} from '../services/api';
import type { B2BCatalogItem, MarketplaceListing, CounterOffer } from '../services/api';

interface B2BState {
    // Original catalog
    catalog: B2BCatalogItem[];
    // Marketplace
    marketplace: MarketplaceListing[];
    myListings: MarketplaceListing[];
    // Negotiations
    negotiations: CounterOffer[];
    // UI
    isLoading: boolean;
    error: string | null;

    // Catalog actions (backward compat)
    loadCatalog: () => Promise<void>;
    addInventory: (item: Omit<B2BCatalogItem, "id">) => Promise<void>;

    // Marketplace actions
    loadMarketplace: () => Promise<void>;
    addListing: (item: Omit<MarketplaceListing, "id" | "createdAt">) => Promise<void>;
    removeListing: (id: string) => Promise<void>;

    // Negotiation actions
    loadNegotiations: () => Promise<void>;
    sendCounterOffer: (data: Omit<CounterOffer, "id" | "createdAt" | "status">) => Promise<void>;
    respondToOffer: (offerId: string, action: "ACCEPTED" | "REJECTED", counterPrice?: number, counterMessage?: string) => Promise<void>;
}

export const useB2BStore = create<B2BState>()(
    persist(
        (set) => ({
            catalog: [],
            marketplace: [],
            myListings: [],
            negotiations: [],
            isLoading: false,
            error: null,

            loadCatalog: async () => {
                set({ isLoading: true, error: null });
                try {
                    const data = await fetchBusinessCatalog();
                    set((state) => {
                        const apiIds = new Set(data.map(item => item.id));
                        const localOnly = state.catalog.filter(item => !apiIds.has(item.id));
                        return { catalog: [...localOnly, ...data], isLoading: false };
                    });
                } catch (err: any) {
                    set({ error: err.message, isLoading: false });
                }
            },

            addInventory: async (item) => {
                set({ isLoading: true, error: null });
                try {
                    const newItem = await postNewInventory(item);
                    set((state) => ({ catalog: [newItem, ...state.catalog], isLoading: false }));
                } catch (err: any) {
                    set({ error: err.message, isLoading: false });
                }
            },

            loadMarketplace: async () => {
                set({ isLoading: true, error: null });
                try {
                    const data = await fetchMarketplaceListings();
                    set((state) => {
                        const apiIds = new Set(data.map(item => item.id));
                        // API items marked as own
                        const apiOwn = data.filter(l => l.isOwn);
                        const apiOthers = data.filter(l => !l.isOwn);
                        // Keep locally-added items that haven't synced to API yet
                        const localOnlyOwn = state.myListings.filter(l => !apiIds.has(l.id));
                        const localOnlyOthers = state.marketplace.filter(l => !apiIds.has(l.id));
                        return {
                            myListings: [...localOnlyOwn, ...apiOwn],
                            marketplace: [...localOnlyOthers, ...apiOthers],
                            isLoading: false,
                        };
                    });
                } catch (err: any) {
                    set({ error: err.message, isLoading: false });
                }
            },

            addListing: async (item) => {
                set({ isLoading: true, error: null });
                try {
                    const newListing = await postMarketplaceListing(item as any);
                    set((state) => ({
                        myListings: [{ ...newListing, isOwn: true }, ...state.myListings],
                        isLoading: false,
                    }));
                } catch (err: any) {
                    set({ error: err.message, isLoading: false });
                }
            },

            removeListing: async (id) => {
                set({ isLoading: true, error: null });
                try {
                    await deleteMarketplaceListing(id);
                    set((state) => ({
                        myListings: state.myListings.filter(l => l.id !== id),
                        isLoading: false,
                    }));
                } catch (err: any) {
                    set({ error: err.message, isLoading: false });
                }
            },

            loadNegotiations: async () => {
                set({ isLoading: true, error: null });
                try {
                    const data = await fetchNegotiations();
                    set((state) => {
                        const apiIds = new Set(data.map(n => n.id));
                        const localOnly = state.negotiations.filter(n => !apiIds.has(n.id));
                        return { negotiations: [...localOnly, ...data], isLoading: false };
                    });
                } catch (err: any) {
                    set({ error: err.message, isLoading: false });
                }
            },

            sendCounterOffer: async (data) => {
                set({ isLoading: true, error: null });
                try {
                    const offer = await apiSubmitCounterOffer(data);
                    set((state) => ({
                        negotiations: [offer, ...state.negotiations],
                        isLoading: false,
                    }));
                } catch (err: any) {
                    set({ error: err.message, isLoading: false });
                }
            },

            respondToOffer: async (offerId, action, counterPrice, counterMessage) => {
                set({ isLoading: true, error: null });
                try {
                    const updated = await apiRespondToCounterOffer(offerId, action, counterPrice, counterMessage);
                    set((state) => ({
                        negotiations: state.negotiations.map(n => n.id === offerId ? updated : n),
                        isLoading: false,
                    }));
                } catch (err: any) {
                    set({ error: err.message, isLoading: false });
                }
            },
        }),
        {
            name: 'udyaam-b2b',
            partialize: (state) => ({
                catalog: state.catalog,
                myListings: state.myListings,
                negotiations: state.negotiations,
            }),
        }
    )
);
