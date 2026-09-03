import { useState } from 'react';
import {
  Link,
  useNavigate,
} from 'react-router-dom';

import {
  login,
} from '../services/authService';


export default function Login() {
  const navigate =
    useNavigate();


  /*
  |--------------------------------------------------------------------------
  | FORM STATE
  |--------------------------------------------------------------------------
  */

  const [
    email,
    setEmail,
  ] = useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');


  /*
  |--------------------------------------------------------------------------
  | LOGIN
  |--------------------------------------------------------------------------
  */

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      /*
      |--------------------------------------------------------------------------
      | Backend login
      |--------------------------------------------------------------------------
      */

      await login({
        email: email.trim(),
        password,
      });


      /*
      |--------------------------------------------------------------------------
      | Tell global auth state that login status changed.
      |
      | useAppState listens for this event and calls /api/auth/me.
      | Navbar then receives the authenticated user immediately.
      |--------------------------------------------------------------------------
      */

      window.dispatchEvent(
        new Event(
          'cw-auth-changed'
        )
      );


      /*
      |--------------------------------------------------------------------------
      | Go to account page
      |--------------------------------------------------------------------------
      */

      navigate(
        '/account',
        {
          replace: true,
        }
      );

    } catch (err) {
      console.error(
        'LOGIN ERROR:',
        err
      );

      setError(
        err?.message ||
        'Unable to login. Please check your email and password.'
      );

    } finally {
      setLoading(false);
    }
  }


  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <div
      className="container section"
    >
      <div
        className="card"
        style={{
          maxWidth: '500px',
          margin: '0 auto',
          padding: '32px',
        }}
      >

        <h2>
          Login
        </h2>


        <p
          style={{
            marginTop: '8px',
            marginBottom: '24px',
            color: 'var(--ink-2)',
          }}
        >
          Login to access your counselling profile.
        </p>


        {/* ERROR MESSAGE */}

        {error && (
          <div
            role="alert"
            style={{
              marginBottom:
                '16px',
              padding:
                '12px 14px',
              borderRadius:
                '8px',
              background:
                '#ffe8e8',
              color:
                '#b00020',
              fontSize:
                '14px',
            }}
          >
            {error}
          </div>
        )}


        {/* LOGIN FORM */}

        <form
          onSubmit={
            handleSubmit
          }
        >

          {/* EMAIL */}

          <div
            className="field"
          >
            <label
              htmlFor="login-email"
            >
              Email
            </label>

            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(
                event
              ) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="Enter your email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck="false"
              required
              disabled={loading}
            />
          </div>


          {/* PASSWORD */}

          <div
            className="field"
          >
            <label
              htmlFor="login-password"
            >
              Password
            </label>

            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(
                event
              ) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </div>


          {/* LOGIN BUTTON */}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              marginTop: '12px',
              cursor:
                loading
                  ? 'not-allowed'
                  : 'pointer',
              opacity:
                loading
                  ? 0.7
                  : 1,
            }}
          >
            {loading
              ? 'Logging in...'
              : 'Login'}
          </button>

        </form>


        {/* REGISTER */}

        <p
          style={{
            marginTop: '20px',
            marginBottom: 0,
            textAlign: 'center',
          }}
        >
          Don&apos;t have an account?{' '}

          <Link
            to="/register"
          >
            Create one
          </Link>
        </p>

      </div>
    </div>
  );
}