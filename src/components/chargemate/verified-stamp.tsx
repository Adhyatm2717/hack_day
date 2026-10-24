import * as React from "react";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedStampProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  sublabel?: string;
  /** Color variant — defaults to forest green */
  variant?: "forest" | "charge" | "ochre";
}

const VARIANT_CLASSES = {
  forest: {
    border: "border-forest/40",
    text:   "text-forest",
    shadow: "shadow-stamp",
    icon:   "text-forest",
  },
  charge: {
    border: "border-charge/40",
    text:   "text-charge",
    shadow: "shadow-stamp-charge",
    icon:   "text-charge",
  },
  ochre: {
    border: "border-ochre/40",
    text:   "text-ochre",
    shadow: "shadow-stamp-ochre",
    icon:   "text-ochre",
  },
};

export function VerifiedStamp({
  label = "KYC & EARTHING VERIFIED",
  sublabel,
  variant = "forest",
  className,
  ...props
}: VerifiedStampProps) {
  const v = VARIANT_CLASSES[variant];

  return (
    <div
      className={cn(
        // Tilted -2deg with hard offset shadow — the signature tactile stamp
        "inline-flex flex-col items-center gap-0.5",
        "bg-card border-2 rounded-md",
        "px-3 py-2",
        "-rotate-2",
        v.border,
        v.shadow,
        className
      )}
      {...props}
    >
      <div className={cn("flex items-center gap-1.5", v.text)}>
        <CheckCircle className={cn("size-3.5 shrink-0", v.icon)} aria-hidden />
        <span className={cn("font-heading text-label-sm uppercase tracking-widest leading-none", v.text)}>
          {label}
        </span>
      </div>
      {sublabel && (
        <span className="text-[9px] font-heading uppercase tracking-widest text-muted-foreground leading-none">
          {sublabel}
        </span>
      )}
    </div>
  );
}
