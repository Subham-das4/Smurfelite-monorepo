"use client";

import React, { useState } from "react";
import { MdDelete } from "react-icons/md";
import { toast } from "react-toastify";
import { useRemoveFromCartMutation } from "@/api/cart";
import { CartItemResponse } from "@smurfelite/types";

interface CartItemProps {
  item: CartItemResponse;
}

export const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const [removeFromCartApi] = useRemoveFromCartMutation();
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await removeFromCartApi(item.productId).unwrap();
    } catch {
      toast.error("Could not remove item from cart. Please try again.");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="group bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-transparent hover:border-primary/20 transition-all">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        {/* Product info */}
        <div className="sm:col-span-6 flex gap-4">
          <div className="relative shrink-0 size-20 md:size-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.product.imageUrl ?? undefined}
              alt={item.product.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          <div className="flex flex-col justify-center gap-1">
            <h3 className="font-bold text-lg leading-tight text-gray-900 dark:text-white group-hover:text-primary transition-colors">
              {item.product.title}
            </h3>
            <button
              type="button"
              onClick={() => void handleRemove()}
              disabled={isRemoving}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium mt-1 w-fit transition-colors disabled:opacity-50 disabled:pointer-events-none"
              aria-label={`Remove ${item.product.title} from cart`}
            >
              <MdDelete className="text-base" />
              {isRemoving ? "Removing…" : "Remove"}
            </button>
          </div>
        </div>

        {/* Platform / Server */}
        <div className="sm:col-span-3 flex sm:justify-center items-center">
          {item.product.gameType ? (
            <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              {item.product.gameType}
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
            ${item.product.price.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
