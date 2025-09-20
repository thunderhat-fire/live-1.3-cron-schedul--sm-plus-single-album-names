"use client";

import React, { FC, useEffect, useState } from "react";
import Heading from "@/components/Heading/Heading";
import CardCategory5 from "@/components/CardCategory5/CardCategory5";
import MySlider from "../MySlider";
import VerifyIcon from "@/components/VerifyIcon";

export interface SectionSliderCategoriesProps {
  className?: string;
  heading?: string;
  subHeading?: string;
}

interface RecordLabel {
  name: string;
  count: number;
  nfts: {
    id: string;
    name: string;
    sideAImage: string;
    creator: string;
    creatorImage: string;
  }[];
}

const SectionSliderCategories: FC<SectionSliderCategoriesProps> = ({
  heading = undefined,
  subHeading = "Discover Albums",
  className = "",
}) => {
  const [recordLabels, setRecordLabels] = useState<RecordLabel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecordLabels = async () => {
      try {
        const response = await fetch('/api/record-labels-premium');
        const data = await response.json();
        if (data.success) {
          setRecordLabels(data.recordLabels);
        }
      } catch (error) {
        console.error('Error fetching premium record labels:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecordLabels();
  }, []);

  if (loading) {
    return (
      <div className={`nc-SectionSliderCategories ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3 mb-8"></div>
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-w-4 aspect-h-3">
                <div className="rounded-2xl bg-neutral-200 dark:bg-neutral-700"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`nc-SectionSliderCategories ${className}`}>
      <MySlider
        itemPerRow={4}
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
              desc={subHeading}
              onClickPrev={onClickPrev}
              onClickNext={onClickNext}
              disableNext={!showNext}
              disablePrev={!showPrev}
            >
              {"See what our "}
              <VerifyIcon iconClass="w-12 h-12 pr-[5px]" isPlusUser />{' '}
              <span className="text-lg font-normal">{" & "}</span>
              <VerifyIcon iconClass="w-12 h-12 pr-[5px]" isGoldUser />{' '}
              {" members are releasing"}
            </Heading>
          );
        }}
        data={recordLabels}
        renderItem={(item, index) => {
          if (!item) return null;
          return (
            <CardCategory5
              key={index}
              index={index}
              featuredImage={item.nfts[0]?.sideAImage || '/images/default-record-label.jpg'}
              name={item.name}
              nftCount={item.count}
            />
          );
        }}
      />
    </div>
  );
};

export default SectionSliderCategories;
