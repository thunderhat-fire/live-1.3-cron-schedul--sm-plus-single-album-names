"use client";

import Avatar from "@/shared/Avatar/Avatar";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  UserIcon,
  RectangleStackIcon as CollectionIcon,
  HeartIcon,
  UserGroupIcon,
  ArrowRightOnRectangleIcon as LogoutIcon,
  PencilSquareIcon as EditIcon,
  CreditCardIcon,
  VideoCameraIcon
} from "@heroicons/react/24/outline";

export default function AvatarDropdown() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Add debug logging
  useEffect(() => {
    console.log('AvatarDropdown - Session State:', {
      status,
      hasSession: !!session,
      userData: session?.user
    });
  }, [session, status]);

  // Only show menu items if we have a valid session with a user ID
  const showMenuItems = status === 'authenticated' && session?.user?.id;

  // Get user data from session
  const userData = session?.user || null;

  // Handle menu toggle
  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (status === 'authenticated') {
      setIsOpen(!isOpen);
    }
  };

  // Handle navigation with type safety
  const handleNavigation = useCallback((path: string) => {
    setIsOpen(false);
    // Type assertion needed for Next.js App Router
    router.push(path as any);
  }, [router]);

  // Handle menu item click
  const handleMenuItemClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    e.stopPropagation();
    handleNavigation(path);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside, true);
      document.addEventListener('touchend', handleClickOutside, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchend', handleClickOutside, true);
    };
  }, [isOpen]);

  // Handle sign out
  const handleSignOut = async () => {
    console.log('Signing out...');
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="AvatarDropdown relative inline-block" ref={dropdownRef} style={{ zIndex: 50 }}>
      <button 
        className="cursor-pointer flex items-center focus:outline-none relative z-10" 
        onClick={toggleDropdown}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {status === 'authenticated' && userData ? (
          <Avatar 
            key={userData.image || ''}
            imgUrl={userData.image || undefined}
            sizeClass="w-8 h-8 sm:w-9 sm:h-9" 
          />
        ) : (
          <Link href="/login" className="btn-primary">
            Login
          </Link>
        )}
      </button>

      {isOpen && showMenuItems && userData?.id && (
        <div 
          className="absolute right-0 top-full mt-2 w-60 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-lg overflow-hidden"
          style={{ zIndex: 100 }}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu"
        >
          <div className="px-4 py-5">
            <div className="flex items-center mb-4">
              <Avatar 
                key={userData.image || ''}
                imgUrl={userData.image || undefined}
                sizeClass="w-12 h-12" 
              />
              <div className="ml-4">
                <p className="text-sm font-medium">{userData.name || 'User'}</p>
                <p className="text-xs text-neutral-500">{userData.email}</p>
              </div>
            </div>

            <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
              <div className="flex flex-col py-2 space-y-1">
                <button 
                  onClick={(e) => handleMenuItemClick(e, `/author/view/${userData.id}`)}
                  className="flex items-center p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg w-full text-left transition-colors duration-150 relative"
                  role="menuitem"
                  style={{ zIndex: 10000 }}
                >
                  <UserIcon className="h-5 w-5 text-neutral-500" />
                  <span className="ml-3 text-sm font-medium">Profile</span>
                </button>
                <button 
                  onClick={(e) => handleMenuItemClick(e, '/account')}
                  className="flex items-center p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg w-full text-left transition-colors duration-150 relative"
                  role="menuitem"
                  style={{ zIndex: 10000 }}
                >
                  <EditIcon className="h-5 w-5 text-neutral-500" />
                  <span className="ml-3 text-sm font-medium">Edit Profile</span>
                </button>
                <button 
                  onClick={(e) => handleMenuItemClick(e, '/account/subscription')}
                  className="flex items-center p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg w-full text-left transition-colors duration-150 relative"
                  role="menuitem"
                  style={{ zIndex: 10000 }}
                >
                  <CreditCardIcon className="h-5 w-5 text-neutral-500" />
                  <span className="ml-3 text-sm font-medium">Subscription & Benefits</span>
                </button>
                <button 
                  onClick={(e) => handleMenuItemClick(e, '/author/created')}
                  className="flex items-center p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg w-full text-left transition-colors duration-150 relative"
                  role="menuitem"
                  style={{ zIndex: 10000 }}
                >
                  <CollectionIcon className="h-5 w-5 text-neutral-500" />
                  <span className="ml-3 text-sm font-medium">My Items</span>
                </button>
                <button 
                  onClick={(e) => handleMenuItemClick(e, '/author/liked')}
                  className="flex items-center p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg w-full text-left transition-colors duration-150 relative"
                  role="menuitem"
                  style={{ zIndex: 10000 }}
                >
                  <HeartIcon className="h-5 w-5 text-neutral-500" />
                  <span className="ml-3 text-sm font-medium">Liked Items</span>
                </button>
                <button 
                  onClick={(e) => handleMenuItemClick(e, '/author/following')}
                  className="flex items-center p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg w-full text-left transition-colors duration-150 relative"
                  role="menuitem"
                  style={{ zIndex: 10000 }}
                >
                  <UserGroupIcon className="h-5 w-5 text-neutral-500" />
                  <span className="ml-3 text-sm font-medium">Following</span>
                </button>
                {(userData?.subscriptionTier === 'plus' || userData?.subscriptionTier === 'gold') && (
                  <button 
                    onClick={(e) => handleMenuItemClick(e, '/live')}
                    className="flex items-center p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg w-full text-left transition-colors duration-150 relative"
                    role="menuitem"
                    style={{ zIndex: 10000 }}
                  >
                    <VideoCameraIcon className="h-5 w-5 text-green-500" />
                    <span className="ml-3 text-sm font-medium text-green-600 dark:text-green-400">Go Live</span>
                  </button>
                )}
              </div>

              <div className="py-2">
                <button 
                  onClick={handleSignOut}
                  className="flex w-full items-center p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-rose-600 transition-colors duration-150 relative"
                  role="menuitem"
                  style={{ zIndex: 10000 }}
                >
                  <LogoutIcon className="h-5 w-5" />
                  <span className="ml-3 text-sm font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
