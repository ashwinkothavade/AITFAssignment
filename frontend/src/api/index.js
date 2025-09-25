// src/api/index.js

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const opts = {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  };
  const res = await fetch(url, opts);
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    // ignore json parse errors
  }
  if (!res.ok) {
    const msg = data?.error || data?.message || `Request failed: ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// Chats & Sessions
export const getMessages = (sessionId) => request(`/messages/${sessionId}`);
export const getSessions = () => request(`/sessions`);
export const renameSession = (sessionId, name) => request(`/sessions/${sessionId}/rename`, {
  method: 'PUT',
  body: JSON.stringify({ name }),
});
export const deleteSession = (sessionId) => request(`/sessions/${sessionId}`, { method: 'DELETE' });
export const searchMessages = (query, sessionId = 'all') => request(`/search`, {
  method: 'POST',
  body: JSON.stringify({ query, sessionId }),
});

// AI generate
export const generate = ({ message, lang, city, sessionId, sessionName }) => request(`/generate`, {
  method: 'POST',
  body: JSON.stringify({ message, lang, city, sessionId, sessionName }),
});

// Utilities
export const testWeather = (city) => request(`/test-weather?city=${encodeURIComponent(city)}`);
export const getSessionSummary = (sessionId) => request(`/sessions/${sessionId}/summary`);

export default {
  getMessages,
  getSessions,
  renameSession,
  deleteSession,
  searchMessages,
  generate,
  testWeather,
  getSessionSummary,
};
