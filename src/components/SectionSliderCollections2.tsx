"use client";

import React, { FC, useState, useEffect } from "react";
import Heading from "@/shared/Heading/Heading";
import CollectionCard from "./CollectionCard";
import CollectionCard2 from "./CollectionCard2";
import Nav from "@/shared/Nav/Nav";
import NavItem2 from "./NavItem2";
import MySlider from "./MySlider";
import Link from "next/link";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";

export interface SectionSliderCollections2Props {
  className?: string;
  itemClassName?: string;
  cardStyle?: "style1" | "style2";
}

const SectionSliderCollections2: FC<SectionSliderCollections2Props> = ({
  className = "",
  cardStyle = "style1",
}) => {
  const [tabActive, setTabActive] = useState("Last 24 hours");
  const [recordLabels, setRecordLabels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecordLabels = async () => {
      try {
        const response = await fetch('/api/record-labels');
        if (!response.ok) throw new Error('Failed to fetch record labels');
        const data = await response.json();
        setRecordLabels(data.recordLabels);
      } catch (error) {
        console.error('Error fetching record labels:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecordLabels();
  }, []);

  const MyCollectionCard =
    cardStyle === "style1" ? CollectionCard : CollectionCard2;

  const demoTab = [
    {
      name: "Last 24 hours",
      icon: `<svg className="w-5 h-5" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.9095 11.5668C17.9095 15.5918 14.6428 18.8585 10.6178 18.8585C6.59284 18.8585 3.32617 15.5918 3.32617 11.5668C3.32617 7.54181 6.59284 4.27515 10.6178 4.27515C14.6428 4.27515 17.9095 7.54181 17.9095 11.5668Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10.6182 7.19177V11.3584" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8.11816 2.19177H13.1182" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        `,
    },
    {
      name: "Last 7 days",
      icon: `<svg className="w-5 h-5" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.28516 2.19177V4.69177" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13.9512 2.19177V4.69177" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3.53516 8.1001H17.7018" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M18.1182 7.60844V14.6918C18.1182 17.1918 16.8682 18.8584 13.9515 18.8584H7.28483C4.36816 18.8584 3.11816 17.1918 3.11816 14.6918V7.60844C3.11816 5.10844 4.36816 3.44177 7.28483 3.44177H13.9515C16.8682 3.44177 18.1182 5.10844 18.1182 7.60844Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13.6972 11.9418H13.7047" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13.6972 14.4418H13.7047" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10.6142 11.9418H10.6217" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10.6142 14.4418H10.6217" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7.53025 11.9418H7.53774" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7.53025 14.4418H7.53774" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        `,
    },
    {
      name: "Last 30 days",
      icon: `<svg className="w-5 h-5" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.28516 2.19177V4.69177" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13.9512 2.19177V4.69177" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13.9515 3.44177C16.7265 3.59177 18.1182 4.65011 18.1182 8.56677V13.7168C18.1182 17.1501 17.2848 18.8668 13.1182 18.8668H8.11816C3.9515 18.8668 3.11816 17.1501 3.11816 13.7168V8.56677C3.11816 4.65011 4.50983 3.60011 7.28483 3.44177H13.9515Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M17.9095 15.1918H3.32617" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        `,
    },
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`nc-SectionSliderCollections2 ${className}`}>
      <Heading
        className="mb-12 lg:mb-14 text-neutral-900 dark:text-neutral-50"
        fontClass="text-3xl md:text-4xl 2xl:text-5xl font-semibold"
        isCenter
        desc="Discover Albums by record Label"
      >
        Record Labels
      </Heading>

      <Nav
        className="p-1 bg-white dark:bg-neutral-800 rounded-full shadow-lg"
        containerClassName="mb-12 lg:mb-14 relative flex justify-center w-full text-sm md:text-base"
      >
        {demoTab.map((item, index) => (
          <NavItem2
            key={index}
            isActive={tabActive === item.name}
            onClick={() => setTabActive(item.name)}
          >
            <div className="flex items-center justify-center sm:space-x-2.5 text-xs sm:text-sm ">
              <span
                className="hidden sm:inline-block"
                dangerouslySetInnerHTML={{ __html: item.icon }}
              ></span>
              <span>{item.name}</span>
            </div>
          </NavItem2>
        ))}
      </Nav>

      <MySlider
        itemPerRow={3}
        data={recordLabels}
        renderItem={(item, index) => {
          if (!item) {
            return (
              <Link
                key={index}
                href={"/search"}
                className="block relative group"
              >
                <div className="relative flex flex-col rounded-2xl overflow-hidden">
                  <div className="relative">
                    <div className="aspect-w-8 aspect-h-5 bg-black/5 dark:bg-neutral-800"></div>
                    <div className="absolute inset-y-6 inset-x-10  flex flex-col items-center justify-center">
                      <div className="flex items-center justify-center relative">
                        <span className="text-xl font-semibold">
                          Record Labels
                        </span>
                        <ArrowUpRightIcon className="absolute left-full w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                      </div>
                      <span className="text-sm mt-1">Show me more</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                    <div className="w-full h-28 bg-black/5 dark:bg-neutral-800"></div>
                    <div className="w-full h-28 bg-black/5 dark:bg-neutral-800"></div>
                    <div className="w-full h-28 bg-black/5 dark:bg-neutral-800"></div>
                  </div>
                </div>
              </Link>
            );
          }
          return <MyCollectionCard key={index} recordLabel={item} />;
        }}
      />
    </div>
  );
};

export default SectionSliderCollections2;
