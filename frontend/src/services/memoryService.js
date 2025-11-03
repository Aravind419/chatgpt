import api from './api.js';

export const getMemories = async (conversationId = null, type = null) => {
  const params = new URLSearchParams();
  if (conversationId) params.append('conversationId', conversationId);
  if (type) params.append('type', type);
  
  const endpoint = `/memories${params.toString() ? '?' + params.toString() : ''}`;
  const response = await api.get(endpoint);
  return response.memories || [];
};

export const createMemory = async (memory) => {
  const response = await api.post('/memories', memory);
  return response.memory;
};

export const updateMemory = async (id, updates) => {
  const response = await api.patch(`/memories/${id}`, updates);
  return response.memory;
};

export const deleteMemory = async (id) => {
  const response = await api.delete(`/memories/${id}`);
  return response;
};

export const deleteAllMemories = async () => {
  const response = await api.delete('/memories');
  return response;
};

