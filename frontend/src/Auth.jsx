import { useState } from "react";
import { supabase } from "./lib/supabaseClient";
import "./Auth.css";

export default function Auth() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = isSignup
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (isSignup) {
      setMessage("Account created. Check your email to confirm.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <img
          className="auth-logo"
          src="/codebase-rag-logoWithText.png"
          alt="CodeBase RAG"
        />

        <p className="auth-subtitle">
          {isSignup ? "Create your account" : "Sign in to your account"}
        </p>

        <div className="auth-tabs">
          <button
            className={!isSignup ? "active" : ""}
            onClick={() => {
              setIsSignup(false);
              setMessage("");
            }}
          >
            Login
          </button>

          <button
            className={isSignup ? "active" : ""}
            onClick={() => {
              setIsSignup(true);
              setMessage("");
            }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />

          {message && <div className="auth-message">{message}</div>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Please wait..." : isSignup ? "Create Account" : "Login"}
          </button>
        </form>

        <p className="auth-switch">
          {isSignup ? "Already have an account?" : "Don't have an account?"}

          <button
            onClick={() => {
              setIsSignup(!isSignup);
              setMessage("");
            }}
          >
            {isSignup ? "Login" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}
