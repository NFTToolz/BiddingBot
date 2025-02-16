"use client";

import { userStore } from "@/store/user.store";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

const SignUp = () => {
  const { createUser } = userStore();
  const router = useRouter();

  const handleCreateUser = async () => {
    try {
      await createUser();
      router.push("/dashboard");
    } catch (error) {
      // Handle any errors here if needed
      console.error("Error creating user:", error);
    }
  };

  return (
    <div className="flex items-center flex-col justify-center w-full mt-8 md:mt-0">
      <Image
        src="/logo.png"
        width={60}
        height={60}
        alt="NFTTOOLS logo"
        className="mb-4 text-center"
      />
      <h5 className="h5 mb-4">Create an account</h5>
      <p className="tagline text-sm mb-4 text-center">
        Let’s build something great
      </p>

      <div className="text-center max-w-md px-4">
        <p className="text-sm text-gray-600 mb-4">
          Sign in securely with your passkey - no password needed. Your
          device&apos;s biometric security (like fingerprint or face
          recognition) keeps your account protected.
        </p>
      </div>
      <button
        onClick={handleCreateUser}
        className={`w-full bg-[#7364DB] text-white p-4 rounded-md hover:bg-[#5C4DB5] mt-5 font-sans uppercase`}
      >
        Create account
      </button>

      <p className="mt-4 text-center">
        Already have an account?{" "}
        <Link href="/auth/signin" className="text-[#7364DB]">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default SignUp;
