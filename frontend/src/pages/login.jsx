import { useState } from "react";
import { Compass, Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { logIn } from "../lib/api.js";

const tokens = {
  tealDeep: "#0B2E2C",
  tealMid: "#12433F",
  tealSoft: "#1E5F58",
  sand: "#F1F5F4",
  sandLight: "#FFFFFF",
  gold: "#C58D25",
  goldSoft: "#E5B957",
  ink: "#0C211E",
  inkSoft: "#3F534F",
};

function TopoPattern({ opacity = 1 }) {
  return (
    <svg viewBox="0 0 600 600" className="h-full w-full" style={{ opacity }}>
      <g fill="none" stroke={tokens.goldSoft} strokeWidth="1">
        <path d="M40,120 C160,60 260,180 380,110 S560,60 620,140" />
        <path d="M20,200 C150,150 250,260 380,190 S560,150 620,220" />
        <path d="M0,280 C140,230 260,340 380,270 S560,230 620,300" />
        <path d="M0,360 C140,320 260,410 380,350 S560,310 620,380" />
        <path d="M0,440 C140,410 260,480 380,430 S560,400 620,460" />
        <path d="M0,520 C140,490 260,550 380,510 S560,480 620,540" />
      </g>
    </svg>
  );
}

function BrandPanel() {
  return (
    <div
      className="auth-brand-panel hidden md:flex"
      style={{ backgroundColor: tokens.tealDeep }}
    >
      <div className="pointer-events-none absolute inset-0">
        <TopoPattern opacity={0.4} />
      </div>

      <Link to="/" className="relative flex items-center gap-2">
        <Compass size={24} color={tokens.gold} strokeWidth={1.75} />
        <span
          className="text-lg"
          style={{ fontFamily: "'Inter', sans-serif", color: tokens.sandLight, fontWeight: 600 }}
        >
          Farflung
        </span>
      </Link>

      <div className="auth-brand-copy">
        <p
          className="text-2xl leading-snug"
          style={{ fontFamily: "'Inter', sans-serif", color: tokens.sandLight, fontWeight: 500 }}
        >
          "Booked Patagonia in ten minutes flat — the itinerary was already half built for us."
        </p>
        <p className="mt-4 text-sm" style={{ color: tokens.goldSoft, fontFamily: "'DM Sans', sans-serif" }}>
          Priya M. — Torres del Paine, 2025
        </p>
      </div>

      <p className="relative text-sm" style={{ color: tokens.sand, fontFamily: "'DM Sans', sans-serif" }}>
        New here?{" "}
        <Link to="/signup" style={{ color: tokens.goldSoft }}>
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const result = await logIn({ email, password });
      localStorage.setItem("farflung_user", JSON.stringify(result.user));
      navigate("/");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">

      <BrandPanel />

      <div className="auth-form-panel">
        <Link
          to="/"
          className="mb-10 flex items-center gap-2 text-sm md:hidden"
          style={{ color: tokens.inkSoft }}
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>

        <div className="auth-form-content">
          <div className="mb-2 flex items-center gap-2 md:hidden">
            <Compass size={22} color={tokens.gold} strokeWidth={1.75} />
            <span
              className="text-lg"
              style={{ fontFamily: "'Inter', sans-serif", color: tokens.ink, fontWeight: 600 }}
            >
              Farflung
            </span>
          </div>

          <h1
            className="text-3xl"
            style={{ fontFamily: "'Inter', sans-serif", color: tokens.ink, fontWeight: 600 }}
          >
            Welcome back
          </h1>
          <p className="mt-2 text-[15px]" style={{ color: tokens.inkSoft }}>
            Log in to manage your bookings and pick up trip planning where you left off.
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div>
              <label
                htmlFor="email"
                className="block text-sm"
                style={{ color: tokens.ink, fontWeight: 500 }}
              >
                Email
              </label>
              <div
                className="auth-field"
              >
                <Mail size={17} color={tokens.inkSoft} />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
                  style={{ color: tokens.ink }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm"
                  style={{ color: tokens.ink, fontWeight: 500 }}
                >
                  Password
                </label>
                <a href="#" className="text-sm" style={{ color: tokens.gold }}>
                  Forgot password?
                </a>
              </div>
              <div
                className="auth-field"
              >
                <Lock size={17} color={tokens.inkSoft} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
                  style={{ color: tokens.ink }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={17} color={tokens.inkSoft} />
                  ) : (
                    <Eye size={17} color={tokens.inkSoft} />
                  )}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm" style={{ color: tokens.inkSoft }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded-sm"
                style={{ accentColor: tokens.gold }}
              />
              Keep me signed in on this device
            </label>

            <button
              type="submit"
              className="auth-primary-button mt-2 py-3 text-[15px]"
              style={{ backgroundColor: tokens.tealDeep, color: tokens.sandLight }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Log in"}
            </button>
          </form>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <div className="mt-8 flex items-center gap-3">
            <div className="h-px flex-1" style={{ backgroundColor: "#DDD3BC" }} />
            <span className="text-xs" style={{ color: tokens.inkSoft }}>
              or
            </span>
            <div className="h-px flex-1" style={{ backgroundColor: "#DDD3BC" }} />
          </div>

          <button
            type="button"
            className="auth-secondary-button mt-6 w-full border py-3 text-[15px]"
            style={{ borderColor: "#DDD3BC", color: tokens.ink, backgroundColor: "#FFFFFF" }}
          >
            Continue with Google
          </button>

          <p className="mt-8 text-center text-sm md:text-left" style={{ color: tokens.inkSoft }}>
            Don't have an account?{" "}
            <Link to="/signup" style={{ color: tokens.gold, fontWeight: 500 }}>
              Register
            </Link>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}