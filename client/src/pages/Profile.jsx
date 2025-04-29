import { Fragment, useEffect, useState, useRef } from "react";
import Header from "../components/Header";
import PageWrapper from "../layouts/PageWrapper";
import Footer from "../components/Footer";
import axios from "../api/axios";
import useAuth from "../hooks/useAuth";
import { Link } from "react-router";

const USER_URL = "/api/user";
const LOGOUT_URL = "/api/logout";

export default function Profile() {
  const { auth } = useAuth();
  const errRef = useRef();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState({});
  const [newUser, setNewUser] = useState(user?.username);
  const [email, setEmail] = useState(user?.email);
  const [isEditing, setIsEditing] = useState(false);

  const [errMsg, setErrMsg] = useState("");

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

  return (
    <Fragment>
      <Header />
      <PageWrapper>
        <main className="min-h-screen">
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <>
              <div>
                <h1 className="text-2xl font-bold">Profile</h1>
                <p>
                  Profile information will only be displayed on your dashboard.
                </p>
                <hr />
                <div className="flex gap-4">
                  <p>Username</p>
                  <p>{user?.username}</p>
                </div>

                <p className="color-neutral-400">
                  Account created at {user?.created_at?.substring(0, 10)}
                </p>
                <p className="color-neutral-400">
                  Last logged in on {user?.last_login?.substring(0, 10)}
                </p>
              </div>
            </>
          )}
        </main>
      </PageWrapper>
      <Footer />
    </Fragment>
  );
}
