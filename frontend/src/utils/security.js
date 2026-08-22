export function escapeHtml(value='') {
  return String(value).replace(/[&<>\"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[ch]));
}
export function safeUrl(url='') {
  try {
    const u = new URL(url, window.location.origin);
    return ['http:','https:'].includes(u.protocol) ? u.href : '#';
  } catch { return '#'; }
}
export function sanitizeRank(raw, fallback=0) {
  const digits = String(raw ?? '').replace(/\D/g,'').slice(0,7);
  const n = Number(digits);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
export function sanitizePercentile(raw) {
  const clean = String(raw ?? '').replace(/[^0-9.]/g,'');
  const n = Number(clean);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? clean : '';
}
