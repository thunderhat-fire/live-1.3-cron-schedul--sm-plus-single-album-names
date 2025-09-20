import React, { FC } from "react";
import CardNFTMusic from "./CardNFTMusic";
import Heading from "@/components/Heading/Heading";
import { NFT } from "@/types/nft";

export interface SectionMagazine8Props {
  className?: string;
  nfts?: NFT[];
}

const SectionMagazine8: FC<SectionMagazine8Props> = ({
  className = "",
  nfts = [],
}) => {
  return (
    <div className={`nc-SectionMagazine8 relative ${className}`}>
      <div className="relative">
        <Heading
          className="mb-12 text-neutral-900 dark:text-neutral-50 text-3xl md:text-4xl font-semibold"
          fontClass="text-3xl md:text-4xl font-semibold"
          isCenter
          desc=""
        >
          Listen NFTs audio live
        </Heading>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-10 mt-8 lg:mt-10">
          {nfts.map((nft: NFT) => (
            <CardNFTMusic 
              key={nft.id} 
              nft={nft}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SectionMagazine8;
