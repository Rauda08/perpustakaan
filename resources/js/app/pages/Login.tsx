import { useState } from 'react';
import { Lock, User, AlertCircle } from 'lucide-react';
import logoImage from '../../imports/logoperpus.png';

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim()) {
      setErrorMsg('Username wajib diisi.');
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Password wajib diisi.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || result?.success === false) {
        const message =
          result?.message ||
          result?.errors?.username?.[0] ||
          result?.errors?.password?.[0] ||
          'Username atau password salah.';

        setErrorMsg(message);
        return;
      }

      if (result?.token) {
        localStorage.setItem('auth_token', result.token);
      }

      if (result?.data) {
        localStorage.setItem('auth_user', JSON.stringify(result.data));
      }

      onLogin();
    } catch {
      setErrorMsg('Gagal terhubung ke server. Pastikan Laravel sedang berjalan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100/40 via-yellow-50/30 to-blue-50/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-border">
          <div className="flex justify-center mb-6">
            <div className="w-28 h-28 flex items-center justify-center">
              <img
                src={logoImage}
                alt="Logo SMAN Bernas"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Sistem Perpustakaan
            </h1>
            <h2 className="text-lg font-semibold text-primary mb-3">
              SMAN Bernas Binsus
            </h2>
            <p className="text-muted-foreground text-sm">
              Masuk untuk melanjutkan
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full pl-11 pr-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Masukkan username"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full pl-11 pr-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-medium transition-all shadow-sm hover:shadow-md ${
                loading
                  ? 'bg-primary/60 text-white cursor-not-allowed'
                  : 'bg-primary hover:bg-primary/90 text-white'
              }`}
            >
              {loading ? 'Memeriksa...' : 'Masuk'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            © 2026 Perpustakaan SMAN Bernas Binsus
          </div>
        </div>
      </div>
    </div>
  );
}
