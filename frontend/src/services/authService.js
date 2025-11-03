import api from './api.js';

export const signup = async (email, password, confirmPassword) => {
  const response = await api.post('/auth/signup', {
    email,
    password,
    confirmPassword,
  });
  return response;
};

export const login = async (email, password) => {
  const response = await api.post('/auth/login', {
    email,
    password,
  });
  return response;
};

export const logout = async () => {
  const response = await api.post('/auth/logout');
  return response;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response;
};

