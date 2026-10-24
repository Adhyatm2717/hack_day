import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base styles
  [
    "inline-flex items-center justify-center gap-2 shrink-0 whitespace-nowrap",
    "font-heading font-semibold tracking-wide transition-all duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.98] cursor-pointer",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        // Charge (rider) — solid orange
        charge:
          "bg-charge text-charge-foreground shadow-md hover:brightness-105 active:brightness-95",
        // Host — deep forest green
        host:
          "bg-forest text-forest-foreground shadow-md hover:brightness-110 active:brightness-90",
        // Neutral outline
        outline:
          "border border-border bg-card text-foreground hover:bg-recessed",
        // Ghost — no bg
        ghost:
          "text-foreground hover:bg-recessed",
        // Destructive
        destructive:
          "bg-destructive text-destructive-foreground hover:brightness-110",
        // Ochre
        ochre:
          "bg-ochre text-ochre-foreground shadow-md hover:brightness-105",
      },
      size: {
        sm:      "h-8  px-3 text-label-md rounded-lg [&_svg]:size-3.5",
        default: "h-11 px-5 text-label-lg rounded-lg [&_svg]:size-4",
        lg:      "h-13 px-6 text-label-lg rounded-xl [&_svg]:size-5",
        icon:    "h-11 w-11 rounded-lg [&_svg]:size-5",
        "icon-sm":"h-8 w-8 rounded-lg [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "charge",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
