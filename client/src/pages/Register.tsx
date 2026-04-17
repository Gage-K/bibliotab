import { Check, X } from "@phosphor-icons/react";
import React, { useEffect, useRef, useState } from "react";
import PageWrapper from "../layouts/PageWrapper";
import { Link, useNavigate, useLocation } from "react-router";
import axios from "../api/axios";
import { AxiosError } from "axios";
import useTypedAuth from "../hooks/useTypedAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

const USER_REGEX = /^[A-z][A-z0-9-_]{3,23}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/;
const REGISTER_URL = "/api/auth/register";

export default function Register() {
  const { setAuth } = useTypedAuth();
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

  const canSubmit = validName && validPwd && validMatch;

  return (
    <PageWrapper>
      <div className="flex justify-center py-16">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Register</CardTitle>
            <CardDescription>
              Create an account to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p
              ref={errRef}
              className={
                errMsg
                  ? "mb-4 rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  : "hidden"
              }
              aria-live="assertive">
              {errMsg}
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  Username
                  <Check
                    size={16}
                    className={validName ? "text-emerald-600" : "hidden"}
                  />
                  <X
                    size={16}
                    className={validName || !user ? "hidden" : "text-destructive"}
                  />
                </Label>
                <Input
                  type="text"
                  id="username"
                  ref={userRef}
                  autoComplete="off"
                  onChange={(e) => setUser(e.target.value)}
                  required
                  aria-invalid={validName ? "false" : "true"}
                  aria-describedby="uidnote"
                  onFocus={() => setUserFocus(true)}
                  onBlur={() => setUserFocus(false)}
                />
                <p
                  id="uidnote"
                  className={
                    userFocus && user && !validName
                      ? "text-sm text-muted-foreground"
                      : "hidden"
                  }>
                  4 to 24 characters. Must begin with a letter.
                  <br />
                  Letters, numbers, underscores, hyphens allowed.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  Password
                  <Check
                    size={16}
                    className={validPwd ? "text-emerald-600" : "hidden"}
                  />
                  <X
                    size={16}
                    className={validPwd || !pwd ? "hidden" : "text-destructive"}
                  />
                </Label>
                <Input
                  type="password"
                  id="password"
                  onChange={(e) => setPwd(e.target.value)}
                  value={pwd}
                  required
                  aria-invalid={validPwd ? "false" : "true"}
                  aria-describedby="pwdnote"
                  onFocus={() => setPwdFocus(true)}
                  onBlur={() => setPwdFocus(false)}
                />
                <p
                  id="pwdnote"
                  className={
                    pwdFocus && !validPwd
                      ? "text-sm text-muted-foreground"
                      : "hidden"
                  }>
                  8 to 24 characters. Must include uppercase and lowercase
                  letters, a number and a special character.
                  <br />
                  Allowed special characters:{" "}
                  <span aria-label="exclamation mark">!</span>{" "}
                  <span aria-label="at symbol">@</span>{" "}
                  <span aria-label="hashtag">#</span>{" "}
                  <span aria-label="dollar sign">$</span>{" "}
                  <span aria-label="percent">%</span>
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirm_pwd" className="flex items-center gap-2">
                  Confirm Password
                  <Check
                    size={16}
                    className={validMatch && matchPwd ? "text-emerald-600" : "hidden"}
                  />
                  <X
                    size={16}
                    className={validMatch || !matchPwd ? "hidden" : "text-destructive"}
                  />
                </Label>
                <Input
                  type="password"
                  id="confirm_pwd"
                  onChange={(e) => setMatchPwd(e.target.value)}
                  value={matchPwd}
                  required
                  aria-invalid={validMatch ? "false" : "true"}
                  aria-describedby="confirmnote"
                  onFocus={() => setMatchFocus(true)}
                  onBlur={() => setMatchFocus(false)}
                />
                <p
                  id="confirmnote"
                  className={
                    matchFocus && !validMatch
                      ? "text-sm text-muted-foreground"
                      : "hidden"
                  }>
                  Must match the first password input field.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!canSubmit || isLoading}>
                {isLoading ? "Signing up..." : "Sign up"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already registered?{" "}
              <Link to="/login" className="text-primary underline underline-offset-4 hover:text-primary/80">
                Log in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
