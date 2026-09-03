import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

import {
  getCurrentUser,
  logout,
} from '../services/authService';


const AuthContext =
  createContext(null);


export function AuthProvider({
  children,
}) {
  const [
    user,
    setUser,
  ] = useState(null);

  const [
    authLoading,
    setAuthLoading,
  ] = useState(true);


  /*
  |--------------------------------------------------------------------------
  | REFRESH CURRENT USER
  |--------------------------------------------------------------------------
  */

  const refreshUser =
    useCallback(
      async () => {
        try {
          setAuthLoading(true);

          const response =
            await getCurrentUser();

          const currentUser =
            response?.data?.user ||
            response?.user ||
            null;

          setUser(
            currentUser
          );

          return currentUser;

        } catch (error) {
          if (
            error?.status === 401
          ) {
            setUser(null);
            return null;
          }

          console.error(
            '[AUTH REFRESH]',
            error
          );

          setUser(null);

          return null;

        } finally {
          setAuthLoading(false);
        }
      },
      []
    );


  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  const logoutUser =
    useCallback(
      async () => {
        try {
          await logout();
        } finally {
          setUser(null);

          window.dispatchEvent(
            new Event(
              'cw-auth-changed'
            )
          );
        }
      },
      []
    );


  /*
  |--------------------------------------------------------------------------
  | INITIAL AUTH CHECK
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      refreshUser();
    },
    [refreshUser]
  );


  /*
  |--------------------------------------------------------------------------
  | LOGIN / LOGOUT EVENT LISTENER
  |--------------------------------------------------------------------------
  |
  | Login.jsx dispatches:
  |
  | window.dispatchEvent(
  |   new Event('cw-auth-changed')
  | )
  |
  | This listener immediately refreshes /api/auth/me.
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      function handleAuthChange() {
        refreshUser();
      }

      window.addEventListener(
        'cw-auth-changed',
        handleAuthChange
      );

      return () => {
        window.removeEventListener(
          'cw-auth-changed',
          handleAuthChange
        );
      };
    },
    [refreshUser]
  );


  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        authLoading,
        refreshUser,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const context =
    useContext(
      AuthContext
    );

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    );
  }

  return context;
}