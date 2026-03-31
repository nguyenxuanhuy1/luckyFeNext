"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Inter:wght@400;600;700&display=swap');

        .nf-body {
          position: fixed; inset: 0;
          background: #07060f;
          font-family: 'Inter', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          color: #f1f0ff;
        }

        /* Animated mesh background */
        .nf-bg::before {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 70% 55% at 20% 15%, rgba(99,102,241,0.15) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 25%, rgba(168,85,247,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 50% 85%, rgba(236,72,153,0.08) 0%, transparent 60%);
          animation: nf-mesh 8s ease-in-out infinite alternate;
        }
        @keyframes nf-mesh {
          0%   { opacity: 0.7; transform: scale(1); }
          100% { opacity: 1;   transform: scale(1.06); }
        }

        /* 404 big text */
        .nf-code {
          font-family: 'Orbitron', monospace;
          font-size: clamp(7rem, 20vw, 13rem);
          font-weight: 900;
          line-height: 1;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #c4b5fd 0%, #818cf8 40%, #a5f3fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 40px rgba(129,140,248,0.35));
          animation: nf-float 4s ease-in-out infinite;
          position: relative;
          z-index: 2;
          user-select: none;
        }
        @keyframes nf-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-14px); }
        }

        /* Glitch overlay on 404 */
        .nf-code::after {
          content: '404';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, #f43f5e, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: nf-glitch 6s infinite;
          clip-path: inset(0 0 90% 0);
        }
        @keyframes nf-glitch {
          0%, 90%, 100% { opacity: 0; transform: translate(0); }
          91%  { opacity: 0.7; transform: translate(-3px, 1px); clip-path: inset(20% 0 60% 0); }
          93%  { opacity: 0.5; transform: translate(3px, -1px); clip-path: inset(60% 0 10% 0); }
          95%  { opacity: 0;   transform: translate(0); }
        }

        .nf-wheel {
          font-size: 3.5rem;
          animation: nf-spin-slow 8s linear infinite;
          display: block;
          filter: drop-shadow(0 0 16px rgba(168,85,247,0.5));
          margin-bottom: 0.25rem;
          position: relative; z-index: 2;
        }
        @keyframes nf-spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        .nf-title {
          font-family: 'Orbitron', monospace;
          font-size: clamp(0.9rem, 2.5vw, 1.15rem);
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(192,132,252,0.75);
          margin-bottom: 0.5rem;
          position: relative; z-index: 2;
        }

        .nf-desc {
          font-size: 0.9rem;
          color: rgba(200,195,255,0.4);
          text-align: center;
          max-width: 340px;
          line-height: 1.6;
          position: relative; z-index: 2;
          margin-bottom: 2.5rem;
        }

        .nf-btn {
          position: relative; z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.8rem 2rem;
          border-radius: 14px;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          border: none;
          color: #fff;
          font-family: 'Orbitron', monospace;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          cursor: pointer;
          box-shadow: 0 0 30px rgba(99,102,241,0.45), 0 8px 24px rgba(0,0,0,0.4);
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          text-decoration: none;
          overflow: hidden;
        }
        .nf-btn::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%);
          transform: translateX(-100%);
          transition: transform 0.6s;
        }
        .nf-btn:hover::before { transform: translateX(100%); }
        .nf-btn:hover {
          transform: translateY(-3px) scale(1.04);
          box-shadow: 0 0 50px rgba(99,102,241,0.65), 0 12px 32px rgba(0,0,0,0.5);
        }
        .nf-btn:active { transform: scale(0.97); }

        .nf-countdown {
          position: relative; z-index: 2;
          margin-top: 1.25rem;
          font-size: 0.72rem;
          color: rgba(139,92,246,0.45);
          letter-spacing: 0.08em;
          font-family: 'Orbitron', monospace;
        }
        .nf-countdown span {
          color: rgba(129,140,248,0.7);
          font-weight: 700;
        }

        /* Orbit rings */
        .nf-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(139,92,246,0.12);
          pointer-events: none;
          animation: nf-pulse-ring 4s ease-in-out infinite;
        }
        .nf-ring-1 { width: 500px; height: 500px; animation-delay: 0s; }
        .nf-ring-2 { width: 700px; height: 700px; animation-delay: 0.8s; }
        .nf-ring-3 { width: 900px; height: 900px; animation-delay: 1.6s; }
        @keyframes nf-pulse-ring {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 0.12; transform: scale(1.03); }
        }

        /* Top bar */
        .nf-topbar {
          position: absolute; top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, #6366f1, #a855f7, #ec4899, #a855f7, #6366f1);
          background-size: 200%;
          animation: nf-bar 3s linear infinite;
        }
        @keyframes nf-bar {
          0%   { background-position: 0%; }
          100% { background-position: 200%; }
        }

        /* Logo top-left */
        .nf-logo {
          position: absolute; top: 24px; left: 28px; z-index: 10;
          display: flex; align-items: center; gap: 0.65rem;
          cursor: pointer; text-decoration: none;
        }
        .nf-logo-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.2rem;
          box-shadow: 0 0 20px rgba(168,85,247,0.5), inset 0 1px 0 rgba(255,255,255,0.2);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .nf-logo:hover .nf-logo-icon {
          transform: scale(1.08) rotate(-5deg);
          box-shadow: 0 0 30px rgba(168,85,247,0.7), inset 0 1px 0 rgba(255,255,255,0.3);
        }
        .nf-logo-text {
          font-family: 'Orbitron', monospace;
          font-weight: 800; font-size: 1.1rem; letter-spacing: 0.05em;
          background: linear-gradient(135deg, #c4b5fd, #818cf8);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      <div className="nf-body nf-bg">
        {/* Decorative rings */}
        <div className="nf-ring nf-ring-1" />
        <div className="nf-ring nf-ring-2" />
        <div className="nf-ring nf-ring-3" />

        {/* Top gradient bar */}
        <div className="nf-topbar" />

        {/* Logo */}
        <a href="/" className="nf-logo">
          <div className="nf-logo-icon">🎯</div>
          <span className="nf-logo-text">QuayMayMan</span>
        </a>

        {/* Content */}
        <span className="nf-wheel" aria-hidden="true">🎡</span>
        <div className="nf-code">404</div>
        <div className="nf-title">Trang không tồn tại</div>
        <p className="nf-desc">
          Trang bạn đang tìm đã bay mất rồi!<br />
          Có thể đường dẫn bị sai hoặc trang đã bị xoá.
        </p>

        <button className="nf-btn" onClick={() => router.push("/")}>
          ← Về trang chủ
        </button>

        <p className="nf-countdown">
          Tự động chuyển hướng sau <span>{countdown}s</span>
        </p>
      </div>
    </>
  );
}
