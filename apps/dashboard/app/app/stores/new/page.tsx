import { OnboardingWizard } from "@/components/onboarding-wizard";

export default function NewStorePage() {
  return (
    <>
      <p className="kicker">Setup</p>
      <h1>Add a store</h1>
      <p className="muted">Details, catalog, snippet — then you are live.</p>
      <OnboardingWizard />
    </>
  );
}
