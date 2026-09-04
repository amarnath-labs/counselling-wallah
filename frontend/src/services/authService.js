import {
  apiRequest,
} from './apiClient';

/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/

export function register(
  payload
) {
  return apiRequest(
    '/auth/register',
    {
      method: 'POST',

      body:
        JSON.stringify(
          payload
        ),
    }
  );
}

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

export function login(
  payload
) {
  return apiRequest(
    '/auth/login',
    {
      method: 'POST',

      body:
        JSON.stringify(
          payload
        ),
    }
  );
}

/*
|--------------------------------------------------------------------------
| CURRENT USER
|--------------------------------------------------------------------------
*/

export function getCurrentUser() {
  return apiRequest(
    '/auth/me',
    {
      method: 'GET',
    }
  );
}

/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

export function logout() {
  return apiRequest(
    '/auth/logout',
    {
      method: 'POST',
    }
  );
}