"use client";

import React, { useEffect, useState } from "react";
import { Tab } from "@/app/headlessui";
import Avatar from "@/shared/Avatar/Avatar";
import VerifyIcon from "@/components/VerifyIcon";
import Link from "next/link";
import Image from "next/image";
import { DEFAULT_AVATAR } from "@/constants/images";

interface PreSaleHistoryItem {
  userId: string;
  userName: string;
  userAvatar?: string;
  date: string;
}

interface TabDetailProps {
  nftId: string;
}

const TabDetail: React.FC<TabDetailProps> = ({ nftId }) => {
  const TABS = ["Details", "Pre-sale History"];
  const [preSaleHistory, setPreSaleHistory] = useState<PreSaleHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreSaleHistory = async () => {
      try {
        const response = await fetch(`/api/nfts/${nftId}/presale-history`);
        if (!response.ok) {
          throw new Error('Failed to fetch pre-sale history');
        }
        const data = await response.json();
        setPreSaleHistory(data.history);
      } catch (err) {
        console.error('Error fetching pre-sale history:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch pre-sale history');
      } finally {
        setLoading(false);
      }
    };

    fetchPreSaleHistory();
  }, [nftId]);

  const renderTabPreSaleHistory = () => {
    if (loading) {
      return (
        <div className="py-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="py-4 text-center text-red-500">
          {error}
        </div>
      );
    }

    if (!preSaleHistory.length) {
      return (
        <div className="py-4 text-center text-neutral-500">
          No pre-sale history available.
        </div>
      );
    }

    return (
      <ul className="divide-y divide-neutral-100 dark:divide-neutral-700">
        {preSaleHistory.map((item, index) => (
          <li key={index} className="py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Image
                  alt={`${item.userName}'s avatar`}
                  src={item.userAvatar || DEFAULT_AVATAR}
                  className="rounded-full"
                  width={40}
                  height={40}
                />
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium">
                  <Link href={`/author/${item.userId}`}>Pre-ordered by {item.userName}</Link>
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  {new Date(item.date).toLocaleDateString()}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  const renderTabItem = (item: string) => {
    switch (item) {
      case "Details":
        return (
          <div className="text-neutral-6000 dark:text-neutral-300">
            <span>Details content for NFT {nftId}</span>
          </div>
        );
      case "Pre-sale History":
        return renderTabPreSaleHistory();
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl p-1 bg-neutral-100 dark:bg-neutral-800">
          {TABS.map((tab) => (
            <Tab
              key={tab}
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-neutral-700 dark:text-neutral-300
                ${
                  selected
                    ? "bg-white dark:bg-neutral-900 shadow"
                    : "hover:bg-white/[0.12] hover:text-neutral-800 dark:hover:text-neutral-100"
                }
                `
              }
            >
              {tab}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-4">
          {TABS.map((tab, idx) => (
            <Tab.Panel
              key={idx}
              className="rounded-xl"
            >
              {renderTabItem(tab)}
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default TabDetail;
