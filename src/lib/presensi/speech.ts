/**
 * Web Speech Recognition Helper untuk Voice-to-Text LKH Presensi
 * Mendukung SpeechRecognition native dan webkitSpeechRecognition pada browser Chrome/Edge/Safari.
 */

// Declarations untuk global window speech recognition
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export interface VoiceRecognitionOptions {
  lang?: string; // default: "id-ID"
  onResult: (transcript: string) => void;
  onError?: (errorMsg: string) => void;
  onEnd?: () => void;
  onStart?: () => void;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export class VoiceLkhListener {
  private recognition: any = null;
  private isListening: boolean = false;

  constructor(private options: VoiceRecognitionOptions) {
    if (typeof window !== "undefined") {
      const SpeechConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechConstructor) {
        this.recognition = new SpeechConstructor();
        this.recognition.lang = options.lang || "id-ID";
        this.recognition.continuous = false;
        this.recognition.interimResults = true;

        this.recognition.onstart = () => {
          this.isListening = true;
          this.options.onStart?.();
        };

        this.recognition.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript.trim()) {
            this.options.onResult(currentTranscript.trim());
          }
        };

        this.recognition.onerror = (event: any) => {
          this.isListening = false;
          let msg = "Gagal merekam suara.";
          if (event.error === "not-allowed") {
            msg = "Izin mikrofon ditolak oleh browser.";
          } else if (event.error === "no-speech") {
            msg = "Tidak ada suara yang terdeteksi.";
          }
          this.options.onError?.(msg);
        };

        this.recognition.onend = () => {
          this.isListening = false;
          this.options.onEnd?.();
        };
      }
    }
  }

  public start(): boolean {
    if (!this.recognition) {
      this.options.onError?.("Browser Anda belum mendukung input suara (Web Speech API).");
      return false;
    }
    if (this.isListening) return true;

    try {
      this.recognition.start();
      return true;
    } catch (err) {
      console.warn("Speech recognition start error:", err);
      return false;
    }
  }

  public stop(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        console.warn("Speech recognition stop error:", err);
      }
    }
    this.isListening = false;
  }

  public get listening(): boolean {
    return this.isListening;
  }
}
