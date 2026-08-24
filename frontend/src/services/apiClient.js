function normalizeApiBaseUrl(value) {
  const trimmed = String(value || '')
    .trim()
    .replace(/\/+$/, '');

  if (!trimmed) {
    return '';
  }

  return trimmed.endsWith('/api')
    ? trimmed
    : `${trimmed}/api`;
}

/*
|--------------------------------------------------------------------------
| API BASE URL
|--------------------------------------------------------------------------
| Local:
|   https://counsellingwallah-backend.onrender.com/api
|
| Production:
|   https://counsellingwallah-backend.onrender.com/api
|
| Vercel:
|   VITE_API_BASE_URL
|--------------------------------------------------------------------------
*/

const localApiUrl =
  'https://counsellingwallah-backend.onrender.com/api';

const productionApiUrl =
  'https://counsellingwallah-backend.onrender.com/api';

const configuredApiUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  '';

const API_BASE_URL =
  normalizeApiBaseUrl(configuredApiUrl) ||
  (
    import.meta.env.PROD
      ? productionApiUrl
      : localApiUrl
  );

console.log(
  '[API] Environment:',
  import.meta.env.MODE
);

console.log(
  '[API] Base URL:',
  API_BASE_URL
);

export async function apiRequest(
  path,
  options = {}
) {
  const cleanPath =
    String(path || '').startsWith('/')
      ? path
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

          credentials: 'include',

          headers: {
            'Content-Type':
              'application/json',

            ...(options.headers || {}),
          },
        }
      );

    const body =
      await response
        .json()
        .catch(
          () => ({})
        );

    if (!response.ok) {
      throw new Error(
        body?.error ||
        body?.message ||
        `API request failed: ${response.status}`
      );
    }

    return body;

  } catch (error) {
    console.error(
      '[API ERROR]',
      {
        url,
        message:
          error?.message,
      }
    );

    throw error;
  }
}

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

export async function getApiCatalog() {
  console.log(
    '[FRONTEND] Loading API catalog...'
  );

  const [
    exams,
    colleges,
    counselling,
  ] =
    await Promise.all([
      apiGet('/exams'),

      apiGet('/colleges'),

      apiGet(
        '/counselling/events?examId=jee-main'
      ),
    ]);

  return {
    exams:
      Array.isArray(exams?.data)
        ? exams.data
        : [],

    colleges:
      Array.isArray(colleges?.data)
        ? colleges.data
        : [],

    counsellingEvents:
      Array.isArray(
        counselling?.data
      )
        ? counselling.data
        : [],
  };
}

export {
  API_BASE_URL,
};