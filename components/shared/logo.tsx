import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  /**
   * "light" — natural colours, for light/white backgrounds (default).
   * "dark"  — white-only version via CSS filter, for dark/black backgrounds.
   */
  variant?: "light" | "dark";
  /** px width of the rendered image (height auto-calculated). Default 140. */
  width?: number;
  href?: string;
  className?: string;
}

export function Logo({
  variant = "light",
  width = 140,
  href,
  className = "",
}: LogoProps) {
  const img = (
    <Image
      src="/logo.png"
      alt="Talent Hub"
      width={width}
      height={Math.round(width / 4.2)}
      priority
      className={`h-auto w-auto max-h-10 object-contain ${
        variant === "dark" ? "brightness-0 invert" : ""
      } ${className}`}
    />
  );

  if (href) {
    return (
      <Link href={href} className="flex-shrink-0 hover:opacity-80 transition-opacity">
        {img}
      </Link>
    );
  }

  return <span className="flex-shrink-0">{img}</span>;
}
