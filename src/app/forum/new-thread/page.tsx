'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ButtonPrimary from '@/shared/Button/ButtonPrimary';
import ButtonSecondary from '@/shared/Button/ButtonSecondary';

interface Category {
  id: string;
  name: string;
  slug: string;
}

const NewThreadPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    // Redirect if not logged in
    if (!session?.user) {
      router.push('/login');
      return;
    }

    // Fetch categories
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/forum/categories');
        const data = await response.json();
        setCategories(data.categories);
        if (data.categories.length > 0) {
          setCategoryId(data.categories[0].id);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setError('Failed to load categories. Please try again later.');
      }
    };

    fetchCategories();
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/forum/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          categoryId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Thread creation failed:', data);
        throw new Error(data.error || 'Failed to create thread');
      }

      if (!data.thread?.id) {
        console.error('No thread ID returned:', data);
        throw new Error('Invalid server response - missing thread ID');
      }

      // Only redirect if we have a valid thread ID
      router.push(`/forum/thread/${data.thread.id}`);
    } catch (error) {
      console.error('Error creating thread:', error);
      setError(error instanceof Error ? error.message : 'Failed to create thread');
      // Stay on the current page when there's an error
      setIsSubmitting(false);
      return;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Start New Thread</h1>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-200 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Category
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="block w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-neutral-900 dark:text-neutral-100 focus:border-primary-500 focus:ring-primary-500"
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-neutral-900 dark:text-neutral-100 focus:border-primary-500 focus:ring-primary-500"
              placeholder="Enter thread title"
              required
              minLength={3}
              maxLength={200}
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="block w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-neutral-900 dark:text-neutral-100 focus:border-primary-500 focus:ring-primary-500"
              rows={8}
              placeholder="Write your thread content here..."
              required
              minLength={10}
            />
          </div>

          <div className="flex space-x-4">
            <ButtonPrimary
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Creating Thread...' : 'Create Thread'}
            </ButtonPrimary>
            <ButtonSecondary
              type="button"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancel
            </ButtonSecondary>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewThreadPage; 