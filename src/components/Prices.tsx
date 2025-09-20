"use client";

import React, { FC } from "react";

export interface PricesProps {
  className?: string;
  price?: string;
  contentClass?: string;
  labelTextClassName?: string;
}

const Prices: FC<PricesProps> = ({
  className = "",
  price = "£1.00",
  contentClass = "py-1 px-2 md:py-1.5 md:px-2.5 text-sm sm:text-base font-semibold",
  labelTextClassName = "",
}) => {
  const formatPrice = (price: string) => {
    console.log('Formatting price:', price);
    // Remove any existing £ symbol, whitespace, and handle commas
    const cleanPrice = price.replace(/[£\s,]/g, '');
    
    // Convert to number and format
    const priceValue = parseFloat(cleanPrice);
    console.log('Parsed price:', priceValue);
    if (isNaN(priceValue)) {
      return "£0.00";
    }

    // Format with exactly 2 decimal places
    const formattedPrice = `£${priceValue.toFixed(2)}`;
    console.log('Formatted price:', formattedPrice);
    return formattedPrice;
  };

  return (
    <div className={`${className}`}>
      <div className={`flex items-center border-2 border-green-500 rounded-lg relative ${contentClass}`}>
        <div className="flex items-center gap-2">
          <span className="!leading-none text-green-500">{formatPrice(price)}</span>
          <span className={`text-xs text-neutral-500 dark:text-neutral-400 ${labelTextClassName}`}>
            Price
          </span>
        </div>
      </div>
    </div>
  );
};

export default Prices;