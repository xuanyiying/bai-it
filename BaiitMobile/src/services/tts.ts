import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

class TextToSpeechService {
  private isSpeaking: boolean = false;

  async speak(word: string): Promise<void> {
    if (this.isSpeaking) {
      await this.stop();
    }

    try {
      this.isSpeaking = true;
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      await Speech.speak(word, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => {
          this.isSpeaking = false;
        },
        onError: () => {
          this.isSpeaking = false;
        },
        onStopped: () => {
          this.isSpeaking = false;
        },
      });
    } catch (error) {
      this.isSpeaking = false;
      console.error('[TTS] speak error:', error);
    }
  }

  async stop(): Promise<void> {
    try {
      await Speech.stop();
      this.isSpeaking = false;
    } catch (error) {
      console.error('[TTS] stop error:', error);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      return voices.length > 0;
    } catch {
      return false;
    }
  }
}

export const TTS = new TextToSpeechService();