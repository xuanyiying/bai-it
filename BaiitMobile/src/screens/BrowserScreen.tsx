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
import Animated, {
    FadeIn,
    FadeOut,
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { Dictionary } from '../services/dictionary';
import { Database, VocabRecord } from '../services/database';
import { storage } from '../services/storage';
import { ProficiencyTest } from '../services/proficiency-test';
import { PersonalizedAnnotationService } from '../services/personalized-annotation';
import { isEnglish, splitSentences, estimateComplexity } from '../utils/rule-engine';
import { RootStackParamList } from '../../App';
import { WordDetailCard } from '../components/WordDetailCard';

type BrowserScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Browser'>;
};

const BOOKMARKS_KEY = 'browser_bookmarks';

const DEFAULT_BOOKMARKS = [
    { name: 'Twitter', url: 'https://twitter.com' },
    { name: 'Reddit', url: 'https://reddit.com' },
    { name: 'Medium', url: 'https://medium.com' },
    { name: 'Hacker News', url: 'https://news.ycombinator.com' },
];

interface WordAnnotation {
    word: string;
    definition: string;
    isNew: boolean;
    pos?: string;
    phonetic?: string;
}

const HIGHLIGHT_SCRIPT_CODE = `
(function() {
    var words = WORDS_PLACEHOLDER;
    
    var style = document.createElement('style');
    style.id = 'baiit-annotation-styles';
    style.textContent = CSS_STYLES;
    
    if (!document.getElementById('baiit-annotation-styles')) {
        document.head.appendChild(style);
    }
    
    function speakWord(word) {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            var utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        }
    }
    
    function removeTooltips() {
        var tooltips = document.querySelectorAll('.baiit-tooltip');
        for (var i = 0; i < tooltips.length; i++) {
            tooltips[i].remove();
        }
    }
    
    function showTooltip(word, definition, isNew, pos, phonetic, element) {
        removeTooltips();
        
        var tooltip = document.createElement('div');
        tooltip.className = 'baiit-tooltip';
        
        var badgeHtml = isNew ? '<span class="baiit-tooltip-badge">NEW</span>' : '';
        var posHtml = pos ? '<span class="baiit-tooltip-pos">' + pos + '</span>' : '';
        var phoneticHtml = phonetic ? '<span class="baiit-tooltip-phonetic">' + phonetic + '</span>' : '';
        var speakerHtml = '<span class="baiit-tooltip-speaker">🔊</span>';
        
        tooltip.innerHTML = '<div class="baiit-tooltip-header">' +
            '<span class="baiit-tooltip-word-text">' + word + '</span>' +
            speakerHtml + badgeHtml + '</div>' +
            '<div class="baiit-tooltip-meta">' + posHtml + phoneticHtml + '</div>' +
            '<div class="baiit-tooltip-definition">' + (definition || 'No definition available') + '</div>';
        
        document.body.appendChild(tooltip);
        
        var speakerBtn = tooltip.querySelector('.baiit-tooltip-speaker');
        if (speakerBtn) {
            speakerBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                speakWord(word);
            });
        }
        
        var rect = element.getBoundingClientRect();
        var tooltipRect = tooltip.getBoundingClientRect();
        
        var left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        var top = rect.bottom + 8;
        
        if (left < 10) left = 10;
        if (left + tooltipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tooltipRect.width - 10;
        }
        if (top + tooltipRect.height > window.innerHeight - 10) {
            top = rect.top - tooltipRect.height - 8;
        }
        
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
        
        setTimeout(function() {
            document.addEventListener('click', function closeTooltip() {
                removeTooltips();
                document.removeEventListener('click', closeTooltip);
            });
        }, 10);
    }
    
    function escapeRegExp(str) {
        var special = '.*+?^\${}()|[]\\\\';
        var result = '';
        for (var i = 0; i < str.length; i++) {
            var c = str[i];
            if (special.indexOf(c) !== -1) {
                result += '\\\\' + c;
            } else {
                result += c;
            }
        }
        return result;
    }
    
    function highlightWords() {
        var wordMap = {};
        for (var i = 0; i < words.length; i++) {
            wordMap[words[i].word.toLowerCase()] = words[i];
        }
        
        var walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    var tag = node.parentElement.tagName;
                    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    if (node.parentElement.classList.contains('baiit-word')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );
        
        var textNodes = [];
        while (walker.nextNode()) {
            textNodes.push(walker.currentNode);
        }
        
        var wordKeys = Object.keys(wordMap);
        var highlightedElements = [];
        
        for (var n = 0; n < textNodes.length; n++) {
            var node = textNodes[n];
            var text = node.textContent;
            var wordsToHighlight = [];
            
            for (var w = 0; w < wordKeys.length; w++) {
                var word = wordKeys[w];
                var escapedWord = escapeRegExp(word);
                var regex = new RegExp('\\\\b' + escapedWord + '\\\\b', 'gi');
                var match;
                while ((match = regex.exec(text)) !== null) {
                    wordsToHighlight.push({
                        word: wordMap[word],
                        index: match.index,
                        length: match[0].length
                    });
                }
            }
            
            if (wordsToHighlight.length === 0) continue;
            
            wordsToHighlight.sort(function(a, b) { return b.index - a.index; });
            
            var parent = node.parentNode;
            var fragment = document.createDocumentFragment();
            var lastIndex = text.length;
            
            for (var h = 0; h < wordsToHighlight.length; h++) {
                var item = wordsToHighlight[h];
                
                if (lastIndex > item.index + item.length) {
                    fragment.insertBefore(document.createTextNode(text.slice(item.index + item.length, lastIndex)), fragment.firstChild);
                }
                
                var wrapper = document.createElement('span');
                wrapper.className = 'baiit-annotation-wrapper';
                wrapper.style.whiteSpace = 'pre-wrap';
                
                var span = document.createElement('span');
                span.className = 'baiit-word' + (item.word.isNew ? ' baiit-word-new' : '');
                span.textContent = text.slice(item.index, item.index + item.length);
                span.setAttribute('data-word', item.word.word);
                span.setAttribute('data-definition', item.word.definition || '');
                span.setAttribute('data-is-new', item.word.isNew ? 'true' : 'false');
                
                var annotation = document.createElement('span');
                annotation.className = 'baiit-annotation-inline' + (item.word.isNew ? ' baiit-annotation-new' : '');
                
                var pos = item.word.pos || '';
                var defText = item.word.definition || '';
                var shortDef = '';
                
                if (defText) {
                    var defParts = defText.split(/[;]/);
                    for (var d = 0; d < defParts.length; d++) {
                        var part = defParts[d].trim();
                        if (part && !part.match(/^\s*\[.*?\]\s*$/)) {
                            shortDef = part.substring(0, 12);
                            if (part.length > 12) shortDef += '...';
                            break;
                        }
                    }
                }
                
                var annotationText = '';
                if (pos) annotationText += pos + ' ';
                if (shortDef) annotationText += shortDef;
                annotation.textContent = annotationText;
                
                wrapper.appendChild(span);
                if (annotationText) {
                    wrapper.appendChild(annotation);
                }
                
                (function(wordInfo, spanEl) {
                    spanEl.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        showTooltip(wordInfo.word, wordInfo.definition, wordInfo.isNew, wordInfo.pos, wordInfo.phonetic, spanEl);
                    });
                })(item.word, span);
                
                fragment.insertBefore(wrapper, fragment.firstChild);
                lastIndex = item.index;
                highlightedElements.push(wrapper);
            }
            
            if (lastIndex > 0) {
                fragment.insertBefore(document.createTextNode(text.slice(0, lastIndex)), fragment.firstChild);
            }
            
            parent.replaceChild(fragment, node);
        }
        
        var highlightedCount = document.querySelectorAll('.baiit-word').length;
        window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'highlight_complete',
            count: highlightedCount
        }));
    }
    
    highlightWords();
})();
true;
`;

