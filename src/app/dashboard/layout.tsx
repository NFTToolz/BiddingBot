"use client";

import "../globals.css";
import React, { useState, useEffect } from "react";
import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useGlobal } from "../context/GlobalContext";
import Sidebar from "@/components/sidebar/Sidebar";
import BackIcon from "@/assets/svg/BackIcon";
import DashboardHeader from "@/components/header/DashboardHeader";
import { useWalletStore } from "@/store";
import { useTagStore } from "@/store/tag.store";
import DisconnectIcon from "@/assets/svg/DisconnectIcon";
import { useWebSocket } from "../context/WebSocketContext";

export default function RootLayout({ children }: any) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const { showSideBar, setShowSidebar } = useGlobal();
  const router = useRouter();

  const { isConnected } = useWebSocket();

  const setWallets = useWalletStore((state) => state.setWallets);
  const setTags = useTagStore((state) => state.setTags);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsCollapsed(true);
        setIsMobileOrTablet(true);
      } else {
        setIsCollapsed(false);
        setIsMobileOrTablet(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

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
      {/* {!isConnected && (
				<div className='fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center'>
					<DisconnectIcon size={240} color='#AEB9E1' />
					<p className='mt-4 text-lg text-gray-600'>
						Connection lost. Reconnecting...
					</p>
				</div>
			)} */}
      <Suspense>
        <div>
          <div className="transition-all duration-300">{children}</div>
        </div>
      </Suspense>
    </main>
  );
}
