"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Liker {
  id: string;
  name: string;
  image: string;
}

interface NFTLikerAvatarsProps {
  likers: Liker[];
  className?: string;
}

const NFTLikerAvatars: React.FC<NFTLikerAvatarsProps> = ({ 
  likers = [], 
  className = "" 
}) => {
  if (!likers.length) return null;

  return (
    <div className={`flex -space-x-2 ${className}`}>
      {likers.map((liker, index) => (
        <Link
          key={liker.id}
          href={`/author/view/${liker.id}`}
          className="relative"
          title={liker.name}
        >
          <div className="w-8 h-8 ring-2 ring-white dark:ring-neutral-900">
            <Image
              src={liker.image}
              alt={liker.name}
              className="rounded-full object-cover"
              width={32}
              height={32}
            />
          </div>
        </Link>
      ))}
    </div>
  );
};

export default NFTLikerAvatars; 