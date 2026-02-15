import Header from "../components/Header";
import Footer from "../components/Footer";
import PageWrapper from "../layouts/PageWrapper";
import { Fragment, useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { AxiosError } from "axios";
import axios from "../api/axios";
import useTypedAuth from "../hooks/useTypedAuth";

const LOGIN_URL = "/api/auth/login";

export default function Login() {
  const { setAuth } = useTypedAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const userRef = useRef<HTMLInputElement | null>(null);
  const errRef = useRef<HTMLParagraphElement | null>(null);

  const [user, setUser] = useState("");
  const [pwd, setPwd] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isFilled = user && pwd;

  useEffect(() => {
    userRef.current?.focus();
  }, []);

  useEffect(() => {
    setErrMsg("");
  }, [user, pwd]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    setIsLoading(true);
    e.preventDefault();

    try {
      const response = await axios.post(
        LOGIN_URL,
        JSON.stringify({ username: user, password: pwd }),
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      const accessToken = response.data.accessToken;
      const refreshToken = response.data.refreshToken;
      setAuth({ user, accessToken, refreshToken });
      navigate(from, { replace: true });
      setIsLoading(false);
    } catch (err) {
      if (err instanceof AxiosError) {
        if (!err.response) {
          setErrMsg("No server response.");
        } else if (err.response.status === 400) {
          setErrMsg("Missing username or password");
        } else if (err.response.status === 401) {
          setErrMsg("Incorrect login details");
        } else {
          setErrMsg("Login failed");
        }
      } else {
        setErrMsg("Login failed");
      }
      errRef.current?.focus();

      console.error(err);
      setIsLoading(false);
    }
  }

  return (
    <Fragment>
      <Header />
      <PageWrapper>
        <main className="min-h-screen flex justify-center py-16">
          <section>
            <div className="bg-neutral-50 dark:bg-neutral-900 p-8 rounded-sm shadow-md border border-neutral-200 dark:border-neutral-700 dark:text-neutral-200">
              <h1 className="text-2xl font-bold mb-4">Log in</h1>
              <p
                ref={errRef}
                className={
                  errMsg
                    ? "flex border border-red-600 bg-red-50 text-red-600 px-2 py-1 rounded-sm"
                    : "hidden"
                }
                aria-live="assertive">
                {errMsg}
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="username"
                    className="flex dark:text-neutral-300">
                    Username:
                  </label>
                  <input
                    type="text"
                    className="border border-neutral-300 dark:border-neutral-700 rounded-sm px-2 py-1"
                    id="username"
                    ref={userRef}
                    autoComplete="off"
                    onChange={(e) => setUser(e.target.value)}
                    value={user}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="flex dark:text-neutral-300">
                    Password:
                  </label>
                  <input
                    type="password"
                    className="border border-neutral-300 dark:border-neutral-700 rounded-sm px-2 py-1"
                    id="password"
                    onChange={(e) => setPwd(e.target.value)}
                    value={pwd}
                    required
                  />
                </div>
                <button
                  disabled={!isFilled || isLoading}
                  className={`rounded-sm py-2 ${isLoading
                    ? `animate-pulse bg-neutral-200 rounded-sm py-2 text-neutral-500 hover:cursor-not-allowed hover:cursor-not-allowed`
                    : isFilled
                      ? `bg-neutral-800 dark:bg-neutral-300 rounded-sm py-2 text-neutral-50 dark:text-neutral-900 hover:bg-neutral-600 cursor-pointer`
                      : `bg-neutral-200 dark:bg-neutral-800 rounded-sm py-2 text-neutral-500 hover:cursor-not-allowed`
                    }`}>
                  Sign in
                </button>
              </form>
              <p className="my-2 text-md text-neutral-700 dark:text-neutral-400">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-medium underline hover:text-neutral-500">
                  Sign up
                </Link>
              </p>
            </div>
          </section>
        </main>
      </PageWrapper>
      <Footer />
    </Fragment>
  );
}
