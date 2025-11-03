import api from './api.js';

export const getConversations = async () => {
  const response = await api.get('/conversations');
  return response.conversations || {};
};

export const getConversation = async (id) => {
  const response = await api.get(`/conversations/${id}`);
  return response.conversation;
};

export const createConversation = async (model = 'gpt-5') => {
  const response = await api.post('/conversations', { model });
  return response.conversation;
};

export const updateConversation = async (id, updates) => {
  const response = await api.patch(`/conversations/${id}`, updates);
  return response.conversation;
};

export const deleteConversation = async (id) => {
  const response = await api.delete(`/conversations/${id}`);
  return response;
};

export const addMessage = async (conversationId, message) => {
  const response = await api.post(`/conversations/${conversationId}/messages`, message);
  return response.message;
};

export const clearMessages = async (conversationId) => {
  const response = await api.delete(`/conversations/${conversationId}/messages`);
  return response;
};

