'use client';

import CardAuthorBox4 from "@/components/CardAuthorBox4/CardAuthorBox4";
import ButtonPrimary from "@/shared/Button/ButtonPrimary";
import Pagination from "@/shared/Pagination/Pagination";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { Creator } from "@/components/CardAuthorBox4/CardAuthorBox4";

const FollowersPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [followers, setFollowers] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowers = async () => {
      try {
        const response = await fetch('/api/user/followers');
        const data = await response.json();
        
        if (data.success && data.followers) {
          // Transform the data to match Creator type
          const transformedFollowers: Creator[] = data.followers.map((user: any) => ({
            id: user.id,
            name: user.name,
            image: user.image,
            bio: user.bio,
            nftsCount: user.nftsCount || 0,
            followersCount: user.followersCount || 0,
            isFollowing: false,
            subscriptionTier: user.subscriptionTier
          }));
          setFollowers(transformedFollowers);
        }
      } catch (error) {
        console.error('Error fetching followers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowers();
  }, []);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  if (loading) {
    return <div className="container py-10">Loading...</div>;
  }

  return (
    <div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-8 lg:mt-10">
        {followers.map((user, index) => (
          <CardAuthorBox4 
            key={user.id}
            author={user}
            authorIndex={index + 1}
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
