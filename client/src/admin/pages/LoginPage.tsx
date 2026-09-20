import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Leaf, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/FormField';

export default function LoginPage() {
  const { signIn, isAuthenticated, loading: authLoading } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!authLoading && isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err?.message ?? 'Sign-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-500 flex items-center justify-center mb-3">
            <Leaf size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-neutral-800 text-center">Agrawal General & Provisional Store</h1>
          <p className="text-xs text-neutral-500 mt-1">Admin Console — Sign in to manage your store</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card p-6 lg:p-8">
          {error && (
            <div className="flex items-start gap-2 bg-rose-50 text-rose-700 text-sm rounded-xl px-4 py-3 mb-5">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email</label>
          <div className="relative mb-4">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="pl-10"
            />
          </div>

          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Password</label>
          <div className="relative mb-6">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pl-10"
            />
          </div>

          <Button type="submit" size="lg" loading={submitting} className="w-full">
            Sign In
          </Button>

        </form>

        <p className="text-center text-xs text-neutral-400 mt-6">
          Protected area · authorized staff only
        </p>
      </div>
    </div>
  );
}
