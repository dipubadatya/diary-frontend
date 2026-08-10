import { Link } from "react-router-dom";

interface DiaryLogoProps {
  className?: string;
  to?: string;
}

const DiaryLogo: React.FC<DiaryLogoProps> = ({ className = "", to = "/" }) => {
  return (
    <Link
      to={to}
      aria-label="Diary"
      className={`group inline-flex items-center ${className}`}
    >
      <span className="diary-wordmark">
        Diary
        <svg
          className="diary-underline"
          viewBox="0 0 200 20"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 12 Q 50 2, 100 10 T 198 8"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </span>
    </Link>
  );
};

export default DiaryLogo;