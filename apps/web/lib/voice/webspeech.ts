export type VoiceState = 'idle' | 'requesting' | 'listening' | 'stopping';

export interface VoiceResult {
  text: string;
  isFinal: boolean;
}

export interface VoiceError {
  code: string;
  message: string;
}

export function isSpeechSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

export function getSpeechRecognition(): any {
  if (typeof window === 'undefined') return null;
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) return null;
  return new SpeechRecognition();
}

export function createRecognizer(lang = 'es-ES'): any {
  const recognition = getSpeechRecognition();
  if (!recognition) return null;
  recognition.lang = lang;
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  return recognition;
}
