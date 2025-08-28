import axios from 'axios';

// Konfiguracja podstawowa
const API_BASE_URL = 'http://localhost:8000';

// Utworzenie instancji Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flaga zapobiegająca wielokrotnym próbom odświeżenia tokenu
let isRefreshing = false;
let failedQueue = [];

// Funkcja do przetwarzania kolejki oczekujących requestów
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Interceptor dla dodawania tokenu do każdego zapytania
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor dla obsługi odpowiedzi i błędów
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Jeśli błąd 401 i nie próbowaliśmy jeszcze odświeżyć tokenu
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // Jeśli już trwa proces odświeżania, dodaj request do kolejki
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        try {
          console.log('🔄 Attempting to refresh token...');
        
          // Próba odświeżenia tokenu wysyłamy refresh token w body nie header
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refresh_token: refreshToken
          });

          const { access_token, refresh_token: newRefreshToken } = response.data;
          
          // Zapisz nowe tokeny
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', newRefreshToken);
          
          console.log('✅ Token refreshed successfully');
          
          // Zaktualizuj header autoryzacji
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          
          // Przetwórz kolejkę oczekujących requestów
          processQueue(null, access_token);
          
          isRefreshing = false;
          
          // Ponów oryginalny request
          return api(originalRequest);
          
        } catch (refreshError) {
          console.log('❌ Token refresh failed:', refreshError);
          
          // Przetwórz kolejkę z błędem
          processQueue(refreshError, null);
          isRefreshing = false;
          
          // Wyczyść tokeny i przekieruj do logowania
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          
          // Przekieruj do strony logowania
          window.location.href = '/login';
          
          return Promise.reject(refreshError);
        }
      } else {
        // Brak refresh tokenu - wyloguj użytkownika
        isRefreshing = false;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    // Zwróć błąd z lepszym formatowaniem
    const errorMessage = error.response?.data?.detail || 
                        error.response?.data?.message || 
                        error.message || 
                        'Wystąpił nieoczekiwany błąd';
    
    return Promise.reject({
      ...error,
      message: errorMessage,
      status: error.response?.status
    });
  }
);

// API Methods dla Auth
export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  googleLogin: (token) => api.post('/api/auth/google', { token }),
  refreshToken: (refreshToken) => api.post('/api/auth/refresh', { refresh_token: refreshToken }),
  getMe: () => api.get('/api/auth/me'),
  logout: (refreshToken) => api.post('/api/auth/logout', { refresh_token: refreshToken }),
};

// API Methods dla Equipment
export const equipmentAPI = {
  getAll: (params = {}) => api.get('/api/equipment', { params }),
  getById: (id) => api.get(`/api/equipment/${id}`),
  create: (data) => api.post('/api/equipment', data),
  update: (id, data) => api.put(`/api/equipment/${id}`, data),
  delete: (id) => api.delete(`/api/equipment/${id}`),
};

// API Methods dla Rentals
export const rentalsAPI = {
  getAll: (params = {}) => api.get('/api/rentals', { params }),
  create: (data) => api.post('/api/rentals', data),
  getById: (id) => api.get(`/api/rentals/${id}`),
  checkAvailability: (params) => api.get('/api/rentals/check-availability', { params }),
  getPricingPreview: (params) => api.get('/api/rentals/pricing-preview', { params }),
};

// API Methods dla Payments
export const paymentsAPI = {
  getAll: (params = {}) => api.get('/api/payments', { params }),
  approveOffline: (data) => api.post('/api/payments/offline-approve', data),
  createStripeIntent: (data) => api.post('/api/payments/stripe/create-payment-intent', data),
  confirmStripe: (paymentIntentId) => api.post(`/api/payments/stripe/confirm/${paymentIntentId}`),
  getStripeConfig: () => api.get('/api/payments/stripe/config'),
};

// API Methods dla Admin
export const adminAPI = {
  getUsers: (params = {}) => api.get('/api/admin/users', { params }),
  updateUser: (id, data) => api.put(`/api/admin/users/${id}`, data),
  getRentals: (params = {}) => api.get('/api/admin/rentals', { params }),
  blockUser: (userId) => api.put(`/api/admin/users/${userId}/block`),
  unblockUser: (userId) => api.put(`/api/admin/users/${userId}/unblock`),
  getDashboard: () => api.get('/api/admin/dashboard'),
  getPendingPayments: (params = {}) => api.get('/api/admin/payments/pending', { params }),
  getPendingRentals: (params = {}) => api.get('/api/admin/rentals/pending', { params }),
  getRevenueReport: (params = {}) => api.get('/api/admin/reports/revenue', { params }),
  getAllPayments: (params = {}) => api.get('/api/payments/admin/all', { params }),
  cancelPayment: (paymentId) => api.post(`/api/payments/${paymentId}/cancel`),
  createOfflinePayment: (data) => api.post('/api/payments/create-offline', data),
};

// Export domyślny instancji Axios (dla custom calls)
export default api;