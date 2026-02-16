import { useEffect, useState } from "react";
import PageWrapper from "../layouts/PageWrapper";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import useTypedAuth from "../hooks/useTypedAuth";
import { AxiosError } from "axios";
import { redirect } from "react-router";
import { SkeletonText } from "../components/Skeleton";
import { useUserProfile, useUpdateEmail } from "../hooks/useUserProfile";

export default function Profile() {
  const { setAuth } = useTypedAuth();
  const axiosPrivate = useAxiosPrivate();
  const { data: user, isLoading } = useUserProfile();
  const updateEmailMutation = useUpdateEmail();

  const [email, setEmail] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
    setIsEditing(true);
  }

  async function handleEmailSubmission(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    updateEmailMutation.mutate(email, {
      onSuccess: () => {
        setIsEditing(false);
      },
      onError: (err) => {
        if (err instanceof AxiosError) {
          if (!err.response) {
            setErrMsg("No server response");
          } else if (err.response.status === 409) {
            setErrMsg("Email already taken");
          } else {
            setErrMsg("Update failed. Please try again.");
          }
        } else {
          setErrMsg("Update failed. Please try again.");
        }
        setIsEditing(false);
      },
    });
  }

  async function handleLogout() {
    try {
      await axiosPrivate.post('/api/auth/logout', {});
    } finally {
      setAuth({});
      redirect("/");
    }
  }

  return (
    <PageWrapper>
      <div className="pt-8 grid gap-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800 dark:text-neutral-200 mb-2">
            Profile
          </h1>
          <p className="text-neutral-600 dark:text-neutral-300">
            Profile information will only be displayed on your dashboard.
          </p>
        </div>
        {isLoading ? (
          <>
            <div className="max-w-lg">
              <SkeletonText />
            </div>
          </>
        ) : (
          <>
            <div className="text-neutral-800 dark:text-neutral-200">
              <div className="flex gap-4 ">
                <p className=" font-medium">Username</p>
                <p>{user?.username}</p>
              </div>
              <button
                className="rounded-sm px-4 py-2 my-4 bg-neutral-800 text-neutral-50 hover:bg-neutral-600 cursor-pointer"
                onClick={handleLogout}>
                Log out
              </button>
            </div>

            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              <p className="">
                Account created on {user?.created_at?.substring(0, 10)}
              </p>
              <p className="">
                Last logged in on {user?.last_login?.substring(0, 10)}
              </p>
            </div>
          </>
        )}
      </div>
    </PageWrapper>
  );
}
