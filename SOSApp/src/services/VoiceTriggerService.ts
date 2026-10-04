import Voice, { SpeechResultsEvent } from './VoiceNative';
import BackgroundActions from 'react-native-background-actions';
import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform, Linking, NativeModules } from 'react-native';
import { apiService } from './apiService';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

type TriggerCallback = () => void;

// ------------------------------------------------------------------
// Internal state
// ------------------------------------------------------------------

let helpCount = 0;
let sessionHelpCount = 0;
let resetTimer: ReturnType<typeof setTimeout> | null = null;
let triggerCooldownTimer: ReturnType<typeof setTimeout> | null = null;
let onTriggered: TriggerCallback | null = null;
let isRunning = false;
let triggerCooldownActive = false;

const TRIGGER_COOLDOWN_MS = 10000;

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function resetCount() {
  helpCount = 0;
  sessionHelpCount = 0;
  if (resetTimer) {
    clearTimeout(resetTimer);
    resetTimer = null;
  }
}

function clearTriggerCooldown() {
  if (triggerCooldownTimer) {
    clearTimeout(triggerCooldownTimer);
    triggerCooldownTimer = null;
  }
  triggerCooldownActive = false;
}

function scheduleReset() {
  if (resetTimer) clearTimeout(resetTimer);
  resetTimer = setTimeout(resetCount, 10000); // reset after 10 s of silence
}

function getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  });
}

async function fireSOS() {
  if (triggerCooldownActive) {
    console.log('[VoiceTrigger] Trigger ignored because cooldown is active');
    return;
  }

  triggerCooldownActive = true;
  if (triggerCooldownTimer) clearTimeout(triggerCooldownTimer);
  triggerCooldownTimer = setTimeout(() => {
    triggerCooldownActive = false;
    triggerCooldownTimer = null;
    console.log('[VoiceTrigger] Trigger cooldown ended');
    if (isRunning) {
      Voice.start('en-US', VOICE_RECOGNITION_OPTIONS).catch((err) => {
        console.warn('[VoiceTrigger] Restart after cooldown failed:', err);
      });
    }
  }, TRIGGER_COOLDOWN_MS);

  console.log('[VoiceTrigger] "Help" heard 3 times — firing SOS!');
  
  // Reset count immediately to prevent double firing
  resetCount();

  try {
    if (Voice) {
      await Voice.stop().catch(() => undefined);
      await Voice.destroy().catch(() => undefined);
    }
  } catch {
    // ignore cleanup errors
  }

  try {
    // Bring app to foreground
    console.log('[VoiceTrigger] Attempting to open app via deep link...');
    const canOpen = await Linking.canOpenURL('sosapp://home');
    console.log(`[VoiceTrigger] Can open deep link: ${canOpen}`);
    
    Linking.openURL('sosapp://home').catch(err => {
      console.warn('[VoiceTrigger] Failed to open app via Linking:', err);
    });

    console.log('[VoiceTrigger] Fetching location...');
    const location = await getCurrentLocation().catch((err: any) => {
      console.warn('[VoiceTrigger] Location fetch failed:', err?.message || err);
      return null;
    });

    const latitude = location?.latitude ?? 0;
    const longitude = location?.longitude ?? 0;
    const locationMessage = location
      ? `Location: https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=18/${latitude}/${longitude}`
      : 'Location unavailable. Please check the app for details.';
    const message = `SOS! Emergency voice alert activated. ${locationMessage}`;

    console.log(`[VoiceTrigger] Sending SOS to backend: ${message}`);
    const res = await apiService.triggerAlert(latitude, longitude, message);
    console.log(`[VoiceTrigger] SOS sent successfully! Response:`, JSON.stringify(res));
  } catch (err: any) {
    console.error('[VoiceTrigger] Failed to send SOS alert:', err?.message || err);
  }

  // Notify UI to navigate to SOSAlert screen
  if (onTriggered) onTriggered();
}

// ------------------------------------------------------------------
// Voice recognition loop
// ------------------------------------------------------------------

function onSpeechPartialResults(e: SpeechResultsEvent) {
  const results = e.value || [];
  if (results.length === 0) return;

  const transcript = results[0] || '';
  const currentHelpCount = countHelpWords(transcript);
  sessionHelpCount = currentHelpCount;

  console.log('[VoiceTrigger] Partial transcript:', transcript);
  console.log('[VoiceTrigger] Partial help count:', currentHelpCount);

  if (helpCount + sessionHelpCount >= 3) {
    console.log('[VoiceTrigger] Partial transcript already reached threshold. Firing.');
    fireSOS();
    helpCount = 0;
    sessionHelpCount = 0;
  }
}

