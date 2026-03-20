import * as Crypto from 'expo-crypto';

export async function generateId(prefix: string = ''): Promise<string> {
  const uuid = await Crypto.randomUUID();
  return prefix ? `${prefix}${uuid}` : uuid;
}

export async function generateVocabId(word: string): Promise<string> {
  return generateId(`vocab-${word}-`);
}

export async function generateSentenceId(): Promise<string> {
  return generateId('sent-');
}

export async function generateContextId(): Promise<string> {
  return generateId('ctx-');
}

export async function generateResultId(): Promise<string> {
  return generateId('result-');
}
