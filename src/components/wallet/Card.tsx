import Image from "next/image";
import React from "react";

interface CardProps {
  icon: React.ReactNode;
  amount: string;
  title: string;
  percentage: number;
  graph: string;
}

const Card: React.FC<CardProps> = ({
  icon,
  amount,
  title,
  percentage,
  graph,
}) => {
  return (
    <div className="card p-6 border-[#313442] border rounded-2xl w-full max-w-[290px] bg-[#1f2129] flex flex-col justify-between">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between w-full">
          <div className="icon p-3 bg-[#313442] rounded-full">{icon}</div>
          <h4 className="numbers text-[#F1F1F1] font-bold font-poppins text-2xl">
            {amount}
          </h4>
        </div>
        <div className="flex items-center justify-between w-full">
          <p className="text-Neutral/Neutra-500-[day] font-semibold text-sm font-poppins">
            {title}
          </p>
          <p
            className={`numbers font-semibold font-poppins text-base ${
              percentage > 0 ? "text-Accents/Green" : "text-[#E23738]"
            }`}
          >
            {percentage}%
          </p>
        </div>
      </div>
      <div className="mt-6">
        <Image
          src={graph}
          alt="Income Graph"
          width={187}
          height={44}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default Card;
