import React, { FC } from "react";
import { IconType } from "react-icons";
import { MdLocalShipping, MdUpload, MdPublish, MdMusicNote, MdAlbum, MdShoppingCart } from "react-icons/md";
import VectorImg from "@/images/VectorHIW.svg";
import Badge from "@/shared/Badge/Badge";
import Image from "next/image";

interface HowItWorkItem {
  id: number;
  icon: IconType;
  title: string;
  desc: string;
}

export interface SectionHowItWorkProps {
  className?: string;
  data?: HowItWorkItem[];
}

const DEMO_DATA: HowItWorkItem[] = [
  {
    id: 1,
    icon: MdUpload,
    title: "Search/Upload",
    desc: "Search for vinyl or upload your own to sell",
  },
  {
    id: 2,
    icon: MdPublish,
    title: "Publish",
    desc: "List your Album with details and price",
  },
  {
    id: 3,
    icon: MdShoppingCart,
    title: "Run PreSale",
    desc: "Launch your PreSale campaign and share on social media",
  },
  {
    id: 4,
    icon: MdAlbum,
    title: "Pressed Records",
    desc: "Successful PreSales are pressed into high-quality records for your fans",
  },
  {
    id: 5,
    icon: MdLocalShipping,
    title: "Fast shipping",
    desc: "Your vinyl is carefully packed and shipped to your supportive fans",
  },
  {
    id: 6,
    icon: MdMusicNote,
    title: "Listen",
    desc: "Enjoy the feeling of having your music with your top fans",
  },
];

const SectionHowItWork: FC<SectionHowItWorkProps> = ({
  className = "",
  data = DEMO_DATA,
}) => {
  return (
    <div className={`nc-SectionHowItWork ${className}`}>
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">The easy six step process to getting records to your paying Fans!</h2>
      <div className="relative grid sm:grid-cols-3 lg:grid-cols-6 gap-10 sm:gap-16 xl:gap-20">
        <Image
          className="hidden md:block absolute inset-x-0 top-5"
          src={VectorImg}
          alt="vector"
        />
        {data.map((item, index) => (
          <div
            key={item.id}
            className="relative flex flex-col items-center max-w-xs mx-auto h-full"
          >
            <div className="mb-4 sm:mb-10 max-w-[140px] mx-auto flex items-center justify-center h-24">
              <item.icon className="w-24 h-24 text-gray-500" />
            </div>
            <div className="text-center flex flex-col flex-1">
              <Badge
                name={`Step ${index + 1}`}
                color={
                  !index
                    ? "red"
                    : index === 1
                    ? "indigo"
                    : index === 2
                    ? "blue"
                    : index === 3
                    ? "green"
                    : index === 4
                    ? "yellow"
                    : "purple"
                }
              />
              <div className="mt-5">
                <h3 className="text-base font-semibold mb-4">{item.title}</h3>
                <span className="block text-slate-600 dark:text-slate-400 text-sm leading-6">
                  {item.desc}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SectionHowItWork;
