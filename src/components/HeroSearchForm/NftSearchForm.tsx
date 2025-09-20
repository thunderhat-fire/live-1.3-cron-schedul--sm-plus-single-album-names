"use client";

import LocationInput from "./LocationInput";
import React, { FC } from "react";
import { useSearch } from "@/contexts/SearchContext";

export interface NftSearchFormProps {
  haveDefaultValue?: boolean;
}

// DEFAULT DATA FOR ARCHIVE PAGE
const defaultLocationValue = "Tokyo, Jappan";

const NftSearchForm: FC<NftSearchFormProps> = ({
  haveDefaultValue = false,
}) => {
  const { 
    searchQuery, 
    setSearchQuery,
    handleSearch 
  } = useSearch();

  const renderForm = () => {
    return (
      <form 
        className="w-full relative xl:mt-8 flex flex-col lg:flex-row rounded-[30px] md:rounded-[36px] lg:rounded-full shadow-xl dark:shadow-2xl bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700 lg:divide-y-0"
        onSubmit={async (e) => {
          e.preventDefault();
          await handleSearch();
        }}
      >
        <LocationInput
          defaultValue={searchQuery}
          onChange={(value) => setSearchQuery(value)}
          className="flex-1"
        />
      </form>
    );
  };

  return renderForm();
};

export default NftSearchForm;
