import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_SERVER_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Human-friendly error message extraction
export function getFriendlyErrorMessage(error: any): string {
  if (!error) return 'Something went wrong. Please try again.';
  if (typeof error === 'string') return error;

  // Offline / Network failures
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'You appear to be offline. Please check your internet connection.';
  }
  if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
    return 'Unable to connect to the server. Please check your internet connection.';
  }
  if (error?.code === 'ECONNABORTED' || error?.message?.toLowerCase().includes('timeout')) {
    return 'The request took too long to complete. Please try again.';
  }

  const response = error?.response;
  const status = response?.status;

  // Backend returned a specific error or message
  const serverMsg =
    response?.data?.error ||
    response?.data?.message ||
    (typeof response?.data === 'string' ? response.data : null);

  if (typeof serverMsg === 'string' && serverMsg.trim() && !serverMsg.trim().startsWith('<')) {
    return serverMsg.trim();
  }

  // HTTP status based human-friendly messages
  if (status === 400) return 'The request was invalid. Please check your input.';
  if (status === 401) return 'Please log in to continue.';
  if (status === 403) return 'You do not have permission to access this.';
  if (status === 404) return 'The requested resource was not found.';
  if (status === 409) return 'A conflict occurred. Please try again.';
  if (status === 413) return 'The file or content size is too large.';
  if (status === 429) return 'Too many requests. Please wait a moment and try again.';
  if (status && status >= 500) return 'Our servers encountered an issue. Please try again shortly.';

  const fallback = error?.message;
  if (typeof fallback === 'string' && fallback && !fallback.includes('status code')) {
    return fallback;
  }

  return 'Something went wrong. Please try again.';
}

// Response interceptor to format errors while preserving AxiosError properties
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Standardize error message on the error object without discarding the response
    error.message = getFriendlyErrorMessage(error);
    return Promise.reject(error);
  }
);

export default api;
