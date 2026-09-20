import {
  useEffect,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  useAuth,
} from '../hooks/AuthContext';


export default function Account() {
  const navigate =
    useNavigate();


  const {
    user,
    authLoading,
    logoutUser,
  } =
    useAuth();


  useEffect(
    () => {
      if (
        !authLoading &&
        !user
      ) {
        navigate(
          '/login',
          {
            replace:
              true,
          }
        );
      }
    },
    [
      authLoading,
      user,
      navigate,
    ]
  );


  async function handleLogout() {
    await logoutUser();

    navigate(
      '/',
      {
        replace:
          true,
      }
    );
  }


  if (
    authLoading
  ) {
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
          maxWidth:
            '650px',

          margin:
            '0 auto',

          padding:
            '32px',
        }}
      >
        <h2>
          My Account
        </h2>

        <p>
          <strong>Name:</strong>{' '}
          {user.name}
        </p>

        <p>
          <strong>Email:</strong>{' '}
          {user.email}
        </p>

        <p>
          <strong>Role:</strong>{' '}
          {user.role}
        </p>


        <button
          type="button"
          className="btn btn-primary"
          onClick={
            handleLogout
          }
        >
          Logout
        </button>
      </div>
    </div>
  );
}