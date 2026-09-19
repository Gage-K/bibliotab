import { Link, NavLink, redirect } from "react-router";
import PageWrapper from "../layouts/PageWrapper";
import useTypedAuth from "../hooks/useTypedAuth";
import { Button } from "./ui/button";

export default function Header() {
  const { auth, setAuth } = useTypedAuth();

  function logout() {
    setAuth({});
    redirect("/");
  }
  const linkBaseStyle =
    "rounded-sm px-3 py-1 hover:bg-accent hover:text-accent-foreground duration-150 ease-in-out";
  const activeStyle = `${linkBaseStyle} bg-accent text-accent-foreground`;
  return (
    <header className="shadow-2xs sticky top-0 py-2 mb-4 bg-background border-b z-100">
      <PageWrapper>
        <div className="flex justify-between items-baseline">
          <div className="flex items-center gap-8">
            <Link to="/" className="font-semibold text-foreground">
              bibliotab
            </Link>
            <nav className="flex gap-2 text-muted-foreground text-sm font-medium">
              <NavLink
                to="/dashboard"
                className={(isActive) =>
                  isActive.isActive ? activeStyle : linkBaseStyle
                }>
                tabs
              </NavLink>
            </nav>
          </div>
          <div className="flex gap-4 text-muted-foreground text-sm font-medium items-center">
            {auth.user ? (
              <Link to="/profile" className="font-semibold text-foreground hover:underline">
                {auth.user}
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="text-muted-foreground hover:text-foreground hover:underline duration-150 ease-in-out">
                  Sign up
                </Link>
                <Button asChild size="sm">
                  <Link to="/login">Log in</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </PageWrapper>
    </header>
  );
}
