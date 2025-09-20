'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Input from '@/shared/Input/Input';
import ButtonPrimary from '@/shared/Button/ButtonPrimary';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null); // Clear error when user types
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      // Registration successful
      router.push('/login?registered=true');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mb-24 lg:mb-32">
      <div className="max-w-md mx-auto space-y-6">
        <div className="grid gap-3">
          <div className="text-center">
            <h2 className="text-3xl font-semibold">Sign up</h2>
            <span className="block text-sm mt-2 text-neutral-700 dark:text-neutral-300">
              Already have an account? {' '}
              <Link href="/login" className="text-green-600">
                Sign in
              </Link>
            </span>
          </div>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            <div className="grid gap-3">
              <label className="block">
                <span className="text-neutral-800 dark:text-neutral-200">
                  Full name
                </span>
                <Input
                  id="name"
                  type="text"
                  name="name"
                  className="mt-1"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                />
              </label>
              <label className="block">
                <span className="text-neutral-800 dark:text-neutral-200">
                  Email address
                </span>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  className="mt-1"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </label>
              <label className="block">
                <span className="text-neutral-800 dark:text-neutral-200">
                  Password
                </span>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  className="mt-1"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
              </label>
              <label className="block">
                <span className="text-neutral-800 dark:text-neutral-200">
                  Confirm Password
                </span>
                <Input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  className="mt-1"
                  required
                  minLength={8}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
              </label>
            </div>
            <ButtonPrimary type="submit" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create account'}
            </ButtonPrimary>
          </form>
        </div>
      </div>
    </div>
  );
}
