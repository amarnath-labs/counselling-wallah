import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/authService';

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function update(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      await register(form);

      navigate('/account');
    } catch (err) {
      setError(
        err?.message ||
        'Unable to create account'
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
        <h2>Create Account</h2>

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
            <label>Name</label>

            <input
              value={form.name}
              onChange={(e) =>
                update('name', e.target.value)
              }
              required
            />
          </div>

          <div className="field">
            <label>Email</label>

            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                update('email', e.target.value)
              }
              required
            />
          </div>

          <div className="field">
            <label>Phone</label>

            <input
              value={form.phone}
              onChange={(e) =>
                update('phone', e.target.value)
              }
            />
          </div>

          <div className="field">
            <label>Password</label>

            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                update('password', e.target.value)
              }
              minLength={8}
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
            {loading
              ? 'Creating account...'
              : 'Create Account'}
          </button>
        </form>

        <p style={{ marginTop: '20px' }}>
          Already have an account?{' '}
          <Link to="/login">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
