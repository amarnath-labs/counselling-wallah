import {
  apiPost,
} from './apiClient';

export function submitFeedback(payload) {
  return apiPost(
    '/feedback',
    payload
  );
}