export function countHelpWords(transcript: string) {
  const normalized = transcript.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  return (normalized.match(/\bhelp\b/g) || []).length;
}

function onSpeechResults(e: SpeechResultsEvent) {
  const results = e.value || [];
  if (results.length === 0) return;

  const transcript = results[0] || '';
  console.log('[VoiceTrigger] Session Transcript:', transcript);

  const currentHelpCount = countHelpWords(transcript);
  sessionHelpCount = currentHelpCount;

  const totalHelp = helpCount + sessionHelpCount;
  console.log(`[VoiceTrigger] Help count: ${totalHelp} (Global: ${helpCount}, Session: ${sessionHelpCount})`);

  if (totalHelp >= 3) {
    console.log('[VoiceTrigger] Threshold reached (3). Firing!');
    fireSOS();
    helpCount = 0;
    sessionHelpCount = 0;
  } else {
    scheduleReset();
  }
}

// export function buildVoiceRecognitionOptions() {
//   return {
//     EXTRA_LANGUAGE_MODEL: 'LANGUAGE_MODEL_FREE_FORM',
//     EXTRA_MAX_RESULTS: 5,
//     EXTRA_PARTIAL_RESULTS: true,
//     EXTRA_INCOGNITO: true,
//     EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 10000,
//     EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 10000,
//     EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 10000,
//     REQUEST_PERMISSIONS_AUTO: true,
//     RECOGNIZER_ENGINE: 'GOOGLE',
//     RECOGNIZER_ACTION: 'VOICE_SEARCH_HANDS_FREE',
//     EXTRA_PREFER_OFFLINE: false,
//   };
// }
export function buildVoiceRecognitionOptions() {
  return {
    EXTRA_LANGUAGE_MODEL: 'LANGUAGE_MODEL_FREE_FORM',
    EXTRA_MAX_RESULTS: 5,
    EXTRA_PARTIAL_RESULTS: true,
    REQUEST_PERMISSIONS_AUTO: true,
  };
}

const VOICE_RECOGNITION_OPTIONS = buildVoiceRecognitionOptions();

function onSpeechEnd() {
  if (!isRunning) return;
  
  // Add this session's count to the global count
  helpCount += sessionHelpCount;
  sessionHelpCount = 0;
  
  console.log(`[VoiceTrigger] Session ended. Global help count: ${helpCount}`);

  if (triggerCooldownActive) {
    console.log('[VoiceTrigger] Skipping immediate restart because trigger cooldown is active');
    return;
  }

  // Restart listening in a loop; delay longer to avoid rapid repeated recognizer restarts
  setTimeout(() => {
    if (isRunning && !triggerCooldownActive) {
      Voice.start('en-US', VOICE_RECOGNITION_OPTIONS).catch((err) =>
        console.warn('[VoiceTrigger] Restart error:', err)
      );
    }
  }, 1000);
}

// ------------------------------------------------------------------
// Background task definition (for Android foreground service)
// ------------------------------------------------------------------

const backgroundOptions = {
  taskName: 'SOSVoiceGuard',
  taskTitle: '🛡️ SOS Guard Active',
  taskDesc: 'Listening for "Help Help Help"…',
  taskIcon: { name: 'ic_launcher', type: 'mipmap' },
  color: '#E8323A',
  linkingURI: 'sosapp://home',
  parameters: { delay: 1000 },
};

const backgroundTask = async (_taskData: any) => {
  // Keep the foreground service alive; actual listening is started via Voice elsewhere
  await new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      if (!isRunning) {
        clearInterval(interval);
        resolve();
      }
    }, 5000);
  });
};

// ------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------

