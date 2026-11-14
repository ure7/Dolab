"use client";

import { useFormStatus } from "react-dom";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { Button } from "./Button";

// A submit button that disables itself while its form is being sent,
// so people can't double-submit by tapping twice.
export function SubmitButton({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  const { t } = useI18n();

  return (
    <Button type="submit" disabled={pending} aria-busy={pending} className={className}>
      {pending ? t.common.working : children}
    </Button>
  );
}
