// import { Link } from "react-router-dom";

// interface DiaryLogoProps {
//   className?: string;
//   to?: string;
// }

// const DiaryLogo: React.FC<DiaryLogoProps> = ({ className = "", to = "/" }) => {
//   return (
//     <Link
//       to={to}
//       aria-label="Diary"
//       className={`group inline-flex items-center ${className}`}
//     >
//       <span className="diary-wordmark">
//         Diary
//         <svg
//           className="diary-underline"
//           viewBox="0 0 200 20"
//           preserveAspectRatio="none"
//           xmlns="http://www.w3.org/2000/svg"
//         >
//           <path
//             d="M2 12 Q 50 2, 100 10 T 198 8"
//             stroke="currentColor"
//             strokeWidth="2.5"
//             strokeLinecap="round"
//             fill="none"
//           />
//         </svg>
//       </span>
//     </Link>
//   );
// };

// export default DiaryLogo;
import React from "react";
import { Link } from "react-router-dom";

interface DiaryLogoProps {
  className?: string;
  to?: string;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: "text-[22px]",
  md: "text-[28px]",
  lg: "text-[36px]",
};

const DiaryLogo: React.FC<DiaryLogoProps> = ({
  className = "",
  to = "/",
  size = "md",
}) => {
  return (
    <Link
      to={to}
      aria-label="diary"
      className={`group inline-flex items-baseline select-none leading-none focus:outline-none ${SIZES[size]} ${className}`}
      style={{
        fontFamily:
          "'Bricolage Grotesque', 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
      }}
    >
      <span className="font-extrabold lowercase tracking-[-0.065em] text-zinc-950 dark:text-white antialiased">
        diary
      </span>
      <span
        aria-hidden="true"
        className="ml-[0.05em] inline-block h-[0.21em] w-[0.21em] rounded-full bg-violet-600 dark:bg-violet-500 transition-transform duration-200 ease-out group-hover:scale-125"
      />
    </Link>
  );
};

export default DiaryLogo;