import { create } from 'zustand';
import { fetchBusinessCatalog, postNewInventory } from '../services/api';
import type { B2BCatalogItem } from '../services/api';

interface CatalogState {
    items: B2BCatalogItem[];
    isLoading: boolean;
    loadCatalog: () => Promise<void>;
    addItem: (data: Omit<B2BCatalogItem, "id">) => Promise<void>;
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
    items: [],
    isLoading: false,
    loadCatalog: async () => {
        set({ isLoading: true });
        const items = await fetchBusinessCatalog();
        set({ items, isLoading: false });
    },
    addItem: async (data) => {
        const newItem = await postNewInventory(data);
        set({ items: [newItem, ...get().items] });
    }
}));