export async function startVoiceTrigger(onTrigger: TriggerCallback): Promise<boolean> {
  console.log('[VoiceTrigger] === START INITIALIZATION ===');
  
  if (isRunning) {
    console.log('[VoiceTrigger] Already running, returning true');
    return true;
  }

  onTriggered = onTrigger;
  helpCount = 0;

  console.log('[VoiceTrigger] Platform:', Platform.OS, 'Version:', Platform.Version);

  // Request necessary permissions on Android
  if (Platform.OS === 'android') {
    const permissions = [
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ];

    // On Android 13+ (API 33+), we also need notification permission
    if (Platform.Version >= 33) {
      permissions.push('android.permission.POST_NOTIFICATIONS' as any);
    }

    console.log('[VoiceTrigger] Requesting Android permissions:', permissions);
    const granted = await PermissionsAndroid.requestMultiple(permissions);
    console.log('[VoiceTrigger] Permission response:', JSON.stringify(granted));

    const recordAudioGranted = granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
    const locationGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
    
    console.log('[VoiceTrigger] RECORD_AUDIO granted?', recordAudioGranted);
    console.log('[VoiceTrigger] ACCESS_FINE_LOCATION granted?', locationGranted);

    if (!recordAudioGranted || !locationGranted) {
      console.error('[VoiceTrigger] FATAL: Required permissions denied! Cannot continue.');
      isRunning = false;
      return false;
    }
    console.log('[VoiceTrigger] All permissions granted ✓');
  }

  console.log('[VoiceTrigger] Checking if Voice module exists...');
  if (!Voice) {
    console.error('[VoiceTrigger] FATAL: Voice module is null!');
    isRunning = false;
    return false;
  }
  
  if (typeof Voice.start !== 'function') {
    console.error('[VoiceTrigger] FATAL: Voice.start is not a function!');
    isRunning = false;
    return false;
  }
  console.log('[VoiceTrigger] Voice module is valid ✓');

  console.log('[VoiceTrigger] Setting up speech event handlers...');
  Voice.onSpeechPartialResults = onSpeechPartialResults;
  Voice.onSpeechResults = onSpeechResults;
  Voice.onSpeechEnd = onSpeechEnd;
  Voice.onSpeechStart = () => {
    console.log('[VoiceTrigger] *** SPEECH STARTED ***');
  };
  // Voice.onSpeechError = (e: any) => {
  //   console.error('[VoiceTrigger] *** SPEECH ERROR ***:', JSON.stringify(e));
  //   if (!isRunning) return;
  // };
  Voice.onSpeechError = (e: any) => {
  if (!isRunning) return;
  console.error('[VoiceTrigger] *** SPEECH ERROR ***:', JSON.stringify(e));

    if (triggerCooldownActive) {
      console.log('[VoiceTrigger] Skipping restart due to trigger cooldown');
      return;
    }

    // Auto-restart after errors, but wait a bit to avoid repeated recognizer beeps.
    console.log('[VoiceTrigger] Auto-restarting after error...');
    setTimeout(() => {
      if (isRunning && !triggerCooldownActive && Voice) {
        Voice.start('en-US', VOICE_RECOGNITION_OPTIONS).catch((err) => {
          console.error('[VoiceTrigger] Restart failed:', err);
        });
      }
    }, 1500);
  };
  console.log('[VoiceTrigger] Event handlers set ✓');

  isRunning = true;
  console.log('[VoiceTrigger] isRunning = true');

  // Start the Android foreground service (keeps mic active when screen is off)
  if (Platform.OS === 'android') {
    try {
      console.log('[VoiceTrigger] Starting BackgroundActions...');
      await BackgroundActions.start(backgroundTask, backgroundOptions);
      console.log('[VoiceTrigger] Background service started ✓');
    } catch (err: any) {
      console.warn('[VoiceTrigger] Background service failed (non-fatal):', err?.message || err);
    }
  }

  // Check if native module exists
  if (NativeModules.Voice) {
    console.log('[VoiceTrigger] NativeModules.Voice found ✓');
  } else if ((NativeModules as any).RCTVoice) {
    console.log('[VoiceTrigger] NativeModules.RCTVoice found ✓ (using without aliasing)');
  } else {
    console.warn('[VoiceTrigger] Native voice module is not available on NativeModules');
  }

  // Begin first recognition session — independent of foreground service success
  console.log('[VoiceTrigger] Calling Voice.start("en-US")...');
  try {
    await Voice.start('en-US', VOICE_RECOGNITION_OPTIONS);
    console.log('[VoiceTrigger] *** VOICE LISTENING STARTED ✓ ***');
    console.log('[VoiceTrigger] === INITIALIZATION COMPLETE ===');
    return true;
  } catch (err: any) {
    console.error('[VoiceTrigger] FATAL: Voice.start() failed:', err?.message || err);
    isRunning = false;
    return false;
  }
}

export async function stopVoiceTrigger(): Promise<void> {
  isRunning = false;
  onTriggered = null;
  resetCount();

  try {
    if (Voice) {
      await Voice.stop();
      await Voice.destroy();
    }
  } catch { }

  clearTriggerCooldown();

  Voice.onSpeechPartialResults = undefined as any;
  Voice.onSpeechResults = undefined as any;
  Voice.onSpeechEnd = undefined as any;
  Voice.onSpeechError = undefined as any;

  if (Platform.OS === 'android') {
    try {
      await BackgroundActions.stop();
    } catch { }
  }

  console.log('[VoiceTrigger] Stopped.');
}
