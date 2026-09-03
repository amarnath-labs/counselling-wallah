import {
  apiRequest,
} from './apiClient';


export function register(
  payload
) {
  return apiRequest(
    '/auth/register',
    {
      method:
        'POST',

      body:
        JSON.stringify(
          payload
        ),
    }
  );
}


export function login(
  payload
) {
  return apiRequest(
    '/auth/login',
    {
      method:
        'POST',

      body:
        JSON.stringify(
          payload
        ),
    }
  );
}


export function getCurrentUser() {
  return apiRequest(
    '/auth/me'
  );
}


export function logout() {
  return apiRequest(
    '/auth/logout',
    {
      method:
        'POST',
    }
  );
}