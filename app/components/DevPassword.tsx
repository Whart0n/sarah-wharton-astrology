"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DevPassword() {
  const expectedPassword = "astr0Dev!2025";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Debug: log both entered and expected password
    // eslint-disable-next-line no-console
    console.log("Entered password:", password);
    // eslint-disable-next-line no-console
    console.log("Expected password:", expectedPassword);
    if (password === expectedPassword) {
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
          type={show ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Dev password"
          style={{ padding: "3px 9px", fontSize: 13, borderRadius: 6, border: "1px solid #b5c0b1", background: "#fff", color: "#2d1b3b", opacity: 0.8 }}
        />
        <label style={{ fontSize: 10, color: "#2d1b3b", opacity: 0.7, cursor: "pointer", userSelect: "none" }}>
          <input type="checkbox" checked={show} onChange={() => setShow(!show)} style={{ marginRight: 4 }} />Show password
        </label>
        {/* Debug info: show entered and expected password */}
        <div style={{ fontSize: 10, color: "#2d1b3b", opacity: 0.5 }}>
          <div>Entered: <code>{password}</code></div>
          <div>Expected: <code>{expectedPassword}</code></div>
        </div>
        {error && <span style={{ color: "#c00", fontSize: 11 }}>{error}</span>}
      </form>
    </div>
  );
}
