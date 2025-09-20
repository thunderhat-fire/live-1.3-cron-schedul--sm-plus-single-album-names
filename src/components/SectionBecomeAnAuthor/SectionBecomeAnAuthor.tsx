import React, { FC } from "react";
import Image from "next/image";
import Link from "next/link";
import Logo from "@/shared/Logo/Logo";
import ButtonPrimary from "@/shared/Button/ButtonPrimary";
import emailSig from "@/images/email-sig_new.png";

export interface SectionBecomeAnAuthorProps {
  className?: string;
}

const SectionBecomeAnAuthor: FC<SectionBecomeAnAuthorProps> = ({
  className = "",
}) => {
  return (
    <div
      className={`nc-SectionBecomeAnAuthor relative flex flex-col lg:flex-row items-center ${className}`}
    >
      <div className="flex-shrink-0 mb-16 lg:mb-0 lg:mr-10 lg:w-2/5">
        <Logo className="w-28" />
        <h2 className="font-semibold text-3xl sm:text-4xl xl:text-6xl mt-6 sm:mt-10 !leading-[1.112] tracking-tight">
          Learn about our <br /> partner Agencies
        </h2>
        <span className="block mt-6 text-neutral-500 dark:text-neutral-400">
          We cover both Physical and Digital Distribution
        </span>
        <div className="mt-6 sm:mt-12 flex items-center space-x-4">
          <Link 
            href="https://www.soundonshape.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ButtonPrimary className="">
              Our Partner
            </ButtonPrimary>
          </Link>
          <Link 
            href="https://www.unchainedmusic.io/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image 
              src={emailSig}
              alt="Email Signature"
              className="h-6 w-auto hover:opacity-80 transition-opacity"
              priority
            />
          </Link>
        </div>
      </div>
      <div className="flex-grow bg-neutral-100 dark:bg-neutral-800 rounded-2xl p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Physical Distribution</h3>
            <ul className="list-disc list-inside space-y-2 text-neutral-600 dark:text-neutral-300">
              <li>Global Distribution Network</li>
              <li>Warehousing Solutions</li>
              <li>Quality Control</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Digital Distribution</h3>
            <ul className="list-disc list-inside space-y-2 text-neutral-600 dark:text-neutral-300">
              <li>Streaming Platforms</li>
              <li>Digital Marketing</li>
              <li>Analytics & Reporting</li>
              <li>Rights Management</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionBecomeAnAuthor;
