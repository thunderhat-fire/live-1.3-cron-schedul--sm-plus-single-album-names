"use client";

import React, { FC, useState, useEffect } from "react";
import Heading from "@/components/Heading/Heading";
import Nav from "@/shared/Nav/Nav";
import NavItem from "@/shared/NavItem/NavItem";
import { Popover, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

export interface HeaderFilterSectionProps {
  className?: string;
  activeGenre?: string;
  onGenreChange?: (genre: string) => void;
  onSortChange?: (sortOrder: string) => void;
}

const GENRES = ["All Albums", "Jazz", "Pop", "Classical", "Electronic"];
const SORT_OPTIONS = [
  { name: "Recently Listed", value: "Recently-listed" },
  { name: "Ending Soon", value: "Ending-soon" },
  { name: "Most Favorited", value: "Most-favorited" },
];

// Add a helper function to handle electronic subgenres
const isElectronicSubgenre = (genre: string) => {
  const subgenres = ["Ambient", "DnB", "Techno"];
  return subgenres.includes(genre);
};

const HeaderFilterSection: FC<HeaderFilterSectionProps> = ({
  className = "mb-12",
  activeGenre = "All Albums",
  onGenreChange,
  onSortChange,
}) => {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState(SORT_OPTIONS[2]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSortChange = (option: typeof SORT_OPTIONS[0]) => {
    setSelectedSort(option);
    onSortChange?.(option.value);
  };

  // Don't render the full component until mounted
  if (!mounted) {
    return (
      <div className={`flex flex-col relative ${className}`}>
        <Heading>{`What's trending now`}</Heading>
      </div>
    );
  }

  return (
    <div className={`flex flex-col relative ${className}`}>
      <Heading>{`What's trending now`}</Heading>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-6 lg:space-y-0 lg:space-x-2">
        <Nav
          className="sm:space-x-2"
          containerClassName="relative flex w-full overflow-x-auto text-sm md:text-base hiddenScrollbar"
        >
          {GENRES.map((item, index) => (
            <NavItem
              key={index}
              isActive={activeGenre === item}
              onClick={() => onGenreChange?.(item)}
            >
              {item}
            </NavItem>
          ))}
        </Nav>

        <Popover className="relative">
          {({ open }) => (
            <>
              <Popover.Button
                className={`flex items-center justify-center px-4 py-2 text-sm rounded-full border focus:outline-none select-none
                  ${open ? 'border-primary-500 text-primary-500' : 'border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500'}
                `}
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                  <path d="M11.5166 5.70834L14.0499 8.24168" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11.5166 14.2917V5.70834" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8.48327 14.2917L5.94995 11.7583" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8.48315 5.70834V14.2917" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="ml-2">{selectedSort.name}</span>
                <ChevronDownIcon className="w-4 h-4 ml-1" />
              </Popover.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <Popover.Panel className="absolute z-10 w-screen max-w-[200px] px-4 mt-3 right-0 sm:px-0">
                  <div className="overflow-hidden rounded-2xl shadow-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                    <div className="relative flex flex-col px-5 py-6 space-y-5">
                      {SORT_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          className={`flex items-center space-x-3 text-sm ${
                            selectedSort.value === option.value
                              ? 'text-primary-500'
                              : 'text-neutral-700 dark:text-neutral-300'
                          }`}
                          onClick={() => handleSortChange(option)}
                        >
                          <span>{option.name}</span>
                          {selectedSort.value === option.value && (
                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
    </div>
  );
};

export default HeaderFilterSection;
