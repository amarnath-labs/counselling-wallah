function normalizeApiBaseUrl(value) {
  const clean = String(value || '')
    .trim()
    .replace(/\/+$/, '');

  if (!clean) {
    return '';
  }

  return clean.endsWith('/api')
    ? clean
    : `${clean}/api`;
}

/*
|--------------------------------------------------------------------------
| API URL
|--------------------------------------------------------------------------
|
| DEVELOPMENT
| Browser -> localhost:4000
|
| PRODUCTION
| Browser -> same Vercel origin /api
| Vercel  -> Render backend through rewrite
|
| This keeps authentication requests same-origin in production and avoids
| relying on third-party cookies between vercel.app and onrender.com.
|
|--------------------------------------------------------------------------
*/

const configuredApiUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  '';

const localApiUrl =
  'http://localhost:4000/api';

const API_BASE_URL =
  import.meta.env.DEV
    ? (
        normalizeApiBaseUrl(
          configuredApiUrl
        ) ||
        localApiUrl
      )
    : '/api';

console.log(
  '[API] Environment:',
  import.meta.env.DEV
    ? 'development'
    : 'production'
);

console.log(
  '[API] Base URL:',
  API_BASE_URL
);

/*
|--------------------------------------------------------------------------
| GENERIC API REQUEST
|--------------------------------------------------------------------------
*/

export async function apiRequest(
  path,
  options = {}
) {
  const cleanPath =
    String(path || '').startsWith('/')
      ? String(path)
      : `/${path}`;

  const url =
    `${API_BASE_URL}${cleanPath}`;

  console.log(
    '[API REQUEST]',
    url
  );

  try {
    const response =
      await fetch(
        url,
        {
          ...options,

          /*
          |--------------------------------------------------------------------------
          | AUTH COOKIE
          |--------------------------------------------------------------------------
          */

          credentials: 'include',

          headers: {
            'Content-Type':
              'application/json',

            Accept:
              'application/json',

            ...(
              options.headers ||
              {}
            ),
          },
        }
      );

    const data =
      await response
        .json()
        .catch(
          () => ({})
        );

    if (!response.ok) {
      const error =
        new Error(
          data?.error ||
          data?.message ||
          `API request failed: ${response.status}`
        );

      error.status =
        response.status;

      error.data =
        data;

      throw error;
    }

    return data;

  } catch (error) {
    console.error(
      '[API ERROR]',
      {
        url,
        status:
          error?.status,
        message:
          error?.message,
      }
    );

    throw error;
  }
}

/*
|--------------------------------------------------------------------------
| GET
|--------------------------------------------------------------------------
*/

export async function apiGet(
  path
) {
  return apiRequest(
    path,
    {
      method: 'GET',
    }
  );
}

/*
|--------------------------------------------------------------------------
| POST
|--------------------------------------------------------------------------
*/

export async function apiPost(
  path,
  body
) {
  return apiRequest(
    path,
    {
      method: 'POST',

      body:
        body === undefined
          ? undefined
          : JSON.stringify(
              body
            ),
    }
  );
}

/*
|--------------------------------------------------------------------------
| PUT
|--------------------------------------------------------------------------
*/

export async function apiPut(
  path,
  body
) {
  return apiRequest(
    path,
    {
      method: 'PUT',

      body:
        JSON.stringify(
          body
        ),
    }
  );
}

/*
|--------------------------------------------------------------------------
| PATCH
|--------------------------------------------------------------------------
*/

export async function apiPatch(
  path,
  body
) {
  return apiRequest(
    path,
    {
      method: 'PATCH',

      body:
        JSON.stringify(
          body
        ),
    }
  );
}

/*
|--------------------------------------------------------------------------
| DELETE
|--------------------------------------------------------------------------
*/

export async function apiDelete(
  path
) {
  return apiRequest(
    path,
    {
      method: 'DELETE',
    }
  );
}

/*
|--------------------------------------------------------------------------
| LOAD APP CATALOG
|--------------------------------------------------------------------------
*/

async function getCollegeCatalog() {

  /*
  |--------------------------------------------------------------------------
  | COLLEGE CATALOG DELIVERY
  |--------------------------------------------------------------------------
  |
  | DEVELOPMENT
  | Local backend remains the source.
  |
  | PRODUCTION
  | Static catalog is served directly by Vercel.
  | This prevents the large read-only catalog request from reaching Render.
  |
  */

  if (import.meta.env.DEV) {
    return apiGet(
      '/colleges'
    );
  }

  const response =
    await fetch(
      '/colleges-catalog.json',
      {
        headers: {
          Accept:
            'application/json',
        },
      }
    );

  if (!response.ok) {
    throw new Error(
      `College catalog request failed: ${response.status}`
    );
  }

  return response.json();
}


export async function getApiCatalog() {
  console.log(
    '[FRONTEND] Loading API catalog...'
  );

  const [
    exams,
    colleges,
    counsellingEvents,
  ] =
    await Promise.all([
      apiGet(
        '/exams'
      ),

      getCollegeCatalog(),

      apiGet(
        '/counselling/events?examId=jee-main'
      ),
    ]);

  return {
    exams:
      Array.isArray(
        exams?.data
      )
        ? exams.data
        : [],

    colleges:
      Array.isArray(
        colleges?.data
      )
        ? colleges.data
        : [],

    counsellingEvents:
      Array.isArray(
        counsellingEvents?.data
      )
        ? counsellingEvents.data
        : [],
  };
}

/*
|--------------------------------------------------------------------------
| EXPORT API BASE URL
|--------------------------------------------------------------------------
*/

export {
  API_BASE_URL,
};
