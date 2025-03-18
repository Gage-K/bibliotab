import { Link, NavLink } from "react-router";
import PageWrapper from "../layouts/PageWrapper";

export default function Header() {
  const linkBaseStyle =
    "bg-neutral-100/0 rounded-sm px-3 py-1 hover:bg-neutral-100 hover:text-neutral-900";
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
        </div>
      </PageWrapper>
    </header>
  );
}
