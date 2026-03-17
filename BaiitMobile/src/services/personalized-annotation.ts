/**
 * 个性化生词标注服务
 * 根据用户语言能力和语境，使用大模型智能标注生词
 */

import { LLMConfig } from '../types';
import { storage } from './storage';
import { ProficiencyTest, ProficiencyResult } from './proficiency-test';

const LLM_CONFIG_KEY = 'llm_config';

export interface AnnotationResult {
  word: string;
  definition: string;
  pos?: string;
  phonetic?: string;
  contextExplanation?: string;
  difficulty: number;
}

export interface PersonalizedAnnotationRequest {
  text: string;
  url?: string;
  title?: string;
}

export interface PersonalizedAnnotationResponse {
  annotations: AnnotationResult[];
  summary: string;
  difficulty: number;
}

/**
 * 构建个性化标注的 Prompt
 */
function buildAnnotationPrompt(
  text: string,
  userProficiency: ProficiencyResult,
  context?: { url?: string; title?: string }
): string {
  const levelPrompt = ProficiencyTest.getLevelPrompt(userProficiency.level);
  const knownWordsNote = userProficiency.knownWords.length > 0
    ? `The user already knows these words (do NOT mark them): ${userProficiency.knownWords.slice(0, 50).join(', ')}`
    : '';

  const contextNote = context?.title
    ? `Context: The user is reading "${context.title}"${context.url ? ` (${context.url})` : ''}.`
    : '';

  return `You are an intelligent English reading assistant that provides personalized vocabulary annotations.

## User Profile
${levelPrompt}
Estimated vocabulary size: ~${userProficiency.vocabularySize} words.
${knownWordsNote}

${contextNote}

## Task
## CRITICAL RULES - FOLLOW STRICTLY

1. **NEVER mark common words** (the, a, is, are, was, were, have, has, had, do, does, did, will, would, could, should, may, might, can, must, this, that, these, those, I, you, he, she, it, we, they, me, him, her, us, them, my, your, his, her, its, our, their, and, or, but, so, because, if, when, where, what, who, how, why, which, with, for, from, to, of, in, on, at, by, about, as, into, through, during, before, after, above, below, between, under, again, further, then, once, here, there, all, any, both, each, few, more, most, other, some, such, no, nor, not, only, own, same, so, than, too, very, just, now, also, back, still, well, even, new, good, first, last, long, great, little, own, old, right, big, high, different, small, large, next, early, young, important, few, public, bad, same, able)

2. **NEVER mark words shorter than 4 letters** unless they are truly difficult abbreviations or technical terms

3. **NEVER mark basic verbs** (go, come, take, make, get, see, know, think, say, tell, give, find, want, use, work, call, try, ask, need, feel, become, leave, put, mean, keep, let, begin, seem, help, show, hear, play, run, move, live, believe, bring, happen, stand, lose, pay, meet, include, continue, set, learn, change, lead, understand, watch, follow, stop, create, speak, read, allow, add, spend, grow, open, walk, offer, remember, love, consider, appear, buy, wait, serve, die, send, expect, build, stay, fall, cut, reach, kill, remain, suggest, raise, pass, sell, require, report, decide, pull)

4. **NEVER mark basic nouns** (time, way, year, work, government, day, man, world, life, part, number, child, system, case, group, company, problem, hand, place, end, week, point, part, question, thing, eye, woman, country, area, person, information, issue, side, kind, head, house, service, friend, father, power, hour, game, line, end, member, law, car, city, community, name, president, team, minute, idea, kid, body, information, back, parent, face, others, level, office, door, health, person, art, war, history, party, result, change, morning, reason, research, girl, guy, moment, air, teacher, force, education)

5. **ONLY mark words that are:**
   - Above the user's CEFR level
   - Domain-specific terminology
   - Academic or formal vocabulary
   - Idioms or phrasal verbs
   - Words with multiple meanings where context matters

## Task

Analyze the text and identify ONLY words that THIS SPECIFIC USER would genuinely find challenging.

For each word you mark:
1. Verify it's NOT in the common words list above
2. Consider the context - provide a definition that matches THIS specific usage
3. For polysemous words (words with multiple meanings), explain which meaning is used here
4. Provide the specific context-based Chinese translation, not just a generic dictionary definition

## Text to Analyze

${text}

## Output Format

Return a JSON object:

\`\`\`json
{
  "annotations": [
    {
      "word": "convoluted",
      "definition": "（情节、论据等）复杂难懂的，错综复杂的",
      "pos": "adj.",
      "phonetic": "/ˈkɒnvəluːtɪd/",
      "contextExplanation": "In this context, describes a narrative structure that is intentionally complex and difficult to follow, not the literal meaning of 'twisted'",
      "difficulty": 5
    }
  ],
  "summary": "Text contains 3 advanced vocabulary items suitable for this user's level",
  "difficulty": 4.2
}
\`\`\`

Requirements:
- ONLY include genuinely challenging words
- definition: MUST be context-appropriate Chinese translation
- contextExplanation: Explain the specific meaning in this context vs. other possible meanings
- difficulty: 1-6 scale based on CEFR level
- Return valid JSON only`;
}

/**
 * 调用 LLM API 进行个性化标注
 */
async function callLLMForAnnotation(
  prompt: string,
  config: LLMConfig
): Promise<PersonalizedAnnotationResponse> {
  // 使用 format 字段判断 API 类型，如果没有则根据 baseUrl 判断
  const isGemini = config.format === 'gemini' ||
    (!config.format && (!config.baseUrl || config.baseUrl.includes('google')));

  if (isGemini) {
    return callGeminiAPI(prompt, config);
  } else {
    return callOpenAIAPI(prompt, config);
  }
}

