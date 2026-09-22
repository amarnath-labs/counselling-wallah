import {
  API_BASE_URL,
} from './apiClient';


function getApiBase() {
  const value =
    String(
      API_BASE_URL ||
      ''
    )
      .replace(
        /\/$/,
        ''
      );

  return value;
}


export async function fetchCollegeReviewStandard100(
  collegeId,
  {
    page = 1,
    limit = 10,
  } = {}
) {
  if (!collegeId) {
    throw new Error(
      'collegeId is required'
    );
  }

  const base =
    getApiBase();

  const url =
    base +
    '/reviews/' +
    encodeURIComponent(
      collegeId
    ) +
    '?page=' +
    encodeURIComponent(
      page
    ) +
    '&limit=' +
    encodeURIComponent(
      limit
    );

  const response =
    await fetch(
      url,
      {
        credentials:
          'include',
      }
    );

  const json =
    await response.json();

  if (!response.ok) {
    throw new Error(
      json?.error ||
      'Unable to load student reviews.'
    );
  }

  return json;
}
