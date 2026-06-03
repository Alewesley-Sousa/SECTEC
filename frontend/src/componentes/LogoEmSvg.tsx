import type { JSX } from "react";

export default function SectecLogo(): JSX.Element {
  return (
    <svg
      width="210"
      height="70"
      viewBox="0 0 210 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ícone */}
      <rect x="0" y="8" width="28" height="28" rx="8" fill="#15803d" />
      <rect x="34" y="8" width="28" height="28" rx="8" fill="#dcfce7" />
      <rect x="0" y="42" width="28" height="28" rx="8" fill="#16a34a" />
      <rect x="34" y="42" width="28" height="28" rx="8" fill="#15803d" />

      {/* Texto */}
      <text
        x="78"
        y="34"
        fill="#14532d"
        fontSize="30"
        fontWeight="800"
        fontFamily="Poppins, Arial, sans-serif"
      >
        SECTEC
      </text>

      <text
        x="80"
        y="54"
        fill="#16a34a"
        fontSize="14"
        fontWeight="500"
        fontFamily="Poppins, Arial, sans-serif"
      >
        Projeto Escolar
      </text>
    </svg>
  );
}