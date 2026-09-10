import { useAuth } from "@/hooks/use-auth";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { HubdexWordmark } from "@/components/hubdex";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ArrowLeft, ArrowRight, Loader2, Mail } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback: string,
): string {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Mode = "signIn" | "register";
type Step = "form" | "otp";

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn, signOut } = useAuth();
  const convex = useConvex();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth ?? "/dashboard",
  );

  const [mode, setMode] = useState<Mode>("signIn");
  const [step, setStep] = useState<Step>("form");
  const [otpEmail, setOtpEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  // Password registration: name, email, password, confirm password.
  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    // Normalize the registration email the same way as at sign-in.
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirmPassword") ?? "");

    if (!name || !email || !password || !confirm) {
      setError("All fields are required.");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setError("Enter a valid email address, like name@example.com.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      // Duplicate pre-check on the normalized email: never create a second
      // account for an email that already has one. The server still enforces
      // uniqueness (the normalized email is the account's unique key), so a
      // race can only fail closed.
      const emailTaken = await convex.query(api.authAccounts.passwordAccountExists, {
        email,
      });
      if (emailTaken) {
        setError(
          "An account with this email already exists. Please sign in instead.",
        );
        setIsLoading(false);
        return;
      }
      await signIn("password", { flow: "signUp", email, password, name });
      // Convex Auth stores session tokens on signUp. Sign out so the user
      // lands on the sign-in page with a success message instead of a live
      // session (mirrors the Flask registration flow).
      await signOut();
      setRegisteredEmail(email.toLowerCase());
      setMode("signIn");
      setNotice("Your account has been created. Please sign in.");
    } catch (err) {
      console.error("Registration error:", err);
      const message = err instanceof Error ? err.message.toLowerCase() : "";
      if (
        message.includes("already exists") ||
        message.includes("unique") ||
        message.includes("duplicate")
      ) {
        setError(
          "An account with this email already exists. Please sign in instead.",
        );
      } else if (message.includes("password")) {
        setError("Password must be at least 8 characters long.");
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Password sign-in with a clear invalid-credentials error.
  const handlePasswordSignIn = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    // Normalize the sign-in email the same way as at registration.
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setError("Enter a valid email address, like name@example.com.");
      return;
    }

    setIsLoading(true);
    try {
      await signIn("password", { flow: "signIn", email, password });
      navigate(redirect);
    } catch (err) {
      console.error("Sign-in error:", err);
      // Generic message: do not reveal whether the email exists.
      setError("Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  // Existing email OTP flow, kept as a secondary sign-in option.
  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const formData = new FormData(event.currentTarget);
      const email = String(formData.get("email") ?? "").trim();
      if (!email || !EMAIL_RE.test(email)) {
        setError("Enter a valid email address, like name@example.com.");
        setIsLoading(false);
        return;
      }
      await signIn("email-otp", formData);
      setOtpEmail(email);
      setStep("otp");
    } catch (err) {
      console.error("Email sign-in error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send verification code. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      navigate(redirect);
    } catch (err) {
      console.error("OTP verification error:", err);
      setError("The verification code you entered is incorrect.");
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await signIn("anonymous");
      navigate(redirect);
    } catch (err) {
      console.error("Guest login error:", err);
      setError(
        "Failed to sign in as guest: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setStep("form");
    setError(null);
    setNotice(null);
  };

  return (
    <div className="ibm-grid flex min-h-screen flex-col bg-background text-foreground">
      {/* Minimal top bar */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="Hubdex home">
            <HubdexWordmark />
          </Link>
          <span className="ibm-eyebrow text-muted-foreground">
            Application tracking
          </span>
        </div>
        <div className="h-0.5 w-full bg-primary" />
      </header>

      {/* Auth content */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="border border-border bg-background shadow-[8px_8px_0_0_rgba(22,22,22,0.06)]">
            <div className="h-1 w-full bg-primary" />
            <div className="px-6 py-8 sm:px-8">
              {step === "otp" ? (
                <>
                  <button
                    type="button"
                    onClick={() => setStep("form")}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="size-3.5" />
                    Use a different method
                  </button>
                  <p className="ibm-eyebrow mt-6 text-[#0f62fe]">Verify</p>
                  <h1 className="mt-2 text-2xl font-bold tracking-[-0.01em]">
                    Check your email
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    We sent a 6-digit code to{" "}
                    <span className="font-medium text-foreground">{otpEmail}</span>
                    .
                  </p>

                  <form onSubmit={handleOtpSubmit} className="mt-6">
                    <input type="hidden" name="email" value={otpEmail} />
                    <input type="hidden" name="code" value={otp} />

                    <div className="flex justify-center">
                      <InputOTP
                        value={otp}
                        onChange={setOtp}
                        maxLength={6}
                        disabled={isLoading}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                            const form = (e.target as HTMLElement).closest("form");
                            if (form) {
                              form.requestSubmit();
                            }
                          }
                        }}
                      >
                        <InputOTPGroup>
                          {Array.from({ length: 6 }).map((_, index) => (
                            <InputOTPSlot key={index} index={index} />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    {error && (
                      <p className="mt-3 text-center text-sm text-destructive">
                        {error}
                      </p>
                    )}
                    <p className="mt-4 text-center text-xs text-muted-foreground">
                      Didn't receive a code?{" "}
                      <button
                        type="button"
                        onClick={() => setStep("form")}
                        className="underline underline-offset-2 hover:text-foreground"
                      >
                        Try again
                      </button>
                    </p>

                    <button
                      type="submit"
                      disabled={isLoading || otp.length !== 6}
                      className="mt-6 flex h-11 w-full items-center justify-center gap-2 bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-[#0353e8] disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Verifying…
                        </>
                      ) : (
                        <>
                          Verify code
                          <ArrowRight className="size-4" />
                        </>
                      )}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  {/* Mode tabs */}
                  <div
                    className="grid grid-cols-2 border border-border"
                    role="tablist"
                    aria-label="Authentication mode"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={mode === "signIn"}
                      onClick={() => switchMode("signIn")}
                      className={
                        "h-10 text-sm font-medium transition-colors " +
                        (mode === "signIn"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground")
                      }
                    >
                      Sign in
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={mode === "register"}
                      onClick={() => switchMode("register")}
                      className={
                        "h-10 text-sm font-medium transition-colors " +
                        (mode === "register"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground")
                      }
                    >
                      Register
                    </button>
                  </div>

                  {mode === "signIn" ? (
                    <>
                      <p className="ibm-eyebrow mt-8 text-[#0f62fe]">
                        Welcome back
                      </p>
                      <h1 className="mt-2 text-2xl font-bold tracking-[-0.01em]">
                        Open your hub
                      </h1>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Sign in with your email and password to pick up your
                        search where you left it.
                      </p>

                      {notice && (
                        <p
                          role="status"
                          className="mt-4 border border-[#0f62fe] bg-[#edf5ff] px-3 py-2 text-sm text-[#0f62fe] dark:border-primary dark:bg-primary/10 dark:text-[#78a9ff]"
                        >
                          {notice}
                        </p>
                      )}

                      <form onSubmit={handlePasswordSignIn} className="mt-6" noValidate>
                        <label
                          htmlFor="signin-email"
                          className="ibm-eyebrow text-muted-foreground"
                        >
                          Email address
                        </label>
                        <div className="relative mt-2">
                          <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="signin-email"
                            name="email"
                            placeholder="name@example.com"
                            type="email"
                            autoComplete="email"
                            defaultValue={registeredEmail ?? undefined}
                            className="h-11 bg-background pl-9"
                            disabled={isLoading}
                            required
                          />
                        </div>

                        <label
                          htmlFor="signin-password"
                          className="ibm-eyebrow mt-4 block text-muted-foreground"
                        >
                          Password
                        </label>
                        <Input
                          id="signin-password"
                          name="password"
                          placeholder="Your password"
                          type="password"
                          autoComplete="current-password"
                          className="mt-2 h-11 bg-background"
                          disabled={isLoading}
                          required
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setError(
                              "Password reset is not available yet. Contact support if you are locked out.",
                            )
                          }
                          className="mt-2 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                        >
                          Forgot password?
                        </button>

                        {error && (
                          <p className="mt-3 text-sm text-destructive">{error}</p>
                        )}

                        <button
                          type="submit"
                          disabled={isLoading}
                          className="mt-5 flex h-11 w-full items-center justify-center gap-2 bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-[#0353e8] disabled:opacity-50"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              Signing in…
                            </>
                          ) : (
                            <>
                              Sign in
                              <ArrowRight className="size-4" />
                            </>
                          )}
                        </button>
                      </form>
                    </>
                  ) : (
                    <>
                      <p className="ibm-eyebrow mt-8 text-[#0f62fe]">
                        Get started
                      </p>
                      <h1 className="mt-2 text-2xl font-bold tracking-[-0.01em]">
                        Create your hub
                      </h1>
                      <p className="mt-2 text-sm text-muted-foreground">
                        One account, every application. Your workspace is ready
                        the moment you register.
                      </p>

                      <form onSubmit={handleRegister} className="mt-6" noValidate>
                        <label
                          htmlFor="register-name"
                          className="ibm-eyebrow text-muted-foreground"
                        >
                          Full name
                        </label>
                        <Input
                          id="register-name"
                          name="name"
                          placeholder="Alex Doe"
                          type="text"
                          autoComplete="name"
                          maxLength={100}
                          className="mt-2 h-11 bg-background"
                          disabled={isLoading}
                          required
                        />

                        <label
                          htmlFor="register-email"
                          className="ibm-eyebrow mt-4 block text-muted-foreground"
                        >
                          Email address
                        </label>
                        <div className="relative mt-2">
                          <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="register-email"
                            name="email"
                            placeholder="name@example.com"
                            type="email"
                            autoComplete="email"
                            className="h-11 bg-background pl-9"
                            disabled={isLoading}
                            required
                          />
                        </div>

                        <label
                          htmlFor="register-password"
                          className="ibm-eyebrow mt-4 block text-muted-foreground"
                        >
                          Password
                        </label>
                        <Input
                          id="register-password"
                          name="password"
                          placeholder="At least 8 characters"
                          type="password"
                          autoComplete="new-password"
                          minLength={8}
                          className="mt-2 h-11 bg-background"
                          disabled={isLoading}
                          required
                        />

                        <label
                          htmlFor="register-confirm"
                          className="ibm-eyebrow mt-4 block text-muted-foreground"
                        >
                          Confirm password
                        </label>
                        <Input
                          id="register-confirm"
                          name="confirmPassword"
                          placeholder="Repeat your password"
                          type="password"
                          autoComplete="new-password"
                          minLength={8}
                          className="mt-2 h-11 bg-background"
                          disabled={isLoading}
                          required
                        />

                        {error && (
                          <p className="mt-3 text-sm text-destructive">{error}</p>
                        )}

                        <button
                          type="submit"
                          disabled={isLoading}
                          className="mt-6 flex h-11 w-full items-center justify-center gap-2 bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-[#0353e8] disabled:opacity-50"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              Creating account…
                            </>
                          ) : (
                            <>
                              Create account
                              <ArrowRight className="size-4" />
                            </>
                          )}
                        </button>
                      </form>
                    </>
                  )}

                  <div className="mt-6 flex items-center gap-3">
                    <span className="h-px flex-1 bg-border" />
                    <span className="ibm-eyebrow text-muted-foreground">or</span>
                    <span className="h-px flex-1 bg-border" />
                  </div>

                  {/* Secondary options: OTP and guest */}
                  <details className="mt-6 border border-border">
                    <summary className="flex h-11 cursor-pointer items-center justify-center gap-2 text-sm font-medium select-none hover:bg-muted">
                      <Mail className="size-4" />
                      Sign in with a one-time email code
                    </summary>
                    <div className="border-t border-border p-4">
                      <form onSubmit={handleEmailSubmit}>
                        <div className="flex items-center gap-2">
                          <Input
                            name="email"
                            placeholder="name@example.com"
                            type="email"
                            autoComplete="email"
                            className="h-11 bg-background"
                            disabled={isLoading}
                            required
                          />
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="inline-flex h-11 w-11 shrink-0 items-center justify-center bg-primary text-primary-foreground transition-colors hover:bg-[#0353e8] disabled:opacity-50"
                            aria-label="Send verification code"
                          >
                            {isLoading ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <ArrowRight className="size-4" />
                            )}
                          </button>
                        </div>
                      </form>
                      <p className="mt-2 text-xs text-muted-foreground">
                        New here? A code creates your account automatically.
                      </p>
                    </div>
                  </details>

                  <button
                    type="button"
                    onClick={handleGuestLogin}
                    disabled={isLoading}
                    className="mt-3 flex h-11 w-full items-center justify-center border border-[#161616] text-sm font-medium transition-colors hover:bg-[#161616] hover:text-white disabled:opacity-50 dark:border-foreground dark:hover:bg-foreground dark:hover:text-background"
                  >
                    Continue as guest
                  </button>
                </>
              )}
            </div>

            <div className="border-t border-border bg-muted px-8 py-3 text-center text-xs text-muted-foreground">
              By continuing you agree to keep your job search honest.
            </div>
          </div>

          <p className="ibm-eyebrow mt-6 text-center text-muted-foreground">
            Hubdex: Every application. One hub.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
