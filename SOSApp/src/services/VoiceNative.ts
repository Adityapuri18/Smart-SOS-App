import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import type {
  SpeechEvents,
  SpeechRecognizedEvent,
  SpeechErrorEvent,
  SpeechResultsEvent,
  SpeechStartEvent,
  SpeechEndEvent,
  SpeechVolumeChangeEvent,
} from '@react-native-voice/voice';

const nativeModules = NativeModules as any;

function getNativeVoice() {
  return nativeModules.Voice || nativeModules.RCTVoice || nativeModules.RCTVoiceModule || nativeModules.VoiceModule;
}

function getVoiceEmitter(nativeVoice: any) {
  return new NativeEventEmitter(nativeVoice);
}

type SpeechEvent = keyof SpeechEvents;

class VoiceWrapper {
  private _listeners: any[] | null = null;
  private _emitter: NativeEventEmitter | null = null;
  private _events: Required<SpeechEvents>;

  constructor() {
    this._listeners = null;
    this._emitter = null;
    this._events = {
      onSpeechStart: () => {},
      onSpeechRecognized: () => {},
      onSpeechEnd: () => {},
      onSpeechError: () => {},
      onSpeechResults: () => {},
      onSpeechPartialResults: () => {},
      onSpeechVolumeChanged: () => {},
    };
  }

  private ensureNativeVoice() {
    const nativeVoice = getNativeVoice();
    if (!nativeVoice) {
      const available = Object.keys(nativeModules).filter(key => /voice/i.test(key)).join(', ') || 'none';
      console.warn('[VoiceNative] No native voice module found. Available native modules:', available);
      throw new Error('Native voice module is not available: expected NativeModules.Voice or NativeModules.RCTVoice');
    }
    return nativeVoice;
  }

  private ensureEmitter() {
    if (!this._emitter) {
      const nativeVoice = this.ensureNativeVoice();
      this._emitter = getVoiceEmitter(nativeVoice);
    }
    return this._emitter;
  }

  removeAllListeners() {
    if (this._listeners) {
      this._listeners.forEach(listener => listener.remove());
      this._listeners = null;
    }
    this._events = {
      onSpeechStart: () => {},
      onSpeechRecognized: () => {},
      onSpeechEnd: () => {},
      onSpeechError: () => {},
      onSpeechResults: () => {},
      onSpeechPartialResults: () => {},
      onSpeechVolumeChanged: () => {},
    };
  }

  destroy() {
    const nativeVoice = getNativeVoice();
    if (!nativeVoice) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve, reject) => {
      nativeVoice.destroySpeech((error: string) => {
        if (error) {
          reject(new Error(error));
        } else {
          this.removeAllListeners();
          resolve();
        }
      });
    });
  }

  start(locale: any, options = {}) {
    if (!this._listeners) {
      const emitter = this.ensureEmitter();
      this._listeners = (Object.keys(this._events) as SpeechEvent[]).map((key: SpeechEvent) =>
        emitter.addListener(key, this._events[key]),
      );
    }

    return new Promise<void>((resolve, reject) => {
      const nativeVoice = this.ensureNativeVoice();
      const callback = (error: string | null) => {
        if (error) {
          reject(new Error(error));
        } else {
          resolve();
        }
      };

      if (Platform.OS === 'android') {
        nativeVoice.startSpeech(
          locale,
          Object.assign(
            {
              EXTRA_LANGUAGE_MODEL: 'LANGUAGE_MODEL_FREE_FORM',
              EXTRA_MAX_RESULTS: 5,
              EXTRA_PARTIAL_RESULTS: true,
              REQUEST_PERMISSIONS_AUTO: true,
            },
            options,
          ),
          callback,
        );
      } else {
        nativeVoice.startSpeech(locale, callback);
      }
    });
  }

  stop() {
    const nativeVoice = getNativeVoice();
    if (!nativeVoice) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve, reject) => {
      nativeVoice.stopSpeech((error: string) => {
        if (error) {
          reject(new Error(error));
        } else {
          resolve();
        }
      });
    });
  }

  cancel() {
    const nativeVoice = getNativeVoice();
    if (!nativeVoice) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve, reject) => {
      nativeVoice.cancelSpeech((error: string) => {
        if (error) {
          reject(new Error(error));
        } else {
          resolve();
        }
      });
    });
  }

  isAvailable(): Promise<0 | 1> {
    return new Promise((resolve, reject) => {
      const nativeVoice = getNativeVoice();
      if (!nativeVoice) {
        reject(new Error('Native voice module is not available'));
        return;
      }
      nativeVoice.isSpeechAvailable((isAvailable: 0 | 1, error: string) => {
        if (error) {
          reject(new Error(error));
        } else {
          resolve(isAvailable);
        }
      });
    });
  }

  getSpeechRecognitionServices() {
    if (Platform.OS !== 'android') {
      throw new Error('Speech recognition services are only available on Android');
    }
    const nativeVoice = getNativeVoice();
    return nativeVoice.getSpeechRecognitionServices();
  }

  isRecognizing(): Promise<0 | 1> {
    return new Promise<0 | 1>((resolve) => {
      const nativeVoice = getNativeVoice();
      if (!nativeVoice) {
        resolve(0);
        return;
      }
      nativeVoice.isRecognizing((isRecognizing: 0 | 1) => resolve(isRecognizing));
    });
  }

  set onSpeechStart(fn: (e: SpeechStartEvent) => void) {
    this._events.onSpeechStart = fn;
  }
  set onSpeechRecognized(fn: (e: SpeechRecognizedEvent) => void) {
    this._events.onSpeechRecognized = fn;
  }
  set onSpeechEnd(fn: (e: SpeechEndEvent) => void) {
    this._events.onSpeechEnd = fn;
  }
  set onSpeechError(fn: (e: SpeechErrorEvent) => void) {
    this._events.onSpeechError = fn;
  }
  set onSpeechResults(fn: (e: SpeechResultsEvent) => void) {
    this._events.onSpeechResults = fn;
  }
  set onSpeechPartialResults(fn: (e: SpeechResultsEvent) => void) {
    this._events.onSpeechPartialResults = fn;
  }
  set onSpeechVolumeChanged(fn: (e: SpeechVolumeChangeEvent) => void) {
    this._events.onSpeechVolumeChanged = fn;
  }
}

export type { SpeechResultsEvent } from '@react-native-voice/voice';
export default new VoiceWrapper();
