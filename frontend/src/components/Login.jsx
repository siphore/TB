import { useState } from "react";

function Login({ setAuthenticated }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Login failed");

      const data = await res.json();

      // Save token in localStorage
      localStorage.setItem("token", data.token);

      // Tell parent we're authenticated
      setAuthenticated(true);
      window.location.reload();
    } catch (err) {
      console.error(err);
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 items-center justify-center min-h-screen text-white"
    >
      <h1 className="text-4xl font-semibold">Login</h1>
      <input
        placeholder="Username"
        className="border border-white p-2 rounded w-64"
        value={form.username}
        onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
      />
      <input
        type="password"
        placeholder="Password"
        className="border border-white p-2 rounded w-64"
        value={form.password}
        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Login
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
}

export default Login;
