import { Link, NavLink } from "react-router";
import PageWrapper from "../layouts/PageWrapper";
import useAuth from "../hooks/useAuth";
import { Circle } from "@phosphor-icons/react";

export default function Header() {
  const { auth } = useAuth();
  const linkBaseStyle =
    "bg-neutral-100/0 rounded-sm px-3 py-1 hover:bg-neutral-100 hover:text-neutral-900 duration-150 ease-in-out";
  const activeStyle = `${linkBaseStyle} text-neutral-900 bg-neutral-100/100`;
  return (
    <header className="shadow-2xs sticky top-0 py-2 mb-4 bg-neutral-50 z-1">
      <PageWrapper>
        <div className="flex justify-between items-baseline">
          <Link to="/" className="font-semibold">
            tablab
          </Link>
          <nav className="flex gap-2 text-neutral-500 text-sm font-medium">
            <NavLink
              to="/"
              className={(isActive) =>
                isActive.isActive ? activeStyle : linkBaseStyle
              }>
              home
            </NavLink>
            <NavLink
              to="/dashboard"
              className={(isActive) =>
                isActive.isActive ? activeStyle : linkBaseStyle
              }>
              tabs
            </NavLink>
            <NavLink
              to="/guide"
              className={(isActive) =>
                isActive.isActive ? activeStyle : linkBaseStyle
              }>
              guide
            </NavLink>
            <NavLink
              to="/updates"
              className={(isActive) =>
                isActive.isActive ? activeStyle : linkBaseStyle
              }>
              updates
            </NavLink>
          </nav>
          {auth.user ? (
            <>
              <Link to="/logout">Log out</Link>
              <Link to="/profile">
                <span className="hidden">Profile</span>
                <Circle size={16} />
              </Link>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>{" "}
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </PageWrapper>
    </header>
  );
}
