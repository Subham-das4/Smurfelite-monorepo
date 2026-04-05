"use client";

import React from "react";
import { MdDelete } from "react-icons/md";
import { useAppDispatch } from "@/hooks";
import { removeFromCart } from "@/store/reducers/cart/slice";
import type { CartItem as CartItemData } from "@/store/reducers/cart/slice";

interface CartItemProps {
  item: CartItemData;
}

export const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const dispatch = useAppDispatch();

  return (
    <div className="group bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-transparent hover:border-primary/20 transition-all">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        {/* Product info */}
        <div className="sm:col-span-6 flex gap-4">
          <div className="relative shrink-0 size-20 md:size-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image}
              alt={item.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          <div className="flex flex-col justify-center gap-1">
            <h3 className="font-bold text-lg leading-tight text-gray-900 dark:text-white group-hover:text-primary transition-colors">
              {item.name}
            </h3>
            {item.subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {item.subtitle}
              </p>
            )}
            <button
              onClick={() => dispatch(removeFromCart(item.id))}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium mt-1 w-fit transition-colors"
              aria-label={`Remove ${item.name} from cart`}
            >
              <MdDelete className="text-base" />
              Remove
            </button>
          </div>
        </div>

        {/* Platform / Server */}
        <div className="sm:col-span-3 flex sm:justify-center items-center">
          {item.platform ? (
            <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              {item.platform}
            </div>
          ) : (
            <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
          )}
        </div>

        {/* Price */}
        <div className="sm:col-span-3 flex justify-between sm:justify-end items-center">
          <span className="sm:hidden text-gray-500 dark:text-gray-400 font-medium text-sm">
            Price:
          </span>
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            ${item.price.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
