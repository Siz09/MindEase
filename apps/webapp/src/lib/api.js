export async function apiPost(path, body = {}, token) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!baseUrl) {
    throw new Error('VITE_API_BASE_URL is not defined');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

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
      try {
        const errorText = await res.text();
        throw new Error(`API error (${res.status}): ${errorText}`);
      } catch (err) {
        throw new Error(`API error (${res.status}): ${err.message}`);
      }
    }

    try {
      return await res.json();
    } catch (err) {
      throw new Error(`Failed to parse JSON response: ${err.message}`);
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function apiGet(path, token) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!baseUrl) {
    throw new Error('VITE_API_BASE_URL is not defined');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      try {
        const errorText = await res.text();
        throw new Error(`API error (${res.status}): ${errorText}`);
      } catch (err) {
        throw new Error(`API error (${res.status}): ${err.message}`);
      }
    }

    try {
      return await res.json();
    } catch (err) {
      throw new Error(`Failed to parse JSON response: ${err.message}`);
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
