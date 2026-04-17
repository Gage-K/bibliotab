import PageWrapper from "../layouts/PageWrapper";
import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { AxiosError } from "axios";
import axios from "../api/axios";
import useTypedAuth from "../hooks/useTypedAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

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
    <PageWrapper>
      <div className="flex justify-center py-16">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Log in</CardTitle>
            <CardDescription>
              Enter your credentials to access your account.
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
                <Label htmlFor="username">Username</Label>
                <Input
                  type="text"
                  id="username"
                  ref={userRef}
                  autoComplete="off"
                  onChange={(e) => setUser(e.target.value)}
                  value={user}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  type="password"
                  id="password"
                  onChange={(e) => setPwd(e.target.value)}
                  value={pwd}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={!isFilled || isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary underline underline-offset-4 hover:text-primary/80">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
