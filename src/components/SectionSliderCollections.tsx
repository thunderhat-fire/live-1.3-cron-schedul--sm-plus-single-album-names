"use client";

import React, { FC, useEffect, useState } from "react";
import Heading from "@/shared/Heading/Heading";
import CollectionCard from "./CollectionCard";
import CollectionCard2 from "./CollectionCard2";
import MySlider from "./MySlider";
import Link from "next/link";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";

export interface SectionSliderCollectionsProps {
  className?: string;
  itemClassName?: string;
  cardStyle?: "style1" | "style2";
}

const SectionSliderCollections: FC<SectionSliderCollectionsProps> = ({
  className = "",
  cardStyle = "style1",
}) => {
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`nc-SectionSliderCollections ${className}`}>
      <MySlider
        itemPerRow={3}
        hideNextPrev
        renderSectionHeading={({
          onClickPrev,
          onClickNext,
          showNext,
          showPrev,
        }) => {
          return (
            <Heading
              hasNextPrev
              desc="Discover Albums by record Label"
              onClickPrev={onClickPrev}
              onClickNext={onClickNext}
              disableNext={!showNext}
              disablePrev={!showPrev}
            >
              Record Labels
            </Heading>
          );
        }}
        data={recordLabels}
        renderItem={(item, index) => {
          if (!item) {
            return (
              <Link
                key={index}
                href={"/search"}
                className="block relative group"
              >
                <div className="relative rounded-2xl overflow-hidden h-[410px]">
                  <div className="h-[410px] bg-black/5 dark:bg-neutral-800"></div>
                  <div className="absolute inset-y-6 inset-x-10  flex flex-col items-center justify-center">
                    <div className="flex items-center justify-center relative">
                      <span className="text-xl font-semibold">Record Labels</span>
                      <ArrowUpRightIcon className="absolute left-full w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-sm mt-1">Show me more</span>
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

export default SectionSliderCollections;
