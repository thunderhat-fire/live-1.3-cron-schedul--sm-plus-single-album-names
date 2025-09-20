import React from "react";
import logoImg from "@/images/logo.png";
import logoDarkImg from "@/images/logo-dark.png";
import Link from "next/link";
import Image from "next/image";

export interface LogoProps {
  img?: string;
  imgDark?: string;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({
  img = logoImg,
  imgDark = logoDarkImg,
  className = "flex-shrink-0",
}) => {
  return (
    <Link
      href="/"
      className={`ttnc-logo inline-block text-slate-600 ${className}`}
    >
      {/* THIS USE FOR MY CLIENT */}
      {/* PLEASE UN COMMENT BELLOW CODE AND USE IT */}
      <span className="inline-flex items-start space-x-1">
        {img ? (
          <Image
            className={`block h-8 sm:h-10 w-auto ${imgDark ? 'dark:hidden' : ''}`}
            src={img}
            alt="VinylFunders Logo"
            sizes="200px"
            priority
          />
        ) : (
          'VinylFunders'
        )}
        {/* Trademark symbol */}
        <sup className="text-[10px] leading-none mt-1">™</sup>
      </span>
      {imgDark && (
        <Image
          className="hidden h-8 sm:h-10 w-auto dark:block"
          src={imgDark}
          alt="VinylFunders Logo Dark"
          sizes="200px"
          priority
        />
      )}
    </Link>
  );
};

export default Logo;
