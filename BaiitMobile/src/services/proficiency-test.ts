/**
 * 用户语言能力测试系统
 * 通过一系列测试题目评估用户的英语水平
 */

import { storage } from './storage';

const PROFICIENCY_KEY = 'user_proficiency_level';
const TEST_COMPLETED_KEY = 'proficiency_test_completed';

export type ProficiencyLevel = 'beginner' | 'elementary' | 'intermediate' | 'upper_intermediate' | 'advanced' | 'proficient';

export interface ProficiencyResult {
  level: ProficiencyLevel;
  score: number;
  vocabularySize: number;
  knownWords: string[];
  recommendedFocus: string[];
}

export interface TestQuestion {
  id: number;
  type: 'vocabulary' | 'grammar' | 'reading';
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: number; // 1-6
  targetWords: string[]; // 测试的目标词汇
}

// CEFR 词汇量参考
const VOCAB_SIZE_RANGES: Record<ProficiencyLevel, { min: number; max: number }> = {
  beginner: { min: 0, max: 500 },
  elementary: { min: 500, max: 1000 },
  intermediate: { min: 1000, max: 2000 },
  upper_intermediate: { min: 2000, max: 4000 },
  advanced: { min: 4000, max: 8000 },
  proficient: { min: 8000, max: 20000 },
};

// 测试题库
const TEST_QUESTIONS: TestQuestion[] = [
  // Beginner (A1)
  {
    id: 1,
    type: 'vocabulary',
    question: 'What is the opposite of "hot"?',
    options: ['warm', 'cold', 'sunny', 'wet'],
    correctAnswer: 1,
    difficulty: 1,
    targetWords: ['opposite', 'cold'],
  },
  {
    id: 2,
    type: 'vocabulary',
    question: 'I ___ to school every day.',
    options: ['go', 'goes', 'going', 'gone'],
    correctAnswer: 0,
    difficulty: 1,
    targetWords: ['every day'],
  },
  // Elementary (A2)
  {
    id: 3,
    type: 'vocabulary',
    question: 'The weather is quite ___ today. (not hot, not cold)',
    options: ['freezing', 'boiling', 'mild', 'humid'],
    correctAnswer: 2,
    difficulty: 2,
    targetWords: ['mild', 'humid'],
  },
  {
    id: 4,
    type: 'grammar',
    question: 'She ___ never been to Paris.',
    options: ['has', 'have', 'had', 'is'],
    correctAnswer: 0,
    difficulty: 2,
    targetWords: ['never been'],
  },
  // Intermediate (B1)
  {
    id: 5,
    type: 'vocabulary',
    question: 'The company decided to ___ the new policy immediately.',
    options: ['implement', 'imply', 'import', 'impose'],
    correctAnswer: 0,
    difficulty: 3,
    targetWords: ['implement', 'policy'],
  },
  {
    id: 6,
    type: 'reading',
    question: 'Despite the rain, they continued with the outdoor event. What does "despite" mean?',
    options: ['Because of', 'Regardless of', 'Instead of', 'In addition to'],
    correctAnswer: 1,
    difficulty: 3,
    targetWords: ['despite', 'continued'],
  },
  // Upper Intermediate (B2)
  {
    id: 7,
    type: 'vocabulary',
    question: 'The scientist\'s theory was met with widespread ___ among colleagues.',
    options: ['skepticism', 'enthusiasm', 'confusion', 'indifference'],
    correctAnswer: 0,
    difficulty: 4,
    targetWords: ['skepticism', 'widespread', 'colleagues'],
  },
  {
    id: 8,
    type: 'reading',
    question: 'The novel\'s protagonist is an enigmatic figure. "Enigmatic" means:',
    options: ['Cheerful and friendly', 'Mysterious and difficult to understand', 'Angry and aggressive', 'Boring and predictable'],
    correctAnswer: 1,
    difficulty: 4,
    targetWords: ['protagonist', 'enigmatic', 'figure'],
  },
  // Advanced (C1)
  {
    id: 9,
    type: 'vocabulary',
    question: 'The politician\'s speech was full of ___ but lacked concrete proposals.',
    options: ['pragmatism', 'rhetoric', 'substance', 'clarity'],
    correctAnswer: 1,
    difficulty: 5,
    targetWords: ['rhetoric', 'concrete', 'proposals'],
  },
  {
    id: 10,
    type: 'reading',
    question: 'The article presents a nuanced view of the controversy. "Nuanced" suggests:',
    options: ['Simple and clear-cut', 'Subtle with fine distinctions', 'Strongly biased', 'Completely neutral'],
    correctAnswer: 1,
    difficulty: 5,
    targetWords: ['nuanced', 'controversy'],
  },
  // Proficient (C2)
  {
    id: 11,
    type: 'vocabulary',
    question: 'The philosopher\'s argument was so ___ that few could follow its intricate logic.',
    options: ['abstruse', 'accessible', 'simplistic', 'transparent'],
    correctAnswer: 0,
    difficulty: 6,
    targetWords: ['abstruse', 'intricate', 'logic'],
  },
  {
    id: 12,
    type: 'reading',
    question: 'The critic found the film\'s narrative structure to be deliberately convoluted. "Convoluted" implies:',
    options: ['Straightforward and linear', 'Overly complex and twisted', 'Emotionally moving', 'Visually stunning'],
    correctAnswer: 1,
    difficulty: 6,
    targetWords: ['narrative', 'deliberately', 'convoluted'],
  },
];

