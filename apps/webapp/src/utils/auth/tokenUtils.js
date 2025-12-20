const decodeBase64Url = (base64Url) => {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  return atob(padded);
};

export const decodeJwtPayload = (token) => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const jsonPayload = decodeURIComponent(
      decodeBase64Url(parts[1])
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token: invalid format or encoding');
    return null;
  }
};

export const getTokenExpirationMs = (token) => {
  const payload = decodeJwtPayload(token);
  const expSeconds = payload?.exp;
  if (!Number.isFinite(expSeconds)) return null;
  return expSeconds * 1000;
};

export const isTokenExpired = (token, skewMs = 0) => {
  const expMs = getTokenExpirationMs(token);
  if (!expMs) return false;
  return Date.now() + skewMs >= expMs;
};
