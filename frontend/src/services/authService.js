import { apiRequest } from './apiClient';

export async function register(payload) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function login(payload) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getCurrentUser() {
  return apiRequest('/auth/me');
}

export async function logout() {
  return apiRequest('/auth/logout', {
    method: 'POST',
  });
}
