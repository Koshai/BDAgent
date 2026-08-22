"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [error, setError] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        const form = new FormData(e.currentTarget);
        const res = await signIn("credentials", {
          email: form.get("email"),
          password: form.get("password"),
          name: form.get("name"),
          mode,
          redirect: false,
        });
        if (res?.error) {
          setError(mode === "register" ? "Could not create account." : "Invalid email or password.");
          return;
        }
        window.location.href = "/app";
      }}
    >
      {mode === "register" ? (
        <>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" required placeholder="Your name" />
        </>
      ) : null}
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" required placeholder="you@store.com" />
      <label htmlFor="password">Password</label>
      <input id="password" name="password" type="password" minLength={8} required />
      {error ? <p className="error">{error}</p> : null}
      <button type="submit">{mode === "register" ? "Create account" : "Sign in"}</button>
    </form>
  );
}
