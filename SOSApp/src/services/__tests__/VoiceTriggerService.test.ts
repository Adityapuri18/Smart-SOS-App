jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-voice/voice', () => ({
  start: jest.fn(() => Promise.resolve()),
  destroy: jest.fn(() => Promise.resolve()),
  stop: jest.fn(() => Promise.resolve()),
  onSpeechPartialResults: undefined,
  onSpeechResults: undefined,
  onSpeechEnd: undefined,
  onSpeechError: undefined,
}));

jest.mock('react-native-background-actions', () => ({
  start: jest.fn(() => Promise.resolve()),
  stop: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: jest.fn(),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'android', Version: 33 },
  PermissionsAndroid: {
    PERMISSIONS: { RECORD_AUDIO: 'RECORD_AUDIO', ACCESS_FINE_LOCATION: 'ACCESS_FINE_LOCATION' },
    RESULTS: { GRANTED: 'granted' },
    requestMultiple: jest.fn(() => Promise.resolve({ RECORD_AUDIO: 'granted', ACCESS_FINE_LOCATION: 'granted' })),
  },
  Linking: { canOpenURL: jest.fn(() => Promise.resolve(false)), openURL: jest.fn(() => Promise.resolve()) },
  NativeModules: { VoiceModule: {} },
}));

import { buildVoiceRecognitionOptions, countHelpWords } from '../VoiceTriggerService';

describe('VoiceTriggerService', () => {
  describe('countHelpWords', () => {
    it('counts three repeated help phrases from a transcript', () => {
      expect(countHelpWords('help help help')).toBe(3);
      expect(countHelpWords('Please help me, help me, help now')).toBe(3);
      expect(countHelpWords('I need assistance')).toBe(0);
      expect(countHelpWords('Help! HELP! help?')).toBe(3);
      expect(countHelpWords('helpful help')).toBe(1);
    });
  });

  describe('buildVoiceRecognitionOptions', () => {
    it('builds silent background voice recognition options', () => {
      expect(buildVoiceRecognitionOptions()).toMatchObject({
        EXTRA_LANGUAGE_MODEL: 'LANGUAGE_MODEL_FREE_FORM',
        EXTRA_MAX_RESULTS: 5,
        EXTRA_PARTIAL_RESULTS: true,
        EXTRA_INCOGNITO: true,
        REQUEST_PERMISSIONS_AUTO: true,
      });
    });
  });
});
