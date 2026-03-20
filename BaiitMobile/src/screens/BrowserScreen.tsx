import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Keyboard,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { Database, VocabRecord } from '../services/database';
import { storage } from '../services/storage';
import { ProficiencyTest, ProficiencyLevel } from '../services/proficiency-test';
import { PersonalizedAnnotationService } from '../services/personalized-annotation';
import * as VocabAnnotationService from '../services/vocab-annotation';
import { isEnglish } from '../utils/rule-engine';
import { generateHighlightScript, HIDE_ANNOTATIONS_SCRIPT, WordAnnotation } from '../utils/highlight-script';
import { RootStackParamList } from '../../App';
import { WordDetailCard } from '../components/WordDetailCard';
import { useBrowser } from '../contexts/BrowserContext';
import { generateVocabId } from '../utils/id-generator';

type BrowserScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Browser'>;
};

const SEARCH_ENGINES = {
    google: { name: 'Google', url: 'https://www.google.com/search?q=' },
    bing: { name: 'Bing', url: 'https://www.bing.com/search?q=' },
    baidu: { name: '百度', url: 'https://www.baidu.com/s?wd=' },
} as const;

type SearchEngineKey = keyof typeof SEARCH_ENGINES;

export function BrowserScreen({ navigation }: BrowserScreenProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [showBookmarks, setShowBookmarks] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processedCount, setProcessedCount] = useState(0);
    const [highlightedCount, setHighlightedCount] = useState(0);
    const [wordAnnotations, setWordAnnotations] = useState<WordAnnotation[]>([]);
    const [selectedWord, setSelectedWord] = useState<WordAnnotation | null>(null);
    const [showWordModal, setShowWordModal] = useState(false);
    const [pageLoaded, setPageLoaded] = useState(false);
    const [vocabLoaded, setVocabLoaded] = useState(false);
    const [showAnnotations, setShowAnnotations] = useState(true);
    const [userLevel, setUserLevel] = useState<ProficiencyLevel>('intermediate');
    const [annotationThreshold, setAnnotationThreshold] = useState<number>(2000);
    const [showDensityPanel, setShowDensityPanel] = useState(false);
    const [totalWordsOnPage, setTotalWordsOnPage] = useState(0);

    const webViewRef = useRef<WebView>(null);
    const inputUrlRef = useRef<string>('');
    const lastPageTextRef = useRef<{ text: string; title?: string } | null>(null);
    const { theme } = useTheme();
    const { t } = useLanguage();
    const browser = useBrowser();

    useEffect(() => {
        loadVocabWords();
        // 加载保存的阈值设置
        storage.get<number>('annotation_threshold').then(savedThreshold => {
            if (savedThreshold) {
                setAnnotationThreshold(savedThreshold);
            }
        });
    }, []);

    // 初始化 inputUrlRef
    useEffect(() => {
        inputUrlRef.current = browser.inputUrl;
    }, [browser.inputUrl]);

    useFocusEffect(
        useCallback(() => {
            if (browser.lastVisitedUrl) {
                setShowBookmarks(false);
            }
        }, [browser.lastVisitedUrl])
    );

    useEffect(() => {
        if (pageLoaded && vocabLoaded && wordAnnotations.length > 0) {
            const timer = setTimeout(() => {
                if (showAnnotations) {
                    highlightWordsInPage();
                } else {
                    hideAnnotations();
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [pageLoaded, vocabLoaded, wordAnnotations.length]);

    useEffect(() => {
        if (pageLoaded && wordAnnotations.length > 0) {
            if (showAnnotations) {
                highlightWordsInPage();
            } else {
                hideAnnotations();
            }
        }
    }, [showAnnotations, pageLoaded, wordAnnotations.length]);

    const hideAnnotations = () => {
        webViewRef.current?.injectJavaScript(HIDE_ANNOTATIONS_SCRIPT);
    };

    const parseDefinition = (def: string): { pos: string; phonetic: string; cleanDef: string } => {
        let pos = '';
        let phonetic = '';
        let cleanDef = def || '';

        const posMatch = def?.match(/^(\w+\.)\s*/);
        if (posMatch) {
            pos = posMatch[1];
            cleanDef = cleanDef.replace(/^(\w+\.)\s*/, '');
        }

        const phoneticMatch = def?.match(/(\/[^/]+\/)/);
        if (phoneticMatch) {
            phonetic = phoneticMatch[1];
        }

        return { pos, phonetic, cleanDef };
    };

    const loadVocabWords = async () => {
        try {
            // 获取用户水平
            const testResult = await ProficiencyTest.getResult();
            if (testResult) {
                setUserLevel(testResult.level);
                setAnnotationThreshold(VocabAnnotationService.getThresholdForLevel(testResult.level));
            }

            const vocab = await Database.getAllVocab();
            const annotations: WordAnnotation[] = vocab.map(v => {
                const parsed = parseDefinition(v.definition || '');
                return {
                    word: v.word,
                    definition: parsed.cleanDef,
                    isNew: v.status === 'new',
                    pos: parsed.pos,
                    phonetic: parsed.phonetic || v.phonetic,
                };
            });
            setWordAnnotations(annotations);
            setVocabLoaded(true);
        } catch (error) {
            console.error('加载生词失败:', error);
        }
    };

    // 已处理的单词集合，避免重复处理
    const processedWordsRef = useRef<Set<string>>(new Set());

    const processPageContent = useCallback(async (text: string, pageTitle?: string, isScroll = false) => {
        // 缓存页面内容，用于阈值调整后重新标注
        lastPageTextRef.current = { text, title: pageTitle };

        if (!isEnglish(text)) {
            console.log('[Browser] 跳过：非英文内容');
            return;
        }
        if (isProcessing) {
            console.log('[Browser] 跳过：正在处理中');
            return;
        }

        // 滚动时检查是否有新内容需要处理
        if (isScroll) {
            // 提取文本中的单词
            const words = text.match(/\b[a-zA-Z]+\b/g) || [];
            const uniqueWords = new Set(words.map(w => w.toLowerCase()));

            // 检查是否有未处理的新单词
            let hasNewWords = false;
            for (const word of uniqueWords) {
                if (!processedWordsRef.current.has(word) && word.length > 3) {
                    hasNewWords = true;
                    break;
                }
            }

            // 如果没有新单词，跳过处理
            if (!hasNewWords) return;
        }

        setIsProcessing(true);
        try {
            // 检查是否已完成能力测试
            const isTestCompleted = await ProficiencyTest.isTestCompleted();
            const canUsePersonalized = await PersonalizedAnnotationService.canAnnotate();

            let annotations: WordAnnotation[] = [];

            // 限制文本长度，提高处理速度
            const maxTextLength = 3000;
            const truncatedText = text.length > maxTextLength ? text.substring(0, maxTextLength) : text;

            console.log('[Browser] 开始处理文本:', truncatedText.length, '字符');
            console.log('[Browser] isTestCompleted:', isTestCompleted, 'canUsePersonalized.can:', canUsePersonalized.can);

            if (isTestCompleted && canUsePersonalized.can) {
                // 使用个性化大模型标注
                const response = await PersonalizedAnnotationService.annotate({
                    text: truncatedText,
                    title: pageTitle,
                    url: browser.currentUrl,
                });

                annotations = response.annotations.map(a => ({
                    word: a.word,
                    definition: a.definition,
                    isNew: true,
                    pos: a.pos,
                    phonetic: a.phonetic,
                }));
            } else {
                // 使用新的生词标注服务（基于词频和用户水平）
                console.log('[Browser] 使用本地词典标注，用户水平:', userLevel, '阈值:', annotationThreshold);

                const result = await VocabAnnotationService.annotateText(truncatedText, {
                    userLevel,
                    customThreshold: annotationThreshold,
                    minDifficulty: 2,
                });

                console.log('[Browser] 标注结果: 总词数=', result.stats.totalWords, '标注=', result.stats.annotatedCount, '跳过常用=', result.stats.skippedCommon);

                setTotalWordsOnPage(result.stats.totalWords);

                if (result.annotations.length === 0) {
                    setIsProcessing(false);
                    return;
                }

                annotations = result.annotations.map(a => ({
                    word: a.word,
                    definition: a.definition,
                    isNew: true,
                    pos: a.pos,
                    phonetic: a.phonetic,
                }));
            }

            // 过滤已处理的单词
            const newAnnotations = annotations.filter(a => {
                if (!a || typeof a.word !== 'string') return false;
                const lowerWord = a.word.toLowerCase();
                if (processedWordsRef.current.has(lowerWord)) {
                    return false;
                }
                processedWordsRef.current.add(lowerWord);
                return true;
            });

            // 保存到数据库
            for (const annotation of newAnnotations) {
                const existingVocab = await Database.getVocabByWord(annotation.word);

                if (existingVocab) {
                    await Database.incrementEncounterCount(annotation.word);
                } else {
                    const id = await generateVocabId(annotation.word);
                    const vocabRecord: VocabRecord = {
                        id,
                        word: annotation.word,
                        status: 'new',
                        phonetic: annotation.phonetic,
                        definition: annotation.definition,
                        encounterCount: 1,
                        firstSeenAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        addedAt: new Date().toISOString(),
                        reviewCount: 0,
                    };
                    await Database.saveVocab(vocabRecord);
                    await Database.recordLearningActivity('new');
                }
            }

            if (newAnnotations.length > 0) {
                console.log('[Browser] 添加新标注:', newAnnotations.length, '词');
                setWordAnnotations(prev => [...prev, ...newAnnotations]);
            }

            setProcessedCount(prev => prev + 1);
        } catch (error) {
            console.error('处理页面内容失败:', error);
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing, browser.currentUrl]);

    // 计算标注密度
    const annotationDensity = totalWordsOnPage > 0
        ? (highlightedCount / totalWordsOnPage * 100).toFixed(1)
        : '0';

    // 根据密度建议阈值调整
    const getDensitySuggestion = () => {
        const density = parseFloat(annotationDensity);
        if (density > 15) {
            return { message: '标注过多，建议提高阈值', action: 'increase' };
        } else if (density < 3) {
            return { message: '标注较少，可降低阈值', action: 'decrease' };
        }
        return { message: '标注密度适中', action: 'none' };
    };

    // 调整阈值并重新标注
    const handleThresholdChange = (newThreshold: number) => {
        setAnnotationThreshold(newThreshold);
        // 清除已处理的单词，允许重新标注
        processedWordsRef.current.clear();
        setWordAnnotations([]);
        setHighlightedCount(0);
        // 保存阈值设置
        storage.set('annotation_threshold', newThreshold);

        // 如果有缓存的页面内容，立即重新标注
        if (lastPageTextRef.current) {
            setTimeout(() => {
                processPageContent(
                    lastPageTextRef.current!.text,
                    lastPageTextRef.current!.title
                );
            }, 100);
        }
    };

    // 长按单词标记为已掌握
    const handleMarkAsMastered = async (word: string) => {
        const lowerWord = word.toLowerCase();

        // 从当前标注中移除
        setWordAnnotations(prev => prev.filter(a => a.word.toLowerCase() !== lowerWord));

        // 保存到数据库
        try {
            const vocab = await Database.getVocabByWord(lowerWord);
            if (vocab) {
                await Database.updateVocabStatus(vocab.id, 'mastered');
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('[Browser] 标记已掌握失败:', error);
        }

        // 在 WebView 中移除该词的标注
        const script = `
            (function() {
                var elements = document.querySelectorAll('[data-word="${lowerWord}"]');
                for (var i = 0; i < elements.length; i++) {
                    var parent = elements[i].parentElement;
                    if (parent && parent.className === 'baiit-annotation-wrapper') {
                        var text = elements[i].textContent;
                        var textNode = document.createTextNode(text);
                        parent.parentNode.replaceChild(textNode, parent);
                    }
                }
            })();
            true;
        `;
        webViewRef.current?.injectJavaScript(script);
    };

    const highlightWordsInPage = useCallback(() => {
        if (wordAnnotations.length === 0) return;

        console.log('[Browser] 执行标注注入，当前标注数:', wordAnnotations.length);
        const script = generateHighlightScript(wordAnnotations);
        webViewRef.current?.injectJavaScript(script);
    }, [wordAnnotations]);

    const handleNavigationStateChange = (navState: WebViewNavigation) => {
        console.log('[Browser] handleNavigationStateChange:', {
            url: navState.url,
            loading: navState.loading,
            canGoBack: navState.canGoBack,
            canGoForward: navState.canGoForward
        });

        browser.setCanGoBack(navState.canGoBack);
        browser.setCanGoForward(navState.canGoForward);
        browser.setCurrentUrl(navState.url);
        browser.setInputUrl(navState.url);
        setIsLoading(navState.loading);

        if (navState.loading) {
            setHighlightedCount(0);
            setPageLoaded(false);
            processedWordsRef.current.clear();
            setWordAnnotations([]);
        }
    };

    const handleLoadEnd = () => {
        setIsLoading(false);
        setShowBookmarks(false);
        setPageLoaded(true);
    };

    const handleMessage = (event: { nativeEvent: { data: string } }) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);

            if (data.type === 'page_content') {
                const { text, title, isScroll } = data;
                console.log('[Browser] 收到页面内容:', text?.length, '字符, isScroll:', isScroll);
                if (text && text.length > 100) {
                    processPageContent(text, title, isScroll);
                }
                return;
            }

            if (data.type === 'highlight_complete') {
                console.log('[Browser] 收到标注完成消息:', data.count, '个词');
                setHighlightedCount(data.count);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                return;
            }

            if (data.type === 'word_clicked') {
                const annotation = wordAnnotations.find(w => w.word.toLowerCase() === data.word.toLowerCase());
                if (annotation) {
                    setSelectedWord(annotation);
                    setShowWordModal(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                return;
            }
        } catch {
            // 兼容旧格式
            const text = event.nativeEvent.data;
            if (text && text.length > 100 && !text.startsWith('{')) {
                processPageContent(text);
            }
        }
    };

    const goBack = () => {
        if (browser.canGoBack) {
            webViewRef.current?.goBack();
        }
    };

    const goForward = () => {
        if (browser.canGoForward) {
            webViewRef.current?.goForward();
        }
    };

    const reload = () => {
        webViewRef.current?.reload();
    };

    // 在系统浏览器中打开当前页面
    const openInSystemBrowser = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            await WebBrowser.openBrowserAsync(browser.currentUrl);
        } catch (error) {
            console.error('打开系统浏览器失败:', error);
            Alert.alert('错误', '无法打开系统浏览器');
        }
    };

    const switchSearchEngine = async () => {
        const options: Array<{ text: string; onPress: () => void; style?: 'cancel' }> = Object.entries(SEARCH_ENGINES).map(([key, engine]) => ({
            text: engine.name,
            onPress: async () => {
                browser.setSearchEngine(key as SearchEngineKey);
            },
        }));
        options.push({ text: '取消', style: 'cancel', onPress: () => { } });

        Alert.alert('选择搜索引擎', '', options);
    };

    // 显示更多选项菜单
    const showMoreOptions = () => {
        Alert.alert(
            '更多选项',
            '',
            [
                {
                    text: '在系统浏览器中打开',
                    onPress: openInSystemBrowser,
                },
                {
                    text: '分享链接',
                    onPress: () => {
                        console.log('分享链接:', browser.currentUrl);
                    },
                },
                {
                    text: '取消',
                    style: 'cancel',
                },
            ]
        );
    };

    const submitUrl = () => {
        Keyboard.dismiss();
        // 使用 ref 获取最新的输入值，避免状态更新延迟
        let finalUrl = (inputUrlRef.current || browser.inputUrl).trim();

        console.log('[Browser] submitUrl input:', finalUrl, 'length:', finalUrl.length);

        if (!finalUrl) return;

        const hasProtocol = finalUrl.startsWith('http://') || finalUrl.startsWith('https://');

        // 检查是否是域名格式：包含至少一个点，点前后有字符
        // 支持：example.com, www.example.com, expo.dev, react.dev, example.com/path
        const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z0-9][a-zA-Z0-9.-]*$/;
        const domainPart = finalUrl.split('/')[0].split('?')[0];
        const looksLikeDomain = domainPattern.test(domainPart);

        console.log('[Browser] submitUrl:', { input: finalUrl, domainPart, looksLikeDomain, hasProtocol });

        if (!hasProtocol) {
            if (looksLikeDomain) {
                finalUrl = 'https://' + finalUrl;
            } else {
                finalUrl = `${SEARCH_ENGINES[browser.searchEngine].url}${encodeURIComponent(finalUrl)}`;
            }
        }

        console.log('[Browser] finalUrl:', finalUrl, 'length:', finalUrl.length);

        browser.setCurrentUrl(finalUrl);
        browser.setInputUrl(finalUrl);
        inputUrlRef.current = finalUrl;
        setShowBookmarks(false);
        setHighlightedCount(0);
        setProcessedCount(0);
    };

    const openBookmark = (bookmarkUrl: string) => {
        browser.setCurrentUrl(bookmarkUrl);
        browser.setInputUrl(bookmarkUrl);
        setShowBookmarks(false);
        setHighlightedCount(0);
        setProcessedCount(0);
    };

    const handleSpeakWord = (word: string) => {
        // 使用 WebView 的 TTS 功能
        const script = `
            if (window.speechSynthesis) {
                const utterance = new SpeechSynthesisUtterance('${word}');
                utterance.lang = 'en-US';
                window.speechSynthesis.speak(utterance);
            }
            true;
        `;
        webViewRef.current?.injectJavaScript(script);
    };

    const handleAddToVocab = async () => {
        if (!selectedWord) return;
        const id = await generateVocabId(selectedWord.word);
        try {
            await Database.saveVocab({
                id,
                word: selectedWord.word,
                definition: selectedWord.definition,
                status: 'new',
                encounterCount: 1,
                firstSeenAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                addedAt: new Date().toISOString(),
                reviewCount: 0,
            });
            setShowWordModal(false);
        } catch (error) {
            console.error('添加到生词本失败:', error);
        }
    };

    const renderWordModal = () => {
        if (!showWordModal || !selectedWord) return null;

        return (
            <WordDetailCard
                word={selectedWord.word}
                definition={selectedWord.definition}
                pos={selectedWord.pos}
                phonetic={selectedWord.phonetic}
                isNew={selectedWord.isNew}
                onClose={() => setShowWordModal(false)}
                onSpeak={() => handleSpeakWord(selectedWord.word)}
                onAddToVocab={handleAddToVocab}
                onMarkAsMastered={() => handleMarkAsMastered(selectedWord.word)}
                onViewDetails={() => {
                    setShowWordModal(false);
                    navigation.navigate('Main');
                }}
            />
        );
    };

    const renderBookmarks = () => (
        <View style={styles.bookmarksContainer}>
            <Text style={[styles.bookmarksTitle, { color: theme.colors.textSecondary }]}>
                {t('browser.quickAccess')}
            </Text>
            <View style={styles.bookmarksGrid}>
                {browser.bookmarks.map((bookmark) => (
                    <TouchableOpacity
                        key={bookmark.id}
                        style={[styles.bookmarkItem, { backgroundColor: theme.colors.surface }]}
                        onPress={() => openBookmark(bookmark.url)}
                    >
                        <Ionicons name="globe-outline" size={24} color={theme.colors.primary} />
                        <Text style={[styles.bookmarkName, { color: theme.colors.text }]}>
                            {bookmark.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    // 渐进式标注：只处理视口内及附近的内容
    const injectedJavaScript = `
(function() {
    // 获取视口内及附近的内容（上下各扩展 500px）
    function getVisibleText() {
        const viewportHeight = window.innerHeight;
        const scrollY = window.scrollY;
        const buffer = 500; // 上下缓冲区

        const range = document.createRange();
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    var tag = node.parentElement.tagName;
                    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        let visibleText = '';
        let node;
        while (node = walker.nextNode()) {
            const rect = node.parentElement.getBoundingClientRect();
            const elementTop = rect.top + scrollY;
            const elementBottom = rect.bottom + scrollY;

            // 检查元素是否在视口+缓冲区范围内
            if (elementBottom >= scrollY - buffer && elementTop <= scrollY + viewportHeight + buffer) {
                visibleText += node.textContent + ' ';
            }
        }

        return visibleText;
    }

    var text = getVisibleText();
    var title = document.title;
    window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'page_content',
        text: text,
        title: title,
        isPartial: true
    }));

    // 监听滚动事件，延迟触发新的内容分析
    var scrollTimeout;
    window.addEventListener('scroll', function() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function() {
            var newText = getVisibleText();
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'page_content',
                text: newText,
                title: document.title,
                isPartial: true,
                isScroll: true
            }));
        }, 500); // 滚动停止 500ms 后触发
    }, { passive: true });
})();
true;
    `;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.urlBar}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={goBack} disabled={!browser.canGoBack} style={styles.navButton}>
                        <Ionicons
                            name="chevron-back"
                            size={24}
                            color={browser.canGoBack ? theme.colors.text : theme.colors.textSecondary}
                        />
                    </TouchableOpacity>

                    <View style={[styles.inputContainer, { backgroundColor: theme.colors.background }]}>
                        <TouchableOpacity onPress={switchSearchEngine} style={styles.searchEngineButton}>
                            <Text style={[styles.searchEngineText, { color: theme.colors.primary }]}>
                                {SEARCH_ENGINES[browser.searchEngine].name}
                            </Text>
                        </TouchableOpacity>
                        <TextInput
                            style={[styles.urlInput, { color: theme.colors.text }]}
                            value={browser.inputUrl}
                            onChangeText={(text) => {
                                inputUrlRef.current = text;
                                browser.setInputUrl(text);
                            }}
                            onSubmitEditing={submitUrl}
                            returnKeyType="go"
                            autoCapitalize="none"
                            autoCorrect={false}
                            spellCheck={false}
                            textContentType="URL"
                            placeholder={t('browser.enterUrl')}
                            placeholderTextColor={theme.colors.textSecondary}
                        />
                        {isLoading && <ActivityIndicator size="small" color={theme.colors.primary} />}
                    </View>

                    <TouchableOpacity onPress={goForward} disabled={!browser.canGoForward} style={styles.navButton}>
                        <Ionicons
                            name="chevron-forward"
                            size={24}
                            color={browser.canGoForward ? theme.colors.text : theme.colors.textSecondary}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={reload} style={styles.navButton}>
                        <Ionicons name="refresh-outline" size={22} color={theme.colors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={showMoreOptions} style={styles.navButton}>
                        <Ionicons name="ellipsis-horizontal" size={22} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>

                <View style={styles.statusBar}>
                    {isProcessing && (
                        <View style={styles.statusItem}>
                            <ActivityIndicator size="small" color={theme.colors.primary} />
                            <Text style={[styles.statusText, { color: theme.colors.primary }]}>
                                {t('browser.processing')}
                            </Text>
                        </View>
                    )}

                    {highlightedCount > 0 && !isProcessing && (
                        <View style={styles.statusItem}>
                            <Ionicons name="sparkles" size={14} color={theme.colors.success} />
                            <Text style={[styles.statusText, { color: theme.colors.success }]}>
                                已标注 {highlightedCount} 个生词
                            </Text>
                        </View>
                    )}

                    {processedCount > 0 && highlightedCount === 0 && !isProcessing && (
                        <View style={styles.statusItem}>
                            <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
                            <Text style={[styles.statusText, { color: theme.colors.success }]}>
                                {t('browser.processed', { count: processedCount })}
                            </Text>
                        </View>
                    )}
                </View>


            </View>

            {showBookmarks ? (
                renderBookmarks()
            ) : (
                <View style={styles.webViewContainer}>
                    <WebView
                        ref={webViewRef}
                        source={{ uri: browser.currentUrl }}
                        style={styles.webView}
                        onNavigationStateChange={handleNavigationStateChange}
                        onLoadEnd={handleLoadEnd}
                        onMessage={handleMessage}
                        injectedJavaScript={injectedJavaScript}
                        startInLoadingState={true}
                        renderLoading={() => (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={theme.colors.primary} />
                            </View>
                        )}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        thirdPartyCookiesEnabled={true}
                        sharedCookiesEnabled={true}
                        onShouldStartLoadWithRequest={(request) => {
                            console.log('[Browser] onShouldStartLoadWithRequest:', {
                                url: request.url,
                                navigationType: request.navigationType,
                                isTopFrame: request.isTopFrame
                            });
                            // 允许所有导航请求
                            return true;
                        }}
                        onOpenWindow={(event) => {
                            // 处理 target="_blank" 链接，在当前 WebView 中打开
                            if (event.nativeEvent.targetUrl) {
                                browser.setCurrentUrl(event.nativeEvent.targetUrl);
                                browser.setInputUrl(event.nativeEvent.targetUrl);
                            }
                        }}
                    />
                    <View style={styles.floatingButtons}>
                        <TouchableOpacity
                            style={[styles.floatingBtn, { backgroundColor: theme.colors.surface }]}
                            onPress={() => setShowDensityPanel(!showDensityPanel)}
                        >
                            <Ionicons
                                name="options"
                                size={20}
                                color={showDensityPanel ? theme.colors.primary : theme.colors.textSecondary}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.floatingBtn, { backgroundColor: theme.colors.surface }]}
                            onPress={() => setShowAnnotations(!showAnnotations)}
                        >
                            <Ionicons
                                name={showAnnotations ? "eye" : "eye-off"}
                                size={20}
                                color={showAnnotations ? theme.colors.primary : theme.colors.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* 标注密度面板 */}
                    {showDensityPanel && (
                        <View style={[styles.densityPanel, { backgroundColor: theme.colors.surface }]}>
                            <View style={styles.densityHeader}>
                                <Text style={[styles.densityTitle, { color: theme.colors.text }]}>标注设置</Text>
                                <TouchableOpacity onPress={() => setShowDensityPanel(false)}>
                                    <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.densityStats}>
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: theme.colors.primary }]}>{highlightedCount}</Text>
                                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>已标注</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: theme.colors.text }]}>{annotationDensity}%</Text>
                                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>密度</Text>
                                </View>
                            </View>

                            <View style={styles.thresholdSection}>
                                <Text style={[styles.thresholdLabel, { color: theme.colors.textSecondary }]}>
                                    词频阈值: {annotationThreshold}
                                </Text>
                                <View style={styles.thresholdButtons}>
                                    <TouchableOpacity
                                        style={[styles.thresholdBtn, { backgroundColor: theme.colors.background }]}
                                        onPress={() => handleThresholdChange(Math.max(500, annotationThreshold - 500))}
                                    >
                                        <Text style={[styles.thresholdBtnText, { color: theme.colors.text }]}>-</Text>
                                    </TouchableOpacity>
                                    <Text style={[styles.thresholdValue, { color: theme.colors.text }]}>{annotationThreshold}</Text>
                                    <TouchableOpacity
                                        style={[styles.thresholdBtn, { backgroundColor: theme.colors.background }]}
                                        onPress={() => handleThresholdChange(Math.min(10000, annotationThreshold + 500))}
                                    >
                                        <Text style={[styles.thresholdBtnText, { color: theme.colors.text }]}>+</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {(() => {
                                const suggestion = getDensitySuggestion();
                                if (suggestion.action !== 'none') {
                                    return (
                                        <TouchableOpacity
                                            style={[styles.suggestionBtn, { backgroundColor: theme.colors.primary + '20' }]}
                                            onPress={() => {
                                                if (suggestion.action === 'increase') {
                                                    handleThresholdChange(annotationThreshold + 500);
                                                } else {
                                                    handleThresholdChange(Math.max(500, annotationThreshold - 500));
                                                }
                                            }}
                                        >
                                            <Ionicons name="information-circle" size={16} color={theme.colors.primary} />
                                            <Text style={[styles.suggestionText, { color: theme.colors.primary }]}>
                                                {suggestion.message}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                }
                                return null;
                            })()}
                        </View>
                    )}
                </View>
            )}

            {renderWordModal()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    urlBar: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    navButton: {
        padding: 8,
    },
    inputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginHorizontal: 4,
    },
    urlInput: {
        flex: 1,
        fontSize: 14,
        marginLeft: 8,
        padding: 0,
    },
    searchEngineButton: {
        padding: 2,
    },
    searchEngineText: {
        fontSize: 11,
        fontWeight: '600',
    },
    statusBar: {
        minHeight: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
    },
    statusItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    statusText: {
        fontSize: 12,
        marginLeft: 6,
    },
    highlightButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginTop: 8,
        gap: 6,
    },
    highlightButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    webViewContainer: {
        flex: 1,
        position: 'relative',
    },
    webView: {
        flex: 1,
    },
    floatingButtons: {
        position: 'absolute',
        top: 12,
        right: 12,
        gap: 8,
        zIndex: 100,
    },
    floatingBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    densityPanel: {
        position: 'absolute',
        top: 60,
        right: 12,
        width: 200,
        borderRadius: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 99,
    },
    densityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    densityTitle: {
        fontSize: 14,
        fontWeight: '600',
    },
    densityStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 12,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
    },
    statLabel: {
        fontSize: 11,
        marginTop: 2,
    },
    thresholdSection: {
        marginBottom: 12,
    },
    thresholdLabel: {
        fontSize: 12,
        marginBottom: 8,
    },
    thresholdButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    thresholdBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    thresholdBtnText: {
        fontSize: 18,
        fontWeight: '600',
    },
    thresholdValue: {
        fontSize: 16,
        fontWeight: '600',
        minWidth: 50,
        textAlign: 'center',
    },
    suggestionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 8,
        gap: 6,
    },
    suggestionText: {
        fontSize: 12,
        flex: 1,
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bookmarksContainer: {
        flex: 1,
        padding: 20,
    },
    bookmarksTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    bookmarksGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    bookmarkItem: {
        width: '47%',
        aspectRatio: 1.5,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bookmarkName: {
        fontSize: 14,
        fontWeight: '500',
        marginTop: 8,
    },
});
