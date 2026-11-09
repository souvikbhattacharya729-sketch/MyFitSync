/**
 * MyFitSync Unified API Service Client
 * Handles token attachment, request configuration, error normalization, and 401 auto-logout.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('myfitsync_token') || sessionStorage.getItem('myfitsync_token') || null;
    this.logoutCallback = null;
  }

  setLogoutCallback(cb) {
    this.logoutCallback = cb;
  }

  setToken(token, persistMode = 'local') {
    this.token = token;
    if (token) {
      if (persistMode === 'local') {
        localStorage.setItem('myfitsync_token', token);
      } else {
        sessionStorage.setItem('myfitsync_token', token);
      }
    } else {
      localStorage.removeItem('myfitsync_token');
      sessionStorage.removeItem('myfitsync_token');
    }
  }

  getToken() {
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('myfitsync_token');
    sessionStorage.removeItem('myfitsync_token');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 204) {
        return null;
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
          if (this.logoutCallback) {
            this.logoutCallback();
          }
        }
        const errorMsg = data?.error?.message || data?.detail || `Request failed with status ${response.status}`;
        const error = new Error(errorMsg);
        error.status = response.status;
        error.code = data?.error?.code || 'request_error';
        error.details = data?.error?.details || [];
        throw error;
      }

      return data;
    } catch (err) {
      if (!err.status) {
        // Network or fetch failure
        const netErr = new Error('Network connection failed. Please check your internet connection or server status.');
        netErr.status = 0;
        netErr.code = 'network_error';
        throw netErr;
      }
      throw err;
    }
  }

  // --- Auth Endpoints ---
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials, persistMode = 'local') {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (data.access_token) {
      this.setToken(data.access_token, persistMode);
    }
    return data;
  }

  async getMe() {
    return this.request('/auth/me', { method: 'GET' });
  }

  async updateMe(profileData) {
    return this.request('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
  }

  // --- Chat Assistant Endpoint ---
  async sendChatMessage(message, timezone, idempotencyKey) {
    const headers = {};
    if (idempotencyKey) {
      headers['X-Idempotency-Key'] = idempotencyKey;
    }
    return this.request('/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, timezone }),
    });
  }

  // --- Dashboard Endpoint ---
  async getDashboard(fromDate, toDate) {
    const params = new URLSearchParams();
    if (fromDate) params.append('from', fromDate);
    if (toDate) params.append('to', toDate);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/dashboard${qs}`, { method: 'GET' });
  }

  // --- Workouts Endpoints ---
  async getWorkouts(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/workouts${qs ? `?${qs}` : ''}`, { method: 'GET' });
  }

  async getWorkout(id) {
    return this.request(`/workouts/${id}`, { method: 'GET' });
  }

  async createWorkout(workoutData) {
    return this.request('/workouts', {
      method: 'POST',
      body: JSON.stringify(workoutData),
    });
  }

  async updateWorkout(id, workoutData) {
    return this.request(`/workouts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(workoutData),
    });
  }

  async deleteWorkout(id) {
    return this.request(`/workouts/${id}`, { method: 'DELETE' });
  }

  // --- Nutrition Endpoints ---
  async getNutrition(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/nutrition${qs ? `?${qs}` : ''}`, { method: 'GET' });
  }

  async getNutritionTotals(date) {
    const qs = date ? `?date=${date}` : '';
    return this.request(`/nutrition/daily-totals${qs}`, { method: 'GET' });
  }

  async createNutrition(nutritionData) {
    return this.request('/nutrition', {
      method: 'POST',
      body: JSON.stringify(nutritionData),
    });
  }

  async updateNutrition(id, nutritionData) {
    return this.request(`/nutrition/${id}`, {
      method: 'PUT',
      body: JSON.stringify(nutritionData),
    });
  }

  async deleteNutrition(id) {
    return this.request(`/nutrition/${id}`, { method: 'DELETE' });
  }

  // --- Readiness Endpoints ---
  async getReadiness(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/readiness${qs ? `?${qs}` : ''}`, { method: 'GET' });
  }

  async createOrUpdateReadiness(readinessData) {
    return this.request('/readiness', {
      method: 'POST',
      body: JSON.stringify(readinessData),
    });
  }

  async updateReadiness(id, readinessData) {
    return this.request(`/readiness/${id}`, {
      method: 'PUT',
      body: JSON.stringify(readinessData),
    });
  }

  async deleteReadiness(id) {
    return this.request(`/readiness/${id}`, { method: 'DELETE' });
  }

  // --- Analytics Endpoints ---
  async getACWR(date) {
    const qs = date ? `?date=${date}` : '';
    return this.request(`/analytics/acwr${qs}`, { method: 'GET' });
  }

  async getStrength(exercise) {
    const qs = exercise ? `?exercise=${exercise}` : '';
    return this.request(`/analytics/strength${qs}`, { method: 'GET' });
  }

  async getVolume(groupBy = 'daily') {
    return this.request(`/analytics/volume?group_by=${groupBy}`, { method: 'GET' });
  }
}

export const api = new ApiClient();
