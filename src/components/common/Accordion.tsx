import ChevronDown from "@/assets/svg/ChevronDown";
import React, { useState } from "react";

interface AccordionProps {
  title: string;
  children: React.ReactNode;
}

const Accordion: React.FC<AccordionProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-[#313442] rounded-lg mb-4">
      <button
        className="w-full text-left p-4 text-[#CAC6DD] rounded-t-2xl flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        {title}
        <ChevronDown
          className={`transition-transform duration-300 ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && <div className="p-4">{children}</div>}
    </div>
  );
};

export default Accordion;
