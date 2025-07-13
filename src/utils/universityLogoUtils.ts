/**
 * University Logo Utilities
 * Handles logo path mapping and fallbacks for South African universities
 */

export const UNIVERSITY_LOGO_MAPPING: Record<string, string> = {
  // Map university IDs to logo files - only include files that actually exist
  uwc: "/university-logos/uwc.svg",
  // All other universities will fall back to default.svg
};

/**
 * Get the logo path for a university
 * Always returns a valid path, defaults to default.svg for missing logos
 */
export function getUniversityLogoPath(universityId: string): string {
  if (!universityId || typeof universityId !== "string") {
    return "/university-logos/default.svg";
  }

  const id = universityId.toLowerCase().trim();
  return UNIVERSITY_LOGO_MAPPING[id] || "/university-logos/default.svg";
}

/**
 * Generate fallback initials for a university
 */
export function generateUniversityInitials(universityName: string): string {
  if (!universityName || typeof universityName !== "string") {
    return "UNI";
  }

  // Special cases for common patterns
  const cleanName = universityName
    .replace(/University of /i, "")
    .replace(/\(.*?\)/g, "") // Remove parentheses content
    .trim();

  // Split by spaces and get first letter of each word
  const words = cleanName.split(" ").filter((word) => word.length > 0);

  if (words.length === 0) {
    return "UNI";
  }

  // Take first letter of each word, max 3 letters
  const initials = words
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 3)
    .join("");

  return initials || "UNI";
}

/**
 * Check if a logo file exists (client-side approximation)
 */
export function createLogoFallbackHandler(
  universityId: string,
  universityName: string,
): (event: React.SyntheticEvent<HTMLImageElement>) => void {
  return (e) => {
    const target = e.currentTarget;
    const currentSrc = target.src;

    // First fallback: try default logo
    if (!currentSrc.includes("default.svg")) {
      target.src = "/university-logos/default.svg";
      return;
    }

    // Second fallback: show initials
    target.style.display = "none";
    const container = target.parentElement;

    if (container && !container.querySelector(".fallback-text")) {
      const textElement = document.createElement("div");
      textElement.className =
        "fallback-text text-book-600 font-bold text-base sm:text-lg flex items-center justify-center w-full h-full text-center bg-slate-100 rounded-xl";
      textElement.textContent = generateUniversityInitials(universityName);

      // Add tooltip
      textElement.title = `${universityName} logo not available`;

      container.appendChild(textElement);
    }
  };
}

/**
 * Preload university logo to check if it exists
 */
export function preloadUniversityLogo(universityId: string): Promise<boolean> {
  return new Promise((resolve) => {
    const logoPath = getUniversityLogoPath(universityId);
    const img = new Image();

    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);

    // Set a timeout to prevent hanging
    setTimeout(() => resolve(false), 3000);

    img.src = logoPath;
  });
}
