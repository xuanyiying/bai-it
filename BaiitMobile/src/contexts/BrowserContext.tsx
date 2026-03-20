import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { storage } from '../services/storage';

interface Bookmark {
    id: string;
    name: string;
    url: string;
}

interface BrowserHistoryItem {
    url: string;
    title?: string;
}

interface BrowserState {
    currentUrl: string;
    inputUrl: string;
    canGoBack: boolean;
    canGoForward: boolean;
    bookmarks: Bookmark[];
    searchEngine: 'google' | 'bing' | 'baidu';
    history: BrowserHistoryItem[];
    lastVisitedUrl: string | null;
}

interface BrowserContextType extends BrowserState {
    setCurrentUrl: (url: string) => void;
    setInputUrl: (url: string) => void;
    setCanGoBack: (can: boolean) => void;
    setCanGoForward: (can: boolean) => void;
    setBookmarks: (bookmarks: Bookmark[]) => void;
    setSearchEngine: (engine: 'google' | 'bing' | 'baidu') => void;
    addToHistory: (item: BrowserHistoryItem) => void;
    clearHistory: () => void;
    saveCurrentState: () => Promise<void>;
    loadSavedState: () => Promise<void>;
}

const BrowserContext = createContext<BrowserContextType | undefined>(undefined);

const STORAGE_KEYS = {
    BOOKMARKS: 'browser_bookmarks',
    SEARCH_ENGINE: 'search_engine',
    LAST_URL: 'browser_last_url',
    HISTORY: 'browser_history',
};

const DEFAULT_BOOKMARKS: Bookmark[] = [
    { id: 'bookmark-twitter', name: 'Twitter', url: 'https://twitter.com' },
    { id: 'bookmark-reddit', name: 'Reddit', url: 'https://reddit.com' },
    { id: 'bookmark-medium', name: 'Medium', url: 'https://medium.com' },
    { id: 'bookmark-hackernews', name: 'Hacker News', url: 'https://news.ycombinator.com' },
];

const DEFAULT_URL = 'https://twitter.com';

export function BrowserProvider({ children }: { children: React.ReactNode }) {
    const [currentUrl, setCurrentUrlState] = useState<string>(DEFAULT_URL);
    const [inputUrl, setInputUrlState] = useState<string>(DEFAULT_URL);
    const [canGoBack, setCanGoBackState] = useState(false);
    const [canGoForward, setCanGoForwardState] = useState(false);
    const [bookmarks, setBookmarksState] = useState<Bookmark[]>(DEFAULT_BOOKMARKS);
    const [searchEngine, setSearchEngineState] = useState<'google' | 'bing' | 'baidu'>('baidu');
    const [history, setHistory] = useState<BrowserHistoryItem[]>([]);
    const [lastVisitedUrl, setLastVisitedUrl] = useState<string | null>(null);
    const isInitialized = useRef(false);

    useEffect(() => {
        if (!isInitialized.current) {
            isInitialized.current = true;
            loadSavedState();
        }
    }, []);

    const setCurrentUrl = useCallback((url: string) => {
        setCurrentUrlState(url);
        setLastVisitedUrl(url);
    }, []);

    const setInputUrl = useCallback((url: string) => {
        console.log('[BrowserContext] setInputUrl:', url, 'length:', url?.length);
        setInputUrlState(url);
    }, []);

    const setCanGoBack = useCallback((can: boolean) => {
        setCanGoBackState(can);
    }, []);

    const setCanGoForward = useCallback((can: boolean) => {
        setCanGoForwardState(can);
    }, []);

    const setBookmarks = useCallback((newBookmarks: Bookmark[]) => {
        setBookmarksState(newBookmarks);
        storage.set(STORAGE_KEYS.BOOKMARKS, newBookmarks);
    }, []);

    const setSearchEngine = useCallback((engine: 'google' | 'bing' | 'baidu') => {
        setSearchEngineState(engine);
        storage.set(STORAGE_KEYS.SEARCH_ENGINE, engine);
    }, []);

    const addToHistory = useCallback((item: BrowserHistoryItem) => {
        setHistory(prev => {
            const newHistory = [item, ...prev.filter(h => h.url !== item.url)].slice(0, 50);
            storage.set(STORAGE_KEYS.HISTORY, newHistory);
            return newHistory;
        });
    }, []);

    const clearHistory = useCallback(() => {
        setHistory([]);
        storage.remove(STORAGE_KEYS.HISTORY);
    }, []);

    const saveCurrentState = useCallback(async () => {
        await Promise.all([
            storage.set(STORAGE_KEYS.LAST_URL, currentUrl),
            storage.set(STORAGE_KEYS.BOOKMARKS, bookmarks),
            storage.set(STORAGE_KEYS.SEARCH_ENGINE, searchEngine),
            storage.set(STORAGE_KEYS.HISTORY, history),
        ]);
    }, [currentUrl, bookmarks, searchEngine, history]);

    const loadSavedState = useCallback(async () => {
        try {
            const [savedLastUrl, savedBookmarks, savedSearchEngine, savedHistory] = await Promise.all([
                storage.get<string>(STORAGE_KEYS.LAST_URL),
                storage.get<Bookmark[]>(STORAGE_KEYS.BOOKMARKS),
                storage.get<'google' | 'bing' | 'baidu'>(STORAGE_KEYS.SEARCH_ENGINE),
                storage.get<BrowserHistoryItem[]>(STORAGE_KEYS.HISTORY),
            ]);

            if (savedLastUrl) {
                setCurrentUrlState(savedLastUrl);
                setInputUrlState(savedLastUrl);
                setLastVisitedUrl(savedLastUrl);
            }

            if (savedBookmarks && savedBookmarks.length > 0) {
                setBookmarksState(savedBookmarks);
            }

            if (savedSearchEngine) {
                setSearchEngineState(savedSearchEngine);
            }

            if (savedHistory && savedHistory.length > 0) {
                setHistory(savedHistory);
            }
        } catch (error) {
            console.error('加载浏览器状态失败:', error);
        }
    }, []);

    const value: BrowserContextType = {
        currentUrl,
        inputUrl,
        canGoBack,
        canGoForward,
        bookmarks,
        searchEngine,
        history,
        lastVisitedUrl,
        setCurrentUrl,
        setInputUrl,
        setCanGoBack,
        setCanGoForward,
        setBookmarks,
        setSearchEngine,
        addToHistory,
        clearHistory,
        saveCurrentState,
        loadSavedState,
    };

    return (
        <BrowserContext.Provider value={value}>
            {children}
        </BrowserContext.Provider>
    );
}

export function useBrowser() {
    const context = useContext(BrowserContext);
    if (context === undefined) {
        throw new Error('useBrowser must be used within a BrowserProvider');
    }
    return context;
}
