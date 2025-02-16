"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { mail } from "@/assets";
import useSWR from "swr";
import { IUpdatePasswordBody } from "@/app/api/auth/reset-password/route";
import { toast } from "react-toastify";
import { getItem } from "@/utils/localStorage";
import Spinner from "@/components/common/Spinner";
import VisibleIcon from "@/assets/svg/VisibleIcon";
import InvisibleIcon from "@/assets/svg/InvisibleIcon";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const Verify = () => {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const token = searchParams.get("token") as string;
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const router = useRouter();

  useEffect(() => {
    const email = getItem("password-reset-email");
    if (email) {
      setEmail(email);
    }
  }, []);

  const {
    data,
    error,
    isLoading,
  }: {
    data: { success: boolean; error: boolean };
    error: any;
    isLoading: boolean;
  } = useSWR(`/api/auth/reset-password?token=${token}`, fetcher);

  useEffect(() => {
    if (error) {
      toast.error(
        "Invalid or expired token. Please request a new password reset."
      );
      router.push("/auth/reset-password");
    }
  }, [error, router]);

  async function updatePassword() {
    setLoading(true);
    try {
      const body: IUpdatePasswordBody = { password };
      const response = await fetch(`/api/auth/reset-password?token=${token}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        router.push("/auth/login");
      } else {
        toast.error(
          result.message || "An error occurred while updating the password"
        );
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const success = useMemo(() => data?.success, [data?.success]);

  if (loading || isLoading) {
    return <Spinner />;
  }

  return (
    <div className="flex items-center flex-col justify-center w-full">
      <Image
        src="/logo.png"
        width={60}
        height={60}
        alt="NFTTOOLS logo"
        className="mb-4 text-center"
      />
      <p className="mb-4 text-center">Enter new password</p>

      {success ? (
        <div className="w-full">
          <div className="relative mt-2">
            <input
              type={isPasswordVisible ? "text" : "password"}
              name="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full border rounded-lg shadow-sm p-4 border-[#1F2128] bg-[#2C2C35]"
              required
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
            >
              {isPasswordVisible ? <VisibleIcon /> : <InvisibleIcon />}
            </button>
          </div>

          <button
            onClick={updatePassword}
            className="w-full bg-[#7364DB] text-white p-4 rounded-md hover:bg-[#5C4DB5] mt-4 font-sans"
          >
            Submit
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4 items-center justify-center">
          <Image src={mail} width={128} height={128} alt="mail" />

          <h2 className="text-[#F1F1F1] font-semibold my-4 font-poppins text-[20px] text-center">
            Thank you!
          </h2>

          <p className="text-center text-sm font-montserrat">
            We sent an email to <span className="text-[#7364DB]">{email} </span>
            . Please check your email for instructions to reset your password
          </p>
        </div>
      )}
    </div>
  );
};

export default Verify;