const CSS_STYLES = `
.baiit-word {
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: underline;
    text-decoration-style: dotted;
    text-decoration-color: rgba(99, 102, 241, 0.6);
    text-decoration-thickness: 2px;
    text-underline-offset: 3px;
    white-space: pre-wrap;
}
.baiit-word:hover {
    text-decoration-color: rgba(99, 102, 241, 0.9);
}
.baiit-word-new {
    text-decoration-color: rgba(239, 68, 68, 0.6);
}
.baiit-word-new:hover {
    text-decoration-color: rgba(239, 68, 68, 0.9);
}
.baiit-annotation-wrapper {
    position: relative;
    display: inline-block;
}
.baiit-annotation-inline {
    position: absolute;
    bottom: -0.7em;
    left: 0;
    font-size: 0.6em;
    color: rgba(99, 102, 241, 0.9);
    white-space: nowrap;
    line-height: 1;
    pointer-events: none;
    font-weight: 500;
}
.baiit-annotation-inline.baiit-annotation-new {
    color: rgba(239, 68, 68, 0.9);
}
.baiit-tooltip {
    position: fixed;
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(12px);
    border-radius: 12px;
    padding: 12px 16px;
    max-width: 300px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    border: 1px solid rgba(255,255,255,0.1);
    animation: baiit-fadeIn 0.2s ease;
}
.baiit-tooltip-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
}
.baiit-tooltip-word-text {
    font-size: 18px;
    font-weight: 700;
    color: #fff;
}
.baiit-tooltip-speaker {
    cursor: pointer;
    font-size: 16px;
    padding: 4px;
    border-radius: 4px;
    transition: background 0.2s;
}
.baiit-tooltip-speaker:hover {
    background: rgba(255,255,255,0.1);
}
.baiit-tooltip-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}
.baiit-tooltip-pos {
    font-size: 12px;
    color: rgba(147, 197, 253, 0.9);
    background: rgba(59, 130, 246, 0.2);
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 500;
}
.baiit-tooltip-phonetic {
    font-size: 13px;
    color: rgba(255,255,255,0.7);
    font-family: "Times New Roman", serif;
}
.baiit-tooltip-definition {
    font-size: 14px;
    color: rgba(255,255,255,0.9);
    line-height: 1.6;
}
.baiit-tooltip-badge {
    display: inline-block;
    background: linear-gradient(135deg, #ef4444, #f97316);
    color: white;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    margin-left: 4px;
    font-weight: 500;
}
@keyframes baiit-fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
}
`;

