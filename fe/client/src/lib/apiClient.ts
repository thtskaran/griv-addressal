// src/lib/apiClient.ts
import axios from 'axios';

const apiClient = axios.create({
  // This should point to your backend.
  // For development, you might use a proxy or the full URL.
  baseURL: 'http://localhost:5000/api',
});

export default apiClient;