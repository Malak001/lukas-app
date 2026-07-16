import AuthCard from "@/components/AuthCard";
import SignupForm from "./SignupForm";

export default function SignupPage() {
  return (
    <AuthCard title="Create your account" subtitle="Start learning in a few minutes.">
      <SignupForm />
    </AuthCard>
  );
}
