const DEFAULT_TIMEOUT_MS = 30000;

const createTimeoutError = () => {
  const error = new Error('Request timeout');
  error.name = 'TimeoutError';
  return error;
};

export async function apiPost(path, body = {}, token, options = {}) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!baseUrl) {
    throw new Error('VITE_API_BASE_URL is not defined');
  }

  const controller = new AbortController();
  const timeoutMs = Number.isFinite(options?.timeout) ? options.timeout : DEFAULT_TIMEOUT_MS;
  const externalSignal = options?.signal;
  const abortListener = () => controller.abort();

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', abortListener, { once: true });
      // Check again in case the signal aborted between the check and addEventListener.
      if (externalSignal.aborted) {
        controller.abort();
      }
    }
  }

  const timeoutId =
    Number.isFinite(timeoutMs) && timeoutMs > 0
      ? setTimeout(() => controller.abort(), timeoutMs)
      : null;

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      let errorText;
      try {
        errorText = await res.text();
      } catch (err) {
        errorText = err.message;
      }
      throw new Error(`API error (${res.status}): ${errorText}`);
    }

    try {
      return await res.json();
    } catch (err) {
      throw new Error(`Failed to parse JSON response: ${err.message}`);
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      if (externalSignal?.aborted) throw err;
      throw createTimeoutError();
    }
    throw err;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', abortListener);
    }
  }
}

export async function apiGet(path, token, options = {}) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!baseUrl) {
    throw new Error('VITE_API_BASE_URL is not defined');
  }

  const controller = new AbortController();
  const timeoutMs = Number.isFinite(options?.timeout) ? options.timeout : DEFAULT_TIMEOUT_MS;
  const externalSignal = options?.signal;
  const abortListener = () => controller.abort();

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', abortListener, { once: true });
      // Check again in case the signal aborted between the check and addEventListener.
      if (externalSignal.aborted) {
        controller.abort();
      }
    }
  }

  const timeoutId =
    Number.isFinite(timeoutMs) && timeoutMs > 0
      ? setTimeout(() => controller.abort(), timeoutMs)
      : null;

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      let errorText;
      try {
        errorText = await res.text();
      } catch (err) {
        errorText = err.message;
      }
      throw new Error(`API error (${res.status}): ${errorText}`);
    }

    try {
      return await res.json();
    } catch (err) {
      throw new Error(`Failed to parse JSON response: ${err.message}`);
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      if (externalSignal?.aborted) throw err;
      throw createTimeoutError();
    }
    throw err;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', abortListener);
    }
  }
}
