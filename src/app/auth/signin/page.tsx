"use client";

import { userStore } from "@/store/user.store";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { toast } from "react-toastify";

const SignIn = () => {
  const router = useRouter();
  const { login } = userStore();

  const handleLogin = async () => {
    await login();
    router.push("/dashboard");
  };

  return (
    <div className="flex items-center flex-col justify-center w-full">
      <Image
        src="/logo.png"
        width={60}
        height={60}
        alt="NFTTOOLS logo"
        className="mb-4 text-center"
      />
      <h5 className="h5 mb-4">Welcome Back!</h5>
      <p className="tagline text-sm mb-4 text-center">
        Let`&apos;s build something great
      </p>

      <div className="text-center max-w-md px-4">
        <p className="text-sm text-gray-600 mb-4">
          Sign in securely with your passkey - no password needed. Your
          device&apos;s biometric security (like fingerprint or face
          recognition) keeps your account protected.
        </p>
      </div>

      <button
        onClick={handleLogin}
        className="w-full bg-Brand/Brand-1 text-white p-4 rounded-md hover:bg-[#5C4DB5] mt-4 font-sans"
      >
        Login
      </button>

      <p className="mt-4 text-center">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className="text-[#7364DB]">
          Create one with your passkey
        </Link>
      </p>
    </div>
  );
};

export default SignIn;
