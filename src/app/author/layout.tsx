"use client";

import React, { ReactNode, useEffect, useState } from "react";
import authorBanner from "@/images/nfts/authorBanner.png";
import NcImage from "@/shared/NcImage/NcImage";
import VerifyIcon from "@/components/VerifyIcon";
import SocialsList from "@/shared/SocialsList/SocialsList";
import NftMoreDropdown from "@/components/NftMoreDropdown";
import ButtonDropDownShare from "@/components/ButtonDropDownShare";
import FollowButton from "@/components/FollowButton";
import BackgroundSection from "@/components/BackgroundSection/BackgroundSection";
import SectionGridAuthorBox from "@/components/SectionGridAuthorBox/SectionGridAuthorBox";
import SectionBecomeAnAuthor from "@/components/SectionBecomeAnAuthor/SectionBecomeAnAuthor";
import ArchiveFilterListBox from "@/components/ArchiveFilterListBox";
import { usePathname, useParams } from "next/navigation";
import Link from "next/link";
import { Route } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MessageModal from "@/components/MessageModal";
import MessageDropdown from "@/components/MessageDropdown";
import Image from "next/image";
import Avatar from "@/shared/Avatar/Avatar";
import NavItem from "@/shared/NavItem/NavItem";
import AuthorBannerLiveStream from "@/components/LiveStream/AuthorBannerLiveStream";
import ArtistStructuredData from '@/components/StructuredData/ArtistStructuredData';

interface UserData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  website: string | null;
  facebook: string | null;
  twitter: string | null;
  tiktok: string | null;
  subscriptionTier?: string;
  coverImage?: string;
  nfts?: Array<{
    id: string;
    name: string;
    createdAt: string;
    genre?: string;
  }>;
}

