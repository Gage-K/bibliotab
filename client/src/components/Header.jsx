import { Link, NavLink, redirect } from "react-router";
import PageWrapper from "../layouts/PageWrapper";
import useAuth from "../hooks/useAuth";
import { Circle } from "@phosphor-icons/react";

export default function Header() {
  const { auth, setAuth } = useAuth();

  function logout() {
    setAuth({});
    redirect("/");
  }
  const linkBaseStyle =
    "bg-neutral-100/0 rounded-sm px-3 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-300 hover:text-neutral-900 duration-150 ease-in-out";
  const activeStyle = `${linkBaseStyle} text-neutral-900 bg-neutral-100/100 dark:bg-neutral-300/100`;
  return (
    <header className="shadow-2xs dark:shadow-neutral-300/10 sticky top-0 py-2 mb-4 bg-neutral-50 dark:bg-neutral-900 z-1">
      <PageWrapper>
        <div className="flex justify-between items-baseline">
          <div className="flex items-center gap-8">
            <Link to="/" className="font-semibold dark:text-neutral-300">
              tablab
            </Link>
            <nav className="flex gap-2 text-neutral-500 dark:text-neutral-400 text-sm font-medium">
              <NavLink
                to="/dashboard"
                className={(isActive) =>
                  isActive.isActive ? activeStyle : linkBaseStyle
                }>
                tabs
              </NavLink>
              {/*<NavLink
                to="/updates"
                className={(isActive) =>
                  isActive.isActive ? activeStyle : linkBaseStyle
                }>
                updates
              </NavLink>*/}
            </nav>
          </div>
          <div className="flex gap-4 text-neutral-500 dark:text-neutral-400 text-sm font-medium items-center">
            {auth.user ? (
              <Link to="/profile" className="font-semibold hover:underline">
                {auth.user}
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:underline duration-50 ease-in-out">
                  Sign up
                </Link>
                <Link
                  to="/login"
                  className="px-2 py-1 bg-indigo-600 text-neutral-50 rounded-sm hover:bg-indigo-400 duration-150 ease-in-out">
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>
      </PageWrapper>
    </header>
  );
}
