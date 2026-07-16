import AuthCard from "@/components/AuthCard";
import OnboardingForm from "./OnboardingForm";

export default function OnboardingPage() {
  return (
    <AuthCard
      title="Let's set you up"
      subtitle="Tell us your native language and the one you want to learn."
    >
      <OnboardingForm />
    </AuthCard>
  );
}
