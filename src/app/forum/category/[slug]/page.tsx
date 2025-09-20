'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import ButtonPrimary from '@/shared/Button/ButtonPrimary';
import Avatar from '@/shared/Avatar/Avatar';

interface Thread {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    image: string;
    subscriptionTier?: string;
  };
  createdAt: string;
  replyCount: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
  threadCount: number;
}

export default function CategoryPage() {
  const params = useParams();
  const slug = params?.slug;
  const { data: session } = useSession();
  const [category, setCategory] = React.useState<Category | null>(null);
  const [threads, setThreads] = React.useState<Thread[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchCategoryAndThreads = async () => {
      try {
        setError(null);
        // Fetch category details
        const categoryResponse = await fetch(`/api/forum/categories/${slug}`);
        const categoryData = await categoryResponse.json();

        if (!categoryResponse.ok) {
          throw new Error(categoryData.error || 'Failed to fetch category');
        }

        setCategory(categoryData.category);

        // Fetch threads in this category
        const threadsResponse = await fetch(`/api/forum/categories/${slug}/threads`);
        const threadsData = await threadsResponse.json();

        if (!threadsResponse.ok) {
          throw new Error(threadsData.error || 'Failed to fetch threads');
        }

        setThreads(threadsData.threads);
      } catch (error) {
        console.error('Error:', error);
        setError(error instanceof Error ? error.message : 'Failed to load category');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchCategoryAndThreads();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-neutral-200 rounded w-2/3 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-neutral-100 p-6 rounded-lg">
                <div className="h-6 bg-neutral-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-neutral-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-200 p-4 rounded-lg mb-6">
          {error || 'Category not found'}
        </div>
        <Link href="/forum">
          <ButtonPrimary>Return to Forum</ButtonPrimary>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
          <p className="text-neutral-600 dark:text-neutral-300">{category.description}</p>
        </div>
        {session?.user && (
          <Link href={`/forum/new-thread?category=${category.id}`}>
            <ButtonPrimary>Start New Thread</ButtonPrimary>
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {threads.map((thread) => (
          <div
            key={thread.id}
            className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-grow">
                <Link
                  href={`/forum/thread/${thread.id}`}
                  className="text-xl font-semibold hover:text-primary-600 hover:underline mb-2 block"
                >
                  {thread.title}
                </Link>
                <div className="flex items-center space-x-4 text-sm text-neutral-500">
                  <div className="flex items-center space-x-2">
                    <Avatar
                      imgUrl={thread.author.image}
                      sizeClass="w-6 h-6"
                    />
                    <Link
                      href={`/profile/${thread.author.id}`}
                      className="font-medium text-primary-600 hover:text-primary-500 flex items-center"
                    >
                      {thread.author.name}
                      {(thread.author.subscriptionTier === 'plus' || thread.author.subscriptionTier === 'gold') && (
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                          thread.author.subscriptionTier === 'gold'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {thread.author.subscriptionTier?.toUpperCase()}
                        </span>
                      )}
                    </Link>
                  </div>
                  <span>•</span>
                  <time dateTime={thread.createdAt}>
                    {new Date(thread.createdAt).toLocaleDateString()}
                  </time>
                  <span>•</span>
                  <span>{thread.replyCount} replies</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {threads.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-neutral-800 rounded-lg">
            <p className="text-neutral-600 dark:text-neutral-300 mb-4">
              No threads in this category yet.
            </p>
            {session?.user && (
              <Link href={`/forum/new-thread?category=${category.id}`}>
                <ButtonPrimary>Start the First Thread</ButtonPrimary>
              </Link>
            )}
          </div>
        )}
      </div>

      {!session?.user && threads.length === 0 && (
        <div className="mt-8 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Join the Discussion</h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Sign in to start a new thread and participate in discussions.
          </p>
          <Link href="/login">
            <ButtonPrimary>Sign In</ButtonPrimary>
          </Link>
        </div>
      )}
    </div>
  );
} 