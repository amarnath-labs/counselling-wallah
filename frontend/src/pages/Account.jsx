import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCurrentUser,
  logout,
} from '../services/authService';

export default function Account() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then((result) => {
        setUser(result?.data?.user || null);
      })
      .catch(() => {
        navigate('/login');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  if (loading) {
    return (
      <div className="container section">
        Loading account...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container section">
      <div
        className="card"
        style={{
          maxWidth: '650px',
          margin: '0 auto',
          padding: '32px',
        }}
      >
        <h2>My Account</h2>

        <p>
          <strong>Name:</strong> {user.name}
        </p>

        <p>
          <strong>Email:</strong> {user.email}
        </p>

        <p>
          <strong>Phone:</strong>{' '}
          {user.phone || 'Not provided'}
        </p>

        <p>
          <strong>Role:</strong> {user.role}
        </p>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleLogout}
          style={{
            marginTop: '20px',
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
