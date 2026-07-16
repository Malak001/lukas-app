import AuthCard from "@/components/AuthCard";
import LogoutButton from "@/components/LogoutButton";

export default function VerifyEmailPage() {
  return (
    <AuthCard title="Check your inbox">
      <p className="text-sm text-stone-600">
        We&apos;ve sent a verification link to your email. Click it to activate
        your account — this page will unlock automatically once you do.
      </p>
      <p className="mt-4 text-sm text-stone-600">
        Wrong email or can&apos;t find it?
      </p>
      <div className="mt-3">
        <LogoutButton label="Log out and try again" />
      </div>
    </AuthCard>
  );
}
