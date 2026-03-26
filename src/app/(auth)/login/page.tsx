"use client";

import { useState, useRef } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [muted,    setMuted]    = useState(true);   // muted for autoplay policy
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync mute button with actual video element
  function handleMuteToggle() {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted((v) => !v);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      window.location.href = "/dashboard";
    }, 1400);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: "#000",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ── VIDEO BACKGROUND ─────────────────────────────────────── */}
      <video
        ref={videoRef}
        autoPlay
        loop
        playsInline
        muted
        preload="auto"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        <source src="/bglogin.mp4" type="video/mp4" />
      </video>

      {/* ── GRADIENT OVERLAY ─────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 45%, rgba(0,0,0,0.55) 100%)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 25%, transparent 70%, rgba(0,0,0,0.75) 100%)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />



      {/* ── MUTE / UNMUTE Button ─────────────────────────────────── */}
      <button
        onClick={handleMuteToggle}
        title={muted ? "Bật âm thanh" : "Tắt âm thanh"}
        aria-label={muted ? "Bật âm thanh" : "Tắt âm thanh"}
        style={{
          position: "absolute",
          bottom: "24px", left: "28px",
          zIndex: 20,
          display: "flex", alignItems: "center", gap: "8px",
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "40px", padding: "8px 16px",
          cursor: "pointer", color: "rgba(255,255,255,0.85)",
          fontSize: "12px", fontWeight: 500, letterSpacing: "0.03em",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.14)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)")}
      >
        {muted ? (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
            </svg>
            Bật âm
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
            Tắt âm
          </>
        )}
      </button>

      {/* ── BRAND LOGO ───────────────────────────────────────────── */}
      <div style={{
        position: "absolute", top: "28px", left: "32px", zIndex: 20,
        display: "flex", alignItems: "center", gap: "12px",
        animation: "fadeDown 0.5s ease both",
      }}>
        <div style={{
          width: "38px", height: "38px", borderRadius: "12px",
          background: "linear-gradient(135deg, #6366f1, #a855f7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(99,102,241,0.5)",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: "18px", fontWeight: 800, color: "white", letterSpacing: "-0.5px", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
            ServiceHub
          </div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>API Platform</div>
        </div>
      </div>

      {/* ── LOGIN FORM (right) ────────────────────────────────────── */}
      <div style={{
        position: "absolute", right: 0, top: 0,
        height: "100%", width: "340px",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px", zIndex: 20,
      }}>
          <div style={{
            width: "100%",
            background: "rgba(8,8,20,0.68)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "32px 28px",
            boxShadow: "0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.08) inset",
            animation: "slideInRight 0.55s cubic-bezier(0.34,1.56,0.64,1) both",
          }}>
            {/* Header */}
            <div style={{ marginBottom: "26px" }}>
              <h1 style={{ fontSize: "22px", fontWeight: 800, color: "white", letterSpacing: "-0.5px", marginBottom: "6px" }}>
                Đăng nhập
              </h1>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
                Chào mừng trở lại! Đăng nhập để tiếp tục.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Email */}
              <div>
                <label htmlFor="login-email" style={{
                  display: "block", fontSize: "11px", fontWeight: 600,
                  color: "rgba(255,255,255,0.5)", marginBottom: "6px",
                  letterSpacing: "0.06em", textTransform: "uppercase",
                }}>Tài khoản</label>
                <div style={{ position: "relative" }}>
                  <span style={{
                    position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)",
                    color: "rgba(255,255,255,0.28)", display: "flex", alignItems: "center", pointerEvents: "none",
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    id="login-email" type="text"
                    placeholder="Email hoặc tên đăng nhập"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    required autoComplete="username"
                    style={{
                      width: "100%", padding: "10px 12px 10px 34px",
                      background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "10px", color: "white", fontSize: "13px",
                      outline: "none", transition: "all 0.2s ease", boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "rgba(99,102,241,0.6)";
                      e.currentTarget.style.background = "rgba(99,102,241,0.07)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <label htmlFor="login-password" style={{
                    fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.5)",
                    letterSpacing: "0.06em", textTransform: "uppercase",
                  }}>Mật khẩu</label>
                  <a href="#" style={{ fontSize: "11px", color: "#818cf8", textDecoration: "none", fontWeight: 500 }}
                    onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = "#a5b4fc")}
                    onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = "#818cf8")}>
                    Quên mật khẩu?
                  </a>
                </div>
                <div style={{ position: "relative" }}>
                  <span style={{
                    position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)",
                    color: "rgba(255,255,255,0.28)", display: "flex", alignItems: "center", pointerEvents: "none",
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="login-password" type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    required autoComplete="current-password"
                    style={{
                      width: "100%", padding: "10px 36px 10px 34px",
                      background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "10px", color: "white", fontSize: "13px",
                      outline: "none", transition: "all 0.2s ease", boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "rgba(99,102,241,0.6)";
                      e.currentTarget.style.background = "rgba(99,102,241,0.07)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                  <button type="button" onClick={() => setShowPass((v) => !v)} aria-label="Hiện/ẩn mật khẩu"
                    style={{
                      position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", padding: "2px",
                    }}>
                    {showPass ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember */}
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", userSelect: "none" }}>
                <input type="checkbox" id="login-remember" style={{ width: "14px", height: "14px", accentColor: "#6366f1", cursor: "pointer" }} />
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>Ghi nhớ đăng nhập</span>
              </label>

              {/* Submit */}
              <button
                id="login-submit" type="submit" disabled={loading}
                style={{
                  marginTop: "4px", width: "100%", height: "42px",
                  background: loading ? "rgba(99,102,241,0.5)" : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  border: "none", borderRadius: "11px", color: "white",
                  fontSize: "14px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "0 4px 20px rgba(99,102,241,0.45)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 28px rgba(99,102,241,0.55)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(99,102,241,0.45)";
                }}
              >
                {loading ? (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
                      style={{ animation: "spin 0.8s linear infinite" }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Đang đăng nhập...
                  </>
                ) : (
                  <>
                    Đăng nhập
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "18px 0" }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.07)" }} />
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.28)" }}>hoặc</span>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.07)" }} />
            </div>

            {/* OAuth */}
            <div style={{ display: "flex", gap: "10px" }}>
              {[
                {
                  label: "Google",
                  icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  ),
                },
                {
                  label: "GitHub",
                  icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  ),
                },
              ].map((p) => (
                <button key={p.label} type="button"
                  style={{
                    flex: 1, height: "38px",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "9px", color: "rgba(255,255,255,0.65)",
                    fontSize: "12px", fontWeight: 500, cursor: "pointer", transition: "all 0.18s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)";
                    (e.currentTarget as HTMLButtonElement).style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
                    (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.65)";
                  }}
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>

            <p style={{ marginTop: "18px", textAlign: "center", fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>
              Chưa có tài khoản?{" "}
              <Link href="/register" style={{ color: "#818cf8", textDecoration: "none", fontWeight: 600 }}>
                Đăng ký miễn phí
              </Link>
            </p>
          </div>
        </div>
      </div>

  );
}
