'use client';

import CardAuthorBox4 from "@/components/CardAuthorBox4/CardAuthorBox4";
import ButtonPrimary from "@/shared/Button/ButtonPrimary";
import Pagination from "@/shared/Pagination/Pagination";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  walletAddress: string | null;
  nftsCount?: number;
  followersCount?: number;
  isFollowing?: boolean;
}

const FollowingPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowing = async () => {
      try {
        const response = await fetch('/api/user/following');
        const data = await response.json();
        
        if (data.success && data.following) {
          setFollowing(data.following);
        }
      } catch (error) {
        console.error('Error fetching following:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowing();
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
        {following.map((user, index) => (
          <CardAuthorBox4 
            key={user.id}
            author={{
              id: user.id,
              name: user.name,
              image: user.image,
              bio: user.bio,
              nftsCount: user.nftsCount || 0,
              followersCount: user.followersCount || 0,
              isFollowing: true
            }}
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

export default FollowingPage;
