// lib/axios.ts
import axios from 'axios';
import { getSession } from 'next-auth/react';

const API_URL = 'http://localhost:3000/api';

export const createAxiosInstance = async () => {
  const session = await getSession();
  
  const instance = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  // Add Authorization header if user is authenticated
  if (session?.user?.accessToken) {
    instance.defaults.headers.common['Authorization'] = `Bearer ${session.user.accessToken}`;
  }
  
  return instance;
};

// For use in component
export const useApi = () => {
  const api = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  // Add a request interceptor
  api.interceptors.request.use(
    async (config) => {
      // Get the session
      const session = await getSession();
      
      // If user is authenticated, add the Authorization header
      if (session?.user?.accessToken) {
        config.headers.Authorization = `Bearer ${session.user.accessToken}`;
      }
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  
  return api;
};