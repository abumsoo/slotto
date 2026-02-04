"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided");
      return;
    }

    fetch(`http://localhost:3001/api/users/verify?token=${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified!");
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong");
      });
  }, [token]);

  return (
    <div className="flex flex-col items-center justify-center m-8">
      {status === "loading" && <p>Verifying your email...</p>}
      {status === "success" && (
        <div className="text-center">
          <p className="text-green-600 text-xl">{message}</p>
          <Link href="/login" className="underline mt-4 block">Go to login</Link>
        </div>
      )}
      {status === "error" && (
        <p className="text-red-500">{message}</p>
      )}
    </div>
  );
}
