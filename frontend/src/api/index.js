const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
// const BASE_URL='http://localhost:5000/api';
async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const opts = {
    headers: { 
      'Content-Type': 'application/json', 
      ...(options.headers || {}) 
    },
    ...options,
  };
  
  try {
    const res = await fetch(url, opts);
    let data = null;
    
    try {
      data = await res.json();
    } catch (_) {
      // Response might not be JSON
    }
    
    if (!res.ok) {
      throw new Error(data?.error || `Request failed: ${res.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

const api = {
  getThemes: () => request('/themes'),
  getMessages: (sessionId) => request(`/messages/${sessionId}`),
  getSessions: () => request('/sessions'),
  renameSession: (sessionId, name) => request(`/sessions/${sessionId}/rename`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  }),
  deleteSession: (sessionId) => request(`/sessions/${sessionId}`, { 
    method: 'DELETE' 
  }),
  generate: ({ message, lang, city, sessionId, sessionName, theme }) => 
    request('/generate', {
      method: 'POST',
      body: JSON.stringify({ 
        message, 
        lang, 
        city, // Only send city if it's new/different
        sessionId, 
        sessionName, 
        theme 
      }),
    }),
  testWeather: (city) => request(`/test-weather?city=${encodeURIComponent(city)}`),
};

export default api;
