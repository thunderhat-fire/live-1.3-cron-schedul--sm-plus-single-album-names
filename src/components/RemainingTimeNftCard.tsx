import React, { FC, useEffect, useState } from "react";

interface Props {
  className?: string;
  contentClassName?: string;
  endDate?: string;
}

const RemainingTimeNftCard: FC<Props> = ({
  className = "absolute bottom-[-1px] right-[-1px] flex items-center",
  contentClassName = "right-4 bottom-1/2 translate-y-1/2",
  endDate,
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!endDate) return;

    const calculateTimeLeft = () => {
      const end = new Date(endDate).getTime();
      const now = new Date().getTime();
      const difference = end - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsExpired(true);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
      setIsExpired(false);
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    // Cleanup
    return () => clearInterval(timer);
  }, [endDate]);

  const formatTimeDisplay = () => {
    const parts = [];
    if (timeLeft.days > 0) parts.push(`${timeLeft.days}d`);
    if (timeLeft.hours > 0 || timeLeft.days > 0) parts.push(`${timeLeft.hours}h`);
    if (timeLeft.minutes > 0 || timeLeft.hours > 0 || timeLeft.days > 0) parts.push(`${timeLeft.minutes}m`);
    return parts.join(' : ');
  };

  return (
    <div className={className} style={{ zIndex: 1 }}>
      <svg
        className="text-white/50 dark:text-neutral-900/50 w-48 md:w-[200px] transform scale-y-[-1]"
        viewBox="0 0 196 55"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M196 55V12C196 5.37258 190.627 0 184 0H0.5V1H4.05286C12.4067 1 20.1595 5.34387 24.5214 12.4685L43.5393 43.5315C47.9012 50.6561 55.654 55 64.0078 55H196Z"
          fill="currentColor"
        />
      </svg>

      <div className={`absolute ${contentClassName}`}>
        <span className="block text-xs text-white tracking-wide">
          {isExpired ? "Vinyl Sale ended" : "Remaining time"}
        </span>
        {!isExpired && (
          <span className="block md:text-lg font-semibold text-white">
            {formatTimeDisplay()}
          </span>
        )}
      </div>
    </div>
  );
};

export default RemainingTimeNftCard;
