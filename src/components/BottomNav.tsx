import { Books, BookOpenText, House, UserCircle } from "@phosphor-icons/react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Обзор", icon: House, end: true },
  { to: "/lessons", label: "Уроки", icon: BookOpenText },
  { to: "/stories", label: "Рассказы", icon: Books },
  { to: "/profile", label: "Профиль", icon: UserCircle },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Основная навигация">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? "active" : undefined)}>
          <Icon size={22} weight="regular" aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
