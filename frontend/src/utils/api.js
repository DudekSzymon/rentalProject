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

// interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Jeśli błąd 401 i nie próbowaliśmy jeszcze odświeżyć tokenu
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        try {
          console.log(' Attempting to refresh token...');
        
          // Próba odświeżenia tokenu
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refresh_token: refreshToken });

          const { access_token, refresh_token: newRefreshToken } = response.data;
          
          // Zapisz nowe tokeny
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', newRefreshToken);
          
          console.log(' Token refreshed successfully');
          
          // Zaktualizuj header autoryzacji
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          
          // Ponów oryginalny request
          return api(originalRequest);
          
        } catch (refreshError) {
          console.log(' Token refresh failed:', refreshError);
          
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
};

// API Methods dla Rentals
export const rentalsAPI = {
  getAll: (params = {}) => api.get('/api/rentals', { params }),
  create: (data) => api.post('/api/rentals', data),
  checkAvailability: (params) => api.get('/api/rentals/check-availability', { params }),
  getPricingPreview: (params) => api.get('/api/rentals/pricing-preview', { params }),
};

// API Methods dla Payments
export const paymentsAPI = {
  approveOffline: (data) => api.post('/api/payments/offline-approve', data),
  createStripeIntent: (data) => api.post('/api/payments/stripe/create-payment-intent', data),
  confirmStripe: (paymentIntentId) => api.post(`/api/payments/stripe/confirm/${paymentIntentId}`),
  getStripeConfig: () => api.get('/api/payments/stripe/config'),
};

// API Methods dla Admin
export const adminAPI = {
  getUsers: (params = {}) => api.get('/api/admin/users', { params }),
  blockUser: (userId) => api.put(`/api/admin/users/${userId}/block`),
  unblockUser: (userId) => api.put(`/api/admin/users/${userId}/unblock`),
  getPendingPayments: (params = {}) => api.get('/api/admin/payments/pending', { params }),
  cancelPayment: (paymentId) => api.post(`/api/payments/${paymentId}/cancel`),
};

// Export domyślny instancji Axios (dla custom calls)
export default api;