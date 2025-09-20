import rightImg from "@/images/hero-right1.png";
import React, { FC } from "react";
import SectionFounder from "./SectionFounder";
import SectionStatistic from "./SectionStatistic";
import BgGlassmorphism from "@/components/BgGlassmorphism/BgGlassmorphism";
import SectionHero from "./SectionHero";
import SectionBecomeAnAuthor from "@/components/SectionBecomeAnAuthor/SectionBecomeAnAuthor";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About VinylFunders',
  description: 'Learn about VinylFunders mission to support independent artists through vinyl presales. Discover our story, team, and how we revolutionize music funding.',
  openGraph: {
    title: 'About VinylFunders | Supporting Independent Artists',
    description: 'Learn about VinylFunders mission to support independent artists through vinyl presales.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About VinylFunders | Supporting Independent Artists',
    description: 'Learn about VinylFunders mission to support independent artists through vinyl presales.',
  },
};

const PageAbout = ({}) => {
  return (
    <div className={`nc-PageAbout overflow-hidden relative`}>
      {/* ======== BG GLASS ======== */}
      <BgGlassmorphism />

      <div className="container py-16 lg:py-28 space-y-16 lg:space-y-28">
        <SectionHero
          rightImg={rightImg}
          heading="👋 About Us."
          btnText=""
          subHeading={`Soundonshape.com – is a Music & Visual Production Agency – Web Hosting | PR & Promotional Marketing | Content Aggregator | Live Streaming and VOD & Album PreSales Minting service.\n\nVinylFunders™ is a recording studio, multiple distributions and a Fanbase PreSale Platform.... we're here to help you succeed.`}
        />

        <SectionFounder />

        <SectionStatistic />

        <SectionBecomeAnAuthor />
      </div>
    </div>
  );
};

export default PageAbout;
