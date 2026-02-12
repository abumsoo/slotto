"use client";

import { useRouter } from "next/navigation";

interface VerifyEmailPromptProps {
  onClose: () => void;
}

export function VerifyEmailPrompt({ onClose }: VerifyEmailPromptProps) {
  const router = useRouter();

  function handleVerify() {
    fetch('/api/users/resend-verification', {
      method: "POST",
      credentials: "include",
    }).catch(console.error);
    router.push("/verify-email");
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-lg border border-border p-6 max-w-sm w-full mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-foreground">Verify your email</h3>
        <p className="text-sm text-muted-foreground">You need to verify your email before you can post.</p>
        <button
          onClick={handleVerify}
          className="block w-full text-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
        >
          Verify Email
        </button>
        <button onClick={onClose} className="w-full text-sm text-muted-foreground hover:text-foreground">Cancel</button>
      </div>
    </div>
  );
}
