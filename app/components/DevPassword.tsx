"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DevPassword() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "astr0Dev!2025") {
      localStorage.setItem("devAuth", "true");
      router.refresh();
    } else {
      setError("Incorrect password");
    }
  };

  // Check if already authenticated
  if (typeof window !== "undefined" && localStorage.getItem("devAuth")) {
    return null;
  }

  return (
    <div style={{ position: "fixed", bottom: 6, right: 8, opacity: 0.15, zIndex: 50 }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Dev password"
          style={{ padding: "3px 9px", fontSize: 13, borderRadius: 6, border: "1px solid #b5c0b1", background: "#fff", color: "#2d1b3b", opacity: 0.8 }}
        />
        {error && <span style={{ color: "#c00", fontSize: 11 }}>{error}</span>}
      </form>
    </div>
  );
}