export class ProficiencyTest {
  /**
   * 获取所有测试题目
   */
  static getQuestions(): TestQuestion[] {
    return TEST_QUESTIONS;
  }

  /**
   * 计算测试结果
   */
  static calculateResult(answers: { questionId: number; selected: number }[]): ProficiencyResult {
    let correctCount = 0;
    const knownWords: string[] = [];
    const allTargetWords: string[] = [];

    for (const answer of answers) {
      const question = TEST_QUESTIONS.find(q => q.id === answer.questionId);
      if (!question) continue;

      allTargetWords.push(...question.targetWords);

      if (answer.selected === question.correctAnswer) {
        correctCount++;
        // 答对的题目，认为用户认识这些词
        knownWords.push(...question.targetWords);
      }
    }

    const score = (correctCount / answers.length) * 100;
    const level = this.scoreToLevel(score);
    const vocabularySize = this.estimateVocabularySize(level, score);

    // 去重
    const uniqueKnownWords = [...new Set(knownWords)];

    return {
      level,
      score,
      vocabularySize,
      knownWords: uniqueKnownWords,
      recommendedFocus: this.getRecommendedFocus(level),
    };
  }

  /**
   * 分数转换为等级
   */
  private static scoreToLevel(score: number): ProficiencyLevel {
    if (score >= 95) return 'proficient';
    if (score >= 85) return 'advanced';
    if (score >= 70) return 'upper_intermediate';
    if (score >= 50) return 'intermediate';
    if (score >= 30) return 'elementary';
    return 'beginner';
  }

  /**
   * 估算词汇量
   */
  private static estimateVocabularySize(level: ProficiencyLevel, score: number): number {
    const range = VOCAB_SIZE_RANGES[level];
    // 在范围内根据分数微调
    const percentage = score / 100;
    return Math.floor(range.min + (range.max - range.min) * percentage);
  }

  /**
   * 获取推荐学习重点
   */
  private static getRecommendedFocus(level: ProficiencyLevel): string[] {
    const focusMap: Record<ProficiencyLevel, string[]> = {
      beginner: ['基础词汇', '简单语法', '日常对话'],
      elementary: ['核心词汇', '时态用法', '基础阅读'],
      intermediate: ['学术词汇', '复杂句型', '阅读技巧'],
      upper_intermediate: ['高级词汇', '写作技巧', '批判性阅读'],
      advanced: ['专业术语', '文学赏析', '学术写作'],
      proficient: ['精进表达', '文化理解', '专业领域'],
    };
    return focusMap[level];
  }

  /**
   * 保存用户能力评估结果
   */
  static async saveResult(result: ProficiencyResult): Promise<void> {
    await storage.set(PROFICIENCY_KEY, result);
    await storage.set(TEST_COMPLETED_KEY, true);
  }

  /**
   * 获取用户能力评估结果
   */
  static async getResult(): Promise<ProficiencyResult | null> {
    return await storage.get<ProficiencyResult>(PROFICIENCY_KEY);
  }

  /**
   * 检查用户是否已完成测试
   */
  static async isTestCompleted(): Promise<boolean> {
    return await storage.get<boolean>(TEST_COMPLETED_KEY) || false;
  }

  /**
   * 获取用户水平描述
   */
  static getLevelDescription(level: ProficiencyLevel): string {
    const descriptions: Record<ProficiencyLevel, string> = {
      beginner: '初学者 (A1)',
      elementary: '初级 (A2)',
      intermediate: '中级 (B1)',
      upper_intermediate: '中高级 (B2)',
      advanced: '高级 (C1)',
      proficient: '精通 (C2)',
    };
    return descriptions[level];
  }

  /**
   * 获取适合用户水平的提示词
   */
  static getLevelPrompt(level: ProficiencyLevel): string {
    const prompts: Record<ProficiencyLevel, string> = {
      beginner: 'The user is a beginner English learner (CEFR A1). Mark common everyday words as new, including basic verbs, nouns, and adjectives.',
      elementary: 'The user is at elementary level (CEFR A2). Mark words beyond the 1000 most common English words.',
      intermediate: 'The user is at intermediate level (CEFR B1). Mark words beyond the 2000 most common English words and basic academic vocabulary.',
      upper_intermediate: 'The user is at upper-intermediate level (CEFR B2). Mark advanced vocabulary, academic terms, and less common idioms.',
      advanced: 'The user is at advanced level (CEFR C1). Only mark rare, literary, technical, or highly specialized vocabulary.',
      proficient: 'The user is proficient in English (CEFR C2). Only mark extremely rare words, archaic terms, or highly domain-specific jargon.',
    };
    return prompts[level];
  }
}
