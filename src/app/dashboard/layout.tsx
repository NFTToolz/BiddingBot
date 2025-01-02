"use client";

import "../globals.css";
import React, { useEffect } from "react";
import { Suspense } from "react";

import { useWalletStore } from "@/store";
import { useTagStore } from "@/store/tag.store";
export default function RootLayout({ children }: any) {
  const setWallets = useWalletStore((state) => state.setWallets);
  const setTags = useTagStore((state) => state.setTags);

  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const response = await fetch("/api/wallet", {
          credentials: "include", // This ensures cookies are sent with the request
        });
        if (!response.ok) throw new Error("Failed to fetch wallets");
        const wallets = await response.json();
        setWallets(wallets); // Store fetched wallets in Zustand state
      } catch (error) {
        console.error("Error fetching wallets:", error);
      }
    };

    fetchWallets();
  }, [setWallets]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch("/api/tag", {
          credentials: "include", // This ensures cookies are sent with the request
        });
        if (!response.ok) throw new Error("Failed to fetch wallets");
        const tags = await response.json();
        setTags(tags); // Store fetched tags in Zustand state
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };

    fetchTags();
  }, [setTags]);

  return (
    <main className="relative mt-8">
      <Suspense>
        <div>
          <div className="transition-all duration-300">{children}</div>
        </div>
      </Suspense>
    </main>
  );
}
