import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Lock, Mail, AlertCircle, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate('/dashboard');
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      if (res.data.success && res.data.data) {
        login(res.data.data.token, res.data.data.admin);
        toast.success('Welcome back, ' + res.data.data.admin.name);
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Login failed. Please check your credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen cyber-bg flex items-center justify-center px-4 relative overflow-hidden">

      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-shield-500/50 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-shield-500/30 to-transparent" />
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-shield-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-shield-600/10 rounded-full blur-3xl" />
        {/* Hexagonal pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V16L28 0l28 16v34L28 66zm0-2l26-15V18L28 2 2 18v31l26 15z' fill='%233b82f6'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="w-full max-w-md relative">

        {/* Card */}
        <div className="glass-card p-8 relative overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-shield-500 to-transparent" />

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-shield-600/20 border border-shield-500/40 mb-4 animate-glow-pulse">
              <Shield size={32} className="text-shield-400" />
            </div>
            <h1 className="text-2xl font-bold text-dark-50 tracking-tight">
              The Shield Protocol
            </h1>
            <p className="text-dark-400 text-sm mt-1.5">
              QR &amp; Email Automation System
            </p>
            <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-shield-600/10 border border-shield-600/30 rounded-full">
              <Zap size={11} className="text-shield-400" />
              <span className="text-xs text-shield-400 font-medium">Admin Access Only</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-5">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@shieldprotocol.com"
                  className="input-field pl-10"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="input-field pl-10 pr-10"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded bg-dark-800 border-dark-600 text-shield-500 focus:ring-shield-500/50"
                />
                <span className="text-xs text-dark-400">Remember me</span>
              </label>
              <button
                type="button"
                className="text-xs text-shield-400 hover:text-shield-300 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center mt-2 py-3"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield size={16} />
                  Access System
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-5 border-t border-dark-700/60 text-center">
            <p className="text-xs text-dark-600">
              © 2026 The Shield Protocol — Internal Admin System
            </p>
            <p className="text-xs text-dark-700 mt-1">Unauthorized access is prohibited</p>
          </div>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="flex items-center gap-1.5 text-xs text-dark-600">
            <Lock size={11} />
            <span>256-bit encrypted</span>
          </div>
          <span className="text-dark-700">•</span>
          <div className="flex items-center gap-1.5 text-xs text-dark-600">
            <Shield size={11} />
            <span>JWT authenticated</span>
          </div>
        </div>
      </div>
    </div>
  );
}
