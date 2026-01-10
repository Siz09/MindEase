import { useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  firebaseCreateUserWithEmail,
  firebaseGetIdToken,
  firebaseLinkCurrentUserWithEmailPassword,
  firebaseSendPasswordResetEmail,
  firebaseSignInAnonymously,
  firebaseSignInWithEmail,
  firebaseSignOut,
} from '../utils/auth/firebaseAuth';
import {
  authApiConvertAnonymous,
  authApiLogin,
  authApiLogout,
  authApiRegister,
  authApiRequestPasswordReset,
  authApiUpdateAnonymousMode,
} from '../utils/auth/authApi';

export const useAuthActions = ({
  t,
  getErrorMessage,
  token,
  currentUser,
  setCurrentUser,
  setAuthTokens,
  clearSessionState,
  markAuthenticated,
  resetSessionFlags,
}) => {
  const handleAuthSuccess = useCallback(
    (jwtToken, userData, refreshTokenValue, toastId, messageText) => {
      setAuthTokens(jwtToken, refreshTokenValue);
      setCurrentUser(userData);
      markAuthenticated();

      if (toastId) {
        toast.update(toastId, {
          render: messageText || 'Signed in!',
          type: 'success',
          isLoading: false,
          autoClose: 3000,
        });
      }

      return { success: true, user: userData, token: jwtToken, refreshToken: refreshTokenValue };
    },
    [setAuthTokens, setCurrentUser, markAuthenticated]
  );

  const login = useCallback(
    async (email, password) => {
      let toastId = null;
      try {
        toastId = toast.loading('Signing in...');
        const firebaseUser = await firebaseSignInWithEmail(email, password);
        const firebaseToken = await firebaseGetIdToken(firebaseUser);
        const responseData = await authApiLogin({ firebaseToken });

        const { token: jwtToken, refreshToken: refreshTokenValue, user: userData } = responseData;

        const role = userData?.role || userData?.authority;
        if (role === 'ADMIN' || role === 'ROLE_ADMIN') {
          // Admin sessions should not be persisted into the user `token`/`refreshToken` keys.
          // Otherwise, reopening the app at `/` will authenticate into the user UI using an admin JWT.
          clearSessionState();
          resetSessionFlags();

          if (toastId) {
            toast.update(toastId, {
              render: 'Signed in as admin',
              type: 'success',
              isLoading: false,
              autoClose: 3000,
            });
          }

          return {
            success: true,
            user: userData,
            token: jwtToken,
            refreshToken: refreshTokenValue,
            isAdmin: true,
          };
        }

        return handleAuthSuccess(
          jwtToken,
          userData,
          refreshTokenValue,
          toastId,
          'Successfully signed in!'
        );
      } catch (error) {
        console.error('Login error:', error);
        if (toastId !== null) toast.dismiss(toastId);

        const errorCode = error.response?.data?.code;
        let errorMessage = getErrorMessage(errorCode, t('auth.loginError'));

        if (!errorCode) {
          if (error.code === 'auth/invalid-credential') {
            errorMessage = getErrorMessage('INVALID_CREDENTIALS', 'Invalid email or password.');
          } else if (error.code === 'auth/user-not-found') {
            errorMessage = getErrorMessage('USER_NOT_FOUND', 'No account found with this email.');
          } else if (error.code === 'auth/wrong-password') {
            errorMessage = getErrorMessage('INVALID_CREDENTIALS', 'Incorrect password.');
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.message) {
            errorMessage = error.message;
          }
        }

        toast.error(errorMessage);
        return { success: false, error: errorMessage, code: errorCode };
      }
    },
    [t, getErrorMessage, handleAuthSuccess, clearSessionState, resetSessionFlags]
  );

  const loginAnonymously = useCallback(async () => {
    let toastId = null;
    try {
      toastId = toast.loading('Continuing anonymously...');

      const firebaseUser = await firebaseSignInAnonymously();
      const firebaseToken = await firebaseGetIdToken(firebaseUser);

      try {
        const loginResponseData = await authApiLogin({ firebaseToken });
        const {
          token: jwtToken,
          refreshToken: refreshTokenValue,
          user: userData,
        } = loginResponseData;
        return handleAuthSuccess(
          jwtToken,
          userData,
          refreshTokenValue,
          toastId,
          'Continuing anonymously!'
        );
      } catch (loginErr) {
        const status = loginErr?.response?.status;
        const errorCode = loginErr?.response?.data?.code;

        if (errorCode === 'USER_NOT_FOUND' || status === 404) {
          const registerResponseData = await authApiRegister({
            email: `anonymous_${firebaseUser.uid}@mindease.com`,
            firebaseToken,
            anonymousMode: true,
          });
          const {
            token: jwtToken,
            refreshToken: refreshTokenValue,
            user: userData,
          } = registerResponseData;
          return handleAuthSuccess(
            jwtToken,
            userData,
            refreshTokenValue,
            toastId,
            'Continuing anonymously!'
          );
        }

        throw loginErr;
      }
    } catch (error) {
      console.error('Anonymous login error:', error);
      if (toastId !== null) toast.dismiss(toastId);
      toast.error('Failed to continue anonymously. Please try again.');
      return { success: false, error: error.message };
    }
  }, [handleAuthSuccess]);

  const register = useCallback(
    async (email, password, anonymousMode = false, autoLogin = true) => {
      let toastId = null;
      try {
        toastId = toast.loading('Creating account...');

        const firebaseUser = await firebaseCreateUserWithEmail(email, password);
        const firebaseToken = await firebaseGetIdToken(firebaseUser);

        const responseData = await authApiRegister({ email, firebaseToken, anonymousMode });
        const { token: jwtToken, refreshToken: refreshTokenValue, user: userData } = responseData;

        if (autoLogin) {
          return handleAuthSuccess(
            jwtToken,
            userData,
            refreshTokenValue,
            toastId,
            'Account created! Welcome to MindEase!'
          );
        }

        try {
          await firebaseSignOut();
        } catch {
          // ignore
        }
        clearSessionState();
        resetSessionFlags();

        toast.update(toastId, {
          render: 'Account created! Please log in.',
          type: 'success',
          isLoading: false,
          autoClose: 3000,
        });

        return { success: true };
      } catch (error) {
        console.error('Register error:', error);
        if (toastId !== null) toast.dismiss(toastId);

        const errorCode = error.response?.data?.code;
        let errorMessage = getErrorMessage(errorCode, t('auth.registerError'));

        if (!errorCode) {
          if (error.code === 'auth/email-already-in-use') {
            errorMessage = getErrorMessage(
              'USER_ALREADY_EXISTS',
              'This email is already registered. Please log in instead.'
            );
          } else if (error.code === 'auth/invalid-email') {
            errorMessage = t('auth.invalidEmailFormat');
          } else if (error.code === 'auth/weak-password') {
            errorMessage = getErrorMessage(
              'WEAK_PASSWORD',
              'Password should be at least 6 characters.'
            );
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.message) {
            errorMessage = error.message;
          }
        }

        toast.error(errorMessage);
        return { success: false, error: errorMessage, code: errorCode };
      }
    },
    [t, getErrorMessage, handleAuthSuccess, clearSessionState, resetSessionFlags]
  );

  const updateUser = useCallback(
    async (updates) => {
      if (!currentUser?.id || !token) {
        return { success: false, error: 'No active session' };
      }
      try {
        if (updates.anonymousMode !== undefined) {
          const updatedUser = await authApiUpdateAnonymousMode({
            userId: currentUser.id,
            anonymousMode: updates.anonymousMode,
            token,
          });
          setCurrentUser((prev) => ({ ...prev, ...updatedUser }));
          return { success: true };
        }
        return { success: false, error: 'Only anonymous mode updates are supported' };
      } catch (error) {
        console.error('Update user error:', error);
        toast.error('Failed to update user settings');
        return { success: false, error: error.message };
      }
    },
    [currentUser?.id, token, setCurrentUser]
  );

  const convertAnonymousToFull = useCallback(
    async (email, password) => {
      let toastId = null;
      try {
        toastId = toast.loading('Converting account...');

        const firebaseUser = await firebaseLinkCurrentUserWithEmailPassword(email, password);
        const firebaseToken = await firebaseGetIdToken(firebaseUser, true);

        const currentToken = token || localStorage.getItem('token');
        const responseData = await authApiConvertAnonymous({
          email,
          password,
          firebaseToken,
          token: currentToken,
        });

        const { token: jwtToken, refreshToken: refreshTokenValue, user: userData } = responseData;
        setAuthTokens(jwtToken, refreshTokenValue);
        setCurrentUser(userData);
        markAuthenticated();

        toast.update(toastId, {
          render: 'Account converted successfully! Welcome to MindEase!',
          type: 'success',
          isLoading: false,
          autoClose: 3000,
        });

        return { success: true, user: userData };
      } catch (error) {
        console.error('Convert anonymous error:', error);
        if (toastId !== null) toast.dismiss(toastId);

        const errorCode = error.response?.data?.code;
        let errorMessage = getErrorMessage(errorCode, 'Failed to convert account');

        if (!errorCode) {
          if (error.code === 'auth/email-already-in-use') {
            errorMessage = getErrorMessage(
              'EMAIL_IN_USE',
              'This email is already in use. Please use a different email.'
            );
          } else if (error.code === 'auth/invalid-email') {
            errorMessage = t('auth.invalidEmailFormat');
          } else if (error.code === 'auth/weak-password') {
            errorMessage = getErrorMessage(
              'WEAK_PASSWORD',
              'Password should be at least 6 characters.'
            );
          } else if (error.code === 'auth/requires-recent-login') {
            errorMessage = 'Please log out and log back in before converting your account.';
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.message) {
            errorMessage = error.message;
          }
        }

        toast.error(errorMessage);
        return { success: false, error: errorMessage, code: errorCode };
      }
    },
    [t, getErrorMessage, token, setAuthTokens, setCurrentUser, markAuthenticated]
  );

  const sendPasswordResetEmail = useCallback(
    async (email) => {
      try {
        try {
          await authApiRequestPasswordReset({ email });
        } catch (backendError) {
          if (backendError.response?.data?.code === 'RATE_LIMIT_EXCEEDED') {
            const errorMsg = getErrorMessage(
              'RATE_LIMIT_EXCEEDED',
              'Too many reset requests. Please try again later.'
            );
            toast.error(errorMsg);
            return { success: false, error: errorMsg };
          }
          console.warn('Backend tracking failed for password reset:', backendError);
        }

        await firebaseSendPasswordResetEmail(email);
        toast.success(t('auth.passwordResetEmailSent', { email }));
        return { success: true };
      } catch (error) {
        console.error('Password reset error:', error);

        let errorMessage = t('auth.passwordResetError');
        if (error.code === 'auth/user-not-found') {
          errorMessage = t('auth.passwordResetGenericSuccess');
          return { success: true };
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = t('auth.invalidEmailFormat');
        } else if (error.code === 'auth/too-many-requests') {
          errorMessage = getErrorMessage(
            'RATE_LIMIT_EXCEEDED',
            'Too many requests. Please try again later.'
          );
        } else if (error.message) {
          errorMessage = error.message;
        }

        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [t, getErrorMessage]
  );

  const logout = useCallback(async () => {
    try {
      if (token) {
        await authApiLogout({ token });
      }
    } catch (error) {
      console.error('Logout error:', error);
    }

    clearSessionState();
    resetSessionFlags();
    try {
      await firebaseSignOut();
    } catch (error) {
      console.warn('Firebase sign-out failed:', error);
    }
    toast.info('You have been logged out');
  }, [token, clearSessionState, resetSessionFlags]);

  return {
    login,
    loginAnonymously,
    register,
    updateUser,
    convertAnonymousToFull,
    sendPasswordResetEmail,
    logout,
  };
};
