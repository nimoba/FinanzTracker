// API configuration
export const API_URL = import.meta.env.PROD 
  ? '/api'  // In production, use relative path (Vercel will handle routing)
  : 'http://localhost:5000/api';  // In development, use local server