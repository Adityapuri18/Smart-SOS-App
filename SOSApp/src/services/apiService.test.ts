jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

import { getErrorMessage } from './apiService';

describe('getErrorMessage', () => {
  it('returns the backend error message when present', () => {
    const message = getErrorMessage({ response: { data: { error: 'Backend rejected the request' } } });
    expect(message).toBe('Backend rejected the request');
  });

  it('falls back to the original message when no backend message exists', () => {
    const message = getErrorMessage({ message: 'Network unavailable' });
    expect(message).toBe('Network unavailable');
  });
});
