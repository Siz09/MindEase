import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

const authHeader = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

export const authApiLogin = async ({ firebaseToken }) => {
  const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { firebaseToken });
  return res.data;
};

export const authApiRegister = async ({ email, firebaseToken, anonymousMode }) => {
  const res = await axios.post(`${API_BASE_URL}/api/auth/register`, {
    email,
    firebaseToken,
    anonymousMode,
  });
  return res.data;
};

export const authApiRefresh = async ({ refreshToken }) => {
  const res = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken });
  return res.data;
};

export const authApiMe = async ({ token }) => {
  const res = await axios.get(`${API_BASE_URL}/api/auth/me`, { headers: authHeader(token) });
  return res.data?.user || res.data;
};

export const authApiLogout = async ({ token }) => {
  await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, { headers: authHeader(token) });
};

export const authApiRequestPasswordReset = async ({ email }) => {
  const res = await axios.post(`${API_BASE_URL}/api/auth/request-password-reset`, { email });
  return res.data;
};

export const authApiConvertAnonymous = async ({ email, password, firebaseToken, token }) => {
  const res = await axios.post(
    `${API_BASE_URL}/api/auth/convert-anonymous`,
    { email, password, firebaseToken },
    { headers: authHeader(token) }
  );
  return res.data;
};

export const authApiUpdateAnonymousMode = async ({ userId, anonymousMode, token }) => {
  const res = await axios.patch(
    `${API_BASE_URL}/api/users/${userId}/anonymous-mode`,
    { anonymousMode },
    { headers: authHeader(token) }
  );
  return res.data;
};