/**
 * 调用 Gemini API
 */
async function callGeminiAPI(
  prompt: string,
  config: LLMConfig
): Promise<PersonalizedAnnotationResponse> {
  const model = config.model || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Empty response from Gemini');
  }

  return parseAnnotationResponse(text);
}

/**
 * 调用 OpenAI 兼容 API
 */
async function callOpenAIAPI(
  prompt: string,
  config: LLMConfig
): Promise<PersonalizedAnnotationResponse> {
  const baseUrl = config.baseUrl.replace(/\/+$/, '');
  const url = `${baseUrl}/v1/chat/completions`;

  const body = {
    model: config.model,
    messages: [
      { role: 'system', content: 'You are a helpful English reading assistant. Always respond with valid JSON.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('Empty response from OpenAI');
  }

  return parseAnnotationResponse(text);
}

/**
 * 解析 LLM 返回的标注结果
 */
function parseAnnotationResponse(text: string): PersonalizedAnnotationResponse {
  // 去除可能的 markdown fence
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(cleaned);

    // 处理可能的外层包装
    if (parsed.annotations && Array.isArray(parsed.annotations)) {
      return {
        annotations: parsed.annotations.map((a: any) => ({
          word: a.word || '',
          definition: a.definition || '',
          pos: a.pos || '',
          phonetic: a.phonetic || '',
          contextExplanation: a.contextExplanation || '',
          difficulty: a.difficulty || 3,
        })),
        summary: parsed.summary || '',
        difficulty: parsed.difficulty || 3,
      };
    }

    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Failed to parse annotation response:', error);
    return { annotations: [], summary: '', difficulty: 3 };
  }
}

/**
 * 个性化标注服务
 */
export class PersonalizedAnnotationService {
  /**
   * 获取 LLM 配置
   */
  private static async getLLMConfig(): Promise<LLMConfig | null> {
    return await storage.get<LLMConfig>(LLM_CONFIG_KEY);
  }

  /**
   * 检查是否可以进行个性化标注
   */
  static async canAnnotate(): Promise<{ can: boolean; reason?: string }> {
    const config = await this.getLLMConfig();
    if (!config || !config.apiKey) {
      return { can: false, reason: '请先配置 LLM API' };
    }

    const proficiency = await ProficiencyTest.getResult();
    if (!proficiency) {
      return { can: false, reason: '请先完成语言能力测试' };
    }

    return { can: true };
  }

  /**
   * 执行个性化标注
   */
  static async annotate(
    request: PersonalizedAnnotationRequest
  ): Promise<PersonalizedAnnotationResponse> {
    const { can, reason } = await this.canAnnotate();
    if (!can) {
      throw new Error(reason);
    }

    const config = await this.getLLMConfig();
    const proficiency = await ProficiencyTest.getResult();

    if (!config || !proficiency) {
      throw new Error('Configuration not found');
    }

    // 如果文本太长，分段处理
    const maxLength = 3000;
    if (request.text.length > maxLength) {
      return this.annotateLongText(request, config, proficiency, maxLength);
    }

    const prompt = buildAnnotationPrompt(request.text, proficiency, {
      url: request.url,
      title: request.title,
    });

    return await callLLMForAnnotation(prompt, config);
  }

  /**
   * 处理长文本（分段标注）
   */
  private static async annotateLongText(
    request: PersonalizedAnnotationRequest,
    config: LLMConfig,
    proficiency: ProficiencyResult,
    maxLength: number
  ): Promise<PersonalizedAnnotationResponse> {
    // 按句子分割
    const sentences = request.text.match(/[^.!?]+[.!?]+/g) || [request.text];

    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxLength) {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    if (currentChunk) chunks.push(currentChunk);

    // 并行处理所有段落
    const results = await Promise.all(
      chunks.map(chunk => {
        const prompt = buildAnnotationPrompt(chunk, proficiency, {
          url: request.url,
          title: request.title,
        });
        return callLLMForAnnotation(prompt, config);
      })
    );

    // 合并结果
    const allAnnotations: AnnotationResult[] = [];
    const seenWords = new Set<string>();

    for (const result of results) {
      for (const annotation of result.annotations) {
        if (!seenWords.has(annotation.word.toLowerCase())) {
          seenWords.add(annotation.word.toLowerCase());
          allAnnotations.push(annotation);
        }
      }
    }

    // 按难度排序
    allAnnotations.sort((a, b) => b.difficulty - a.difficulty);

    return {
      annotations: allAnnotations,
      summary: `Found ${allAnnotations.length} challenging words in this article`,
      difficulty: results.reduce((sum, r) => sum + r.difficulty, 0) / results.length,
    };
  }

  /**
   * 快速标注（使用本地词典，无需 LLM）
   * 用于离线场景或快速预览
   */
  static async annotateOffline(text: string): Promise<AnnotationResult[]> {
    const proficiency = await ProficiencyTest.getResult();
    const vocabLevel = proficiency?.level || 'intermediate';

    // 简单的基于词频的标注
    const words = text.match(/\b[a-zA-Z]+\b/g) || [];
    const uniqueWords = [...new Set(words.map(w => w.toLowerCase()))];

    // 根据用户水平过滤
    const thresholdMap: Record<string, number> = {
      beginner: 1000,
      elementary: 2000,
      intermediate: 4000,
      upper_intermediate: 6000,
      advanced: 8000,
      proficient: 15000,
    };

    const threshold = thresholdMap[vocabLevel] || 4000;

    // 这里应该调用本地词典服务
    // 暂时返回空数组，实际实现需要集成本地词典
    return [];
  }
}
