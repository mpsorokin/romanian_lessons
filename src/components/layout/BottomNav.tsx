import { Books, CardsThree, House, UserCircle } from "@phosphor-icons/react";
import { NavLink, useLocation } from "react-router-dom";

const items = [
  { to: "/", label: "Обзор", icon: House, end: true, match: (path: string) => path === "/" },
  { to: "/library", label: "Библиотека", icon: Books, match: (path: string) => path.startsWith("/library") },
  { to: "/cards", label: "Карточки", icon: CardsThree, match: (path: string) => path.startsWith("/cards") },
  { to: "/profile", label: "Профиль", icon: UserCircle, match: (path: string) => path === "/profile" || path === "/stats" },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="bottom-nav" aria-label="Основная навигация">
      {items.map(({ to, label, icon: Icon, match, ...rest }) => (
        <NavLink
          key={to}
          to={to}
          end={"end" in rest ? rest.end : undefined}
          className={() => (match(pathname) ? "active" : undefined)}
        >
          <Icon size={22} weight="regular" aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
