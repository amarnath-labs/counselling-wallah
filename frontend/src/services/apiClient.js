function normalizeApiBaseUrl(value) {
  const trimmed = String(value || '').replace(/\/+$/, '');

  return trimmed.endsWith('/api')
    ? trimmed
    : `${trimmed}/api`;
}

const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    'http://localhost:4000/api'
);

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error || `API request failed: ${response.status}`);
  }

  return body;
}

export async function apiGet(path) {
  return apiRequest(path);
}

export async function getApiCatalog() {
  const [exams, colleges, counselling] = await Promise.all([
    apiGet('/exams'),
    apiGet('/colleges'),
    apiGet('/counselling/events?examId=jee-main'),
  ]);

  return {
    exams: exams.data,
    colleges: colleges.data,
    counsellingEvents: counselling.data,
  };
}

export { API_BASE_URL };
