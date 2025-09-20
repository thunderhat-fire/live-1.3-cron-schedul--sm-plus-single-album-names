import React, { FC } from "react";

export interface PricesProps {
  className?: string;
  price: string;
  labelText?: string;
}

const Prices: FC<PricesProps> = ({
  className = "",
  price,
  labelText = "Price",
}) => {
  const formatPrice = (price: string) => {
    // If the price already has a currency symbol, return it as is
    if (price.startsWith('£')) {
      return price;
    }

    // Otherwise, convert to number and format
    const priceValue = parseFloat(price);
    if (isNaN(priceValue)) {
      return "£0.00";
    }

    return `£${priceValue.toFixed(2)}`;
  };

  return (
    <div className={`${className}`}>
      <span className="text-neutral-500 dark:text-neutral-400 text-sm">
        {labelText}
      </span>
      <span className="text-base font-medium text-neutral-900 dark:text-neutral-100">
        {formatPrice(price)}
      </span>
    </div>
  );
};

export default Prices; 