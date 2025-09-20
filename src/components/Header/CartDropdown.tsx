"use client";

import { Fragment } from "react";
import { Popover, Transition } from "@headlessui/react";
import { useCart } from "@/contexts/CartContext";
import ButtonPrimary from "@/shared/Button/ButtonPrimary";
import Image from "next/image";
import Link from "next/link";

export default function CartDropdown() {
  const { items, getTotal } = useCart();
  
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="relative">
      <Popover className="relative">
        {({ open }) => (
          <>
            <Popover.Button
              className={`
                ${open ? "" : "text-opacity-90"}
                group p-3 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full inline-flex items-center text-base font-medium hover:text-opacity-100
                focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 relative`}
            >
              {totalItems > 0 && (
                <span className="w-5 h-5 bg-primary-500 absolute -top-1 -right-1 rounded-full text-white text-xs flex items-center justify-center">
                  {totalItems}
                </span>
              )}
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M2 2H3.74001C4.82001 2 5.67 2.93 5.58 4L4.75 13.96C4.61 15.59 5.89999 16.99 7.53999 16.99H18.19C19.63 16.99 20.89 15.81 21 14.38L21.54 6.88C21.66 5.22 20.4 3.87 18.73 3.87H5.82001" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeMiterlimit="10" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M16.25 22C16.9404 22 17.5 21.4404 17.5 20.75C17.5 20.0596 16.9404 19.5 16.25 19.5C15.5596 19.5 15 20.0596 15 20.75C15 21.4404 15.5596 22 16.25 22Z" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeMiterlimit="10" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M8.25 22C8.94036 22 9.5 21.4404 9.5 20.75C9.5 20.0596 8.94036 19.5 8.25 19.5C7.55964 19.5 7 20.0596 7 20.75C7 21.4404 7.55964 22 8.25 22Z" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeMiterlimit="10" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M9 8H21" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeMiterlimit="10" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
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
                  <div className="relative grid gap-6 bg-white dark:bg-neutral-800 p-7">
                    <h3 className="text-xl font-semibold mb-2">Shopping Cart</h3>
                    
                    {items.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-neutral-500 dark:text-neutral-400">Your cart is empty</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4 max-h-[300px] overflow-auto">
                          {items.map((item, index) => (
                            <div key={`${item.id}-${item.format}`} className="flex items-center space-x-4 border-b border-neutral-200 dark:border-neutral-700 pb-4">
                              <div className="relative w-16 h-16">
                                <Image
                                  src={item.imageUrl}
                                  alt={item.name}
                                  fill
                                  className="object-cover rounded-lg"
                                />
                              </div>
                              <div className="flex-grow">
                                <h4 className="text-sm font-medium">{item.name}</h4>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                  Qty: {item.quantity} × £{item.price}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
                          <div className="flex justify-between mb-4">
                            <span className="font-medium">Total:</span>
                            <span className="font-semibold">£{getTotal().toFixed(2)}</span>
                          </div>
                          <Link href="/cart" className="w-full">
                            <ButtonPrimary className="w-full">
                              View Cart
                            </ButtonPrimary>
                          </Link>
                        </div>
                      </>
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