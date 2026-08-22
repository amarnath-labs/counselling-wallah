import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/authService';

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      await login({
        email,
        password,
      });

      navigate('/account');
    } catch (err) {
      setError(
        err?.message ||
        'Unable to login'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container section">
      <div
        className="card"
        style={{
          maxWidth: '500px',
          margin: '0 auto',
          padding: '32px',
        }}
      >
        <h2>Login</h2>

        <p>
          Login to access your counselling profile.
        </p>

        {error && (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px',
              borderRadius: '8px',
              background: '#ffe8e8',
              color: '#b00020',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
            />
          </div>

          <div className="field">
            <label>Password</label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              marginTop: '12px',
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p style={{ marginTop: '20px' }}>
          Don't have an account?{' '}
          <Link to="/register">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
