import { useAuth } from "@/hooks/use-auth";
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

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth ?? "/dashboard",
  );
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
      setIsLoading(false);
    } catch (error) {
      console.error("Email sign-in error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send verification code. Please try again.",
      );
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      navigate(redirect);
    } catch (error) {
      console.error("OTP verification error:", error);
      setError("The verification code you entered is incorrect.");
      setIsLoading(false);
      setOtp("");
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(redirect);
    } catch (error) {
      console.error("Guest login error:", error);
      setError(
        `Failed to sign in as guest: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      setIsLoading(false);
    }
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
            <div className="px-8 py-8">
              {step === "signIn" ? (
                <>
                  <p className="ibm-eyebrow text-[#0f62fe]">Sign in</p>
                  <h1 className="mt-2 text-2xl font-bold tracking-[-0.01em]">
                    Open your hub
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Enter your email to log in or sign up. New here? A code
                    creates your account automatically.
                  </p>

                  <form onSubmit={handleEmailSubmit} className="mt-6">
                    <label
                      htmlFor="email"
                      className="ibm-eyebrow text-muted-foreground"
                    >
                      Email address
                    </label>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="email"
                          name="email"
                          placeholder="name@example.com"
                          type="email"
                          className="h-11 bg-background pl-9"
                          disabled={isLoading}
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center bg-primary text-primary-foreground transition-colors hover:bg-[#0353e8] disabled:opacity-50"
                        aria-label="Continue with email"
                      >
                        {isLoading ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <ArrowRight className="size-4" />
                        )}
                      </button>
                    </div>
                    {error && (
                      <p className="mt-3 text-sm text-destructive">{error}</p>
                    )}
                  </form>

                  <div className="mt-6 flex items-center gap-3">
                    <span className="h-px flex-1 bg-border" />
                    <span className="ibm-eyebrow text-muted-foreground">or</span>
                    <span className="h-px flex-1 bg-border" />
                  </div>

                  <button
                    type="button"
                    onClick={handleGuestLogin}
                    disabled={isLoading}
                    className="mt-6 flex h-11 w-full items-center justify-center border border-[#161616] text-sm font-medium transition-colors hover:bg-[#161616] hover:text-white disabled:opacity-50 dark:border-foreground dark:hover:bg-foreground dark:hover:text-background"
                  >
                    Continue as guest
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setStep("signIn")}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="size-3.5" />
                    Use a different email
                  </button>
                  <p className="ibm-eyebrow mt-6 text-[#0f62fe]">Verify</p>
                  <h1 className="mt-2 text-2xl font-bold tracking-[-0.01em]">
                    Check your email
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    We sent a 6-digit code to{" "}
                    <span className="font-medium text-foreground">
                      {step.email}
                    </span>
                    .
                  </p>

                  <form onSubmit={handleOtpSubmit} className="mt-6">
                    <input type="hidden" name="email" value={step.email} />
                    <input type="hidden" name="code" value={otp} />

                    <div className="flex justify-center">
                      <InputOTP
                        value={otp}
                        onChange={setOtp}
                        maxLength={6}
                        disabled={isLoading}
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            otp.length === 6 &&
                            !isLoading
                          ) {
                            const form = (e.target as HTMLElement).closest(
                              "form",
                            );
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
                        onClick={() => setStep("signIn")}
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
