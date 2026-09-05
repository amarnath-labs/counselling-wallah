import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

import {
  useAuth,
} from '../hooks/AuthContext';


/*
|--------------------------------------------------------------------------
| USER INITIALS
|--------------------------------------------------------------------------
*/

function getInitials(user) {
  const name = String(
    user?.name ||
    user?.fullName ||
    user?.email ||
    ''
  ).trim();

  if (!name) {
    return 'U';
  }

  /*
  |--------------------------------------------------------------------------
  | EMAIL FALLBACK
  |--------------------------------------------------------------------------
  */

  if (name.includes('@')) {
    return name
      .charAt(0)
      .toUpperCase();
  }

  const parts =
    name
      .split(/\s+/)
      .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .charAt(0)
      .toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[
      parts.length - 1
    ].charAt(0)
  ).toUpperCase();
}


/*
|--------------------------------------------------------------------------
| DISPLAY NAME
|--------------------------------------------------------------------------
*/

function getDisplayName(user) {
  return (
    user?.name ||
    user?.fullName ||
    user?.email ||
    'My Account'
  );
}


/*
|--------------------------------------------------------------------------
| NAVBAR
|--------------------------------------------------------------------------
*/

export default function Navbar() {
  const navigate =
    useNavigate();

  const {
    user,
    authLoading,
    logoutUser,
  } = useAuth();

  const [
    menuOpen,
    setMenuOpen,
  ] = useState(false);

  const menuRef =
    useRef(null);


  /*
  |--------------------------------------------------------------------------
  | CLOSE ACCOUNT MENU WHEN CLICKED OUTSIDE
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      function handleOutsideClick(
        event
      ) {
        if (
          menuRef.current &&
          !menuRef.current.contains(
            event.target
          )
        ) {
          setMenuOpen(false);
        }
      }

      document.addEventListener(
        'mousedown',
        handleOutsideClick
      );

      return () => {
        document.removeEventListener(
          'mousedown',
          handleOutsideClick
        );
      };
    },
    []
  );


  /*
  |--------------------------------------------------------------------------
  | CLOSE ACCOUNT MENU WITH ESCAPE
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      function handleEscape(
        event
      ) {
        if (
          event.key ===
          'Escape'
        ) {
          setMenuOpen(false);
        }
      }

      document.addEventListener(
        'keydown',
        handleEscape
      );

      return () => {
        document.removeEventListener(
          'keydown',
          handleEscape
        );
      };
    },
    []
  );


  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  async function handleLogout() {
    try {
      await logoutUser();

    } catch (error) {
      console.error(
        '[NAVBAR LOGOUT ERROR]',
        error
      );

    } finally {
      setMenuOpen(false);

      navigate(
        '/',
        {
          replace: true,
        }
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | USER DISPLAY VALUES
  |--------------------------------------------------------------------------
  */

  const initials =
    getInitials(user);

  const displayName =
    getDisplayName(user);


  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <nav className="navbar">
      <div
        className="container nav-inner"
      >

        {/* =====================================================
            LEFT — LOGO + BETA BADGE
        ===================================================== */}

        <Link
          to="/"
          className="brand"
          aria-label="TruMarg home"
        >
          <div className="mark" />

          <span>
            TruMarg
          </span>

          <span
            className="beta-badge"
            title="TruMarg Beta"
          >
            BETA
          </span>
        </Link>


        {/* =====================================================
            CENTER — NAVIGATION
        ===================================================== */}

        <div className="nav-links">

          <Link to="/">
            Home
          </Link>

          <Link to="/exams">
            Find Colleges
          </Link>

          <Link to="/exams">
            Exams
          </Link>

          <Link to="/compare">
            Compare
          </Link>

          <Link to="/pricing">
            Pricing
          </Link>

        </div>


        {/* =====================================================
            RIGHT — AUTH + CTA
        ===================================================== */}

        <div className="nav-cta">

          {/* ===================================================
              AUTH LOADING
          =================================================== */}

          {authLoading && (
            <div
              className="nav-auth-placeholder"
              aria-hidden="true"
            />
          )}


          {/* ===================================================
              NOT LOGGED IN
          =================================================== */}

          {!authLoading &&
            !user && (
              <Link
                to="/login"
                className="btn btn-ghost btn-sm nav-login-btn"
              >
                Login
              </Link>
            )}


          {/* ===================================================
              LOGGED IN
          =================================================== */}

          {!authLoading &&
            user && (
              <div
                ref={menuRef}
                className="nav-user"
              >

                {/* =============================================
                    USER AVATAR
                ============================================= */}

                <button
                  type="button"
                  className="nav-avatar"
                  onClick={() =>
                    setMenuOpen(
                      (current) =>
                        !current
                    )
                  }
                  aria-label="Open account menu"
                  aria-haspopup="menu"
                  aria-expanded={
                    menuOpen
                  }
                  title={
                    displayName
                  }
                >
                  {initials}
                </button>


                {/* =============================================
                    ACCOUNT DROPDOWN
                ============================================= */}

                {menuOpen && (
                  <div
                    className="nav-account-menu"
                    role="menu"
                  >

                    {/* ACCOUNT HEADER */}

                    <div
                      className="nav-account-header"
                    >
                      <div
                        className="nav-account-name"
                      >
                        {displayName}
                      </div>

                      {user?.email && (
                        <div
                          className="nav-account-email"
                        >
                          {user.email}
                        </div>
                      )}
                    </div>


                    {/* MY ACCOUNT */}

                    <Link
                      to="/account"
                      className="nav-account-item"
                      role="menuitem"
                      onClick={() =>
                        setMenuOpen(
                          false
                        )
                      }
                    >
                      My Account
                    </Link>


                    {/* MY PROFILE */}

                    <Link
                      to="/profile"
                      className="nav-account-item"
                      role="menuitem"
                      onClick={() =>
                        setMenuOpen(
                          false
                        )
                      }
                    >
                      My Profile
                    </Link>


                    {/* DASHBOARD */}

                    <Link
                      to="/dashboard"
                      className="nav-account-item"
                      role="menuitem"
                      onClick={() =>
                        setMenuOpen(
                          false
                        )
                      }
                    >
                      Dashboard
                    </Link>


                    {/* SAVED / CHOICE LIST */}

                    <Link
                      to="/choice-list"
                      className="nav-account-item"
                      role="menuitem"
                      onClick={() =>
                        setMenuOpen(
                          false
                        )
                      }
                    >
                      Saved / Choice List
                    </Link>


                    {/* LOGOUT */}

                    <button
                      type="button"
                      className="nav-account-item nav-account-logout"
                      role="menuitem"
                      onClick={
                        handleLogout
                      }
                    >
                      Logout
                    </button>

                  </div>
                )}

              </div>
            )}


          {/* ===================================================
              FIND MY COLLEGE
          =================================================== */}

          <Link
            to="/exams"
            className="btn btn-primary btn-sm nav-find-college-btn"
          >
            Find My College
          </Link>

        </div>

      </div>
    </nav>
  );
}
