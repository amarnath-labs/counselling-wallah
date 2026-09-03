import {
  useEffect,
  useState,
} from 'react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

import {
  register,
} from '../services/authService';

import {
  useAuth,
} from '../hooks/AuthContext';


export default function Register() {
  const navigate =
    useNavigate();


  const {
    user,
    authLoading,
    refreshUser,
  } =
    useAuth();


  const [
    form,
    setForm,
  ] =
    useState({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    });


  const [
    loading,
    setLoading,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState('');


  useEffect(
    () => {
      if (
        !authLoading &&
        user
      ) {
        navigate(
          '/account',
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


  function change(
    event
  ) {
    setForm(
      (
        current
      ) => ({
        ...current,

        [event.target.name]:
          event.target.value,
      })
    );
  }


  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setError('');


    if (
      form.password !==
      form.confirmPassword
    ) {
      setError(
        'Passwords do not match'
      );

      return;
    }


    if (
      form.password.length <
      8
    ) {
      setError(
        'Password must be at least 8 characters'
      );

      return;
    }


    setLoading(true);


    try {
      await register({
        name:
          form.name.trim(),

        email:
          form.email
            .trim()
            .toLowerCase(),

        phone:
          form.phone.trim(),

        password:
          form.password,
      });


      const currentUser =
        await refreshUser();


      if (!currentUser) {
        throw new Error(
          'Account created but session could not be loaded'
        );
      }


      navigate(
        '/account',
        {
          replace:
            true,
        }
      );

    } catch (
      err
    ) {
      setError(
        err?.message ||
        'Unable to create account'
      );

    } finally {
      setLoading(false);
    }
  }


  return (
    <div
      className="container section"
    >
      <div
        className="card"
        style={{
          maxWidth:
            '520px',

          margin:
            '0 auto',

          padding:
            '32px',
        }}
      >
        <h2>
          Create Account
        </h2>


        {error && (
          <div
            style={{
              padding:
                '12px',

              marginBottom:
                '16px',

              background:
                '#ffe8e8',

              color:
                '#b00020',
            }}
          >
            {error}
          </div>
        )}


        <form
          onSubmit={
            handleSubmit
          }
        >
          <div className="field">
            <label>Name</label>

            <input
              name="name"
              value={
                form.name
              }
              required
              onChange={
                change
              }
            />
          </div>


          <div className="field">
            <label>Email</label>

            <input
              type="email"
              name="email"
              value={
                form.email
              }
              required
              onChange={
                change
              }
            />
          </div>


          <div className="field">
            <label>Phone</label>

            <input
              name="phone"
              value={
                form.phone
              }
              onChange={
                change
              }
            />
          </div>


          <div className="field">
            <label>Password</label>

            <input
              type="password"
              name="password"
              value={
                form.password
              }
              required
              minLength={8}
              onChange={
                change
              }
            />
          </div>


          <div className="field">
            <label>
              Confirm Password
            </label>

            <input
              type="password"
              name="confirmPassword"
              value={
                form.confirmPassword
              }
              required
              minLength={8}
              onChange={
                change
              }
            />
          </div>


          <button
            className="btn btn-primary"
            type="submit"
            disabled={
              loading
            }
            style={{
              width:
                '100%',

              marginTop:
                '15px',
            }}
          >
            {loading
              ? 'Creating...'
              : 'Create Account'}
          </button>
        </form>


        <p
          style={{
            marginTop:
              '20px',
          }}
        >
          Already registered?{' '}

          <Link to="/login">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}