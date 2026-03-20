export interface WordAnnotation {
    word: string;
    definition: string;
    isNew: boolean;
    pos?: string;
    phonetic?: string;
}

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
    
    function shouldSkipElement(element) {
        if (!element || !element.tagName) return false;
        
        var tag = element.tagName.toLowerCase();
        
        var skipTags = [
            'script', 'style', 'noscript', 
            'button', 'input', 'textarea', 'select', 'option', 
            'a', 'code', 'pre', 'kbd', 'samp', 'var', 'tt'
        ];
        if (skipTags.indexOf(tag) !== -1) return true;
        
        if (tag === 'input') {
            var inputType = element.getAttribute('type');
            if (!inputType || inputType === 'button' || inputType === 'submit' || inputType === 'reset') {
                return true;
            }
        }
        
        var skipClasses = [
            'baiit-word', 'baiit-tooltip',
            'btn', 'button', 'btn-', 'button-',
            'code', 'codeblock', 'code-block', 'code_block',
            'highlight', 'hljs', 'prism', 'prettyprint',
            'gist', 'github', 'markdown-body',
            'language-', 'lang-', 'brush:'
        ];
        var className = element.className;
        var classList = element.classList;
        if (typeof className === 'string') {
            for (var i = 0; i < skipClasses.length; i++) {
                if (className.indexOf(skipClasses[i]) !== -1) return true;
            }
        }
        if (classList && classList.length > 0) {
            for (var i = 0; i < skipClasses.length; i++) {
                if (classList.contains(skipClasses[i])) return true;
            }
        }
        
        var role = element.getAttribute('role');
        if (role === 'button' || role === 'link' || role === 'navigation' || role === 'code') return true;
        
        var dataLang = element.getAttribute('data-lang') || element.getAttribute('data-language');
        if (dataLang) return true;
        
        var parent = element.parentElement;
        var maxDepth = 10;
        var depth = 0;
        while (parent && depth < maxDepth) {
            var parentTag = parent.tagName.toLowerCase();
            if (parentTag === 'code' || parentTag === 'pre' || parentTag === 'kbd' || parentTag === 'samp' || parentTag === 'var' || parentTag === 'tt') {
                return true;
            }
            
            if (parentTag === 'button' || parentTag === 'a') {
                return true;
            }
            
            var parentClass = parent.className;
            if (typeof parentClass === 'string') {
                var codeBlockPatterns = [
                    'highlight', 'hljs', 'prism', 'prettyprint',
                    'code', 'codeblock', 'code-block', 'code_block',
                    'gist', 'language-', 'lang-',
                    'markdown-body', 'md-content',
                    'syntax', 'source-code'
                ];
                for (var j = 0; j < codeBlockPatterns.length; j++) {
                    if (parentClass.indexOf(codeBlockPatterns[j]) !== -1) return true;
                }

                var buttonPatterns = ['btn', 'button', 'btn-', 'button-'];
                for (var k = 0; k < buttonPatterns.length; k++) {
                    if (parentClass.indexOf(buttonPatterns[k]) !== -1) return true;
                }
            }
            
            var parentRole = parent.getAttribute('role');
            if (parentRole === 'button') return true;
            
            if (parent.getAttribute('data-lang') || parent.getAttribute('data-language')) {
                return true;
            }
            
            parent = parent.parentElement;
            depth++;
        }
        
        return false;
    }
    
    function highlightWords() {
        var startTime = Date.now();
        
        var wordMap = {};
        var wordSet = new Set();
        var wordList = [];
        for (var i = 0; i < words.length; i++) {
            var w = words[i].word.toLowerCase();
            wordMap[w] = words[i];
            wordSet.add(w);
            wordList.push(w);
        }
        
        if (wordList.length === 0) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'highlight_complete',
                count: 0
            }));
            return;
        }
        
        var patternStr = '\\\\b(' + wordList.map(function(w) { return escapeRegExp(w); }).join('|') + ')\\\\b';
        var combinedRegex = new RegExp(patternStr, 'gi');
        
        var skipCache = new WeakMap();
        
        function cachedShouldSkip(element) {
            if (!element) return false;
            if (skipCache.has(element)) return skipCache.get(element);
            var result = shouldSkipElement(element);
            skipCache.set(element, result);
            return result;
        }
        
        var walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    if (cachedShouldSkip(node.parentElement)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    var text = node.textContent;
                    if (!text || text.trim().length < 3) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );
        
        var textNodes = [];
        var nodeCount = 0;
        var maxNodes = 500;
        while (walker.nextNode() && nodeCount < maxNodes) {
            textNodes.push(walker.currentNode);
            nodeCount++;
        }
        
        var highlightedCount = 0;
        var processedNodes = 0;
        var maxProcessedNodes = 300;
        
        function processBatch(startIndex) {
            var endIndex = Math.min(startIndex + 50, textNodes.length);
            
            for (var n = startIndex; n < endIndex; n++) {
                var node = textNodes[n];
                var text = node.textContent;
                var wordsToHighlight = [];
                
                var match;
                combinedRegex.lastIndex = 0;
                while ((match = combinedRegex.exec(text)) !== null) {
                    var matchedWord = match[1].toLowerCase();
                    if (wordSet.has(matchedWord) && wordMap[matchedWord]) {
                        wordsToHighlight.push({
                            word: wordMap[matchedWord],
                            index: match.index,
                            length: match[0].length
                        });
                    }
                }
                
                if (wordsToHighlight.length === 0) continue;
                
                wordsToHighlight.sort(function(a, b) { return b.index - a.index; });
                
                var deduped = [];
                var seen = new Set();
                for (var h = 0; h < wordsToHighlight.length; h++) {
                    var item = wordsToHighlight[h];
                    var key = item.index + '-' + item.length;
                    if (!seen.has(key)) {
                        seen.add(key);
                        deduped.push(item);
                    }
                }
                wordsToHighlight = deduped;
                
                var parent = node.parentNode;
                if (!parent) continue;
                
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
                            if (part && !part.match(/^\\s*\\[.*?\\]\\s*$/)) {
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
                    highlightedCount++;
                }
                
                if (lastIndex > 0) {
                    fragment.insertBefore(document.createTextNode(text.slice(0, lastIndex)), fragment.firstChild);
                }
                
                parent.replaceChild(fragment, node);
                processedNodes++;
            }
            
            if (endIndex < textNodes.length && processedNodes < maxProcessedNodes) {
                requestAnimationFrame(function() {
                    processBatch(endIndex);
                });
            } else {
                var elapsed = Date.now() - startTime;
                console.log('[Baiit] 标注完成: ' + highlightedCount + ' 词, 耗时 ' + elapsed + 'ms');
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'highlight_complete',
                    count: highlightedCount
                }));
            }
        }
        
        processBatch(0);
    }
    
    highlightWords();
})();
true;
`;

export function generateHighlightScript(words: WordAnnotation[]): string {
    const cssStyles = CSS_STYLES.replace(/`/g, '\\`').replace(/\$/g, '\\$');
    return HIGHLIGHT_SCRIPT_CODE
        .replace('WORDS_PLACEHOLDER', JSON.stringify(words))
        .replace('CSS_STYLES', '`' + cssStyles + '`');
}

export const HIDE_ANNOTATIONS_SCRIPT = `
(function() {
    var style = document.getElementById('baiit-annotation-styles');
    if (style) {
        style.textContent = '.baiit-annotation-inline { display: none !important; } .baiit-word { text-decoration: none !important; cursor: default !important; }';
    }
})();
true;
`;
