// src/lib/apiClient.ts
import axios from 'axios';

const apiClient = axios.create({
  // This should point to your backend.
  // For development, you might use a proxy or the full URL.
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors here
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;