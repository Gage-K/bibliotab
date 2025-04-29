import { Fragment, useEffect, useState, useRef } from "react";
import Header from "../components/Header";
import PageWrapper from "../layouts/PageWrapper";
import Footer from "../components/Footer";
import axios from "../api/axios";
import useAuth from "../hooks/useAuth";
import { Link, redirect, useNavigate } from "react-router";

const USER_URL = "/api/user";
const LOGOUT_URL = "/api/logout";

export default function Profile() {
  const { auth, setAuth } = useAuth();
  const errRef = useRef();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState({});
  const [newUser, setNewUser] = useState(user?.username);
  const [email, setEmail] = useState(user?.email);
  const [isEditing, setIsEditing] = useState(false);

  const [errMsg, setErrMsg] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const getUser = async () => {
      try {
        const response = await axios.get(USER_URL, {
          headers: {
            "Content-Type": "application/json",
            Authorization: auth.accessToken,
          },
        });
        setUser(response.data);
        setEmail(response.data.email);
      } catch (err) {
        console.error(err);
      }
    };

    getUser();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  function handleEmailChange(event) {
    setEmail(event.target.value);
    setIsEditing(true);
  }

  async function handleEmailSubmission(event) {
    event.preventDefault();

    try {
      const response = await axios.put(
        USER_URL,
        JSON.stringify({ email: email }),
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: auth.accessToken,
          },
          withCredentials: true,
        }
      );
    } catch (err) {
      if (!err?.response) {
        setErrMsg("No server response");
      } else if (err.response?.status === 409) {
        setErrMsg("Email already taken");
      } else {
        setErrMsg("Update failed. Please try again.");
      }
    }
    setIsEditing(false);
    // errRef.current.focus();
  }

  async function handleLogout() {
    setAuth({});
    redirect("/");
  }

  return (
    <Fragment>
      <Header />
      <PageWrapper>
        <main className="min-h-screen ">
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <>
              <div className="pt-8 grid gap-8">
                <div>
                  <h1 className="text-3xl font-bold text-neutral-800 mb-2">
                    Profile
                  </h1>
                  <p className="text-neutral-600">
                    Profile information will only be displayed on your
                    dashboard.
                  </p>
                </div>

                <div>
                  <div className="flex gap-4 text-neutral-800">
                    <p className=" font-medium">Username</p>
                    <p>{user?.username}</p>
                  </div>
                  <button onClick={handleLogout}>Log out</button>
                </div>

                <div>
                  <p className="text-neutral-500 text-sm">
                    Account created on {user?.created_at?.substring(0, 10)}
                  </p>
                  <p className="text-neutral-500 text-sm">
                    Last logged in on {user?.last_login?.substring(0, 10)}
                  </p>
                </div>
              </div>
            </>
          )}
        </main>
      </PageWrapper>
      <Footer />
    </Fragment>
  );
}
