import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { authService } from '../services/authService';

const SignUp = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasSessionToken = useAuthStore((state) => Boolean(state.accessToken || state.refreshToken));
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTarget = location.state?.from?.pathname || location.state?.from || '/dashboard';

  useEffect(() => {
    if (hasHydrated && isAuthenticated && hasSessionToken) {
      navigate(redirectTarget, { replace: true });
    }
  }, [hasHydrated, isAuthenticated, hasSessionToken, navigate, redirectTarget]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const data = await authService.register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName
      );
      setAuth(data.user, data.tokens.accessToken, data.tokens.refreshToken);
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-bg paper-texture flex items-center justify-center px-4">
      <div className="glass-strong rounded-3xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Create Account
        </h1>

        {error && (
          <div
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="signup-first-name" className="block text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">
                First Name
              </label>
              <input
                type="text"
                id="signup-first-name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-3 glass rounded-xl border border-white/20 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                placeholder="John"
                autoComplete="given-name"
                required
              />
            </div>
            <div>
              <label htmlFor="signup-last-name" className="block text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">
                Last Name
              </label>
              <input
                type="text"
                id="signup-last-name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-3 glass rounded-xl border border-white/20 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                placeholder="Doe"
                autoComplete="family-name"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              id="signup-email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 glass rounded-xl border border-white/20 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              id="signup-password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 glass rounded-xl border border-white/20 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </div>

          <div>
            <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="signup-confirm-password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 glass rounded-xl border border-white/20 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 btn-glass text-white rounded-xl font-semibold disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-700 dark:text-gray-300">
          Already have an account?{' '}
          <Link to="/login" state={{ from: redirectTarget }} className="text-purple-600 dark:text-purple-400 font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
