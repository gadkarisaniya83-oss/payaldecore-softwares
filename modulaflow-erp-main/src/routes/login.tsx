import { useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { login, isLoggedIn } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (isLoggedIn()) {
      throw redirect({ to: "/" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!adminId.trim() || !password) {
      setError("Enter your Admin ID and password.");
      return;
    }

    if (!login(adminId, password)) {
      setError("Admin ID or password is incorrect.");
      return;
    }

    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF7F4] px-4 py-10">
      <div className="w-full max-w-[440px] rounded-2xl border border-[#EADFD5] bg-white p-8 shadow-[0_10px_40px_rgba(60,35,10,0.08)] sm:p-10">
        <div className="mb-8 flex justify-center">
          <img
            src="/payal-decor-logo.png"
            alt="Payal Decor"
            className="h-20 w-auto object-contain"
          />
        </div>

        <h1 className="text-2xl font-semibold text-[#1F1710]">Welcome back</h1>
        <p className="mt-1 text-sm text-[#7A6A5C]">
          Sign in to your Payal Decor ERP.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
          <div>
            <label
              htmlFor="admin-id"
              className="mb-1.5 block text-sm font-medium text-[#1F1710]"
            >
              Admin ID
            </label>
            <input
              id="admin-id"
              type="text"
              autoComplete="username"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              placeholder="Enter Admin ID"
              className="h-11 w-full rounded-lg border border-[#E3D6CA] bg-white px-3 text-sm text-[#1F1710] outline-none transition placeholder:text-[#B5A698] focus:border-[#B05A00] focus:ring-2 focus:ring-[#B05A00]/20"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-[#1F1710]"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="h-11 w-full rounded-lg border border-[#E3D6CA] bg-white px-3 pr-11 text-sm text-[#1F1710] outline-none transition placeholder:text-[#B5A698] focus:border-[#B05A00] focus:ring-2 focus:ring-[#B05A00]/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-[#7A6A5C] hover:text-[#1F1710]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#B05A00] text-sm font-semibold text-white transition hover:bg-[#954C00] focus:outline-none focus:ring-2 focus:ring-[#B05A00]/40 focus:ring-offset-2"
          >
            Sign in
            <ArrowRight size={16} />
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-[#7A6A5C]">
          Protected by admin access control
        </p>
      </div>
    </div>
  );
}