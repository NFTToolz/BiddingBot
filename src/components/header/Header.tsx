"use client";

import { disablePageScroll, enablePageScroll } from "scroll-lock";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { navigation } from "@/constants";
import Button from "../common/Button";
import { HamburgerMenu } from "@/design/Header";
import MenuSvg from "./MenuSvg";

const Header = () => {
  const [openNavigation, setOpenNavigation] = useState(false);
  const [hash, setHash] = useState("");
  const router = useRouter();

  useEffect(() => {
    const updateHash = () => {
      setHash(window.location.hash);
    };

    updateHash();

    window.addEventListener("hashchange", updateHash);

    return () => {
      window.removeEventListener("hashchange", updateHash);
    };
  }, []);

  const toggleNavigation = () => {
    if (openNavigation) {
      setOpenNavigation(false);
      enablePageScroll();
    } else {
      setOpenNavigation(true);
      disablePageScroll();
    }
  };

  const handleClick = () => {
    if (!openNavigation) return;

    enablePageScroll();
    setOpenNavigation(false);
  };

  const handleSignIn = async () => {
    try {
      const response = await fetch("/api/auth/token", {
        method: "GET",
        credentials: "include", // This is important for including cookies in the request
      });

      const data = await response.json();

      if (data.success) {
        router.push("/dashboard");
      } else {
        router.push("/auth/signin");
      }
    } catch (error) {
      console.error("Error checking authentication:", error);
      router.push("/auth/signin");
    }
  };

  return (
    <div
      className={`fixed top-0 left-0 w-full z-50 border-b border-[#3F3A52] lg:bg-n-8/90 lg:backdrop-blur-sm ${
        openNavigation ? "bg-n-8" : "bg-n-8/90 backdrop-blur-sm"
      }`}
    >
      <div className="flex items-center justify-between px-5 lg:px-7.5 xl:px-10 max-lg:py-4">
        <Link className="w-[12rem] flex items-center gap-4" href="/#hero">
          <Image src="/logo.png" width={60} height={60} alt="Brainwave" />
          <h2 className="text-2xl font-bold">NFTTOOLS</h2>
        </Link>
        <nav
          className={`${
            openNavigation ? "flex" : "hidden"
          } fixed top-[5rem] left-0 right-0 bottom-0 bg-n-8 lg:static lg:flex lg:mx-auto lg:bg-transparent`}
        >
          <div className="relative z-2 flex flex-col items-center justify-center m-auto lg:flex-row">
            {navigation.map((item, index) => (
              <Link
                key={index}
                href={`/${item.url}`}
                onClick={handleClick}
                className={`block relative font-code text-2xl uppercase text-[#FFFFFF] transition-colors hover:text-color-1 ${
                  item.onlyMobile ? "lg:hidden" : ""
                } px-6 py-6 md:py-8 lg:-mr-0.25 lg:text-base lg:font-semibold ${
                  item.url === hash
                    ? "z-2 lg:text-[#FFFFFF]"
                    : "lg:text-[#FFFFFF]/50"
                } lg:leading-5 lg:hover:text-[#FFFFFF] xl:px-12`}
              >
                {item.title}
              </Link>
            ))}
          </div>

          <HamburgerMenu />
        </nav>
        <button
          className="border border-[#7364DB] w-auto uppercase font-code font-semibold px-8 py-2 rounded bg-[#7364DB]"
          onClick={handleSignIn}
        >
          Sign in
        </button>
        <button className="ml-auto lg:hidden px-3" onClick={toggleNavigation}>
          <MenuSvg openNavigation={openNavigation} />
        </button>
      </div>
    </div>
  );
};

export default Header;
