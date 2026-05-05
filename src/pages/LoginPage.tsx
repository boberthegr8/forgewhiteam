import { useState } from 'react';
import { useAppStore } from '../lib/store';
import { useToast } from '../lib/toast';
import { Truck, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

export function LoginPage() {
  const { login, loginWithGoogle } = useAppStore();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 400));
    const result = login(email, password);
    setLoading(false);
    if (result.success) {
      addToast('Welcome back!', 'success');
    } else {
      setError(result.error || 'Login failed.');
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setError('');
      try {
        // Fetch user info from Google
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const info = await res.json();
        const result = loginWithGoogle(info.email, info.name);
        if (result.success) {
          addToast(`Welcome, ${info.given_name || info.name}!`, 'success');
        } else {
          setError(result.error || 'No account found for that Google address. Ask your admin to create one.');
        }
      } catch {
        setError('Google sign-in failed. Please try again.');
      }
      setGoogleLoading(false);
    },
    onError: () => {
      setError('Google sign-in was cancelled or failed.');
      setGoogleLoading(false);
    },
  });

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      {/* Background gradient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#f97316] rounded-full blur-[180px] opacity-[0.04]" />
      </div>

      <div className="w-full max-w-[400px] animate-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-[14px] bg-[#f97316] flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(249,115,22,0.35)]">
            <Truck className="text-white w-9 h-9" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Forge AM</h1>
          <p className="text-[#9ca3af] text-sm mt-1 tracking-widest uppercase">V2.1414</p>
        </div>

        {/* Card */}
        <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-[12px] p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-1">Sign in to your account</h2>
          <p className="text-[#9ca3af] text-sm mb-6">Enter your credentials to continue</p>

          {/* Google SSO */}
          <button
            type="button"
            onClick={() => handleGoogleLogin()}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-[#252525] border border-[#3a3a3a] hover:bg-[#2e2e2e] hover:border-[#4a4a4a] text-white text-sm font-semibold py-2.5 px-4 rounded-[8px] transition mb-4"
          >
            {googleLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#2e2e2e]" />
            <span className="text-[11px] text-[#6b7280] uppercase tracking-wider font-semibold">or</span>
            <div className="flex-1 h-px bg-[#2e2e2e]" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Email</span>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
                <input
                  type="email"
                  className="win-input w-full pl-10"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoFocus
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Password</span>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
                <input
                  type={showPw ? 'text' : 'password'}
                  className="win-input w-full pl-10 pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-white transition">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>

            {error && (
              <div className="bg-[#3b1a1a] border border-[#ef4444]/30 rounded-[6px] p-3 text-sm text-[#ef4444] flex items-center gap-2">
                <span className="text-base">⚠</span> {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="win-btn win-btn-primary w-full flex items-center justify-center gap-2 mt-2 py-3 text-base">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</>
              ) : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-[#6b7280] text-xs mt-6">
          Forge AM V2.1414 · JK Hardware Group
        </p>
      </div>
    </div>
  );
}
