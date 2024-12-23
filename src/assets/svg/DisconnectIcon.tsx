import React from "react";

interface DisconnectIconProps {
  color?: string;
  size?: number;
}

const DisconnectIcon: React.FC<DisconnectIconProps> = ({
  color = "#000000",
  size = 200,
}) => {
  return (
    <svg
      height={size}
      width={size}
      version="1.1"
      viewBox="0 0 512 512"
      xmlSpace="preserve"
    >
      <g>
        <path
          fill={color}
          d="M210.287,176.988h-57.062c-36.544,0-67.206,24.836-76.238,58.53H0v40.973h76.987 c9.04,33.686,39.702,58.522,76.238,58.522h57.062v-38.588h43.025v-80.84h-43.025V176.988z"
        />
        <path
          fill={color}
          d="M435.005,235.517c-9.032-33.694-39.686-58.53-76.23-58.53h-57.062v158.024h57.062 c36.544,0,67.191-24.836,76.23-58.522H512v-40.973H435.005z"
        />
      </g>
    </svg>
  );
};

export default DisconnectIcon;
