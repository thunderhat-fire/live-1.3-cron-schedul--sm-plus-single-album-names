'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import ButtonPrimary from '@/shared/Button/ButtonPrimary';
import Avatar from '@/shared/Avatar/Avatar';

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  slug: string;
  threadCount: number;
  lastThread?: {
    id: string;
    title: string;
    author: {
      id: string;
      name: string;
      image: string;
      subscriptionTier?: string;
    };
    createdAt: string;
  };
}

const ForumPage = () => {
  const { data: session } = useSession();
  const [categories, setCategories] = React.useState<ForumCategory[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        setError(null);
        const response = await fetch('/api/forum/categories');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch categories');
        }
        
        if (!data.categories || !Array.isArray(data.categories)) {
          throw new Error('Invalid response format');
        }

        console.log('Fetched categories:', data.categories);
        setCategories(data.categories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setError(error instanceof Error ? error.message : 'Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-neutral-100 p-6 rounded-lg">
                <div className="h-6 bg-neutral-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-neutral-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-200 p-4 rounded-lg">
          <p>Error: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Community Forum</h1>
        {session?.user && (
          <Link href="/forum/new-thread">
            <ButtonPrimary>Start New Thread</ButtonPrimary>
          </Link>
        )}
      </div>

      <div className="space-y-6">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6"
          >
            <div className="flex justify-between items-start">
              <Link href={`/forum/category/${category.slug}`} className="flex-grow">
                <div>
                  <h2 className="text-xl font-semibold mb-2">{category.name}</h2>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    {category.description}
                  </p>
                </div>
              </Link>
              <Link 
                href={`/forum/category/${category.slug}`}
                className="text-sm text-neutral-500 ml-4 hover:text-primary-600 hover:underline"
              >
                {category.threadCount} threads
              </Link>
            </div>

            {category.lastThread && (
              <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center space-x-3 text-sm text-neutral-500">
                  <div className="flex-shrink-0">
                    <Avatar 
                      imgUrl={category.lastThread.author.image}
                      sizeClass="w-8 h-8"
                    />
                  </div>
                  <div className="flex-grow">
                    <Link 
                      href={`/forum/thread/${category.lastThread.id}`}
                      className="font-medium text-neutral-700 dark:text-neutral-300 hover:underline"
                    >
                      {category.lastThread.title}
                    </Link>
                    <div className="flex items-center mt-1">
                      <span>by</span>
                      <Link 
                        href={`/profile/${category.lastThread.author.id}`}
                        className="ml-1 font-medium text-primary-600 hover:text-primary-500 flex items-center"
                      >
                        {category.lastThread.author.name}
                        {(category.lastThread.author.subscriptionTier === 'plus' || category.lastThread.author.subscriptionTier === 'gold') && (
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            category.lastThread.author.subscriptionTier === 'gold'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {category.lastThread.author.subscriptionTier?.toUpperCase()}
                          </span>
                        )}
                      </Link>
                      <span className="mx-2">•</span>
                      <span className="text-neutral-500">
                        {new Date(category.lastThread.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {categories.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-neutral-600 dark:text-neutral-300">
            No forum categories found.
          </p>
        </div>
      )}

      {!session?.user && (
        <div className="mt-8 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Join the Discussion</h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Sign in to participate in discussions and connect with other vinyl enthusiasts.
          </p>
          <Link href="/login">
            <ButtonPrimary>Sign In</ButtonPrimary>
          </Link>
        </div>
      )}
    </div>
  );
};

export default ForumPage; 