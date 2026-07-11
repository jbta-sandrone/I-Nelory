import { useLayoutEffect, type ReactNode } from "react";
import { initializeAppearance } from "../context/AppearanceContext";

type PublicLightLayoutProps = {
  children: ReactNode;
};

export default function PublicLightLayout({
  children,
}: PublicLightLayoutProps) {
  useLayoutEffect(() => {
    const root = document.documentElement;

    root.setAttribute("data-public-light-theme", "");
    root.classList.remove("dark", "compact");
    root.style.colorScheme = "light";

    return () => {
      root.removeAttribute("data-public-light-theme");
      initializeAppearance();
    };
  }, []);

  return <div className="public-light-theme">{children}</div>;
}
