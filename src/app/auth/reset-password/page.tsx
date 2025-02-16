"use client";

import { IResetPasswordBody } from "@/app/api/auth/reset-password/route";
import Plane from "@/assets/svg/Plane";
import Spinner from "@/components/common/Spinner";
import { setItem } from "@/utils/localStorage";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "react-toastify";

const Page = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ loading: false, submitted: false });

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setStatus((prev) => ({ ...prev, loading: true }));
      const body: IResetPasswordBody = { email };

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setItem("password-reset-email", email);
        toast.success(data.message);
        router.push("/auth/reset-password/success");
      } else {
        toast.error(data.message || "An error occurred. Please try again.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again later.");
    } finally {
      setStatus(() => ({ loading: false, submitted: false }));
      setEmail("");
    }
  }

  return (
    <div className="flex items-center flex-col justify-center w-full">
      <Plane />
      <h5 className="h5 my-4">Reset Password!</h5>
      <p className="text-sm mb-4 text-center text-[#7E7E8F]">
        Enter your email address and we&apos;ll send you an email with
        instructions to reset your password.
      </p>

      <form onSubmit={handleResetPassword} className="mt-7 w-full">
        <div className="mt-4">
          <label
            htmlFor="email"
            className="block text-sm text-[#F1F1F1] font-sans"
          >
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 block w-full border rounded-lg shadow-sm p-4 border-[#1F2128] bg-[#2C2C35]"
            required
          />
        </div>
        {status.loading ? (
          <div className="mt-4">
            <Spinner />
          </div>
        ) : (
          <button
            type="submit"
            className="w-full bg-[#7364DB] text-white p-4 rounded-md hover:bg-[#5C4DB5] mt-4 font-sans"
          >
            Submit
          </button>
        )}
      </form>
    </div>
  );
};

export default Page;
