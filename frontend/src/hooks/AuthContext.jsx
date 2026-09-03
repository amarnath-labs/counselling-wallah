import {
  createContext,
  useContext,
  useEffect,
  useState,
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
  ] =
    useState(null);


  const [
    authLoading,
    setAuthLoading,
  ] =
    useState(true);


  async function refreshUser() {
    try {
      setAuthLoading(
        true
      );


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

    } catch (
      error
    ) {
      if (
        error?.status ===
        401
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
      setAuthLoading(
        false
      );
    }
  }


  async function logoutUser() {
    try {
      await logout();
    } finally {
      setUser(null);
    }
  }


  useEffect(
    () => {
      refreshUser();
    },
    []
  );


  return (
    <AuthContext.Provider
      value={{
        user,
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