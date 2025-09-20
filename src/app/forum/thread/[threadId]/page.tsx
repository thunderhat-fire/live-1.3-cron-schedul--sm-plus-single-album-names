'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ButtonPrimary from '@/shared/Button/ButtonPrimary';
import Link from 'next/link';

interface Author {
  id: string;
  name: string;
  image: string;
}

interface Thread {
  id: string;
  title: string;
  content: string;
  author: Author;
  createdAt: string;
  categoryId: string;
}

interface Reply {
  id: string;
  content: string;
  author: Author;
  createdAt: string;
}

export default function ThreadPage() {
  const params = useParams();
  const threadId = params?.threadId;
  const { data: session } = useSession();
  const [thread, setThread] = React.useState<Thread | null>(null);
  const [replies, setReplies] = React.useState<Reply[]>([]);
  const [replyContent, setReplyContent] = React.useState('');
  const [error, setError] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fetchReplies = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/forum/threads/${threadId}/replies`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load replies');
      }

      setReplies(data.replies);
    } catch (error) {
      console.error('Error loading replies:', error);
    }
  }, [threadId]);

  React.useEffect(() => {
    const fetchThread = async () => {
      try {
        const response = await fetch(`/api/forum/threads/${threadId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load thread');
        }

        setThread(data.thread);
        await fetchReplies();
      } catch (error) {
        console.error('Error loading thread:', error);
        setError(error instanceof Error ? error.message : 'Failed to load thread');
      } finally {
        setIsLoading(false);
      }
    };

    if (threadId) {
      fetchThread();
    }
  }, [threadId, fetchReplies]);

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/forum/threads/${threadId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: replyContent }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to post reply');
      }

      setReplyContent('');
      await fetchReplies();
    } catch (error) {
      console.error('Error posting reply:', error);
      setError(error instanceof Error ? error.message : 'Failed to post reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-200 p-4 rounded-lg mb-6">
            {error}
          </div>
          <Link href="/forum">
            <ButtonPrimary>Return to Forum</ButtonPrimary>
          </Link>
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Thread Not Found</h1>
          <Link href="/forum">
            <ButtonPrimary>Return to Forum</ButtonPrimary>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">{thread.title}</h1>
        
        <div className="flex items-center space-x-4 mb-8 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            {thread.author.image && (
              <img
                src={thread.author.image}
                alt={thread.author.name}
                className="w-6 h-6 rounded-full"
              />
            )}
            <Link 
              href={`/profile/${thread.author.id}`}
              className="hover:text-primary-600 hover:underline"
            >
              {thread.author.name}
            </Link>
          </div>
          <span>•</span>
          <time dateTime={thread.createdAt}>
            {new Date(thread.createdAt).toLocaleDateString()}
          </time>
        </div>

        <div className="prose dark:prose-invert max-w-none mb-8">
          {thread.content}
        </div>

        {/* Replies Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Replies</h2>
          
          <div className="space-y-6">
            {replies.map((reply) => (
              <div
                key={reply.id}
                className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-sm"
              >
                <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-2">
                    {reply.author.image && (
                      <img
                        src={reply.author.image}
                        alt={reply.author.name}
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <Link 
                      href={`/profile/${reply.author.id}`}
                      className="hover:text-primary-600 hover:underline"
                    >
                      {reply.author.name}
                    </Link>
                  </div>
                  <span>•</span>
                  <time dateTime={reply.createdAt}>
                    {new Date(reply.createdAt).toLocaleDateString()}
                  </time>
                </div>
                <div className="prose dark:prose-invert max-w-none">
                  {reply.content}
                </div>
              </div>
            ))}

            {replies.length === 0 && (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No replies yet. Be the first to reply!
              </p>
            )}
          </div>

          {/* Reply Form */}
          {session?.user ? (
            <form onSubmit={handleSubmitReply} className="mt-8">
              <div className="mb-4">
                <label
                  htmlFor="reply"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Your Reply
                </label>
                <textarea
                  id="reply"
                  rows={4}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Write your reply here..."
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex justify-end">
                <ButtonPrimary
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Posting...' : 'Post Reply'}
                </ButtonPrimary>
              </div>
            </form>
          ) : (
            <div className="mt-8 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Please sign in to reply to this thread.
              </p>
              <Link href="/login">
                <ButtonPrimary>Sign In</ButtonPrimary>
              </Link>
            </div>
          )}
        </div>

        <div className="flex space-x-4 mt-8">
          <Link href="/forum">
            <ButtonPrimary>Return to Forum</ButtonPrimary>
          </Link>
        </div>
      </div>
    </div>
  );
} 