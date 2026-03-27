"use client";

import { useState, useRef } from "react";
import { authService } from "@/services/api";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [mode,     setMode]     = useState<"login" | "register">("login");
  const [muted,    setMuted]    = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  function handleMuteToggle() {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted((v) => !v);
  }

  function switchMode(m: "login" | "register") {
    setMode(m); setError("");
    setUsername(""); setPassword(""); setConfirm("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (mode === "register" && password !== confirm) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await authService.login(username, password);
      } else {
        await authService.register({ username, password });
      }
      router.push("/");
    } catch {
      setError(mode === "login" ? "Sai tài khoản hoặc mật khẩu." : "Đăng ký thất bại. Tài khoản có thể đã tồn tại.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px 10px 34px",
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px", color: "white", fontSize: "13px",
    outline: "none", transition: "all 0.2s ease", boxSizing: "border-box",
  };

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", background: "#000", fontFamily: "'Inter', sans-serif" }}>
      {/* VIDEO BACKGROUND */}
      <video ref={videoRef} autoPlay loop playsInline muted preload="auto"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none", zIndex: 1 }}>
        <source src="/bglogin.mp4" type="video/mp4" />
      </video>

      {/* OVERLAYS */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 45%, rgba(0,0,0,0.55) 100%)", pointerEvents: "none", zIndex: 2 }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 25%, transparent 70%, rgba(0,0,0,0.75) 100%)", pointerEvents: "none", zIndex: 2 }} />

      {/* MUTE BUTTON */}
      <button onClick={handleMuteToggle} title={muted ? "Bật âm thanh" : "Tắt âm thanh"}
        style={{ position: "absolute", bottom: "24px", left: "28px", zIndex: 20, display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "40px", padding: "8px 16px", cursor: "pointer", color: "rgba(255,255,255,0.85)", fontSize: "12px", fontWeight: 500 }}>
        {muted ? (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
            </svg>Bật âm
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>Tắt âm
          </>
        )}
      </button>

      {/* BRAND LOGO */}
      <div style={{ position: "absolute", top: "28px", left: "32px", zIndex: 20, display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "38px", height: "38px", borderRadius: "12px", background: "linear-gradient(135deg, #6366f1, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(99,102,241,0.5)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
        </div>
        <div>
          <div style={{ fontSize: "18px", fontWeight: 800, color: "white", letterSpacing: "-0.5px" }}>LuckyPick</div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>Vòng quay may mắn</div>
        </div>
      </div>

      {/* LOGIN / REGISTER FORM */}
      <div style={{ position: "absolute", right: 0, top: 0, height: "100%", width: "340px", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", zIndex: 20 }}>
        <div style={{ width: "100%", background: "rgba(8,8,20,0.68)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)", padding: "32px 28px", boxShadow: "0 32px 64px rgba(0,0,0,0.5)" }}>

          {/* Header */}
          <div style={{ marginBottom: "26px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: "white", letterSpacing: "-0.5px", marginBottom: "6px" }}>
              {mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>



            {/* Username */}
            <div>
              <label htmlFor="login-user" style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: "6px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Tài khoản</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.28)", display: "flex", alignItems: "center", pointerEvents: "none" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input id="login-user" type="text" placeholder="Tên đăng nhập" value={username}
                  onChange={(e) => setUsername(e.target.value)} required autoComplete="username"
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.6)"; e.currentTarget.style.background = "rgba(99,102,241,0.07)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-pass" style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: "6px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Mật khẩu</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.28)", display: "flex", alignItems: "center", pointerEvents: "none" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input id="login-pass" type={showPass ? "text" : "password"} placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"
                  style={{ ...inputStyle, paddingRight: "36px" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.6)"; e.currentTarget.style.background = "rgba(99,102,241,0.07)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                />
                <button type="button" onClick={() => setShowPass((v) => !v)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", padding: "2px" }}>
                  {showPass ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm password — chỉ hiện khi đăng ký */}
            {mode === "register" && (
              <div>
                <label htmlFor="login-confirm" style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: "6px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Xác nhận mật khẩu</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.28)", display: "flex", alignItems: "center", pointerEvents: "none" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input id="login-confirm" type="password" placeholder="Nhập lại mật khẩu" value={confirm}
                    onChange={(e) => setConfirm(e.target.value)} required
                    style={{ ...inputStyle }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.6)"; e.currentTarget.style.background = "rgba(99,102,241,0.07)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ padding: "10px 12px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", color: "#fca5a5", fontSize: "12px", fontWeight: 500 }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button id="login-submit" type="submit" disabled={loading}
              style={{ marginTop: "4px", width: "100%", height: "42px", background: loading ? "rgba(99,102,241,0.5)" : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", border: "none", borderRadius: "11px", color: "white", fontSize: "14px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 4px 20px rgba(99,102,241,0.45)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s ease" }}>
              {loading ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ animation: "spin 0.8s linear infinite" }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Đang xử lý...
                </>
              ) : (
                mode === "login" ? "Đăng nhập" : "Tạo tài khoản"
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <p style={{ marginTop: "20px", textAlign: "center", fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>
            {mode === "login" ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
            <button type="button" onClick={() => switchMode(mode === "login" ? "register" : "login")}
              style={{ background: "none", border: "none", color: "#818cf8", fontWeight: 600, fontSize: "12px", cursor: "pointer", padding: 0 }}>
              {mode === "login" ? "Đăng ký miễn phí" : "Đăng nhập ngay"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
