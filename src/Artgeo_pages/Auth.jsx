import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Auth({ onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [loading, setLoading] = useState(false);

  async function signUp() {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      if (error.message.includes("already registered")) {
        alert("This email is already registered. Please Sign In instead.");
      } else {
        alert(error.message);
      }
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({ id: data.user.id, email: data.user.email, role: "user" });

      if (profileError) {
        console.error("Profile insert failed:", profileError);
      }
    }

    setLoading(false);
    alert("Account created! You can now sign in.");
    setMode("signin");
  }

  async function signIn() {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    console.log("Signed in:", data.user.email);
    setLoading(false);
    // onAuthStateChange in App.jsx handles the rest
    if (onClose) onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-xl relative">

        {/* Close button — only if opened as modal */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-xl font-bold"
          >
            ✕
          </button>
        )}

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 text-white font-extrabold text-lg shadow mb-4">
          AG
        </div>

        <h1 className="text-2xl font-bold mb-1">
          {mode === "signin" ? "Welcome back" : "Create account"}
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          {mode === "signin"
            ? "Sign in to access ArtGeo Trails"
            : "Sign up to explore art trails"}
        </p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-slate-200 p-3 rounded-lg mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-slate-200 p-3 rounded-lg mb-5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />

        <button
          onClick={mode === "signin" ? signIn : signUp}
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
        >
          {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Sign Up"}
        </button>

        <p className="text-center text-sm text-slate-500 mt-4">
          {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-orange-600 font-semibold hover:underline"
          >
            {mode === "signin" ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}