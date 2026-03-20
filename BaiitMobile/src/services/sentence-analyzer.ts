import { storage } from './storage';
import { AIConfig, AIMultiConfig, resolveAIConfig, FullAnalysisResult } from '../types';
import { analyzeSentenceFull } from '../utils/ai-adapter';
import type { MobileSentenceAnalysis } from '../types';

const AI_CONFIG_KEY = 'ai_config';

async function getAIConfig(): Promise<AIConfig | null> {
  const raw = await storage.get<AIMultiConfig | AIConfig>(AI_CONFIG_KEY);
  if (!raw) return null;
  return resolveAIConfig(raw as AIMultiConfig);
}

function mapToMobileAnalysis(result: FullAnalysisResult, sentenceId: string): MobileSentenceAnalysis {
  return {
    id: sentenceId,
    sentenceId: sentenceId,
    chunked: result.chunked,
    sentence_analysis: result.sentence_analysis,
    expression_tips: result.expression_tips,
    newWords: result.new_words,
    analyzedAt: new Date().toISOString(),
  };
}

export async function analyzeSentence(
  sentence: string
): Promise<MobileSentenceAnalysis | null> {
  try {
    const config = await getAIConfig();
    if (!config || !config.apiKey) {
      console.log('[SentenceAnalyzer] 未配置 AI API Key');
      return null;
    }

    const result = await analyzeSentenceFull(sentence, config);
    return mapToMobileAnalysis(result, sentence);
  } catch (error) {
    console.error('[SentenceAnalyzer] 分析失败:', error);
    return null;
  }
}

export function isAIConfigured(): Promise<boolean> {
  return getAIConfig().then(config => !!config?.apiKey);
}