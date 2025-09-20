'use client';

import React from "react";
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import SectionHero3 from "@/components/SectionHero/SectionHero3";
import PresaleRewardsSlider from '@/components/PresaleRewardsSlider';
import VideoBackground from '@/components/VideoBackground';
import LiveNowGrid from '@/components/LiveNowGrid';
import LatestStreamsGrid from '@/components/LatestStreamsGrid';
import BackgroundSection from "@/components/BackgroundSection/BackgroundSection";
import SectionGridAuthorBox from "@/components/SectionGridAuthorBox/SectionGridAuthorBox";
import SectionSliderCollections from "@/components/SectionSliderCollections";
import SectionSubscribe2 from "@/components/SectionSubscribe2/SectionSubscribe2";
import SectionGridFeatureNFT2 from "../SectionGridFeatureNFT2";
import SectionSliderCategories from "@/components/SectionSliderCategories/SectionSliderCategories";
import SectionBecomeAnAuthor from "@/components/SectionBecomeAnAuthor/SectionBecomeAnAuthor";


function PageHome3() {
  const { data: session } = useSession();




  return (
    <div className="nc-PageHome3 relative">
      <div className="container px-4">
        <SectionHero3 />
        

      </div>

      <div className="container relative space-y-24 mb-24 lg:space-y-32 lg:mb-32">
        {/* White space above What's trending now */}
        <div className="h-[35px]"></div>
        
        {/* SECTION: What's trending now */}
        <div className="relative py-20 lg:py-28">
            <BackgroundSection className="bg-neutral-100/70 dark:bg-black/20 " />
            <SectionGridFeatureNFT2 />
          </div>

          {/* SECTION: Artist live streams */}
          <LiveNowGrid />

          {/* SECTION: Latest & Live Streams (YouTube style) */}
        {/* <LatestStreamsGrid /> */}

          {/* SECTION: Record Labels */}
          <SectionSliderCollections />

          {/* SECTION: Browse by Author */}
          <div className="relative py-20 lg:py-28">
            <BackgroundSection />
            <SectionGridAuthorBox
              sectionStyle="style2"
              boxCard="box4"
              title="Browse by Author"
            />
          </div>

          {/* SECTION */}
          <SectionSubscribe2 />

          {/* SECTION 1 */}
          <SectionSliderCategories />

          {/* SECTION */}
          <div className="relative py-20 lg:py-24">
            <BackgroundSection />
            <SectionBecomeAnAuthor />
          </div>
        </div>

      {/* Rewards Slider at the bottom above the footer */}
      <div className="container pt-0 pb-2 lg:pt-0 lg:pb-2">
        <div className="text-center text-sm text-neutral-500 mb-2 font-medium">
          Release your music to Fans on vinyl is easy - just upload and share - we do the rest !
          <span> </span>
          <a href="/seller-guide" className="text-primary-600 hover:underline ml-1">Read more on our Seller guide</a>
        </div>
        <h2 className="text-2xl font-bold text-center mb-4 tracking-wide text-black">YOUR FANS - YOUR VINYL - YOUR REWARDS</h2>
        <div className="relative rounded-xl overflow-hidden">
          <VideoBackground 
            videoUrl="/videos/vinyl-background.mp4"
            className="h-[400px]"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <PresaleRewardsSlider />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PageHome3;
