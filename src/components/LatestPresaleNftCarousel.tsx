"use client";
import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import SmallNftCard from "./SmallNftCard";
import Link from "next/link";

export default function LatestPresaleNftCarousel() {
  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(
      "/api/nfts?saleType=presale&sortOrder=Recently-listed&limit=10"
    )
      .then((res) => res.json())
      .then((data) => {
        setNfts(data?.nfts || data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-4 text-neutral-400">Loading latest presale Albums...</div>;
  }
  if (!nfts.length) {
    return <div className="text-center py-4 text-neutral-400">No presale Albums found.</div>;
  }

  return (
    <div className="w-full max-w-5xl mx-auto mb-4 pb-[15px]">
      <Swiper
        spaceBetween={12}
        slidesPerView={2}
        breakpoints={{
          640: { slidesPerView: 3 },
          768: { slidesPerView: 4 },
          1024: { slidesPerView: 5 },
        }}
        navigation
        modules={[Navigation]}
        className="py-2"
      >
        {nfts.map((nft) => (
          <SwiperSlide key={nft.id}>
            <Link href={`/nft-detail/${nft.id}`} passHref legacyBehavior>
              <a tabIndex={0} className="block focus:outline-none focus:ring-2 focus:ring-primary-500 rounded">
                <SmallNftCard nft={nft} />
              </a>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
} 