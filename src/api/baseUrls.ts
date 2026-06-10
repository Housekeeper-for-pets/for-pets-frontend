const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const trimLeadingSlash = (value: string) => value.replace(/^\/+/, '');
const defaultApiBaseUrl = import.meta.env.PROD
  ? 'https://api.forpetscare.uk/api'
  : '/api';

export const API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL ?? defaultApiBaseUrl,
);

export const buildApiUrl = (path: string) =>
  `${API_BASE_URL}/${trimLeadingSlash(path)}`;

export const buildWebSocketUrl = (path: string) => {
  const configuredUrl = import.meta.env.VITE_WS_BASE_URL;

  if (configuredUrl) {
    return `${trimTrailingSlash(configuredUrl)}/${trimLeadingSlash(path)}`;
  }

  if (API_BASE_URL.startsWith('http')) {
    const url = new URL(API_BASE_URL);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = `/${trimLeadingSlash(path)}`;
    url.search = '';
    url.hash = '';
    return url.toString();
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/${trimLeadingSlash(path)}`;
};
