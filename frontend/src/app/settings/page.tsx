"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { DeleteAccountModal } from "@/components/DeleteAccountModal";
import { API_BASE } from "@/lib/api";


export default function SettingsPage() {
  const { user, loading, refreshUser } = useAuth({ redirectTo: "/login" });
  const router = useRouter();

  function handleLogout() {
    fetch(`${API_BASE}/api/users/logout`, { method: 'POST', credentials: 'include' })
      .then(() => router.push('/login'));
  }

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  async function handleResendVerification() {
    setResendLoading(true);
    setResendMessage("");
    setResendError("");
    const res = await fetch(`${API_BASE}/api/users/resend-verification`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();
    setResendLoading(false);
    if (!res.ok) {
      setResendError(data.message || "Failed to send email");
    } else {
      setResendMessage(data.message);
    }
  }

  async function handleProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    if (!username.trim() && !name.trim()) {
      setProfileError("Enter a username or name to update");
      return;
    }
    setProfileLoading(true);
    const body: Record<string, string> = {};
    if (username.trim()) body.username = username.trim();
    if (name.trim()) body.name = name.trim();

    const res = await fetch(`${API_BASE}/api/users/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setProfileLoading(false);
    if (!res.ok) {
      setProfileError(data.message || "Update failed");
      return;
    }
    setProfileSuccess("Profile updated");
    setUsername("");
    setName("");
    refreshUser();
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailError("");
    setEmailSuccess("");
    if (!email.trim()) {
      setEmailError("Enter a new email");
      return;
    }
    setEmailLoading(true);
    const res = await fetch(`${API_BASE}/api/users/email`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = await res.json();
    setEmailLoading(false);
    if (!res.ok) {
      setEmailError(data.message || "Update failed");
      return;
    }
    setEmailSuccess(data.message);
    setEmail("");
    refreshUser();
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    if (!currentPassword || !newPassword) {
      setPasswordError("Both fields are required");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }
    setPasswordLoading(true);
    const res = await fetch(`${API_BASE}/api/users/password`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setPasswordLoading(false);
    if (!res.ok) {
      setPasswordError(data.message || "Update failed");
      return;
    }
    setPasswordSuccess(data.message);
    setCurrentPassword("");
    setNewPassword("");
  }

  if (loading || !user) return null;

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-24 sm:pb-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <button onClick={handleLogout} className="text-sm text-muted-foreground hover:text-foreground">Log out</button>
      </div>

      {/* Change Name & Username */}
      <form onSubmit={handleProfile} className="bg-card rounded-lg shadow-sm border border-border p-4 space-y-3">
        <h2 className="text-base font-semibold text-foreground">Name & Username</h2>
        <p className="text-sm text-muted-foreground">Current: {user.name ? `${user.name} (@${user.username})` : `@${user.username}`}</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New name"
          className="w-full bg-muted rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="New username"
          className="w-full bg-muted rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {profileError && <p className="text-red-500 text-sm">{profileError}</p>}
        {profileSuccess && <p className="text-green-500 text-sm">{profileSuccess}</p>}
        <button
          type="submit"
          disabled={profileLoading}
          className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {profileLoading ? "Saving..." : "Update Profile"}
        </button>
      </form>

      {/* Change Email */}
      <form onSubmit={handleEmail} className="bg-card rounded-lg shadow-sm border border-border p-4 space-y-3">
        <h2 className="text-base font-semibold text-foreground">Email</h2>
        <p className="text-sm text-muted-foreground">Current: {user.email}</p>
        {!user.verified && (
          <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 px-3 py-2.5 space-y-1.5">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">Your email isn&apos;t verified yet.</p>
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resendLoading}
              className="text-sm font-medium text-yellow-700 dark:text-yellow-400 underline underline-offset-2 disabled:opacity-50"
            >
              {resendLoading ? "Sending..." : "Resend verification email"}
            </button>
            {resendMessage && <p className="text-sm text-green-600 dark:text-green-400">{resendMessage}</p>}
            {resendError && <p className="text-sm text-red-500">{resendError}</p>}
          </div>
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="New email"
          className="w-full bg-muted rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
        {emailSuccess && <p className="text-green-500 text-sm">{emailSuccess}</p>}
        <button
          type="submit"
          disabled={emailLoading}
          className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {emailLoading ? "Saving..." : "Update Email"}
        </button>
      </form>

      {/* Change Password */}
      <form onSubmit={handlePassword} className="bg-card rounded-lg shadow-sm border border-border p-4 space-y-3">
        <h2 className="text-base font-semibold text-foreground">Password</h2>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Current password"
          className="w-full bg-muted rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password (min 8 characters)"
          className="w-full bg-muted rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
        {passwordSuccess && <p className="text-green-500 text-sm">{passwordSuccess}</p>}
        <button
          type="submit"
          disabled={passwordLoading}
          className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {passwordLoading ? "Saving..." : "Update Password"}
        </button>
      </form>

      {/* Delete Account */}
      <div className="bg-card rounded-lg shadow-sm border border-red-500/50 p-4 space-y-3">
        <h2 className="text-base font-semibold text-foreground">Delete Account</h2>
        <p className="text-sm text-muted-foreground">Permanently delete your account and all your posts. This cannot be undone.</p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Delete Account
        </button>
      </div>

      {showDeleteModal && <DeleteAccountModal onClose={() => setShowDeleteModal(false)} />}
    </div>
  );
}
