const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Important for cookies
  };

  try {
    const response = await fetch(url, config);
    
    // Try to parse JSON, but handle non-JSON responses
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // If response is not JSON, read as text
      const text = await response.text();
      throw new Error(text || 'Request failed');
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    // Handle network errors and other fetch errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Failed to connect to server. Please check if the backend server is running on port 5000.');
    }
    
    // Re-throw error with message if it's already an Error with a message
    if (error instanceof Error) {
      throw error;
    }
    
    // Fallback for other error types
    throw new Error(error.message || 'An unexpected error occurred');
  }
}

export default {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
  post: (endpoint, body) => apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  patch: (endpoint, body) => apiRequest(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }),
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
};

