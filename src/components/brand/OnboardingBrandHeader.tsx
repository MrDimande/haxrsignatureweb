import Link from "next/link";
import HaxrLogo from "@/components/brand/HaxrLogo";

type OnboardingBrandHeaderProps = {
  subtitle?: string;
};

/** Marca HAXR no fluxo de onboarding — sem alterar lógica de passos. */
export default function OnboardingBrandHeader({
  subtitle = "Wedding Setup",
}: OnboardingBrandHeaderProps) {
  return (
    <Link href="/" className="inline-block w-fit transition-opacity hover:opacity-90">
      <HaxrLogo
        variant="full"
        tone="dark"
        size="md"
        subtitle={subtitle}
        className="items-start"
      />
    </Link>
  );
}
