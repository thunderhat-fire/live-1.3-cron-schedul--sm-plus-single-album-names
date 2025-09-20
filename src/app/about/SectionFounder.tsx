import React from "react";
import Image from "next/image";
import Link from "next/link";
import heroRightImg from "@/images/hero-right-3.png";
import signatureImg from "@/images/signature.png";

const SectionFounder = () => {
  return (
    <div className="nc-SectionFounder relative">
      <div className="flex flex-col lg:flex-row space-y-14 lg:space-y-0 lg:space-x-10 items-start">
        <div className="w-screen max-w-full xl:max-w-lg space-y-5 lg:space-y-7">
          <h2 className="text-3xl !leading-tight font-semibold text-neutral-900 md:text-4xl xl:text-5xl dark:text-neutral-100">
            💭 Founder&apos;s Statement
          </h2>
          <div className="text-neutral-700 dark:text-neutral-300 text-lg leading-relaxed space-y-6">
            <p>
              &ldquo;At VinylFunders™, we believe in the power of music to connect, inspire, and transform. Our journey began with a simple vision: to create a platform that bridges the gap between artists and their fans through the timeless medium of vinyl records.
            </p>
            <p>
              We understand the challenges artists face in bringing their music to life in physical form. That&apos;s why we&apos;ve built a platform that not only helps fund vinyl production through PreSales but also provides comprehensive support through our recording studio and distribution networks.
            </p>
            <p>
              Our commitment goes beyond just being a marketplace. We&apos;re a community that celebrates the artistry of music, the warmth of vinyl, and the direct connection between creators and their audience. Through VinylFunders™, we&apos;re making it possible for more artists to share their music in its most authentic form.
            </p>
          </div>
        </div>
        <div className="flex-grow">
          <div className="p-2 border border-neutral-200 dark:border-neutral-700 rounded-2xl">
            <Image 
              src={heroRightImg} 
              alt="VinylFunders Illustration" 
              className="w-full rounded-xl"
              priority
            />
          </div>
          <div className="mt-6 flex items-center">
            <Image 
              src={signatureImg} 
              alt="Founder's Signature"
              className="h-64 w-auto"
              priority
            />
            <div className="ml-4">
              <span className="text-lg text-neutral-700 dark:text-neutral-300">
                Ross Blytt Jordens - Ba Business | PG Dip
              </span>
              <Link 
                href="https://www.linkedin.com/in/rossblyttjordens"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-3 inline-flex items-center text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-500 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-10 text-center max-w-3xl mx-auto">
        <p className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 italic">
          &ldquo;Together, we&apos;re not just pressing records – we&apos;re pressing forward into the future of music distribution while honoring its physical legacy.&rdquo;
        </p>
      </div>
    </div>
  );
};

export default SectionFounder;
