import { useEffect, useState } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import useTypedAuth from "../hooks/useTypedAuth";
import { AxiosError } from "axios";
import { redirect } from "react-router";
import { SkeletonText } from "../components/Skeleton";
import { useUserProfile, useUpdateEmail } from "../hooks/useUserProfile";
import { Button } from "../components/ui/button";

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
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Profile information will only be displayed on your dashboard.
        </p>
      </div>
      {isLoading ? (
        <div className="max-w-lg">
          <SkeletonText />
        </div>
      ) : (
        <>
          <div className="text-foreground">
            <div className="flex gap-4">
              <p className="font-medium">Username</p>
              <p className="text-muted-foreground">{user?.username}</p>
            </div>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={handleLogout}>
              Log out
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Account created on {user?.created_at?.substring(0, 10)}</p>
            <p>Last logged in on {user?.last_login?.substring(0, 10)}</p>
          </div>
        </>
      )}
    </div>
  );
}
