import React, { FC } from "react";

export interface ShippingIconProps {
  className?: string;
}

const ShippingIcon: FC<ShippingIconProps> = ({ className = "w-32 h-32" }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Vinyl record base */}
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      
      {/* Shipping box elements */}
      <path
        d="M20 8L16 12V19H8V12L4 8M4 8L12 4L20 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default ShippingIcon; 