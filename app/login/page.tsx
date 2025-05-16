"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // This should match the password in middleware.ts
    if (password === process.env.NEXT_PUBLIC_PREVIEW_PASSWORD || password === "letmein") {
      document.cookie = `preview_auth=${password}; path=/`;
      router.push("/");
    } else {
      setError("Incorrect password");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: 32, border: "1px solid #ccc", borderRadius: 8, background: "#fff" }}>
      <h2>Site Preview Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 12 }}
        />
        <button type="submit" style={{ width: "100%", padding: 8 }}>Login</button>
        {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
      </form>
    </div>
  );
}
