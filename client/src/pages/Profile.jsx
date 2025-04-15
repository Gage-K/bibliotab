import { Fragment, useEffect, useState } from "react";
import Header from "../components/Header";
import PageWrapper from "../layouts/PageWrapper";
import Footer from "../components/Footer";
import axios from "../api/axios";
import useAuth from "../hooks/useAuth";

const USER_URL = "/api/user";

export default function Profile() {
  const { auth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState({});

  /*
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("http://localhost:3000/api/user/9", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
        });
        setIsLoading(false);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);
  */

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

  return (
    <Fragment>
      <Header />
      <PageWrapper>
        <main className="min-h-screen">
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <>
              <h1>Profile</h1>
              <p>Username</p>
              <p>{user?.username}</p>

              <p>Email</p>
              <p>{user?.email}</p>

              <p>Account created at {user?.created_at?.substring(0, 10)}</p>
              <p>Last logged in on {user?.last_login?.substring(0, 10)}</p>
            </>
          )}
        </main>
      </PageWrapper>
      <Footer />
    </Fragment>
  );
}
