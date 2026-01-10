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

export async function apiPut(path, body = {}, token, options = {}) {
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
      method: 'PUT',
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

export async function apiDelete(path, token, options = {}) {
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
      method: 'DELETE',
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

// ==================== Chat Session API Functions ====================

/**
 * Create a new chat session
 */
export async function createChatSession(token, options = {}) {
  return apiPost('/api/chat/sessions', {}, token, options);
}

/**
 * Get all chat sessions for the current user
 */
export async function getChatSessions(token, options = {}) {
  return apiGet('/api/chat/sessions', token, options);
}

/**
 * Get history for a specific chat session
 */
export async function getChatSessionHistory(sessionId, token, options = {}) {
  const { page = 0, size = 50, sort = 'desc' } = options;
  return apiGet(
    `/api/chat/sessions/${sessionId}/history?page=${page}&size=${size}&sort=${sort}`,
    token,
    options
  );
}

/**
 * Update chat session title
 */
export async function updateChatSession(sessionId, title, token, options = {}) {
  return apiPut(`/api/chat/sessions/${sessionId}`, { title }, token, options);
}

/**
 * Delete a chat session
 */
export async function deleteChatSession(sessionId, token, options = {}) {
  return apiDelete(`/api/chat/sessions/${sessionId}`, token, options);
}

/**
 * Get chat history (legacy endpoint with optional sessionId)
 */
export async function getChatHistory(token, options = {}) {
  const { page = 0, size = 50, sort = 'desc', sessionId } = options;
  let path = `/api/chat/history?page=${page}&size=${size}&sort=${sort}`;
  if (sessionId) {
    path += `&sessionId=${sessionId}`;
  }
  return apiGet(path, token, options);
}