function generateHighlightScript(words: WordAnnotation[]): string {
    return HIGHLIGHT_SCRIPT_CODE
        .replace('WORDS_PLACEHOLDER', JSON.stringify(words))
        .replace('CSS_STYLES', JSON.stringify(CSS_STYLES));
}

export function BrowserScreen({ navigation }: BrowserScreenProps) {
    const [url, setUrl] = useState('https://twitter.com');
    const [inputUrl, setInputUrl] = useState('https://twitter.com');
    const [isLoading, setIsLoading] = useState(true);
    const [canGoBack, setCanGoBack] = useState(false);
    const [canGoForward, setCanGoForward] = useState(false);
    const [bookmarks, setBookmarks] = useState(DEFAULT_BOOKMARKS);
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

    const webViewRef = useRef<WebView>(null);
    const { theme } = useTheme();
    const { t } = useLanguage();

    useEffect(() => {
        loadBookmarks();
        loadVocabWords();
    }, []);

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
        webViewRef.current?.injectJavaScript(`
            (function() {
                var style = document.getElementById('baiit-annotation-styles');
                if (style) {
                    style.textContent = '.baiit-annotation-inline { display: none !important; } .baiit-word { text-decoration: none !important; cursor: default !important; }';
                }
            })();
            true;
        `);
    };

    const loadBookmarks = async () => {
        const saved = await storage.get<typeof DEFAULT_BOOKMARKS>(BOOKMARKS_KEY);
        if (saved) {
            setBookmarks(saved);
        }
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
        if (isProcessing || !isEnglish(text)) return;

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

            if (isTestCompleted && canUsePersonalized.can) {
                // 使用个性化大模型标注
                const response = await PersonalizedAnnotationService.annotate({
                    text: truncatedText,
                    title: pageTitle,
                    url,
                });

                annotations = response.annotations.map(a => ({
                    word: a.word,
                    definition: a.definition,
                    isNew: true,
                    pos: a.pos,
                    phonetic: a.phonetic,
                }));
            } else {
                // 使用本地词典标注（原有逻辑）
                const sentences = splitSentences(truncatedText);
                const complexSentences = sentences.filter(s => estimateComplexity(s) >= 3);

                if (complexSentences.length === 0) {
                    setIsProcessing(false);
                    return;
                }

                const analysis = await Dictionary.analyzeText(truncatedText);

                if (analysis.newWordsCount === 0) {
                    setIsProcessing(false);
                    return;
                }

                annotations = analysis.words
                    .filter(w => w.isNew)
                    .map(w => ({
                        word: w.word,
                        definition: w.definition || '',
                        isNew: true,
                    }));
            }

            // 过滤已处理的单词
            const newAnnotations = annotations.filter(a => {
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
                    const vocabRecord: VocabRecord = {
                        id: `${Date.now()}-${annotation.word}`,
                        word: annotation.word,
                        status: 'new',
                        phonetic: annotation.phonetic,
                        definition: annotation.definition,
                        encounterCount: 1,
                        firstSeenAt: Date.now(),
                        updatedAt: Date.now(),
                    };
                    await Database.saveVocab(vocabRecord);
                    await Database.recordLearningActivity('new');
                }
            }

            if (newAnnotations.length > 0) {
                setWordAnnotations(prev => [...prev, ...newAnnotations]);
            }

            setProcessedCount(prev => prev + 1);
        } catch (error) {
            console.error('处理页面内容失败:', error);
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing, url]);

    const highlightWordsInPage = useCallback(() => {
        if (wordAnnotations.length === 0) return;

        const script = generateHighlightScript(wordAnnotations);
        webViewRef.current?.injectJavaScript(script);
    }, [wordAnnotations]);

    const handleNavigationStateChange = (navState: WebViewNavigation) => {
        setCanGoBack(navState.canGoBack);
        setCanGoForward(navState.canGoForward);
        setUrl(navState.url);
        setInputUrl(navState.url);
        setIsLoading(navState.loading);

        if (navState.loading) {
            setHighlightedCount(0);
            setPageLoaded(false);
            // 清空已处理单词集合，避免跨页面污染
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
                if (text && text.length > 100) {
                    processPageContent(text, title, isScroll);
                }
                return;
            }

            if (data.type === 'highlight_complete') {
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
        if (canGoBack) {
            webViewRef.current?.goBack();
        }
    };

    const goForward = () => {
        if (canGoForward) {
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
            await WebBrowser.openBrowserAsync(url);
        } catch (error) {
            console.error('打开系统浏览器失败:', error);
            Alert.alert('错误', '无法打开系统浏览器');
        }
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
                        // 可以集成 expo-sharing
                        console.log('分享链接:', url);
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
        let finalUrl = inputUrl.trim();

        if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
            finalUrl = 'https://' + finalUrl;
        }

        setUrl(finalUrl);
        setShowBookmarks(false);
        setHighlightedCount(0);
        setProcessedCount(0);
    };

    const openBookmark = (bookmarkUrl: string) => {
        setUrl(bookmarkUrl);
        setInputUrl(bookmarkUrl);
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

        try {
            await Database.saveVocab({
                id: Date.now().toString(),
                word: selectedWord.word,
                definition: selectedWord.definition,
                status: 'new',
                encounterCount: 1,
                firstSeenAt: Date.now(),
                updatedAt: Date.now(),
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
                {bookmarks.map((bookmark, index) => (
                    <TouchableOpacity
                        key={index}
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
                    <TouchableOpacity onPress={goBack} disabled={!canGoBack} style={styles.navButton}>
                        <Ionicons
                            name="chevron-back"
                            size={24}
                            color={canGoBack ? theme.colors.text : theme.colors.textSecondary}
                        />
                    </TouchableOpacity>

                    <View style={[styles.inputContainer, { backgroundColor: theme.colors.background }]}>
                        <Ionicons name="search-outline" size={16} color={theme.colors.textSecondary} />
                        <TextInput
                            style={[styles.urlInput, { color: theme.colors.text }]}
                            value={inputUrl}
                            onChangeText={setInputUrl}
                            onSubmitEditing={submitUrl}
                            returnKeyType="go"
                            autoCapitalize="none"
                            autoCorrect={false}
                            placeholder={t('browser.enterUrl')}
                            placeholderTextColor={theme.colors.textSecondary}
                        />
                        {isLoading && <ActivityIndicator size="small" color={theme.colors.primary} />}
                    </View>

                    <TouchableOpacity onPress={goForward} disabled={!canGoForward} style={styles.navButton}>
                        <Ionicons
                            name="chevron-forward"
                            size={24}
                            color={canGoForward ? theme.colors.text : theme.colors.textSecondary}
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
                        <Animated.View
                            entering={FadeIn}
                            exiting={FadeOut}
                            style={styles.statusItem}
                        >
                            <ActivityIndicator size="small" color={theme.colors.primary} />
                            <Text style={[styles.statusText, { color: theme.colors.primary }]}>
                                {t('browser.processing')}
                            </Text>
                        </Animated.View>
                    )}

                    {highlightedCount > 0 && !isProcessing && (
                        <Animated.View
                            entering={FadeIn}
                            exiting={FadeOut}
                            style={styles.statusItem}
                        >
                            <Ionicons name="sparkles" size={14} color={theme.colors.success} />
                            <Text style={[styles.statusText, { color: theme.colors.success }]}>
                                已标注 {highlightedCount} 个生词
                            </Text>
                        </Animated.View>
                    )}

                    {processedCount > 0 && highlightedCount === 0 && !isProcessing && (
                        <Animated.View
                            entering={FadeIn}
                            exiting={FadeOut}
                            style={styles.statusItem}
                        >
                            <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
                            <Text style={[styles.statusText, { color: theme.colors.success }]}>
                                {t('browser.processed', { count: processedCount })}
                            </Text>
                        </Animated.View>
                    )}
                </View>


            </View>

            {showBookmarks ? (
                renderBookmarks()
            ) : (
                <View style={styles.webViewContainer}>
                    <WebView
                        ref={webViewRef}
                        source={{ uri: url }}
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
                        onShouldStartLoadWithRequest={() => true}
                    />
                    <TouchableOpacity
                        style={[styles.annotationToggle, { backgroundColor: theme.colors.surface }]}
                        onPress={() => setShowAnnotations(!showAnnotations)}
                    >
                        <Ionicons
                            name={showAnnotations ? "eye" : "eye-off"}
                            size={20}
                            color={showAnnotations ? theme.colors.primary : theme.colors.textSecondary}
                        />
                    </TouchableOpacity>
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
    annotationToggle: {
        position: 'absolute',
        top: 12,
        right: 12,
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
        zIndex: 100,
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
