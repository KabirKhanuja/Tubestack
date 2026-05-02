"use client";

import { useTheme } from "@/components/theme-provider";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" strokeWidth={3} />,
        info: <InfoIcon className="size-4" strokeWidth={3} />,
        warning: <TriangleAlertIcon className="size-4" strokeWidth={3} />,
        error: <OctagonXIcon className="size-4" strokeWidth={3} />,
        loading: <Loader2Icon className="size-4 animate-spin" strokeWidth={3} />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "brutal-toast",
          title: "brutal-toast-title",
          description: "brutal-toast-desc",
          icon: "brutal-toast-icon",
          actionButton: "brutal-toast-action",
          cancelButton: "brutal-toast-cancel",
          success: "brutal-toast-success",
          error: "brutal-toast-error",
          warning: "brutal-toast-warning",
          info: "brutal-toast-info",
          loading: "brutal-toast-loading",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
