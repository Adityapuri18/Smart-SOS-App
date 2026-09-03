import { Platform } from 'react-native';

const DEFAULT_PROD_URL = 'http://10.176.206.139:5000';

export function getPreferredBackendUrl(isDev = __DEV__, platform = Platform.OS): string {
  if (isDev) {
    if (platform === 'android') {
      return DEFAULT_PROD_URL;
    }
    return 'http://127.0.0.1:5000';
  }

  return DEFAULT_PROD_URL;
}
