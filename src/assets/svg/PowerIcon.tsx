import React from "react";

const PowerIcon = ({ width = 24, height = 24 }) => {
  return (
    <svg
      fill="#fff"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={width}
      height={height}
    >
      <g>
        <path d="M12,24C6.5,24,2,19.5,2,14c0-4.1,2.4-7.7,6.2-9.2c0.5-0.2,1.1,0,1.3,0.5c0.2,0.5,0,1.1-0.5,1.3C5.9,7.8,4,10.7,4,14 c0,4.4,3.6,8,8,8s8-3.6,8-8c0-3.3-1.9-6.2-4.9-7.4c-0.5-0.2-0.8-0.8-0.5-1.3c0.2-0.5,0.8-0.8,1.3-0.5C19.6,6.3,22,9.9,22,14 C22,19.5,17.5,24,12,24z" />
        <path d="M12,14c-0.6,0-1-0.4-1-1V1c0-0.6,0.4-1,1-1s1,0.4,1,1v12C13,13.6,12.6,14,12,14z" />
      </g>
    </svg>
  );
};

export default PowerIcon;
