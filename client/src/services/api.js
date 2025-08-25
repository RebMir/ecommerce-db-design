import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens (if needed)
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('authToken');
      // window.location.href = '/login';
    }
    
    if (error.response?.status === 500) {
      console.error('Server error:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

// Product API methods
export const productAPI = {
  // Get single product
  getProduct: async (productId) => {
    try {
      const response = await api.get(`/products/${productId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch product');
    }
  },

  // Get product reviews
  getProductReviews: async (productId, params = {}) => {
    try {
      const response = await api.get(`/products/${productId}/reviews`, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch reviews');
    }
  },

  // Get related products
  getRelatedProducts: async (productId) => {
    try {
      const response = await api.get(`/products/${productId}/related`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch related products');
    }
  },

  // Search products
  searchProducts: async (params = {}) => {
    try {
      const response = await api.get('/products', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to search products');
    }
  },
};

// Order API methods
export const orderAPI = {
  // Create order
  createOrder: async (orderData) => {
    try {
      const response = await api.post('/orders', orderData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create order');
    }
  },

  // Get order by ID
  getOrder: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch order');
    }
  },

  // Get order by order number
  getOrderByNumber: async (orderNumber) => {
    try {
      const response = await api.get(`/orders/number/${orderNumber}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch order');
    }
  },
};

// Payment API methods
export const paymentAPI = {
  // M-Pesa STK Push
  initiateMpesaPayment: async (paymentData) => {
    try {
      const response = await api.post('/payments/mpesa', paymentData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to initiate M-Pesa payment');
    }
  },

  // Check M-Pesa payment status
  checkMpesaStatus: async (checkoutRequestId) => {
    try {
      const response = await api.get(`/payments/mpesa/status/${checkoutRequestId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to check payment status');
    }
  },

  // Bank transfer
  processBankTransfer: async (transferData) => {
    try {
      const response = await api.post('/payments/bank', transferData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to process bank transfer');
    }
  },
};

// Utility methods
export const utils = {
  // Format currency
  formatCurrency: (amount, currency = 'KSH') => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency === 'KSH' ? 'KES' : currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  },

  // Format date
  formatDate: (date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  },

  // Generate stars for rating
  generateStars: (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push('full');
    }
    
    if (hasHalfStar) {
      stars.push('half');
    }
    
    while (stars.length < 5) {
      stars.push('empty');
    }
    
    return stars;
  },

  // Validate phone number (Kenyan format)
  validateKenyanPhone: (phone) => {
    const cleanPhone = phone.replace(/\s+/g, '');
    const kenyanPhoneRegex = /^254[0-9]{9}$/;
    return kenyanPhoneRegex.test(cleanPhone);
  },

  // Format phone number for M-Pesa
  formatPhoneForMpesa: (phone) => {
    let cleanPhone = phone.replace(/\s+/g, '').replace(/^\+/, '');
    
    // Convert 0 prefix to 254
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '254' + cleanPhone.substring(1);
    }
    
    return cleanPhone;
  },

  // Debounce function for search
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Handle API errors
  handleApiError: (error) => {
    if (error.response) {
      // Server responded with error status
      return error.response.data?.message || 'An error occurred';
    } else if (error.request) {
      // Request was made but no response received
      return 'Network error. Please check your connection.';
    } else {
      // Something else happened
      return error.message || 'An unexpected error occurred';
    }
  },
};

export default api;