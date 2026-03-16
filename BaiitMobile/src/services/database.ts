/**
 * 本地数据库服务
 * 使用 AsyncStorage 实现类似 SQLite 的关系型数据存储
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MobileVocabStatus as VocabStatus,
  MobileVocabRecord as VocabRecord,
  MobileVocabContextRecord as VocabContextRecord,
  MobileSavedSentence as SavedSentence,
  MobileSentenceAnalysis as SentenceAnalysis,
  MobileLearningRecord as LearningRecord,
  MobileReviewItem as ReviewItem,
  MobileAppStats as AppStats,
} from '../types';

export type { VocabStatus, VocabRecord, VocabContextRecord, SavedSentence, SentenceAnalysis, LearningRecord, ReviewItem, AppStats };

// ========== 存储键名 ==========
const KEYS = {
  VOCAB: 'baiit:vocab',
  VOCAB_CONTEXT: 'baiit:vocab_context',
  SENTENCES: 'baiit:sentences',
  LEARNING_RECORDS: 'baiit:learning_records',
  REVIEW_ITEMS: 'baiit:review_items',
  STATS: 'baiit:stats',
  SETTINGS: 'baiit:settings',
};

// ========== 工具函数 ==========

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterdayString(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}

function getPreviousDayString(dateStr: string): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}

// ========== 数据库服务 ==========

class DatabaseClass {
  // ========== 生词本操作 ==========

  async getAllVocab(): Promise<VocabRecord[]> {
    const data = await AsyncStorage.getItem(KEYS.VOCAB);
    return data ? JSON.parse(data) : [];
  }

  async getVocabById(id: string): Promise<VocabRecord | null> {
    const vocab = await this.getAllVocab();
    return vocab.find(v => v.id === id) || null;
  }

  async getVocabByWord(word: string): Promise<VocabRecord | null> {
    const vocab = await this.getAllVocab();
    return vocab.find(v => v.word.toLowerCase() === word.toLowerCase()) || null;
  }

  async saveVocab(vocab: VocabRecord): Promise<void> {
    const all = await this.getAllVocab();
    const index = all.findIndex(v => v.id === vocab.id);

    if (index >= 0) {
      all[index] = { ...vocab, updatedAt: Date.now() };
    } else {
      all.push({
        ...vocab,
        id: vocab.id || generateId(),
        firstSeenAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    await AsyncStorage.setItem(KEYS.VOCAB, JSON.stringify(all));
    await this.updateStats();
  }

  async updateVocabStatus(id: string, status: VocabStatus): Promise<void> {
    const vocab = await this.getVocabById(id);
    if (!vocab) return;

    vocab.status = status;
    vocab.updatedAt = Date.now();

    if (status === 'mastered' && !vocab.masteredAt) {
      vocab.masteredAt = Date.now();
    }

    await this.saveVocab(vocab);

    // 更新学习记录
    await this.recordLearningActivity(status === 'mastered' ? 'mastered' : 'reviewed');
  }

  async incrementEncounterCount(word: string): Promise<void> {
    const vocab = await this.getVocabByWord(word);
    if (vocab) {
      vocab.encounterCount++;
      vocab.updatedAt = Date.now();
      await this.saveVocab(vocab);
    }
  }

  async deleteVocab(id: string): Promise<void> {
    const all = await this.getAllVocab();
    const filtered = all.filter(v => v.id !== id);
    await AsyncStorage.setItem(KEYS.VOCAB, JSON.stringify(filtered));

    // 删除相关语境
    const contexts = await this.getVocabContexts(id);
    for (const ctx of contexts) {
      await this.deleteVocabContext(ctx.id);
    }

    await this.updateStats();
  }

  async getVocabByStatus(status: VocabStatus): Promise<VocabRecord[]> {
    const vocab = await this.getAllVocab();
    return vocab.filter(v => v.status === status);
  }

  async searchVocab(query: string): Promise<VocabRecord[]> {
    const vocab = await this.getAllVocab();
    const lowerQuery = query.toLowerCase();
    return vocab.filter(v =>
      v.word.toLowerCase().includes(lowerQuery) ||
      v.definition?.toLowerCase().includes(lowerQuery)
    );
  }

  // ========== 生词语境操作 ==========

  async getVocabContexts(vocabId: string): Promise<VocabContextRecord[]> {
    const data = await AsyncStorage.getItem(KEYS.VOCAB_CONTEXT);
    const all: VocabContextRecord[] = data ? JSON.parse(data) : [];
    return all.filter(c => c.vocabId === vocabId).sort((a, b) => b.createdAt - a.createdAt);
  }

  async saveVocabContext(context: VocabContextRecord): Promise<void> {
    const data = await AsyncStorage.getItem(KEYS.VOCAB_CONTEXT);
    const all: VocabContextRecord[] = data ? JSON.parse(data) : [];

    all.push({
      ...context,
      id: context.id || generateId(),
      createdAt: Date.now(),
    });

    await AsyncStorage.setItem(KEYS.VOCAB_CONTEXT, JSON.stringify(all));
  }

  async deleteVocabContext(id: string): Promise<void> {
    const data = await AsyncStorage.getItem(KEYS.VOCAB_CONTEXT);
    const all: VocabContextRecord[] = data ? JSON.parse(data) : [];
    const filtered = all.filter(c => c.id !== id);
    await AsyncStorage.setItem(KEYS.VOCAB_CONTEXT, JSON.stringify(filtered));
  }

  // ========== 句子收藏操作 ==========

  async getAllSentences(): Promise<SavedSentence[]> {
    const data = await AsyncStorage.getItem(KEYS.SENTENCES);
    const sentences: SavedSentence[] = data ? JSON.parse(data) : [];
    return sentences.sort((a, b) => b.createdAt - a.createdAt);
  }

  async getSentenceById(id: string): Promise<SavedSentence | null> {
    const sentences = await this.getAllSentences();
    return sentences.find(s => s.id === id) || null;
  }

  async saveSentence(sentence: SavedSentence): Promise<void> {
    const all = await this.getAllSentences();
    const index = all.findIndex(s => s.id === sentence.id);

    const now = Date.now();
    if (index >= 0) {
      all[index] = { ...sentence, updatedAt: now };
    } else {
      all.unshift({
        ...sentence,
        id: sentence.id || generateId(),
        createdAt: now,
        updatedAt: now,
      });
    }

    await AsyncStorage.setItem(KEYS.SENTENCES, JSON.stringify(all));
    await this.updateStats();
    await this.recordLearningActivity('sentence');
  }

  async deleteSentence(id: string): Promise<void> {
    const all = await this.getAllSentences();
    const filtered = all.filter(s => s.id !== id);
    await AsyncStorage.setItem(KEYS.SENTENCES, JSON.stringify(filtered));
    await this.updateStats();
  }

  async searchSentences(query: string): Promise<SavedSentence[]> {
    const sentences = await this.getAllSentences();
    const lowerQuery = query.toLowerCase();
    return sentences.filter(s =>
      s.text.toLowerCase().includes(lowerQuery) ||
      s.translation?.toLowerCase().includes(lowerQuery)
    );
  }

  // ========== 学习记录操作 ==========

  async getLearningRecord(date: string): Promise<LearningRecord | null> {
    const data = await AsyncStorage.getItem(KEYS.LEARNING_RECORDS);
    const all: LearningRecord[] = data ? JSON.parse(data) : [];
    return all.find(r => r.date === date) || null;
  }

  async getLearningRecords(startDate: string, endDate: string): Promise<LearningRecord[]> {
    const data = await AsyncStorage.getItem(KEYS.LEARNING_RECORDS);
    const all: LearningRecord[] = data ? JSON.parse(data) : [];
    return all.filter(r => r.date >= startDate && r.date <= endDate)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async recordLearningActivity(
    type: 'new' | 'reviewed' | 'mastered' | 'sentence',
    minutes: number = 0
  ): Promise<void> {
    const today = getTodayString();
    let record = await this.getLearningRecord(today);

    if (!record) {
      record = {
        id: generateId(),
        date: today,
        newWords: 0,
        reviewedWords: 0,
        masteredWords: 0,
        sentencesCollected: 0,
        studyTimeMinutes: 0,
      };
    }

    switch (type) {
      case 'new':
        record.newWords++;
        break;
      case 'reviewed':
        record.reviewedWords++;
        break;
      case 'mastered':
        record.masteredWords++;
        break;
      case 'sentence':
        record.sentencesCollected++;
        break;
    }

    record.studyTimeMinutes += minutes;

    const data = await AsyncStorage.getItem(KEYS.LEARNING_RECORDS);
    const all: LearningRecord[] = data ? JSON.parse(data) : [];
    const index = all.findIndex(r => r.date === today);

    if (index >= 0) {
      all[index] = record;
    } else {
      all.push(record);
    }

    await AsyncStorage.setItem(KEYS.LEARNING_RECORDS, JSON.stringify(all));
    await this.updateStats();
  }

  // ========== 复习项目操作（SM-2 算法） ==========

  async getReviewItems(dueBefore: number = Date.now()): Promise<ReviewItem[]> {
    const data = await AsyncStorage.getItem(KEYS.REVIEW_ITEMS);
    const all: ReviewItem[] = data ? JSON.parse(data) : [];
    return all.filter(r => r.nextReviewAt <= dueBefore)
      .sort((a, b) => a.nextReviewAt - b.nextReviewAt);
  }

  async saveReviewItem(item: ReviewItem): Promise<void> {
    const data = await AsyncStorage.getItem(KEYS.REVIEW_ITEMS);
    const all: ReviewItem[] = data ? JSON.parse(data) : [];
    const index = all.findIndex(r => r.id === item.id);

    if (index >= 0) {
      all[index] = item;
    } else {
      all.push(item);
    }

    await AsyncStorage.setItem(KEYS.REVIEW_ITEMS, JSON.stringify(all));
  }

  async updateReviewItemAfterReview(
    itemId: string,
    quality: number // 0-5，表示复习质量
  ): Promise<void> {
    const data = await AsyncStorage.getItem(KEYS.REVIEW_ITEMS);
    const all: ReviewItem[] = data ? JSON.parse(data) : [];
    const item = all.find(r => r.id === itemId);

    if (!item) return;

    // SM-2 算法
    if (quality >= 3) {
      if (item.repetitions === 0) {
        item.interval = 1;
      } else if (item.repetitions === 1) {
        item.interval = 6;
      } else {
        item.interval = Math.round(item.interval * item.easeFactor);
      }
      item.repetitions++;
    } else {
      item.repetitions = 0;
      item.interval = 1;
    }

    item.easeFactor = Math.max(
      1.3,
      item.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );

    item.lastReviewedAt = Date.now();
    item.nextReviewAt = Date.now() + item.interval * 24 * 60 * 60 * 1000;

    await AsyncStorage.setItem(KEYS.REVIEW_ITEMS, JSON.stringify(all));
    await this.recordLearningActivity('reviewed');
  }

  // ========== 统计操作 ==========

  async getStats(): Promise<AppStats> {
    const data = await AsyncStorage.getItem(KEYS.STATS);
    if (data) return JSON.parse(data);

    return {
      totalWords: 0,
      masteredWords: 0,
      learningWords: 0,
      newWords: 0,
      totalSentences: 0,
      currentStreak: 0,
      longestStreak: 0,
    };
  }

  async updateStats(): Promise<void> {
    const vocab = await this.getAllVocab();
    const sentences = await this.getAllSentences();
    const records = await AsyncStorage.getItem(KEYS.LEARNING_RECORDS);
    const learningRecords: LearningRecord[] = records ? JSON.parse(records) : [];

    // 计算连续学习天数
    const today = getTodayString();
    const yesterday = getYesterdayString();

    let currentStreak = 0;
    let longestStreak = 0;

    const sortedRecords = learningRecords.sort((a, b) => b.date.localeCompare(a.date));

    // 检查今天或昨天是否有学习记录
    const hasTodayRecord = sortedRecords.some(r => r.date === today);
    const hasYesterdayRecord = sortedRecords.some(r => r.date === yesterday);

    if (hasTodayRecord || hasYesterdayRecord) {
      currentStreak = 1;
      let checkDate = hasTodayRecord ? today : yesterday;

      for (let i = 0; i < sortedRecords.length; i++) {
        const record = sortedRecords[i];
        if (record.date === checkDate) {
          currentStreak++;
          checkDate = getPreviousDayString(checkDate);
        } else if (record.date < checkDate) {
          break;
        }
      }
    }

    // 计算最长连续天数
    longestStreak = Math.max(currentStreak, ...learningRecords.map(r => r.studyTimeMinutes > 0 ? 1 : 0));

    const stats: AppStats = {
      totalWords: vocab.length,
      masteredWords: vocab.filter(v => v.status === 'mastered').length,
      learningWords: vocab.filter(v => v.status === 'learning').length,
      newWords: vocab.filter(v => v.status === 'new').length,
      totalSentences: sentences.length,
      currentStreak,
      longestStreak,
      lastStudyDate: hasTodayRecord ? today : undefined,
    };

    await AsyncStorage.setItem(KEYS.STATS, JSON.stringify(stats));
  }

  // ========== 数据导出/导入 ==========

  async exportAllData(): Promise<string> {
    const data = {
      vocab: await this.getAllVocab(),
      vocabContexts: await AsyncStorage.getItem(KEYS.VOCAB_CONTEXT),
      sentences: await this.getAllSentences(),
      learningRecords: await AsyncStorage.getItem(KEYS.LEARNING_RECORDS),
      reviewItems: await AsyncStorage.getItem(KEYS.REVIEW_ITEMS),
      stats: await this.getStats(),
      exportedAt: Date.now(),
    };
    return JSON.stringify(data, null, 2);
  }

  async importAllData(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString);

      if (data.vocab) await AsyncStorage.setItem(KEYS.VOCAB, JSON.stringify(data.vocab));
      if (data.vocabContexts) await AsyncStorage.setItem(KEYS.VOCAB_CONTEXT, data.vocabContexts);
      if (data.sentences) await AsyncStorage.setItem(KEYS.SENTENCES, JSON.stringify(data.sentences));
      if (data.learningRecords) await AsyncStorage.setItem(KEYS.LEARNING_RECORDS, data.learningRecords);
      if (data.reviewItems) await AsyncStorage.setItem(KEYS.REVIEW_ITEMS, data.reviewItems);

      await this.updateStats();
      return true;
    } catch {
      return false;
    }
  }

  // ========== 清理数据 ==========

  async clearAllData(): Promise<void> {
    const keys = Object.values(KEYS);
    for (const key of keys) {
      await AsyncStorage.removeItem(key);
    }
  }
}

export const Database = new DatabaseClass();
