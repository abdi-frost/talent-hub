import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit Your Profile",
  description: "Join the Talent Hub network by submitting your profile.",
};

export default function SubmitPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="font-display text-5xl mb-2">Submit Profile</h1>
      <p className="text-[var(--color-muted)] mb-12">
        Fill in your details to join the talent network.
      </p>
      {/* TalentSubmissionForm component goes here */}
    </main>
  );
}
