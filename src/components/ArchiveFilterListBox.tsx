"use client";
import React, { FC } from "react";
import { Fragment, useState } from "react";
import { Listbox, Transition } from "@/app/headlessui";
import { CheckIcon } from "@heroicons/react/24/solid";
import ButtonDropdown from "./ButtonDropdown";
import { useParams, usePathname } from "next/navigation";
import { NFT } from "@/types";

export interface ArchiveFilterListBoxProps {
  className?: string;
  onFilterChange?: (nfts: NFT[]) => void;
}

const lists = [
  { name: "Most Recent", value: "recent" },
  { name: "Most Viewed", value: "viewed" },
  { name: "Most Appreciated", value: "appreciated" },
  // These filters will be enabled when their features are implemented
  // { name: "Curated by Admin", value: "curated" },
  // { name: "Most Discussed", value: "discussed" },
];

const ArchiveFilterListBox: FC<ArchiveFilterListBoxProps> = ({
  className = "",
  onFilterChange
}) => {
  const [selected, setSelected] = useState(lists[0]);
  const params = useParams();
  const pathname = usePathname();

  const handleFilterChange = async (newValue: typeof lists[0]) => {
    setSelected(newValue);
    
    try {
      const userId = params?.id;
      
      console.log('Applying filter:', {
        filter: newValue.value,
        userId
      });

      const response = await fetch(`/api/nfts/filter?filter=${newValue.value}${userId ? `&userId=${userId}` : ''}`);
      if (!response.ok) {
        throw new Error('Failed to apply filter');
      }
      const data = await response.json();
      
      console.log('Filter response:', {
        success: data.success,
        nftCount: data.nfts?.length
      });

      if (data.success && onFilterChange) {
        onFilterChange(data.nfts);
      }
    } catch (error) {
      console.error('Error applying filter:', error);
    }
  };

  return (
    <div
      className={`nc-ArchiveFilterListBox ${className}`}
      data-nc-id="ArchiveFilterListBox"
    >
      <Listbox value={selected} onChange={handleFilterChange}>
        <div className="relative md:min-w-[200px]">
          <Listbox.Button as={"div"}>
            <ButtonDropdown>{selected.name}</ButtonDropdown>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute right-0 z-20 w-52 py-1 mt-2 overflow-auto text-sm text-neutral-900 dark:text-neutral-200 bg-white rounded-2xl shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-neutral-900 dark:ring-neutral-700">
              {lists.map((item, index: number) => (
                <Listbox.Option
                  key={index}
                  className={({ active }) =>
                    `${
                      active
                        ? "text-primary-700 dark:text-neutral-200 bg-primary-50 dark:bg-neutral-700"
                        : ""
                    } cursor-default select-none relative py-2 pl-10 pr-4`
                  }
                  value={item}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`${
                          selected ? "font-medium" : "font-normal"
                        } block truncate`}
                      >
                        {item.name}
                      </span>
                      {selected ? (
                        <span className="text-primary-700 absolute inset-y-0 left-0 flex items-center pl-3 dark:text-neutral-200">
                          <CheckIcon className="w-5 h-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
};

export default ArchiveFilterListBox;
