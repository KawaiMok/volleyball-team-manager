/** Clerk `appearance` 物件（註解：避免依賴未直接安裝的 @clerk/types）。 */
type ClerkAppearance = {
  elements?: Record<string, string>;
};

const cardBase: ClerkAppearance = {
  elements: {
    rootBox: "mx-auto",
    card: "shadow-lg",
  },
};

/**
 * Clerk 表單外觀（註解：原生殼內隱藏 OAuth，避免 Google `disallowed_useragent`）。
 */
export function clerkAuthAppearance(nativeShell: boolean): ClerkAppearance {
  if (!nativeShell) {
    return cardBase;
  }

  return {
    elements: {
      ...cardBase.elements,
      socialButtons: "hidden",
      socialButtonsRoot: "hidden",
      socialButtonsBlockButton: "hidden",
      socialButtonsIconButton: "hidden",
      dividerRow: "hidden",
      dividerLine: "hidden",
      dividerText: "hidden",
    },
  };
}
