import * as React from "react";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export const DateInput = React.forwardRef(({ className, ...props }, ref) => {
  const inputRef = React.useRef(null);

  const openPicker = () => {
    if (inputRef.current?.showPicker) {
      inputRef.current.showPicker();
    } else {
      inputRef.current?.focus();
    }
  };

  return (
    <div className="relative w-full">
      <Input
        ref={(node) => {
          inputRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        type="date"
        style={{ colorScheme: "light" }}
        className={cn(
          "pr-10 cursor-pointer",
          "appearance-none",
          "[&::-webkit-calendar-picker-indicator]:hidden",
          className
        )}
        {...props}
      />

      <button
        type="button"
        onClick={openPicker}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Calendar size={18} />
      </button>
    </div>
  );
});

DateInput.displayName = "DateInput";
