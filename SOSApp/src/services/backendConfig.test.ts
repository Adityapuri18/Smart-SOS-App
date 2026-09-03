import { getPreferredBackendUrl } from './backendConfig';

describe('getPreferredBackendUrl', () => {
  it('uses the hosted backend for physical Android devices in development', () => {
    expect(getPreferredBackendUrl(true, 'android')).toBe('http://10.176.206.139:5000');
  });

  it('uses the local loopback URL for iOS development', () => {
    expect(getPreferredBackendUrl(true, 'ios')).toBe('http://127.0.0.1:5000');
  });
});
