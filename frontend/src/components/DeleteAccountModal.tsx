"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from '@/lib/api';

interface DeleteAccountModalProps {
  onClose: () => void;
}

export function DeleteAccountModal({ onClose }: DeleteAccountModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch(`${API_BASE}/api/users/me`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.message || "Delete failed");
      setLoading(false);
      return;
    }

    router.push("/");
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-lg border border-border p-6 max-w-sm w-full mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-foreground">Delete your account?</h3>
        <p className="text-sm text-muted-foreground">This action is permanent. All your posts will be deleted. Enter your password to confirm.</p>
        <form onSubmit={handleDelete} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full bg-muted rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Delete My Account"}
          </button>
        </form>
        <button onClick={onClose} className="w-full text-sm text-muted-foreground hover:text-foreground">Cancel</button>
      </div>
    </div>
  );
}
