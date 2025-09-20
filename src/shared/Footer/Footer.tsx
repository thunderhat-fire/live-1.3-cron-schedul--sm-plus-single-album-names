import Logo from "@/shared/Logo/Logo";
import SocialsList1 from "@/shared/SocialsList1/SocialsList1";
import { CustomLink } from "@/data/types";
import React from "react";
import Image from "next/image";
import mpaImage from "@/images/mpa.png";

export interface WidgetFooterMenu {
  id: string;
  title: string;
  menus: CustomLink[];
}

const widgetMenus: WidgetFooterMenu[] = [
  {
    id: "5",
    title: "Getting started",
    menus: [
      { href: "/help-center#faq", label: "FAQ" },
      { href: "/seller-guide", label: "Seller Guide" },
      { href: "/mastering", label: "Mastering and Preparation" },
      { href: "/upload-item", label: "Upload your music Album" },
    ],
  },
  {
    id: "1",
    title: "Explore",
    menus: [
      { href: "/collection", label: "Labels" },
      { href: "/search", label: "Find Artists" },
    ],
  },
  {
    id: "2",
    title: "Resources",
    menus: [
      { href: "/best-practices", label: "Best practices" },
      { href: "/contact", label: "Support" },
      { href: "/login", label: "Login" },
    ],
  },
  {
    id: "4",
    title: "Community",
    menus: [
      { href: "/forum", label: "Discussion Forums" },
      { href: "/code-of-conduct", label: "Code of Conduct" },
      { href: "/data-protection", label: "Data Protection & GDPR" },
      { href: "/terms", label: "Terms & Conditions" },
    ],
  },
];

const Footer: React.FC = () => {
  const renderWidgetMenuItem = (menu: WidgetFooterMenu, index: number) => {
    return (
      <div key={index} className="text-sm">
        <h2 className="font-semibold text-neutral-700 dark:text-neutral-200">
          {menu.title}
        </h2>
        <ul className="mt-5 space-y-4">
          {menu.menus.map((item, index) => (
            <li key={index}>
              <a
                key={index}
                className="text-neutral-6000 dark:text-neutral-300 hover:text-black dark:hover:text-white"
                href={item.href}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="nc-Footer relative py-20 lg:pt-28 lg:pb-24 border-t border-neutral-200 dark:border-neutral-700">
      <div className="container grid grid-cols-2 gap-y-10 gap-x-5 sm:gap-x-8 md:grid-cols-4 lg:grid-cols-6 lg:gap-x-10 ">
        <div className="grid grid-cols-4 gap-5 col-span-2 md:col-span-4 lg:md:col-span-1 lg:flex lg:flex-col">
          <div className="col-span-2 md:col-span-1">
            <Logo />
          </div>
          <div className="col-span-2 flex items-center md:col-span-3">
            <div className="flex items-center space-x-2 lg:space-x-0 lg:flex-col lg:space-y-3 lg:items-start">
              <SocialsList1 className="flex items-center space-x-2 lg:space-x-0 lg:flex-col lg:space-y-3 lg:items-start" />
              {/* EFF Image below Instagram */}
              <div className="mt-2 lg:mt-0">
                <a 
                  href="https://eff.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block cursor-pointer hover:scale-105 transition-transform duration-200 relative z-10 rounded-full border-2 border-gray-300 p-1 hover:border-gray-400"
                  title="Visit Electronic Frontier Foundation"
                >
                  <Image 
                    src="/eff.png" 
                    alt="Electronic Frontier Foundation" 
                    className="w-16 h-16 lg:w-20 lg:h-20 object-contain opacity-70 hover:opacity-100 transition-opacity pointer-events-none"
                    width={80}
                    height={80}
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
        {widgetMenus.map(renderWidgetMenuItem)}
        <div className="text-sm">
          <h2 className="font-semibold text-neutral-700 dark:text-neutral-200">
            Associations
          </h2>
          <div className="mt-5">
            <Image 
              src={mpaImage} 
              alt="MPA Logo" 
              className="w-[240px] h-auto object-contain"
              width={240}
              height={80}
              style={{ height: 'auto' }}
            />
            <p className="mt-6 text-neutral-6000 dark:text-neutral-300">
              SoundOnShape.com - LTD.<br />
              Co. 16464812
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
