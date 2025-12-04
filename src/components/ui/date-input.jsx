import React from 'react';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export const DateInput = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div className="relative w-full">
      <Input
        type="date"
        ref={ref}
        className={cn(
          "pr-10 cursor-pointer",
          "[&::-webkit-calendar-picker-indicator]:opacity-0",
          "[&::-webkit-calendar-picker-indicator]:absolute",
          "[&::-webkit-calendar-picker-indicator]:inset-0",
          "[&::-webkit-calendar-picker-indicator]:w-full",
          "[&::-webkit-calendar-picker-indicator]:h-full",
          "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
          "[&::-webkit-calendar-picker-indicator]:z-20",
          className
        )}
        {...props}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
        <Calendar className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
});

DateInput.displayName = "DateInput";
