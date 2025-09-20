"use client";

import React, { Fragment } from 'react';
import { Popover, Transition } from '@headlessui/react';
import { useMessageNotifications } from '@/hooks/useMessageNotifications';
import Avatar from '@/shared/Avatar/Avatar';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

const MessageNotifications = () => {
  const { unreadCount, messages, markAsRead, hasNewMessages } = useMessageNotifications();

  return (
    <Popover className="relative">
      <Popover.Button className="flex items-center">
        <div className="relative">
          <svg
            className={`w-6 h-6 dark:text-neutral-100 transition-all duration-200 ${
              hasNewMessages ? 'scale-110' : ''
            }`}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              stroke="currentColor"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          {unreadCount > 0 && (
            <span className={`absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-semibold ${
              hasNewMessages ? 'animate-pulse scale-125' : 'animate-pulse'
            }`}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
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
        <Popover.Panel className="absolute right-0 z-10 mt-3 w-screen max-w-xs transform px-4 sm:px-0">
          <div className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="relative bg-white dark:bg-neutral-800">
              <div className="p-3">
                <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 pb-3">
                  <h3 className="text-lg font-semibold">Messages</h3>
                  {unreadCount > 0 && (
                    <span className="bg-red-500/10 text-red-500 text-sm font-medium px-2 py-1 rounded-full animate-pulse">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="mt-2 max-h-[60vh] overflow-y-auto">
                  {messages.length === 0 ? (
                    <div className="text-center py-10 text-neutral-500 dark:text-neutral-400">
                      No new messages
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex items-start space-x-3 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg cursor-pointer transition-all duration-200 ${
                            !message.read ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
                          }`}
                          onClick={() => markAsRead(message.id)}
                        >
                          <Avatar
                            imgUrl={message.fromUser.image}
                            sizeClass="w-10 h-10"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                {message.fromUser.name}
                              </p>
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                              {message.content}
                            </p>
                          </div>
                          {!message.read && (
                            <span className="h-3 w-3 bg-green-500 rounded-full flex-shrink-0 animate-pulse" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                  <Link
                    href="/messages"
                    className="block w-full text-center py-2 px-4 rounded-lg text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-500 dark:hover:text-primary-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                  >
                    View All Messages
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
};

export default MessageNotifications; 