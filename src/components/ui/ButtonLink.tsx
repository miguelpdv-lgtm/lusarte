import Link from "next/link";
import type { ComponentProps } from "react";

const variants = {
  primary: "bg-estrella text-carbon",
  light: "bg-crema text-carbon",
  dark: "bg-carbon text-crema",
} as const;

type Props = ComponentProps<typeof Link> & {
  variant?: keyof typeof variants;
};

export function ButtonLink({ variant = "primary", className = "", ...props }: Props) {
  return (
    <Link
      className={`toon toon-press inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