const Layout = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [userData, setUserData] = useState<UserData | null>(null);
  const pathname = usePathname();
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        // Always fetch fresh data from the API
        const userId = params?.id || session?.user?.id;
        
        // If we're not on a specific user's page and there's no session, redirect to login
        if (!params?.id && !session?.user?.id) {
          router.push('/login');
          return;
        }

        // If we have a userId (either from params or session), try to fetch the user
        if (userId) {
          const response = await fetch(`/api/user/${userId}`);
          if (response.ok) {
            const data = await response.json();
            
            // Also fetch user's NFTs for structured data
            try {
              const nftsResponse = await fetch(`/api/nfts/user/${userId}?tab=created`);
              if (nftsResponse.ok) {
                const nftsData = await nftsResponse.json();
                data.nfts = nftsData.nfts?.map((nft: any) => ({
                  id: nft.id,
                  name: nft.name,
                  createdAt: nft.createdAt,
                  genre: nft.genre
                })) || [];
              }
            } catch (error) {
              console.error('Error fetching user NFTs for structured data:', error);
              data.nfts = [];
            }
            
            setUserData(data);
          } else {
            const errorData = await response.json();
            console.error("Failed to fetch user data:", errorData.error);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we're not in a loading state
    if (status !== 'loading' && params) {
      fetchUserData();
    }
  }, [session, pathname, params, status, router]);

  let navs: { name: string; href: string }[] = [
    {
      name: "Created",
      href: pathname?.includes('/author/') && params?.id ? `/author/${params.id}/created` : "/author/created",
    },
    {
      name: "Liked",
      href: pathname?.includes('/author/') && params?.id ? `/author/${params.id}/liked` : "/author/liked",
    },
    {
      name: "Following",
      href: pathname?.includes('/author/') && params?.id ? `/author/${params.id}/following` : "/author/following",
    },
    {
      name: "Followers",
      href: pathname?.includes('/author/') && params?.id ? `/author/${params.id}/followers` : "/author/followers",
    },
  ];

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  // If we're not on a specific user's page and not authenticated, redirect to login
  if (!params?.id && status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  // Show user not found only if we're done loading and have no user data
  if (!userData && !isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">User not found</h2>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">The user you&apos;re looking for doesn&apos;t exist.</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // At this point, userData is guaranteed to be non-null
  const user = userData!;

  const handleSendMessage = async (message: string) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: message,
          toUserId: params?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // You could add a toast notification here
      console.log('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  return (
    <div className={`nc-AuthorPage`}>
      {userData && (
        <ArtistStructuredData artist={{
          id: userData.id,
          name: userData.name || undefined, // Convert null to undefined
          email: userData.email,
          image: userData.image || undefined,
          bio: userData.bio || undefined,
          website: userData.website || undefined,
          facebook: userData.facebook || undefined,
          twitter: userData.twitter || undefined,
          tiktok: userData.tiktok || undefined,
          createdAt: new Date().toISOString(), // Fallback date
          updatedAt: new Date().toISOString(), // Fallback date  
          subscriptionTier: userData.subscriptionTier || 'starter',
          nfts: userData.nfts || []
        }} />
      )}
      {/* HEADER */}
      <div className="w-full">
        <div className="relative w-full h-40 md:h-60 2xl:h-72">
          {/* Fallback banner image */}
          <Image
            src={authorBanner}
            alt="cover"
            fill
            className="absolute inset-0 object-cover w-full h-full"
          />
        </div>
        <div className="container -mt-6 lg:-mt-10">
          <div className="relative bg-white dark:bg-neutral-900 dark:border dark:border-neutral-700 p-4 lg:p-6 rounded-3xl md:rounded-[40px] shadow-xl flex flex-col md:flex-row md:items-start">
            <div className="w-32 lg:w-44 flex-shrink-0 mt-0 sm:mt-0">
              <div className="relative w-32 h-32 lg:w-44 lg:h-44 rounded-3xl overflow-hidden">
                {user.image ? (
                  <img
                    src={`${user.image}?t=${new Date().getTime()}`}
                    alt={user.name || "Profile image"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                    <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <div className="flex items-center space-x-2.5">
                  <ButtonDropDownShare
                    className="flex items-center justify-center text-neutral-500 hover:text-primary-500 dark:text-neutral-400 dark:hover:text-primary-500"
                    panelMenusClass="origin-top-left left-0"
                  />
                  <FollowButton
                    authorId={user.id}
                  />
                  <MessageDropdown 
                    onMessageClick={() => setIsMessageModalOpen(true)}
                  />
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-grow pt-5 md:pt-1 md:px-6 xl:px-8">
              <div className="max-w-screen-sm space-y-3.5 ">
                <h2 className="inline-flex items-center text-2xl sm:text-3xl lg:text-4xl font-semibold">
                  <span>{user.name || "Unnamed User"}</span>
                  <VerifyIcon
                    className="ml-2"
                    iconClass="w-6 h-6"
                    subscriptionTier={user.subscriptionTier}
                  />
                </h2>
                {/*  */}
                <div className="flex items-center text-sm font-medium space-x-2.5 text-neutral-500 dark:text-neutral-400 -ml-2.5">
                  <div
                    className="flex items-center text-sm font-medium"
                  >
                    <span className="ml-2.5">
                    {user.email}
                  </span>
                </div>
                </div>

                <span className="block text-sm text-neutral-500 dark:text-neutral-400">
                  {user.bio || "No bio yet."}
                </span>
                </div>
              <div className="mt-4">
                <SocialsList 
                  itemClass="block w-7 h-7"
                  socials={[
                    user.facebook && { name: 'Facebook', icon: '<i class="lab la-facebook-f"></i>', href: user.facebook },
                    user.website && { name: 'Website', icon: '<i class="las la-globe"></i>', href: user.website },
                    user.twitter && { name: 'Twitter', icon: '<i class="lab la-twitter"></i>', href: user.twitter },
                    user.tiktok && { name: 'Tiktok', icon: '<i class="lab la-tiktok"></i>', href: user.tiktok },
                  ].filter(Boolean) as any}
                />
              </div>
            </div>

            {/* Live Stream and Action Buttons */}
            <div className="flex-shrink-0 mt-6 md:mt-0 md:ml-auto">
              <div className="aspect-[16/9] w-full h-full max-w-2xl min-w-[320px] min-h-[180px] rounded-2xl overflow-hidden flex items-center">
                <AuthorBannerLiveStream 
                  authorId={params ? (typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '') : ''}
                  className="w-full h-full"
                />
              </div>
            </div>

          </div>
        </div>
      </div>
      {/* ====================== END HEADER ====================== */}

      <div className="container py-16 lg:pb-28 lg:pt-20 space-y-16 lg:space-y-28">
        <main>
          <div className="flex flex-col lg:flex-row justify-between">
            <div className="flex space-x-0 sm:space-x-2 overflow-x-auto">
              {navs.map((item, index) => {
                const active = item.href === pathname;
                return (
                  <NavItem
                    key={index}
                    isActive={active}
                    onClick={() => router.push(item.href as Route)}
                    className="px-4 py-2 text-sm sm:text-base sm:px-5 sm:py-2.5 capitalize"
                  >
                    {item.name}
                  </NavItem>
                );
              })}
            </div>
            <div className="mt-5 lg:mt-0 flex items-end justify-end">
              <ArchiveFilterListBox />
            </div>
          </div>

          {/*  */}
          {children}
        </main>

        {/* === SECTION 5 === */}
        <div className="relative py-16 lg:py-28">
          <BackgroundSection />
          <SectionGridAuthorBox data={Array.from("11111111")} boxCard="box4" />
        </div>

        {/* SUBCRIBES */}
        <SectionBecomeAnAuthor />
      </div>

      <MessageModal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        recipientId={params ? (typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '') : ''}
        recipientName={user.name || 'User'}
        onSend={handleSendMessage}
      />
    </div>
  );
};

export default Layout;
