'use client';

import React, { useEffect, useState } from "react";
import CardAuthorBox from "@/components/CardAuthorBox/CardAuthorBox";
import Pagination from "@/shared/Pagination/Pagination";
import { useSession } from "next-auth/react";

interface User {
  id: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  nftsCount: number;
  followersCount: number;
  isFollowing: boolean;
}

interface Props {
  params: {
    id: string;
  };
}

const FollowersPage = ({ params }: Props) => {
  const { data: session } = useSession();
  const [followers, setFollowers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFollowers = async () => {
      try {
        const response = await fetch(`/api/user/${params?.id}/followers`);
        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
          return;
        }
        
        if (data.success && data.followers) {
          setFollowers(data.followers);
        } else {
          setError(data.error || 'Failed to fetch followers');
        }
      } catch (error) {
        console.error('Error fetching followers:', error);
        setError('Failed to fetch followers. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (params?.id) {
      fetchFollowers();
    }
  }, [params?.id]);

  if (loading) {
    return <div className="container py-10">Loading...</div>;
  }

  if (error) {
    return (
      <div className="container py-10">
        <div className="text-center">
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
            {error}
          </h3>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Please try again later
          </p>
        </div>
      </div>
    );
  }

  if (followers.length === 0) {
    return (
      <div className="container py-10">
        <div className="text-center">
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
            Nothing here yet.
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-10 mt-8 lg:mt-10">
        {followers.map((follower) => (
          <CardAuthorBox 
            key={follower.id}
            author={follower}
          />
        ))}
      </div>
      <div className="flex flex-col mt-12 lg:mt-16 space-y-5 sm:space-y-0 sm:space-x-3 sm:flex-row sm:justify-between sm:items-center">
        <Pagination />
      </div>
    </div>
  );
};

export default FollowersPage; 