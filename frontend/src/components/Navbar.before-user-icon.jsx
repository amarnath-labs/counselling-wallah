import {
  Link,
  useNavigate,
} from 'react-router-dom';

import {
  useAuth,
} from '../hooks/AuthContext';


export default function Navbar() {
  const navigate =
    useNavigate();


  const {
    user,
    authLoading,
    logoutUser,
  } =
    useAuth();


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


  return (
    <nav className="topnav">
      <div className="topnav-inner">

        <Link
          className="brand"
          to="/"
        >
          <div className="mark" />
          Counselling Wallah
        </Link>


        <div className="nav-links">
          <Link to="/">
            Home
          </Link>

          <Link to="/exams">
            Find Colleges
          </Link>

          <Link to="/compare">
            Compare
          </Link>

          <Link to="/pricing">
            Pricing
          </Link>
        </div>


        <div className="nav-cta">

          {!authLoading &&
            !user && (
            <>
              <Link
                className="btn btn-ghost btn-sm"
                to="/login"
              >
                Login
              </Link>

              <Link
                className="btn btn-ghost btn-sm"
                to="/register"
              >
                Register
              </Link>
            </>
          )}


          {!authLoading &&
            user && (
            <>
              <Link
                className="btn btn-ghost btn-sm"
                to="/account"
              >
                {user.name ||
                  'Account'}
              </Link>

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={
                  handleLogout
                }
              >
                Logout
              </button>
            </>
          )}


          <Link
            className="btn btn-primary btn-sm"
            to="/exams"
          >
            Find My College
          </Link>

        </div>
      </div>
    </nav>
  );
}