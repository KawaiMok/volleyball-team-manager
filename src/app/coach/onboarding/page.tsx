import { redirect } from "next/navigation";

/** 舊網址相容（註解：請改用 `/onboarding`）。 */
export default function CoachOnboardingRedirectPage() {
  redirect("/onboarding");
}
