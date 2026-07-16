import AuthCard from "@/components/AuthCard";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <AuthCard title="Welcome back">
      <LoginForm />
    </AuthCard>
  );
}
