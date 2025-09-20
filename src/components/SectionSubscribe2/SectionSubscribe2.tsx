"use client";

import React, { FC, useState } from "react";
import ButtonCircle from "@/shared/Button/ButtonCircle";
import rightImg from "@/images/SVG-subcribe2.png";
import NcImage from "@/shared/NcImage/NcImage";
import Badge from "@/shared/Badge/Badge";
import Input from "@/shared/Input/Input";
import { ArrowSmallRightIcon } from "@heroicons/react/24/outline";

export interface SectionSubscribe2Props {
  className?: string;
}

const SectionSubscribe2: FC<SectionSubscribe2Props> = ({ className = "" }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess("Thank you for subscribing!");
        setEmail("");
      } else {
        setError(data.error || "Failed to subscribe. Please try again.");
      }
    } catch (err) {
      setError("Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`nc-SectionSubscribe2 relative flex flex-col lg:flex-row lg:items-center ${className}`}
    >
      <div className="flex-shrink-0 mb-10 lg:mb-0 lg:mr-10 lg:w-2/5">
        <h2 className="font-semibold text-4xl">Never miss a drop!</h2>
        <span className="block mt-5 text-neutral-500 dark:text-neutral-400">
          Subscribe to our super-exclusive drop list and be the first to know
          about upcoming drops
        </span>
        <ul className="space-y-4 mt-10">
          <li className="flex items-center space-x-4">
            <Badge name="01" />
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              Get more discount
            </span>
          </li>
          <li className="flex items-center space-x-4">
            <Badge color="red" name="02" />
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              Get premium offers
            </span>
          </li>
        </ul>
        <form className="mt-10 relative max-w-sm" onSubmit={handleSubmit}>
          <Input
            required
            aria-required
            placeholder="Enter your email"
            type="email"
            rounded="rounded-full"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={loading}
          />
          <ButtonCircle
            type="submit"
            className="absolute transform top-1/2 -translate-y-1/2 right-1"
            disabled={loading}
          >
            <ArrowSmallRightIcon className="w-5 h-5" />
          </ButtonCircle>
          {success && <div className="mt-3 text-green-600 text-sm">{success}</div>}
          {error && <div className="mt-3 text-red-600 text-sm">{error}</div>}
        </form>
      </div>
      <div className="flex-grow">
        <NcImage className="rounded-3xl" src={rightImg.src} alt="Newsletter subscription" />
      </div>
    </div>
  );
};

export default SectionSubscribe2;
