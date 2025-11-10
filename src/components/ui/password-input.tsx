import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "./utils";
import { Input } from "./input";

export interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  showStrengthIndicator?: boolean;
  strengthScore?: number;
  strengthText?: string;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showStrengthIndicator, strengthScore, strengthText, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const getStrengthColor = (score?: number) => {
      if (!score) return "bg-gray-200";
      if (score === 1) return "bg-red-500";
      if (score === 2) return "bg-orange-500";
      if (score === 3) return "bg-yellow-500";
      if (score === 4) return "bg-blue-500";
      return "bg-green-500";
    };

    return (
      <div className="space-y-2">
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            className={cn("pr-10", className)}
            ref={ref}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        
        {showStrengthIndicator && strengthScore !== undefined && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    i <= strengthScore
                      ? getStrengthColor(strengthScore)
                      : "bg-gray-200"
                  )}
                />
              ))}
            </div>
            {strengthText && (
              <p className="text-xs text-muted-foreground">{strengthText}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
