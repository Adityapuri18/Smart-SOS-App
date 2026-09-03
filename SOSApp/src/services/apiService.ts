import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPreferredBackendUrl } from './backendConfig';

const DEFAULT_TIMEOUT_MS = 5000;
const API_URL = getPreferredBackendUrl();

console.log(`[ApiService] Connecting to: ${API_URL}`);

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      timeout: DEFAULT_TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          console.warn('[ApiService] No auth token found for request:', config.url);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          AsyncStorage.removeItem('authToken');
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints - Direct JWT (no OTP)
  async register(phone: string, email: string, name: string, password: string) {
    try {
      const response = await this.api.post('/auth/register', {
        phone,
        email,
        name,
        password,
      });
      // Save token
      if (response.data?.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
      }
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get auth token for socket.io connection
  async getToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return token;
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  }

  async login(phoneOrEmail: string, password: string) {
    try {
      const loginData: any = { password };

      // Detect if input is phone or email
      if (phoneOrEmail.includes('@')) {
        loginData.email = phoneOrEmail;
      } else {
        loginData.phone = phoneOrEmail;
      }

      const response = await this.api.post('/auth/login', loginData);
      if (response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
      }
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async requestPasswordReset(phoneOrEmail: string) {
    try {
      const data: any = {};

      if (phoneOrEmail.includes('@')) {
        data.email = phoneOrEmail;
      } else {
        data.phone = phoneOrEmail;
      }

      const response = await this.api.post('/auth/password/request-reset', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const response = await this.api.post('/auth/password/reset', {
        token,
        password: newPassword,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async logout() {
    try {
      await AsyncStorage.removeItem('authToken');
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Contacts endpoints
  async getContacts() {
    try {
      const response = await this.api.get('/contacts');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async addContact(contactData: any) {
    try {
      const response = await this.api.post('/contacts', contactData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateContact(id: string, contactData: any) {
    try {
      const response = await this.api.put(`/contacts/${id}`, contactData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteContact(id: string) {
    try {
      const response = await this.api.delete(`/contacts/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Alerts endpoints
  async triggerAlert(latitude: number, longitude: number, message?: string) {
    try {
      const response = await this.api.post('/alerts/trigger', {
        latitude,
        longitude,
        message: message || 'SOS! Need help',
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateAlertLocation(alertId: string, latitude: number, longitude: number) {
    try {
      const response = await this.api.post(`/alerts/${alertId}/location`, {
        latitude,
        longitude,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async stopAlert(alertId: string) {
    try {
      const response = await this.api.post(`/alerts/${alertId}/stop`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getAlerts() {
    try {
      const response = await this.api.get('/alerts');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // User profile endpoints
  async getUserProfile() {
    try {
      const response = await this.api.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateUserProfile(profileData: any) {
    try {
      const response = await this.api.put('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }


  private handleError(error: any) {
    let message = 'An error occurred';
    let status = 0;
    let data = null;

    if (error?.response) {
      status = error.response.status;
      data = error.response.data;
      message = error.response.data?.error || error.response.data?.message || message;
    } else if (error?.code === 'ECONNABORTED') {
      message = 'Request timed out. Please check your connection and backend server.';
    } else if (error?.request) {
      const url = error.config?.url ? ` (${error.config.url})` : '';
      message = `No response from server${url}. Please check your connection and backend address.`;
    } else if (error?.message) {
      message = error.message;
    }

    const wrappedError = new Error(message) as Error & { status?: number; data?: any };
    wrappedError.status = status;
    wrappedError.data = data;
    throw wrappedError;
  }
}

export function getErrorMessage(error: any): string {
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return 'An error occurred';
}

export const apiService = new ApiService();
