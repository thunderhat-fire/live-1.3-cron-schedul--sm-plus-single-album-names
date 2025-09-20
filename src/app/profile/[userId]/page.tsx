'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ButtonPrimary from '@/shared/Button/ButtonPrimary';
import Avatar from '@/shared/Avatar/Avatar';
import VerifyIcon from '@/components/VerifyIcon';
import { useSession } from 'next-auth/react';

interface Thread {
  id: string;
  title: string;
  createdAt: string;
  replyCount: number;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

interface UserProfile {
  id: string;
  name: string;
  image: string;
  subscriptionTier?: string;
  bio?: string;
  joinedAt: string;
  threadCount: number;
  replyCount: number;
  threads: Thread[];
}

export default function ProfilePage() {
  const params = useParams();
  const userId = params?.userId;
  const { data: session } = useSession();
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        setError(null);
        const response = await fetch(`/api/users/${userId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch profile');
        }

        setProfile(data.profile);
      } catch (error) {
        console.error('Error:', error);
        setError(error instanceof Error ? error.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-20 h-20 bg-neutral-200 rounded-full"></div>
              <div>
                <div className="h-6 bg-neutral-200 rounded w-48 mb-2"></div>
                <div className="h-4 bg-neutral-200 rounded w-24"></div>
              </div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-neutral-100 p-6 rounded-lg">
                  <div className="h-5 bg-neutral-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-neutral-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-200 p-4 rounded-lg mb-6">
            {error || 'User not found'}
          </div>
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
        <div className="flex items-start space-x-6 mb-8">
          <Avatar
            imgUrl={profile.image}
            sizeClass="w-20 h-20"
          />
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold">{profile.name}</h1>
              <VerifyIcon 
                className="ml-1" 
                iconClass="w-5 h-5" 
                subscriptionTier={profile.subscriptionTier}
              />
            </div>
            <Link 
              href={`/author/${profile.id}`}
              className="text-sm text-primary-600 hover:text-primary-500 hover:underline mt-1 block"
            >
              View Author Page
            </Link>
            {profile.bio && (
              <p className="text-neutral-600 dark:text-neutral-300 mt-2">
                {profile.bio}
              </p>
            )}
            <div className="flex items-center space-x-4 mt-3 text-sm text-neutral-500">
              <span>Joined {new Date(profile.joinedAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>{profile.threadCount} threads</span>
              <span>•</span>
              <span>{profile.replyCount} replies</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold mb-4">Recent Threads</h2>
          {profile.threads.map((thread) => (
            <div
              key={thread.id}
              className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6"
            >
              <Link
                href={`/forum/thread/${thread.id}`}
                className="text-lg font-medium hover:text-primary-600 hover:underline block mb-2"
              >
                {thread.title}
              </Link>
              <div className="flex items-center space-x-4 text-sm text-neutral-500">
                <Link
                  href={`/forum/category/${thread.category.slug}`}
                  className="hover:text-primary-600 hover:underline"
                >
                  {thread.category.name}
                </Link>
                <span>•</span>
                <time dateTime={thread.createdAt}>
                  {new Date(thread.createdAt).toLocaleDateString()}
                </time>
                <span>•</span>
                <span>{thread.replyCount} replies</span>
              </div>
            </div>
          ))}

          {profile.threads.length === 0 && (
            <p className="text-center py-8 text-neutral-500">
              No threads created yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}