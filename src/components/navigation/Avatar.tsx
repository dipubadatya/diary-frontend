

export const AVATAR_FALLBACK =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100";

export interface AvatarProps {
  src?: string;
  alt: string;
  size?: number;
  ring?: boolean;
  className?: string;
}

export function Avatar({
  src,
  alt,
  size = 32,
  ring = false,
  className = "",
}: AvatarProps) {
  return (
    <img
      src={src || AVATAR_FALLBACK}
      alt={alt || "Avatar"}
      className={`rounded-full object-cover bg-gray-100 flex-shrink-0 ${
        ring ? "ring-2 ring-white/30" : ""
      } ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      loading="lazy"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = AVATAR_FALLBACK;
      }}
    />
  );
}

export default Avatar;
