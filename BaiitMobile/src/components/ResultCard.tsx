import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { ScanResult, WordInfo } from '../types';
import { Database, SavedSentence, SentenceAnalysis } from '../services/database';

interface ResultCardProps {
  result: ScanResult;
}

export function ResultCard({ result }: ResultCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(result.text);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderWord = (word: WordInfo, index: number) => {
    if (word.isNew) {
      return (
        <Text key={index} style={styles.newWord}>
          {word.word}
        </Text>
      );
    }
    return <Text key={index}>{word.word}</Text>;
  };

  const newWords = result.words.filter((w: WordInfo) => w.isNew);

  const handleSaveSentence = async () => {
    if (isSaved) return;

    try {
      setIsAnalyzing(true);

      // 构建句子分析（简化版，实际应该调用 AI 服务）
      const analysis: SentenceAnalysis = {
        chunked: result.text, // 简化处理
        sentenceAnalysis: '句子结构分析...',
        expressionTips: '表达提示...',
        newWords: newWords.map((w: WordInfo) => ({
          word: w.word,
          definition: w.definition || '暂无释义',
        })),
      };

      const sentence: SavedSentence = {
        id: result.id,
        text: result.text,
        words: result.words.map((w: WordInfo) => w.word),
        sourceApp: result.sourceApp,
        isAnalyzed: true,
        analysisResult: analysis,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await Database.saveSentence(sentence);
      setIsSaved(true);

      Alert.alert('成功', '句子已收藏');
    } catch (error) {
      console.error('保存句子失败:', error);
      Alert.alert('错误', '保存句子失败');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.time}>{formatTime(result.timestamp)}</Text>
          {result.sourceApp && (
            <Text style={styles.source}>{result.sourceApp}</Text>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={copyToClipboard} style={styles.actionBtn}>
            <Ionicons name="copy-outline" size={18} color="#2196F3" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSaveSentence}
            style={styles.actionBtn}
            disabled={isSaved || isAnalyzing}
          >
            <Ionicons
              name={isSaved ? "bookmark" : "bookmark-outline"}
              size={18}
              color={isSaved ? "#4CAF50" : "#2196F3"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sentence}>
        {result.words.map((word: WordInfo, index: number) => renderWord(word, index))}
      </View>

      {newWords.length > 0 && (
        <View style={styles.newWordsSection}>
          <Text style={styles.newWordsTitle}>
            生词 ({newWords.length})
          </Text>
          <View style={styles.newWordsList}>
            {newWords.map((word: WordInfo, index: number) => (
              <View key={index} style={styles.wordTag}>
                <Text style={styles.wordTagText}>{word.word}</Text>
                {word.definition && (
                  <Text style={styles.wordDefinition} numberOfLines={1}>
                    {word.definition}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  source: {
    fontSize: 11,
    color: '#666',
    marginLeft: 8,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionBtn: {
    padding: 4,
    marginLeft: 8,
  },
  sentence: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  newWord: {
    backgroundColor: '#FFF3E0',
    color: '#E65100',
    paddingHorizontal: 2,
    borderRadius: 2,
  },
  newWordsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  newWordsTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  newWordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  wordTag: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    maxWidth: '100%',
  },
  wordTagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
  },
  wordDefinition: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
});
