"use client";

import React, { FC, useState, useEffect } from "react";
import CreatorCard from "@/components/CreatorCard/CreatorCard";
import CardAuthorBox2 from "@/components/CardAuthorBox2/CardAuthorBox2";
import CardAuthorBox3 from "@/components/CardAuthorBox3/CardAuthorBox3";
import CardAuthorBox4 from "@/components/CardAuthorBox4/CardAuthorBox4";
import Heading from "@/components/Heading/Heading";
import ButtonPrimary from "@/shared/Button/ButtonPrimary";
import ButtonSecondary from "@/shared/Button/ButtonSecondary";
import Nav from "@/shared/Nav/Nav";
import SortOrderFilter from "./SortOrderFilter";

export interface SectionGridAuthorBoxProps {
  className?: string;
  sectionStyle?: "style1" | "style2";
  gridClassName?: string;
  boxCard?: "box1" | "box2" | "box3" | "box4";
  data?: any[];
  title?: string;
}

interface Creator {
  id: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  nftsCount: number;
  followersCount: number;
  isFollowing: boolean;
}

const SectionGridAuthorBox: FC<SectionGridAuthorBoxProps> = ({
  className = "",
  boxCard = "box1",
  sectionStyle = "style1",
  gridClassName = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  title = "Popular",
}) => {
  const [tabActive, setTabActive] = useState("Popular");
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("all");

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/user/popular?timeFilter=${timeFilter}`);
        const data = await response.json();
        
        if (data.success && data.users) {
          setCreators(data.users);
        } else {
          console.error('Failed to fetch creators:', data.error || 'Unknown error');
        }
      } catch (error) {
        console.error('Error fetching popular creators:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCreators();
  }, [timeFilter]);

  const handleTimeFilterChange = (filter: string) => {
    const filterMap: { [key: string]: string } = {
      "Today": "today",
      "Last 7 days": "7days",
      "Last 30 days": "30days",
      "Sort order": "all"
    };
    setTimeFilter(filterMap[filter] || "all");
  };

  const renderCard = (creator: Creator, index: number) => {
    switch (boxCard) {
      case "box1":
        return (
          <CreatorCard
            key={creator.id}
            index={index < 3 ? index + 1 : undefined}
            author={creator}
            following={creator.isFollowing}
          />
        );
      case "box2":
        return (
          <CardAuthorBox2 
            key={creator.id} 
            author={creator}
            following={creator.isFollowing}
          />
        );
      case "box3":
        return (
          <CardAuthorBox3 
            key={creator.id} 
            author={creator}
            following={creator.isFollowing}
          />
        );
      case "box4":
        return (
          <CardAuthorBox4
            key={creator.id}
            authorIndex={index < 3 ? index + 1 : undefined}
            author={creator}
          />
        );
      default:
        return null;
    }
  };

  const renderHeading1 = () => {
    return (
      <div className="mb-12 lg:mb-16 flex justify-between flex-col sm:flex-row">
        <Heading
          rightPopoverText="Creators"
          rightPopoverOptions={[
            {
              name: "Creators",
              href: "#",
            },
            {
              name: "Buyers",
              href: "#",
            },
          ]}
          className="text-neutral-900 dark:text-neutral-50"
        >
          {title}
        </Heading>
        <div className="mt-4 sm:mt-0">
          <SortOrderFilter onFilterChange={handleTimeFilterChange} />
        </div>
      </div>
    );
  };

  const renderHeading2 = () => {
    return (
      <div className="mb-12 lg:mb-16">
        <Heading
          className="text-neutral-900 dark:text-neutral-50"
          fontClass="text-3xl md:text-4xl 2xl:text-5xl font-semibold"
        >
          {title}
        </Heading>
        <h4 className="mt-4 text-neutral-500 dark:text-neutral-400 text-lg font-normal">
          Every User that creates an Album upload is marked as an author. Search here to support your favourite Artist or choose to search by record Label.
        </h4>
      </div>
    );
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`nc-SectionGridAuthorBox relative ${className}`}>
      {sectionStyle === "style1" ? renderHeading1() : renderHeading2()}
      <div className={`grid gap-4 md:gap-7 ${gridClassName}`}>
        {creators.map((creator, index) => renderCard(creator, index))}
      </div>
      <div className="mt-16 flex flex-col sm:flex-row items-center justify-center">
        <ButtonPrimary href="/subscription">Become a author</ButtonPrimary>
      </div>
    </div>
  );
};

export default SectionGridAuthorBox;
