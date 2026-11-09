import { Button, PasswordInput, TextInput } from "@mantine/core";
import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { ApiError, api, type SessionUser } from "../api";
import { useSession } from "../session";

export function LoginPage() {
  const { user, loading, refresh } = useSession();
  const [email, setEmail] = useState("hr@acme.test");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api<SessionUser>("/api/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not sign in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={(event) => void onSubmit(event)}>
        <p className="page-kicker">ACME</p>
        <h1 className="page-title">Pay ledger</h1>
        <p className="lede">Sign in to maintain salaries and see how the organization pays.</p>
        <TextInput
          label="Email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
          required
          mb="sm"
        />
        <PasswordInput
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.currentTarget.value)}
          required
          mb="md"
        />
        {error ? <p role="alert">{error}</p> : null}
        <Button type="submit" loading={submitting} fullWidth>
          Sign in
        </Button>
        <p className="demo-note">
          Demo account: hr@acme.test / acme-hr-demo
        </p>
      </form>
    </div>
  );
}
