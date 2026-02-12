"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DeleteAccountModal } from "@/components/DeleteAccountModal";

export default function SettingsPage() {
  const { user, loading, refreshUser } = useAuth({ redirectTo: "/login" });

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

    const res = await fetch("/api/users/profile", {
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
    const res = await fetch("/api/users/email", {
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
    setPasswordLoading(true);
    const res = await fetch("/api/users/password", {
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
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <a href="/home" className="text-muted-foreground hover:text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </a>
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
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
