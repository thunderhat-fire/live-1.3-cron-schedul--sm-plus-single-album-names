import React, { FC } from "react";
import Heading from "@/components/Heading/Heading";

export interface Statistic {
  id: string;
  heading: string;
  subHeading: string;
}

const FOUNDER_DEMO: Statistic[] = [
  {
    id: "1",
    heading: "Vinyl v's Streaming",
    subHeading:
      "81% of vinyl buyers also pay for a music streaming service",
  },
  {
    id: "2",
    heading: "Total Units Sold",
    subHeading: "6.7 million vinyl albums, marking a 9.1% increase from 2023's 6.1 million units in UK.",
  },
  {
    id: "3",
    heading: "Market Share",
    subHeading:
      "Vinyl accounted for 34% of all UK album sales, the highest proportion since 1990",
  },
];

export interface SectionStatisticProps {
  className?: string;
}

const SectionStatistic: FC<SectionStatisticProps> = ({ className = "" }) => {
  return (
    <div className={`nc-SectionStatistic relative ${className}`}>
      <Heading
        desc="Some noteworthy information - why, how and when users pay for music"
      >
        🚀 Fast Facts
      </Heading>
      <div className="grid md:grid-cols-2 gap-6 lg:grid-cols-3 xl:gap-8">
        {FOUNDER_DEMO.map((item) => (
          <div
            key={item.id}
            className="p-6 bg-neutral-50 dark:bg-neutral-800 rounded-2xl dark:border-neutral-800"
          >
            <h3 className="text-2xl font-semibold leading-none text-neutral-900 md:text-3xl dark:text-neutral-200">
              {item.heading}
            </h3>
            <span className="block text-sm text-neutral-500 mt-3 sm:text-base dark:text-neutral-400">
              {item.subHeading}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SectionStatistic;
