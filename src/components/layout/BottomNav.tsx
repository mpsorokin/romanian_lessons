import { Books, CardsThree, House, UserCircle } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";

const items = [
  { to: "/", labelKey: "nav.overview", icon: House, end: true, match: (path: string) => path === "/" },
  { to: "/library", labelKey: "nav.library", icon: Books, match: (path: string) => path.startsWith("/library") },
  { to: "/cards", labelKey: "nav.cards", icon: CardsThree, match: (path: string) => path.startsWith("/cards") },
  { to: "/profile", labelKey: "nav.profile", icon: UserCircle, match: (path: string) => path === "/profile" || path === "/stats" },
] as const;

export function BottomNav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return (
    <nav className="bottom-nav" aria-label={t("nav.main")}>
      {items.map(({ to, labelKey, icon: Icon, match, ...rest }) => (
        <NavLink
          key={to}
          to={to}
          end={"end" in rest ? rest.end : undefined}
          className={() => (match(pathname) ? "active" : undefined)}
        >
          <Icon size={22} weight="regular" aria-hidden="true" />
          <span>{t(labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
