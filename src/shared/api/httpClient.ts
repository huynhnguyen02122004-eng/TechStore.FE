import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL?.trim() || '/api/v1';

export const httpClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});
