"use client";

import { Popover, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isGlobal: boolean;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

export default function NotifyDropdown() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch("/api/notifications");
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setNotifications(data.notifications);
          }
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    if (session?.user) {
      fetchNotifications();
      // Poll for new notifications every minute
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [session]);

  return (
    <div className="relative flex">
      <Popover className="self-center">
        {({ open }) => (
          <>
            <Popover.Button
              className={`
                ${open ? "" : "text-opacity-90"}
                 group p-3 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full inline-flex items-center text-base font-medium hover:text-opacity-100
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 relative`}
            >
              {notifications.length > 0 && (
                <span className="w-2.5 h-2.5 bg-blue-500 absolute top-2 right-2 rounded-full animate-pulse"></span>
              )}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 6.43994V9.76994"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                />
                <path
                  d="M12.02 2C8.34002 2 5.36002 4.98 5.36002 8.66V10.76C5.36002 11.44 5.08002 12.46 4.73002 13.04L3.46002 15.16C2.68002 16.47 3.22002 17.93 4.66002 18.41C9.44002 20 14.61 20 19.39 18.41C20.74 17.96 21.32 16.38 20.59 15.16L19.32 13.04C18.97 12.46 18.69 11.43 18.69 10.76V8.66C18.68 5 15.68 2 12.02 2Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                />
                <path
                  d="M15.33 18.8201C15.33 20.6501 13.83 22.1501 12 22.1501C11.09 22.1501 10.25 21.7701 9.65004 21.1701C9.05004 20.5701 8.67004 19.7301 8.67004 18.8201"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeMiterlimit="10"
                />
              </svg>
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
              <Popover.Panel className="absolute z-10 w-screen max-w-xs sm:max-w-sm px-4 top-full -right-28 sm:right-0 sm:px-0">
                <div className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="relative bg-white dark:bg-neutral-800 p-7">
                    <h3 className="text-xl font-semibold mb-4">Notifications</h3>
                    {notifications.length === 0 ? (
                      <p className="text-center text-neutral-500">No notifications</p>
                    ) : (
                      <div className="space-y-4">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 rounded-lg ${
                              notification.type === "success"
                                ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                : notification.type === "warning"
                                ? "bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                                : notification.type === "error"
                                ? "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                                : "bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                            }`}
                          >
                            <h4 className="font-medium mb-1">{notification.title}</h4>
                            <p className="text-sm opacity-90">{notification.message}</p>
                            <div className="mt-2 text-xs opacity-75">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </div>
  );
}
