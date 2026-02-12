import { Check, X } from "@phosphor-icons/react";
import React, { Fragment, useEffect, useRef, useState } from "react";
import Header from "../components/Header";
import PageWrapper from "../layouts/PageWrapper";
import Footer from "../components/Footer";
import { Link, useNavigate, useLocation } from "react-router";
import axios from "../api/axios";
import { AxiosError } from "axios";
import useAuth from "../hooks/useAuth";

const USER_REGEX = /^[A-z][A-z0-9-_]{3,23}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/;
const REGISTER_URL = "/api/auth/register";

export default function Register() {
  const { setAuth } = useAuth() as {
    setAuth: (auth: { user: string; accessToken: string; refreshToken: string }) => void;
  };
  const userRef = useRef<HTMLInputElement | null>(null);
  const errRef = useRef<HTMLParagraphElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [user, setUser] = useState("");
  const [validName, setValidName] = useState(false);
  const [userFocus, setUserFocus] = useState(false);

  const [pwd, setPwd] = useState("");
  const [validPwd, setValidPwd] = useState(false);
  const [pwdFocus, setPwdFocus] = useState(false);

  const [matchPwd, setMatchPwd] = useState("");
  const [validMatch, setValidMatch] = useState(false);
  const [matchFocus, setMatchFocus] = useState(false);

  const [errMsg, setErrMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    userRef.current?.focus();
  }, []);

  useEffect(() => {
    const result = USER_REGEX.test(user);

    setValidName(result);
  }, [user]);

  useEffect(() => {
    const result = PWD_REGEX.test(pwd);

    setValidPwd(result);
    const match = pwd === matchPwd;
    setValidMatch(match);
  }, [pwd, matchPwd]);

  useEffect(() => {
    setErrMsg("");
  }, [user, pwd, matchPwd]);

  async function handleSubmit(event: React.FormEvent) {
    setIsLoading(true);
    event.preventDefault();

    // prevents enabling button by JS injection
    const v1 = USER_REGEX.test(user);
    const v2 = PWD_REGEX.test(pwd);
    if (!v1 || !v2) {
      setErrMsg("Invalid entry");
      return;
    }

    try {
      const response = await axios.post(
        REGISTER_URL,
        JSON.stringify({ username: user, password: pwd }),
        {
          headers: {
            "Content-Type": "application/json",
            withCredentials: true,
          },
        }
      );
      const accessToken = response.data.accessToken;
      const refreshToken = response.data.refreshToken;
      setAuth({ user, accessToken, refreshToken });
      setIsLoading(false);
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof AxiosError) {
        if (!err?.response) {
          setErrMsg("No server response");
        } else if (err.response?.status === 409) {
          setErrMsg("Username taken");
        } else {
          setErrMsg("Registration failed");
        }
      }
      errRef.current?.focus();
      setIsLoading(false);
    }
  }

  return (
    <Fragment>
      <Header />
      <PageWrapper>
        <main className="min-h-screen flex justify-center py-16">
          <section>
            <div className="bg-neutral-50 dark:bg-neutral-900 p-8 rounded-sm shadow-md border border-neutral-200 dark:border-neutral-700">
              <h1 className="text-2xl font-bold mb-4 dark:text-neutral-200">
                Register
              </h1>
              <p
                ref={errRef}
                className={
                  errMsg
                    ? "flex border border-red-600 bg-red-50 text-red-600 px-2 py-1 mb-2 rounded-sm"
                    : "hidden"
                }
                aria-live="assertive">
                {errMsg}
              </p>
              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-4 dark:text-neutral-300">
                <div>
                  <label htmlFor="username" className="flex items-center gap-2">
                    Username
                    <Check
                      size={16}
                      className={
                        validName ? "valid text-emerald-600" : "hidden"
                      }
                    />
                    <X
                      size={16}
                      className={
                        validName || !user ? "hidden" : "invalid text-red-600"
                      }
                    />
                  </label>
                  <input
                    type="text"
                    id="username"
                    className="border border-neutral-300 rounded-sm px-2 py-1 dark:border-neutral-700"
                    ref={userRef}
                    autoComplete="off"
                    onChange={(e) => setUser(e.target.value)}
                    required
                    aria-invalid={validName ? "false" : "true"}
                    aria-describedby="uidnote"
                    onFocus={() => setUserFocus(true)}
                    onBlur={() => setUserFocus(false)}
                  />
                  <div className="max-w-58 text-sm text-neutral-600 mt-2">
                    <p
                      id="uidnote"
                      className={
                        userFocus && user && !validName
                          ? "instructions dark:text-neutral-400"
                          : "hidden"
                      }>
                      4 to 24 characters.
                      <br />
                      Must begin with a letter.
                      <br />
                      Letters, numbers, underscores, hyphens allowed.
                    </p>
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="flex items-center">
                    Password:
                    <Check
                      size={16}
                      className={validPwd ? "valid text-emerald-600" : "hidden"}
                    />
                    <X
                      size={16}
                      className={
                        validPwd || !pwd ? "hidden" : "invalid text-red-600"
                      }
                    />
                  </label>
                  <input
                    type="password"
                    className="border border-neutral-300 rounded-sm px-2 py-1 dark:border-neutral-700"
                    id="password"
                    onChange={(e) => setPwd(e.target.value)}
                    value={pwd}
                    required
                    aria-invalid={validPwd ? "false" : "true"}
                    aria-describedby="pwdnote"
                    onFocus={() => setPwdFocus(true)}
                    onBlur={() => setPwdFocus(false)}
                  />
                  <div className="max-w-58 text-sm text-neutral-600 mt-2">
                    <p
                      id="pwdnote"
                      className={
                        pwdFocus && !validPwd
                          ? "instructions dark:text-neutral-400"
                          : "hidden"
                      }>
                      8 to 24 characters.
                      <br />
                      Must include uppercase and lowercase letters, a number and
                      a special character.
                      <br />
                      Allowed special characters:{" "}
                      <span aria-label="exclamation mark">!</span>{" "}
                      <span aria-label="at symbol">@</span>{" "}
                      <span aria-label="hashtag">#</span>{" "}
                      <span aria-label="dollar sign">$</span>{" "}
                      <span aria-label="percent">%</span>
                    </p>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm_pwd" className="flex">
                    Confirm Password:
                    <Check
                      size={16}
                      className={
                        validMatch && matchPwd
                          ? "valid text-emerald-600"
                          : "hidden"
                      }
                    />
                    <X
                      size={16}
                      className={
                        validMatch || !matchPwd
                          ? "hidden"
                          : "invalid text-red-600"
                      }
                    />
                  </label>
                  <input
                    type="password"
                    className="border border-neutral-300 rounded-sm px-2 py-1 dark:border-neutral-700"
                    id="confirm_pwd"
                    onChange={(e) => setMatchPwd(e.target.value)}
                    value={matchPwd}
                    required
                    aria-invalid={validMatch ? "false" : "true"}
                    aria-describedby="confirmnote"
                    onFocus={() => setMatchFocus(true)}
                    onBlur={() => setMatchFocus(false)}
                  />
                  <div className="max-w-58 text-sm text-neutral-600 mt-2">
                    <p
                      id="confirmnote"
                      className={
                        matchFocus && !validMatch
                          ? "instructions dark:text-neutral-400"
                          : "hidden"
                      }>
                      Must match the first password input field.
                    </p>
                  </div>
                </div>

                <button
                  className={`rounded-sm py-2 ${isLoading
                    ? `animate-pulse bg-neutral-200 rounded-sm py-2 text-neutral-500 hover:cursor-not-allowed hover:cursor-not-allowed`
                    : !validName || !validPwd || !validMatch
                      ? "bg-neutral-200 dark:bg-neutral-800 rounded-sm py-2 text-neutral-500 hover:cursor-not-allowed"
                      : "bg-neutral-800 dark:bg-neutral-300 rounded-sm py-2 text-neutral-50 dark:text-neutral-900 hover:bg-neutral-600 cursor-pointer"
                    }`}
                  disabled={
                    !validName || !validPwd || !validMatch ? true : false
                  }>
                  Sign up
                </button>
              </form>
              <p className="my-2 text-md text-neutral-700 dark:text-neutral-400">
                Already registered?{" "}
                <Link
                  to="/login"
                  className="font-medium underline hover:text-neutral-500">
                  Log in
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
