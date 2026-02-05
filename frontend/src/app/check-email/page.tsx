import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <div className="flex flex-col items-center justify-center m-8 text-center">
      <h1 className="text-2xl font-semibold mb-4">Check your email</h1>
      <p className="text-muted-foreground mb-6">
        We sent you a verification link. Please check your inbox and click the link to verify your account.
      </p>
      <Link href="/login" className="text-primary hover:underline">
        Back to login
      </Link>
    </div>
  );
}
