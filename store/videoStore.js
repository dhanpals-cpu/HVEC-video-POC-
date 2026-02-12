import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'hevc_video_metadata';

export const useVideoStore = create((set, get) => ({
    videos: [],
    isLoading: false,
    error: null,

    loadVideos: async () => {
        console.log('[VideoStore] Loading videos from AsyncStorage...');
        set({ isLoading: true, error: null });
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                const videos = JSON.parse(stored);
                console.log(`[VideoStore] Loaded ${videos.length} videos`);
                set({ videos, isLoading: false });
            } else {
                console.log('[VideoStore] No videos found in storage');
                set({ videos: [], isLoading: false });
            }
        } catch (error) {
            console.error('[VideoStore] Failed to load videos:', error);
            set({ error: 'Failed to load videos', isLoading: false });
        }
    },

    addVideos: async (newVideos) => {
        console.log(`[VideoStore] Adding ${newVideos.length} videos...`);
        set({ isLoading: true, error: null });
        try {
            const currentVideos = get().videos;
            const updatedVideos = [...currentVideos, ...newVideos];
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedVideos));
            console.log(`[VideoStore] Saved ${updatedVideos.length} total videos`);
            set({ videos: updatedVideos, isLoading: false });
        } catch (error) {
            console.error('[VideoStore] Failed to save videos:', error);
            set({ error: 'Failed to save videos', isLoading: false });
        }
    },

    clearError: () => set({ error: null }),
    setError: (error) => set({ error }),
    setLoading: (loading) => set({ isLoading: loading }),
}));
