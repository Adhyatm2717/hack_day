"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Login page — Phone OTP + Google sign-in
// Design ref: /design/chargemate_login_with_otp
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap, Shield, ArrowRight, RefreshCw, MessageCircle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { sendOtp, verifyOtp, signInWithGoogle, DEV_OTP } from "@/lib/data/auth";
import { useAuth } from "@/lib/auth-context";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

type Step = "phone" | "otp";

export default function LoginPage() {
  const router        = useRouter();
  const { setUser }   = useAuth();

  const [step,        setStep]        = useState<Step>("phone");
  const [phone,       setPhone]       = useState("");
  const [otp,         setOtp]         = useState(["", "", "", "", "", ""]);
  const [error,       setError]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [countdown,   setCountdown]   = useState(0);

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function formatPhone(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 10);
    return digits;
  }

  async function handleSendOtp() {
    const digits = formatPhone(phone);
    if (digits.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await sendOtp(`+91${digits}`);
      setStep("otp");
      setCountdown(30);
      // Auto-fill dev OTP for convenience
      if (USE_MOCK) {
        setOtp(DEV_OTP.split(""));
        setTimeout(() => otpRefs.current[5]?.focus(), 100);
      } else {
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      }
    } catch {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const digits = formatPhone(phone);
      const { session, isNewUser } = await verifyOtp(`+91${digits}`, code);
      if (!session) {
        setError("Invalid code. Please check and try again.");
        setLoading(false);
        return;
      }
      // We don't have profile in session — fetch it
      const { getProfileById } = await import("@/lib/data/auth");
      const profile = await getProfileById(session.userId);
      if (profile) {
        setUser({ id: session.userId, phone: session.phone, profile });
      }
      if (isNewUser || !profile?.full_name) {
        router.replace("/onboarding");
      } else {
        router.replace(profile.active_mode === "host" ? "/host/dashboard" : "/explore");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setLoading(true);
    try {
      const { session, isNewUser } = await signInWithGoogle();
      const { getProfileById } = await import("@/lib/data/auth");
      const profile = await getProfileById(session.userId);
      if (profile) setUser({ id: session.userId, phone: session.phone, profile });
      if (isNewUser || !profile?.full_name) {
        router.replace("/onboarding");
      } else {
        router.replace(profile?.active_mode === "host" ? "/host/dashboard" : "/explore");
      }
    } catch {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // OTP digit handlers
  function handleOtpChange(idx: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next  = [...otp];
    next[idx]   = digit;
    setOtp(next);
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
  }

  function handleOtpKeyDown(idx: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
    if (e.key === "Enter" && otp.join("").length === 6) handleVerifyOtp();
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const text   = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const digits = text.split("");
    setOtp([...digits, ...Array(6 - digits.length).fill("")]);
    otpRefs.current[Math.min(digits.length, 5)]?.focus();
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="w-full min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-5xl mx-auto">
        <div className="w-full bg-card rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">

          {/* ── Left branding panel ─────────────────────────────────────── */}
          <div className="lg:col-span-5 bg-forest text-forest-foreground flex flex-col justify-between p-8 md:p-10 relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-charge/10 blur-3xl pointer-events-none" />
            <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />

            {/* Brand mark */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-charge flex items-center justify-center shadow-md">
                  <Zap className="size-4 text-white" aria-hidden />
                </div>
                <span className="font-heading text-headline-sm text-white tracking-tight">
                  ChargeMate
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-charge animate-pulse" />
                <span className="font-heading text-label-sm text-white/80 uppercase tracking-wider">
                  Mesh 2.4
                </span>
              </div>
            </div>

            {/* Headline */}
            <div className="relative z-10 my-8 space-y-4">
              <span className="font-heading text-label-md uppercase tracking-widest text-white/60 block">
                Unified Grid Account
              </span>
              <h2 className="font-heading text-3xl md:text-4xl leading-tight text-white font-bold">
                One login.<br />Ride or host anytime.
              </h2>
              <div className="space-y-3 pt-2">
                {[
                  { icon: "↔", text: "Switch seamlessly between rider and host in a single tap." },
                  { icon: "₹", text: "Instant UPI payouts credited straight to your registered VPA." },
                  { icon: "✓", text: "DL & phone verified riders ensure zero gate-access friction." },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-white text-xs font-bold">
                      {item.icon}
                    </div>
                    <p className="font-body text-body-sm text-white/70">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Host testimonial card */}
            <div className="relative z-10 mt-auto pt-4">
              <div className="bg-white rounded-xl p-4 shadow-md relative">
                <div className="absolute -top-3.5 right-3 -rotate-3 bg-card text-forest px-2.5 py-1 rounded shadow-stamp flex items-center gap-1.5">
                  <span className="text-xs">✓</span>
                  <span className="font-heading text-label-sm uppercase tracking-wider font-bold">KYC & Earthing Verified</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-recessed flex items-center justify-center overflow-hidden shrink-0">
                    <img
                      src="https://i.pravatar.cc/48?u=ramesh-verma"
                      alt="Ramesh Verma"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-heading text-headline-sm text-foreground leading-tight">
                        Ramesh Verma
                      </h4>
                      <span className="text-ochre text-sm">✓</span>
                    </div>
                    <p className="font-body text-body-sm text-muted-foreground">
                      Indiranagar 100ft Rd · 16A + Type 2
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between bg-recessed rounded px-3 py-1.5">
                  <span className="font-body text-label-sm text-muted-foreground font-mono">
                    EARTHING RESISTANCE: 2.1Ω
                  </span>
                  <span className="font-heading text-label-sm text-charge font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-charge" /> LIVE
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right auth panel ─────────────────────────────────────────── */}
          <div className="lg:col-span-7 bg-card p-8 md:p-10 flex flex-col justify-between">
            <div className="w-full max-w-md mx-auto">

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <span className="font-heading text-label-sm font-bold tracking-widest text-charge uppercase">
                  Fast Track Sign-In
                </span>
                <div className="flex items-center gap-1 text-muted-foreground text-body-sm">
                  <Lock className="size-4 text-forest" aria-hidden />
                  <span className="font-body">256-bit Encrypted</span>
                </div>
              </div>

              {step === "phone" ? (
                <>
                  <h1 className="font-heading text-headline-lg-mobile text-foreground tracking-tight mb-2">
                    Enter your phone number
                  </h1>
                  <p className="font-body text-body-md text-muted-foreground mb-6">
                    We&apos;ll send a 6-digit WhatsApp or SMS code to get you rolling.
                  </p>

                  {/* Dev mode banner */}
                  {USE_MOCK && (
                    <div className="mb-4 px-3 py-2 rounded-lg bg-ochre-fixed border border-ochre/30 text-body-sm font-body text-foreground">
                      <strong>Dev mode</strong> — OTP auto-filled as{" "}
                      <code className="font-mono font-bold">{DEV_OTP}</code>
                    </div>
                  )}

                  {/* Phone input */}
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="phone-input"
                        className="block font-heading text-label-md font-semibold text-foreground mb-1.5"
                      >
                        MOBILE NUMBER
                      </label>
                      <div className="flex items-stretch bg-recessed rounded-xl p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-ring transition-all">
                        <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-lg border border-border select-none shrink-0">
                          <span className="text-xl" aria-hidden>🇮🇳</span>
                          <span className="font-heading text-headline-sm font-bold text-foreground">+91</span>
                        </div>
                        <input
                          id="phone-input"
                          type="tel"
                          maxLength={10}
                          placeholder="98450 12345"
                          value={phone}
                          onChange={(e) => {
                            setPhone(formatPhone(e.target.value));
                            setError("");
                          }}
                          onKeyDown={(e) => { if (e.key === "Enter") handleSendOtp(); }}
                          className="w-full bg-transparent px-3 py-2 font-heading text-headline-sm text-foreground placeholder:text-muted-foreground focus:outline-none tracking-wide"
                          autoComplete="tel"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Error */}
                    {error && (
                      <p role="alert" className="font-body text-body-sm text-destructive">
                        {error}
                      </p>
                    )}

                    {/* CTA */}
                    <button
                      id="get-code-btn"
                      onClick={handleSendOtp}
                      disabled={loading}
                      className={cn(
                        "w-full h-[52px] bg-charge text-white font-heading text-headline-sm font-bold rounded-xl shadow-md",
                        "hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      {loading ? (
                        <RefreshCw className="size-5 animate-spin" aria-hidden />
                      ) : (
                        <>
                          <span>Get Verification Code</span>
                          <ArrowRight className="size-5" aria-hidden />
                        </>
                      )}
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-2">
                      <div className="flex-1 h-px bg-border" />
                      <span className="font-body text-body-sm text-muted-foreground">or</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    {/* Google */}
                    <button
                      id="google-sign-in-btn"
                      onClick={handleGoogle}
                      disabled={loading}
                      className={cn(
                        "w-full h-[52px] bg-card border border-border text-foreground font-heading text-label-lg font-semibold rounded-xl",
                        "hover:bg-recessed active:scale-[0.98] transition-all flex items-center justify-center gap-3",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      <svg className="size-5" viewBox="0 0 24 24" aria-hidden>
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Continue with Google
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* OTP step */}
                  <button
                    onClick={() => { setStep("phone"); setError(""); setOtp(["","","","","",""]); }}
                    className="text-body-sm text-muted-foreground hover:text-foreground font-body mb-4 flex items-center gap-1 transition-colors"
                  >
                    ← Back
                  </button>

                  <h1 className="font-heading text-headline-lg-mobile text-foreground tracking-tight mb-2">
                    Enter the 6-digit code
                  </h1>
                  <p className="font-body text-body-md text-muted-foreground mb-6">
                    Sent to <strong>+91 {phone}</strong> via SMS / WhatsApp
                  </p>

                  <div className="bg-recessed rounded-xl p-5 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5 font-heading text-label-md font-semibold text-foreground">
                        <MessageCircle className="size-4 text-charge" aria-hidden />
                        ENTER 6-DIGIT CODE
                      </div>
                      <span
                        id="otp-timer"
                        className="font-body text-label-sm text-muted-foreground font-mono"
                      >
                        {countdown > 0 ? `Resend in ${countdown}s` : "Ready to resend"}
                      </span>
                    </div>

                    {/* OTP boxes */}
                    <div
                      id="otp-container"
                      className="grid grid-cols-6 gap-2 my-3"
                      onPaste={handleOtpPaste}
                    >
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => { otpRefs.current[idx] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          placeholder="·"
                          id={`otp-digit-${idx}`}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className={cn(
                            "w-full h-12 text-center font-heading text-headline-md text-foreground",
                            "bg-card rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all",
                          )}
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                      <span className="font-body text-body-sm text-muted-foreground">
                        Didn&apos;t receive it?
                      </span>
                      <button
                        onClick={() => {
                          if (countdown > 0) return;
                          sendOtp(`+91${formatPhone(phone)}`);
                          setCountdown(30);
                          if (USE_MOCK) setOtp(DEV_OTP.split(""));
                        }}
                        disabled={countdown > 0}
                        className="font-heading text-label-md text-forest font-bold flex items-center gap-1 hover:underline disabled:opacity-40"
                      >
                        <MessageCircle className="size-3.5" aria-hidden />
                        Resend via WhatsApp
                      </button>
                    </div>
                  </div>

                  {error && (
                    <p role="alert" className="font-body text-body-sm text-destructive mb-3">
                      {error}
                    </p>
                  )}

                  <button
                    id="verify-otp-btn"
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.join("").length !== 6}
                    className={cn(
                      "w-full h-[52px] bg-charge text-white font-heading text-headline-sm font-bold rounded-xl shadow-md",
                      "hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {loading ? (
                      <RefreshCw className="size-5 animate-spin" aria-hidden />
                    ) : (
                      <>
                        <span>Verify & Continue</span>
                        <ArrowRight className="size-5" aria-hidden />
                      </>
                    )}
                  </button>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="w-full max-w-md mx-auto pt-6 space-y-1.5">
              <div className="flex items-center gap-2 text-muted-foreground font-body text-body-sm">
                <Shield className="size-4 text-forest shrink-0" aria-hidden />
                <span>Zero spam. Only used for host gate-access PINs and active charge telemetry alerts.</span>
              </div>
              <p className="font-body text-body-sm text-muted-foreground">
                By continuing, you agree to ChargeMate&apos;s{" "}
                <a href="#" className="text-foreground font-semibold underline underline-offset-2">
                  Community Safety & Earthing Standards
                </a>{" "}
                (Updated October 2026).
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
