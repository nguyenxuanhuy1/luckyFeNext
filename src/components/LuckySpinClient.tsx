"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { wheelService, Wheel, SpinHistoryResponse, getAuth, authService } from "@/services/api";

/* ============================
   TYPES
   ============================ */
export interface Participant {
  id: string;
  name: string;
}

/* ============================
   CONSTANTS & UTILS
   ============================ */
const SEGMENT_COLORS = [
  "#7c3aed", "#0891b2", "#db2777", "#d97706",
  "#059669", "#dc2626", "#7c3aed", "#0284c7",
  "#9333ea", "#16a34a", "#ea580c", "#be185d",
];

const LIGHT_COLORS = [
  "#a78bfa", "#67e8f9", "#f9a8d4", "#fcd34d",
  "#6ee7b7", "#fca5a5", "#c4b5fd", "#7dd3fc",
  "#d8b4fe", "#86efac", "#fdba74", "#f9a8d4",
];

const SPIN_DURATIONS = [5, 8, 11, 16];

function generateSessionId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 8; i++) {
    if (i === 4) id += "-";
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function generateUid(): string {
  return Math.random().toString(36).slice(2, 9);
}

const DEFAULT_PARTICIPANTS: Participant[] = [
  { id: generateUid(), name: "Nguyễn Văn A" },
  { id: generateUid(), name: "Trần Thị B" },
  { id: generateUid(), name: "Lê Văn C" },
  { id: generateUid(), name: "Phạm Thị D" },
  { id: generateUid(), name: "Hoàng Văn E" },
  { id: generateUid(), name: "Vũ Thị F" },
];

/* ============================
   MOCK BACKEND API
   ============================ */
// Removed Mock Backend API

/* ============================
   CONFETTI (PHÁO HOA)
   ============================ */
function ConfettiEffect({ active }: { active: boolean }) {
  const colors = [
    "#ffd700", "#a78bfa", "#67e8f9", "#f9a8d4",
    "#6ee7b7", "#fca5a5", "#fff", "#fdba74",
  ];

  if (!active) return null;

  return (
    <div className="confetti-container" aria-hidden="true">
      {Array.from({ length: 100 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.5;
        const duration = 2.5 + Math.random() * 2;
        const drift = (Math.random() - 0.5) * 200;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 6 + Math.random() * 10;
        const isCircle = Math.random() > 0.5;
        return (
          <div
            key={i}
            className="confetti-particle"
            style={{
              left: `${left}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              background: color,
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: isCircle ? "50%" : "2px",
              // @ts-expect-error CSS custom property cho drift x offset
              "--drift": `${drift}px`,
            }}
          />
        );
      })}
    </div>
  );
}

/* ============================
   SPIN WHEEL SVG (VÒNG QUAY 3D)
   ============================ */
function SpinWheelSVG({
  participants,
  rotation,
  isSpinning,
}: {
  participants: Participant[];
  rotation: number;
  isSpinning: boolean;
}) {
  const count = participants.length;
  const size = 540;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 6;
  const innerR = 70;

  if (count === 0) {
    return (
      <svg viewBox={`0 0 ${size} ${size}`} className="spin-wheel" style={{ pointerEvents: 'none' }}>
        <circle cx={cx} cy={cy} r={r} fill="#1a1a3e" stroke="none" />
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(255,255,255,0.3)"
          fontSize="24"
          fontFamily="Inter,sans-serif"
        >
          Thêm người tham gia
        </text>
      </svg>
    );
  }

  if (count === 1) {
    return (
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className={`spin-wheel ${isSpinning ? "is-spinning" : ""}`}
        style={{ transform: `rotate(${rotation}deg)`, pointerEvents: 'none' }}
      >
        <circle cx={cx} cy={cy} r={r} fill={SEGMENT_COLORS[0]} />
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          fontSize="28"
          fontFamily="Inter,sans-serif"
          fontWeight="bold"
        >
          {participants[0].name}
        </text>
      </svg>
    );
  }

  const segmentAngle = 360 / count;

  const segments = participants.map((p, i) => {
    const startAngle = (i * segmentAngle * Math.PI) / 180;
    const endAngle = ((i + 1) * segmentAngle * Math.PI) / 180;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);

    const xi1 = cx + innerR * Math.cos(startAngle);
    const yi1 = cy + innerR * Math.sin(startAngle);
    const xi2 = cx + innerR * Math.cos(endAngle);
    const yi2 = cy + innerR * Math.sin(endAngle);

    const largeArc = segmentAngle > 180 ? 1 : 0;

    const path = [
      `M ${xi1} ${yi1}`,
      `L ${x1} ${y1}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${xi2} ${yi2}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${xi1} ${yi1}`,
      "Z",
    ].join(" ");
    const midAngle = ((i + 0.5) * segmentAngle * Math.PI) / 180;

    // textR: sát vòng tâm, chữ chạy ra ngoài → hiển thị được nhiều hơn khi ô rộng
    const textR = innerR + 18;

    const tx = cx + textR * Math.cos(midAngle);
    const ty = cy + textR * Math.sin(midAngle);
    const textRotation = (i + 0.5) * segmentAngle;

    // maxLen tỉ lệ thuận với góc của ô: ô càng rộng → hiển thị càng nhiều ký tự
    const maxLen = Math.max(4, Math.floor(segmentAngle / 4));
    const displayName =
      p.name.length > maxLen ? p.name.slice(0, maxLen - 1) + "…" : p.name;

    const edgeDotR = r - 8;
    const edgeMidAngle = ((i + 0.5) * segmentAngle * Math.PI) / 180;
    const edgeX = cx + edgeDotR * Math.cos(edgeMidAngle);
    const edgeY = cy + edgeDotR * Math.sin(edgeMidAngle);

    return {
      path,
      tx,
      ty,
      textRotation,
      displayName,
      color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
      lightColor: LIGHT_COLORS[i % LIGHT_COLORS.length],
      edgeX,
      edgeY,
      i,
    };
  });

  const separators = participants.map((_, i) => {
    const angle = (i * segmentAngle * Math.PI) / 180;
    return {
      x1: cx + innerR * Math.cos(angle),
      y1: cy + innerR * Math.sin(angle),
      x2: cx + r * Math.cos(angle),
      y2: cy + r * Math.sin(angle),
    };
  });

  const fontSize = count > 15 ? 12 : count > 10 ? 15 : count > 6 ? 20 : 24;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={`spin-wheel ${isSpinning ? "is-spinning" : ""}`}
      style={{ transform: `rotate(${rotation}deg)`, pointerEvents: 'none' }}
    >
      <defs>
        {segments.map((seg) => (
          <radialGradient
            key={`grad-${seg.i}`}
            id={`seg-grad-${seg.i}`}
            cx="50%"
            cy="50%"
            r="50%"
          >
            <stop offset="0%" stopColor={seg.lightColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={seg.color} stopOpacity="1" />
          </radialGradient>
        ))}
      </defs>

      {segments.map((seg) => (
        <g key={seg.i}>
          <path
            d={seg.path}
            fill={`url(#seg-grad-${seg.i})`}
            stroke="none"
          />
          <path
            d={seg.path}
            fill="rgba(255,255,255,0.08)"
            stroke="none"
            clipPath=""
          />
          <circle
            cx={seg.edgeX}
            cy={seg.edgeY}
            r="6.5"
            fill="rgba(255,255,255,0.5)"
          />
        </g>
      ))}

      {separators.map((sep, i) => (
        <line
          key={i}
          x1={sep.x1}
          y1={sep.y1}
          x2={sep.x2}
          y2={sep.y2}
          stroke="#fb7185" /* fallback */
          strokeWidth="0" /* borders handled by path stroke */
        />
      ))}

      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="2"
      />

      {segments.map((seg) => (
        <text
          key={`txt-${seg.i}`}
          x={seg.tx}
          y={seg.ty}
          textAnchor="start"
          dominantBaseline="middle"
          fill="#ffffff"
          fontSize={fontSize}
          fontFamily="Inter,sans-serif"
          fontWeight="900"
          style={{ textShadow: "0px 2px 4px rgba(0,0,0,0.8), 0px 0px 3px rgba(0,0,0,1)" }}
          transform={`rotate(${seg.textRotation}, ${seg.tx}, ${seg.ty})`}
        >
          {seg.displayName}
        </text>
      ))}

      <circle
        cx={cx}
        cy={cy}
        r={innerR + 2}
        fill="rgba(0,0,0,0.3)"
        stroke="rgba(0,0,0,0.5)"
        strokeWidth="1"
      />
    </svg>
  );
}

/* ============================
   SLOT MACHINE SPINNER (>15 participants)
   ============================ */
function SlotMachineSpinner({
  participants,
  isSpinning,
  targetWinner,
  spinDuration,
  onSpinClick,
  disabled,
  isFetchingResult,
}: {
  participants: Participant[];
  isSpinning: boolean;
  targetWinner: Participant | null;
  spinDuration: number;
  onSpinClick: () => void;
  disabled: boolean;
  isFetchingResult: boolean;
}) {
  const ITEM_H = 72;
  const VISIBLE = 5;
  const CENTER_IDX = Math.floor(VISIBLE / 2);

  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<Participant[]>([]);
  const rafRef = useRef<number | null>(null);

  const getColor = (p: Participant) => {
    const idx = participants.findIndex(x => x.id === p.id);
    return idx >= 0 ? SEGMENT_COLORS[idx % SEGMENT_COLORS.length] : '#6366f1';
  };

  useEffect(() => {
    if (!isSpinning || !targetWinner) return;

    const extraCount = Math.max(35, Math.round(spinDuration * 7));
    const list: Participant[] = [];
    for (let i = 0; i < extraCount; i++) {
      list.push(participants[i % participants.length]);
    }
    list.push(targetWinner);
    for (let i = 1; i <= CENTER_IDX + 1; i++) {
      list.push(participants[(extraCount + i) % participants.length]);
    }

    setItems(list);
    setOffset(0);

    const finalOffset = -((extraCount - CENTER_IDX) * ITEM_H);
    const startTime = performance.now();
    const durationMs = spinDuration * 1000;

    function easeOut(t: number) { return 1 - Math.pow(1 - t, 5); }

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      setOffset(finalOffset * easeOut(progress));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isSpinning, targetWinner, spinDuration, participants, CENTER_IDX]);

  const displayItems = items.length > 0 ? items : [...participants, ...participants].slice(0, VISIBLE + 2);
  const frameH = ITEM_H * VISIBLE;

  return (
    <div className="flex flex-col items-center w-full max-w-[500px]">
      {/* Machine outer frame */}
      <div
        className="relative w-full rounded-[28px] overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0d0a20 0%, #130f2e 100%)',
          border: '2px solid rgba(139,92,246,0.4)',
          boxShadow: '0 0 60px rgba(99,102,241,0.2), 0 30px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Top status bar */}
        <div className="flex items-center justify-between px-6 py-3.5" style={{ borderBottom: '1px solid rgba(139,92,246,0.2)', background: 'rgba(0,0,0,0.2)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#6366f1', boxShadow: '0 0 8px #6366f1' }} />
            <span className="text-[11px] font-[Orbitron] font-bold text-indigo-400/70 uppercase tracking-widest">DRUM SPIN</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-[Orbitron] font-bold text-indigo-400/50 uppercase tracking-widest">{participants.length} PLAYERS</span>
          </div>
        </div>

        {/* Drum viewport */}
        <div className="relative mx-5 my-4 rounded-2xl overflow-hidden" style={{ height: frameH, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(139,92,246,0.15)' }}>
          {/* Gradient fades */}
          <div className="absolute inset-x-0 top-0 z-10 pointer-events-none" style={{ height: ITEM_H * 2, background: 'linear-gradient(to bottom, rgba(13,10,32,0.97) 0%, transparent 100%)' }} />
          <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none" style={{ height: ITEM_H * 2, background: 'linear-gradient(to top, rgba(13,10,32,0.97) 0%, transparent 100%)' }} />

          {/* Center highlight band */}
          <div className="absolute inset-x-0 z-10 pointer-events-none" style={{
            top: CENTER_IDX * ITEM_H,
            height: ITEM_H,
            background: 'rgba(99,102,241,0.1)',
            borderTop: '2px solid rgba(139,92,246,0.55)',
            borderBottom: '2px solid rgba(139,92,246,0.55)',
            boxShadow: 'inset 0 0 30px rgba(99,102,241,0.1)',
          }} />
          {/* Left arrow tick */}
          <div className="absolute left-0 z-20 pointer-events-none" style={{ top: CENTER_IDX * ITEM_H + ITEM_H / 2 - 10, width: 0, height: 0, borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderLeft: '12px solid rgba(139,92,246,0.7)' }} />
          {/* Right arrow tick */}
          <div className="absolute right-0 z-20 pointer-events-none" style={{ top: CENTER_IDX * ITEM_H + ITEM_H / 2 - 10, width: 0, height: 0, borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderRight: '12px solid rgba(139,92,246,0.7)' }} />

          {/* Scrolling names */}
          <div style={{ transform: `translateY(${offset}px)`, willChange: 'transform' }}>
            {displayItems.map((p, i) => {
              const color = getColor(p);
              return (
                <div key={i} className="flex items-center justify-center gap-4 px-10" style={{ height: ITEM_H }}>
                  <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 10px ${color}90` }} />
                  <span className="font-black text-[22px] tracking-wide text-white/90 truncate max-w-[340px]" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.9)', fontFamily: 'Inter, sans-serif' }}>
                    {p.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom: spin button */}
        <div className="px-5 pb-5">
          <button
            className="relative w-full overflow-hidden flex items-center justify-center gap-3 font-[Orbitron] font-black text-white rounded-2xl transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              height: '56px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              boxShadow: '0 6px 25px rgba(99,102,241,0.45)',
              fontSize: '17px',
              letterSpacing: '0.18em',
            }}
            onClick={onSpinClick}
            disabled={disabled}
          >
            <div className="absolute inset-0 bg-[linear-gradient(105deg,transparent_30%,rgba(255,255,255,0.12)_50%,transparent_70%)] translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
            {isFetchingResult ? (
              <span className="animate-pulse text-[14px]">⏳ KẾT NỐI...</span>
            ) : isSpinning ? (
              <span className="animate-pulse">ĐANG QUAY...</span>
            ) : (
              <span>🎰 QUAY NGAY</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================
   ADMIN LOGIN MODAL (inline)
   ============================ */
function AdminLoginModal({
  onSuccess,
  onClose,
}: {
  onSuccess: (role: "ADMIN" | "USER") => void;
  onClose: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await authService.login(username, password);
      onSuccess(user.role);
    } catch {
      setError("Sai tài khoản hoặc mật khẩu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(4,4,16,0.8)', backdropFilter: 'blur(16px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden animate-[card-pop_0.25s_ease-out]"
        style={{
          background: 'linear-gradient(160deg, #0f0c29 0%, #141130 100%)',
          border: '1px solid rgba(139,92,246,0.35)',
          boxShadow: '0 0 0 1px rgba(139,92,246,0.1), 0 40px 80px rgba(0,0,0,0.7)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient top bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#6366f1,#a855f7,#ec4899)' }} />

        <div className="px-7 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(139,92,246,0.4)' }}>
                🔐
              </div>
              <div>
                <h2 className="text-white font-black text-lg tracking-wide">Admin Login</h2>
                <p className="text-indigo-300/50 text-xs">Chỉ dành cho quản trị viên</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-indigo-300/60 hover:text-white transition-colors text-lg"
              style={{ background: 'rgba(139,92,246,0.15)' }}>✕</button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* Username */}
            <div className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(139,92,246,0.7)" strokeWidth="2" strokeLinecap="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              <input
                type="text" placeholder="Tên đăng nhập"
                value={username} onChange={(e) => setUsername(e.target.value)}
                required autoComplete="username"
                className="flex-1 bg-transparent border-none text-white placeholder-indigo-400/40 outline-none text-[14px] font-medium"
              />
            </div>

            {/* Password */}
            <div className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(139,92,246,0.7)" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                type={showPass ? "text" : "password"} placeholder="Mật khẩu"
                value={password} onChange={(e) => setPassword(e.target.value)}
                required autoComplete="current-password"
                className="flex-1 bg-transparent border-none text-white placeholder-indigo-400/40 outline-none text-[14px] font-medium"
              />
              <button type="button" onClick={() => setShowPass(v => !v)} className="text-indigo-400/40 hover:text-indigo-300 transition-colors">
                {showPass
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="text-[12px] text-red-400 px-2 font-medium">{error}</div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="mt-1 py-3 rounded-xl font-black text-[14px] tracking-widest text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}
            >
              {loading
                ? <span className="animate-pulse">Đang đăng nhập...</span>
                : "ĐĂNG NHẬP"
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ============================
   MAIN COMPONENT
   ============================ */
export default function LuckySpinClient() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [wheelId, setWheelId] = useState<string | number | null>(null);
  const [presetResult, setPresetResult] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);

  const [inputName, setInputName] = useState("");
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isFetchingResult, setIsFetchingResult] = useState(false);
  const [winner, setWinner] = useState<Participant | null>(null);
  const [pendingWinner, setPendingWinner] = useState<Participant | null>(null);
  const [showResult, setShowResult] = useState(false);

  const [sessionId, setSessionId] = useState(() => generateSessionId());
  const [history, setHistory] = useState<SpinHistoryResponse[]>([]);
  const [spinDuration, setSpinDuration] = useState<number>(5);
  const [userRole, setUserRole] = useState<"ADMIN" | "USER" | null>(null);

  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  // Theme support
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Đọc role nếu đã đăng nhập sẵn (không bắt buộc)
    const auth = getAuth();
    if (auth) setUserRole(auth.role);
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const totalRotationRef = useRef<number>(0);
  const currentRotationRef = useRef<number>(0);

  const initWheel = useCallback(() => {
    // Không call API khi load trang — chỉ dùng danh sách mặc định
    // API chỉ được gọi khi user xác nhận danh sách hoặc quay
    setParticipants(DEFAULT_PARTICIPANTS);
    setIsInitializing(false);
  }, []);

  useEffect(() => {
    initWheel();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [initWheel]);

  /* QUẢN LÝ NGƯỜI CHƠI */
  const handleAddParticipant = useCallback(() => {
    const name = inputName.trim();
    if (!name) return;
    setParticipants((prev) => [...prev, { id: generateUid(), name }]);
    setInputName("");
    inputRef.current?.focus();
  }, [inputName]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAddParticipant();
  };

  const handleRemove = useCallback((id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleUpdateName = useCallback((id: string, newName: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: newName } : p))
    );
  }, []);

  /* LOGIC QUAY */
  const executeSpin = useCallback(async () => {
    if (isSpinning || participants.length < 2) return;

    setIsSpinning(true);
    setIsFetchingResult(true);
    setShowResult(false);
    setWinner(null);

    try {
      // Nếu chưa có wheelId → tạo mới trên BE lần đầu quay
      let activeWheelId = wheelId;
      if (!activeWheelId) {
        const newWheel = await wheelService.createWheel(
          "Vòng quay may mắn",
          participants.map(p => p.name)
        );
        activeWheelId = newWheel.id;
        setWheelId(newWheel.id);
        setSessionId(String(newWheel.id).slice(0, 8).toUpperCase());
      }

      const resp = await wheelService.spinWheel(activeWheelId);
      setIsFetchingResult(false);
      setPresetResult(""); // Clear local preset state since backend clears it after spinning

      const winnerName = resp.result;
      const winnerIndex = participants.findIndex(p => p.name === winnerName);
      if (winnerIndex === -1) {
        setIsSpinning(false);
        return;
      }
      const apiResult = { winner: participants[winnerIndex], winnerIndex };
      setPendingWinner(apiResult.winner);

      const count = participants.length;
      const segmentAngle = 360 / count;
      const targetMidpoint = (apiResult.winnerIndex + 0.5) * segmentAngle;
      const extraSpins = spinDuration + 1;
      const randomOffset = (Math.random() - 0.5) * (segmentAngle * 0.7);

      const finalAngle = (360 - targetMidpoint + randomOffset + 360) % 360;
      let delta = finalAngle - (currentRotationRef.current % 360);
      if (delta <= 0) delta += 360;

      const targetAngle = extraSpins * 360 + delta;

      const durationMs = spinDuration * 1000;

    startTimeRef.current = performance.now();
    totalRotationRef.current = targetAngle;

    function easeOutQuint(t: number): number {
      return 1 - Math.pow(1 - t, 5);
    }

    function animate(now: number) {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / durationMs, 1);
      const easedProgress = easeOutQuint(progress);

      const currentAngle = totalRotationRef.current * easedProgress;
      const absoluteRotation = currentRotationRef.current + currentAngle;

      setRotation(absoluteRotation);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        currentRotationRef.current = absoluteRotation % 360;
        setIsSpinning(false);
        setWinner(apiResult.winner);
        setPendingWinner(null);
        setShowResult(true);


        const now2 = new Date();
        setHistory((prev) => [
          {
            id: Date.now(),
            wheelId: wheelId as string,
            result: apiResult.winner.name,
            spinTime: now2.toLocaleTimeString("vi-VN"),
          },
          ...prev.slice(0, 19),
        ]);

        setSessionId(generateSessionId());

      }
    }

    animFrameRef.current = requestAnimationFrame(animate);
    } catch(err) {
      console.error(err);
      setIsSpinning(false);
      setIsFetchingResult(false);
    }
  }, [isSpinning, participants, sessionId, spinDuration, wheelId]);

  const handleCloseResult = () => {
    setShowResult(false);
    setWinner(null);
  };

  const statusText = isFetchingResult
    ? "⏳ Kết nối hệ thống..."
    : isSpinning
    ? "⏳ Đang quay..."
    : "🎰 QUAY NGAY";

  if (isInitializing) {
    return <div className="fixed inset-0 flex flex-col items-center justify-center bg-[var(--bg-deep)] text-[var(--gold)] font-[Orbitron] text-lg sm:text-2xl animate-pulse z-50">ĐANG TẢI DỮ LIỆU TỪ MÁY CHỦ...</div>;
  }

  return (
    <>
      <div className="starfield" aria-hidden="true" />
      <div className="nebula" aria-hidden="true" />

      <div className="app-wrapper">
        <header className="top-bar flex items-center justify-between w-full h-[60px] bg-white/95 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800 backdrop-blur-md shadow-sm dark:shadow-none z-50 relative">
          <div className="logo cursor-pointer group flex items-center gap-2 shrink-0">
            <div className="logo-icon text-2xl sm:text-3xl group-hover:scale-105 transition-transform duration-300">
              🎯
            </div>
            <span className="logo-text hidden sm:block font-[Orbitron] font-black text-xl tracking-wider text-slate-800 dark:text-white drop-shadow-sm dark:drop-shadow-md">LuckyPick</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-5 shrink-0">


            <div className="duration-config flex flex-row items-center gap-2" aria-label="Cấu hình thời gian quay">
              <span className="text-xs uppercase font-extrabold text-slate-600 dark:text-slate-300 tracking-wider hidden sm:block">
                Thời gian
              </span>
              <div className="flex gap-1 sm:gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-full p-1 backdrop-blur-md">
                {SPIN_DURATIONS.map((dur) => (
                  <button
                    key={dur}
                    onClick={() => setSpinDuration(dur)}
                    className={`px-3 md:px-4 py-1 sm:py-1.5 flex items-center justify-center rounded-full text-xs sm:text-sm font-bold transition-all duration-300 ${
                      spinDuration === dur
                        ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30 scale-105"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {dur}s
                  </button>
                ))}
              </div>
            </div>

            <div className="session-badge flex items-center justify-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-full px-3 sm:px-4 py-1 sm:py-1.5 shrink-0 shadow-sm">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_#10b981] mr-2 shrink-0 animate-pulse" />
              <span className="session-label hidden sm:inline text-[10px] sm:text-xs text-slate-500 dark:text-slate-300 mr-2 uppercase font-black tracking-widest">Session</span>
              <span className="session-id text-xs sm:text-sm font-mono font-bold text-indigo-700 dark:text-indigo-400 block w-[65px] sm:w-[80px] overflow-hidden text-ellipsis whitespace-nowrap">{sessionId}</span>
            </div>

            {/* Admin area: nếu đã đăng nhập thì hiện username + logout, chưa thì hiện nút Admin nhỏ */}
            {userRole ? (
              <button
                onClick={() => { authService.logout(); setUserRole(null); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 text-indigo-600 dark:text-indigo-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all border border-indigo-200 dark:border-indigo-700/50"
                title="Đăng xuất admin"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline font-bold">{getAuth()?.username}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            ) : (
              <button
                onClick={() => window.location.href = "/login"}
                className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all border border-slate-200 dark:border-slate-700/50"
                title="Đăng nhập Admin"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </button>
            )}
          </div>
        </header>

        {/* LAYOUT MỚI: TRÁI (LỊCH SỬ) - PHẢI (VÒNG QUAY) */}
        <div className="main-content flex flex-col lg:flex-row w-full max-w-none 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 py-4 lg:py-10 gap-8 lg:gap-16 xl:gap-24 items-center lg:items-start justify-center">
          
          {/* CỘT TRÁI: NÚT QUẢN LÝ NGƯỜI DÙNG & LỊCH SỬ KẾT QUẢ */}
          <div className="flex flex-col w-full lg:w-[420px] shrink-0 gap-8 order-2 lg:order-1 z-10">
            {/* NÚT QUẢN LÝ NGƯỜI THAM GIA */}
            <button
              onClick={() => setIsManageModalOpen(true)}
              className="w-full relative overflow-hidden flex items-center justify-between transition-all duration-300 group"
              style={{
                padding: '20px 24px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(15,12,40,0.95) 0%, rgba(20,16,50,0.95) 100%)',
                border: '1px solid rgba(139,92,246,0.35)',
                boxShadow: '0 0 0 1px rgba(139,92,246,0.1), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.border = '1px solid rgba(167,139,250,0.6)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 1px rgba(139,92,246,0.2), 0 12px 40px rgba(99,102,241,0.2), inset 0 1px 0 rgba(255,255,255,0.08)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.border = '1px solid rgba(139,92,246,0.35)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 1px rgba(139,92,246,0.1), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'none';
              }}
            >
              {/* Gradient top line */}
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.6), transparent)' }} />
              {/* Shimmer hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(99,102,241,0.08) 0%, transparent 70%)' }} />

              {/* Left: icon + text */}
              <div className="relative z-10 flex items-center gap-4">
                {/* Icon box */}
                <div className="w-13 h-13 flex-shrink-0 flex items-center justify-center rounded-2xl"
                  style={{
                    width: '52px', height: '52px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    boxShadow: '0 4px 16px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
                  }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                {/* Text */}
                <div className="flex flex-col items-start">
                  <span className="font-black text-white text-base tracking-wide">
                    Quản lý người chơi
                  </span>
                  <span className="text-xs mt-0.5 font-medium" style={{ color: 'rgba(167,139,250,0.7)' }}>
                    Thêm · Sửa · Xoá danh sách
                  </span>
                </div>
              </div>

              {/* Right: số người + arrow */}
              <div className="relative z-10 flex items-center gap-3">
                <div className="flex flex-col items-center px-4 py-2 rounded-xl"
                  style={{
                    background: 'rgba(99,102,241,0.15)',
                    border: '1px solid rgba(139,92,246,0.25)',
                  }}>
                  <span className="font-black text-white text-2xl leading-none">{participants.length}</span>
                  <span className="text-[10px] font-semibold mt-0.5" style={{ color: 'rgba(167,139,250,0.7)' }}>người</span>
                </div>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" style={{ color: 'rgba(167,139,250,0.5)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>


            {/* LỊCH SỬ — TẤM BIA ĐÁ */}
            <section
              className="history-section flex-1 h-full min-h-[450px] w-full flex flex-col relative xl:max-w-md"
              style={{
                /* Màu sa thạch — lớp mặt đá */
                background: "linear-gradient(160deg, #9e8e7e 0%, #8a7a6a 25%, #7e6e5e 50%, #8c7c6c 75%, #957e6e 100%)",
                /* Cạnh đá 3D — dày như tấm đá thật */
                boxShadow: `
                  inset 0 1px 0 rgba(255,255,255,0.25),
                  inset 0 -1px 0 rgba(0,0,0,0.4),
                  inset 1px 0 0 rgba(255,255,255,0.12),
                  inset -1px 0 0 rgba(0,0,0,0.25),
                  6px 6px 0 #5a4a3a,
                  7px 7px 0 #4a3a2a,
                  8px 8px 0 #3a2a1a,
                  0 16px 40px rgba(0,0,0,0.6)
                `,
                border: "2px solid #6a5a4a",
                borderRadius: "4px",
              }}
              aria-label="Lịch sử kết quả quay thưởng"
            >
              {/* Vân đá — texture hạt đá */}
              <div className="absolute inset-0 pointer-events-none rounded"
                style={{
                  backgroundImage: `
                    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E")
                  `,
                  mixBlendMode: "multiply",
                  opacity: 0.6,
                }}
              />
              {/* Vết nứt/vân đá chéo */}
              <div className="absolute inset-0 pointer-events-none rounded"
                style={{
                  backgroundImage: "repeating-linear-gradient(73deg, transparent, transparent 8px, rgba(0,0,0,0.03) 8px, rgba(0,0,0,0.03) 9px)",
                  opacity: 0.8,
                }}
              />
              {/* Highlight mặt đá (ánh sáng từ trên) */}
              <div className="absolute inset-x-0 top-0 h-[40%] pointer-events-none rounded-t"
                style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%)" }} />

              <div className="relative z-10 p-6 lg:p-8 flex flex-col h-full">

                {/* TIÊU ĐỀ khắc chìm vào đá */}
                <div className="pb-5 mb-3 flex items-center justify-between"
                  style={{
                    borderBottom: "2px solid #6a5a48",
                    boxShadow: "0 1px 0 rgba(255,255,255,0.18)",
                  }}>
                  <h2
                    className="text-2xl lg:text-3xl font-black tracking-[0.25em] uppercase select-none"
                    style={{
                      color: "#f0ddb8",
                      textShadow:
                        "0 1px 3px rgba(0,0,0,0.8), 1px 1px 0 rgba(0,0,0,0.5), -1px -1px 0 rgba(255,220,140,0.1)",
                      fontFamily: "'Georgia', 'Times New Roman', serif",
                      letterSpacing: "0.3em",
                    }}>
                    ✦ LỊCH SỬ ✦
                  </h2>
                  {history.length > 0 && (
                    <span
                      className="text-xs font-bold px-3 py-1 tracking-widest rounded-sm"
                      style={{
                        color: "#e8c87a",
                        background: "rgba(0,0,0,0.25)",
                        textShadow: "0 1px 2px rgba(0,0,0,0.6)",
                        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3), inset 0 -1px 0 rgba(255,255,255,0.1)",
                        border: "1px solid rgba(0,0,0,0.3)",
                      }}>
                      {history.length} LƯỢT
                    </span>
                  )}
                </div>

                {/* Danh sách lịch sử — mỗi dòng như hàng chữ khắc */}
                <div className="history-list flex-1 overflow-y-auto pr-1 mt-2 space-y-1"
                  style={{ maxHeight: "calc(100vh - 350px)", minHeight: "350px" }}>
                  {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4">
                      <div className="text-5xl opacity-25 select-none">⬛</div>
                      <p
                        className="uppercase tracking-[0.3em] text-sm font-bold select-none"
                        style={{
                          color: "#d4b896",
                          textShadow: "0 1px 2px rgba(0,0,0,0.7), 1px 1px 0 rgba(0,0,0,0.4)",
                          fontFamily: "'Georgia', serif",
                        }}>
                        — CHƯA CÓ DỮ LIỆU —
                      </p>
                    </div>
                  ) : (
                    history.map((entry, i) => {
                      const idx = participants.findIndex(p => p.name === entry.result);
                      const color = idx !== -1 ? SEGMENT_COLORS[idx % SEGMENT_COLORS.length] : "#8a7a6a";
                      return (
                        <div
                          key={entry.id}
                          className="history-item flex items-center gap-3 px-3 py-2.5"
                          style={{
                            /* Mỗi dòng như rãnh khắc phẳng */
                            borderBottom: "1px solid rgba(0,0,0,0.15)",
                            boxShadow: "0 1px 0 rgba(255,255,255,0.18)",
                          }}>
                          {/* Số thứ tự — chữ khắc */}
                          <span
                            className="text-xs shrink-0 w-7 text-center font-bold select-none"
                            style={{
                              color: "#c8a878",
                              textShadow: "0 1px 2px rgba(0,0,0,0.7), 1px 1px 0 rgba(0,0,0,0.4)",
                              fontFamily: "'Georgia', serif",
                            }}>
                            {history.length - i}
                          </span>
                          {/* Dấu màu */}
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{
                              background: color,
                              boxShadow: `0 1px 2px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)`,
                            }} />
                          {/* Tên — chữ khắc lõm */}
                          <span
                            className="flex-1 truncate text-sm font-bold uppercase tracking-widest select-none"
                            style={{
                              color: "#f0ddb8",
                              textShadow: "0 1px 3px rgba(0,0,0,0.8), 1px 1px 0 rgba(0,0,0,0.5), -1px -1px 0 rgba(255,200,100,0.1)",
                              fontFamily: "'Georgia', 'Times New Roman', serif",
                            }}>
                            {entry.result}
                          </span>
                          {/* Thời gian */}
                          <span
                            className="shrink-0 text-[10px] font-mono select-none"
                            style={{
                              color: "#b89a6a",
                              textShadow: "0 1px 2px rgba(0,0,0,0.6)",
                            }}>
                            {entry.spinTime}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>

          </div>

          {/* CỘT PHẢI: VÒNG QUAY */}
          <div className="flex-1 w-full flex flex-col items-center justify-center order-1 lg:order-2 lg:self-start lg:mt-0 mt-4">

            <section
              className="wheel-section relative -mt-4"
              aria-label="Khu vực vòng quay bốc thăm"
            >
              {participants.length > 20 ? (
                /* SLOT MACHINE MODE */
                <SlotMachineSpinner
                  participants={participants}
                  isSpinning={isSpinning}
                  targetWinner={pendingWinner}
                  spinDuration={spinDuration}
                  onSpinClick={executeSpin}
                  disabled={isSpinning || participants.length < 2}
                  isFetchingResult={isFetchingResult}
                />
              ) : (
                /* WHEEL MODE (≤15 người) */
                <div className="wheel-outer-wrapper">
                  {/* Đã xóa wheel-glow-ring */}
                  <div className="wheel-container">
                    {/* Right Pointer - Bắn từ ngoài (bên phải) vào trong */}
                    <div 
                      className="absolute top-1/2 z-[15]" 
                      style={{ 
                        right: '-25px', 
                        transform: 'translateY(-50%) scaleX(-1)', 
                        pointerEvents: 'none',
                        userSelect: 'none',
                        width: '65px',
                        height: '34px'
                      }}
                    >
                      <svg width="65" height="34" viewBox="0 0 100 50" style={{ pointerEvents: 'none' }}>
                        <defs>
                          <linearGradient id="pointerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fff8dc" />
                            <stop offset="25%" stopColor="#ffd700" />
                            <stop offset="55%" stopColor="#b8860b" />
                            <stop offset="80%" stopColor="#daa520" />
                            <stop offset="100%" stopColor="#8b6914" />
                          </linearGradient>
                          <filter id="pointerShadow" x="-10%" y="-20%" width="120%" height="140%">
                            <feDropShadow dx="1" dy="1" stdDeviation="2" floodColor="#00000066" />
                          </filter>
                        </defs>
                        <path
                          d="M0,0 L100,25 L0,50 Q12,25 0,0 Z"
                          fill="url(#pointerGrad)"
                          stroke="#a0720a"
                          strokeWidth="1.5"
                          filter="url(#pointerShadow)"
                        />
                        {/* Highlight trên */}
                        <path
                          d="M0,0 L100,25 L60,15 Q8,8 0,0 Z"
                          fill="rgba(255,255,255,0.28)"
                          stroke="none"
                        />
                      </svg>
                    </div>

                    {/* Đã xóa hiệu ứng hover lệch trục 3D ở phần CSS */}
                    <div className={`wheel-3d ${isSpinning ? "spinning" : ""}`}>
                      <div className="wheel-rim" />
                      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
                        const rad = (angle * Math.PI) / 180;
                        const cx = 50 + 47.5 * Math.cos(rad);
                        const cy = 50 + 47.5 * Math.sin(rad);
                        return (
                          <div
                            key={angle}
                            className="wheel-bolt"
                            style={{
                              left: `${cx}%`,
                              top: `${cy}%`,
                              transform: "translate(-50%,-50%)",
                            }}
                          />
                        );
                      })}

                      <SpinWheelSVG
                        participants={participants}
                        rotation={rotation}
                        isSpinning={isSpinning}
                      />

                      <button
                        className="wheel-center-btn flex flex-col items-center justify-center font-[Orbitron] font-black text-white"
                        onClick={executeSpin}
                        disabled={isSpinning || participants.length < 2}
                        title="Quay!"
                        aria-label="Nhấn để quay"
                      >
                        {isFetchingResult ? (
                          <span className="text-[16px] animate-pulse">Wait</span>
                        ) : isSpinning ? (
                          <span className="text-[20px] animate-pulse text-indigo-200">...</span>
                        ) : (
                          <span className="text-[24px] tracking-widest text-white drop-shadow-md leading-none ml-1">QUAY</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>

          </div>
        </div>
      </div>



      {/* MODAL: QUẢN LÝ NGƯỜI CHƠI - PREMIUM REDESIGN */}
      {isManageModalOpen && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6"
          style={{ background: 'rgba(4,4,16,0.85)', backdropFilter: 'blur(20px)' }}
          onClick={() => setIsManageModalOpen(false)}
        >
          <div
            className="relative w-full max-w-xl flex flex-col rounded-3xl overflow-hidden animate-[card-pop_0.3s_ease-out] shadow-2xl"
            style={{
              background: 'linear-gradient(160deg, #0f0c29 0%, #141130 50%, #0f0c29 100%)',
              border: '1px solid rgba(139,92,246,0.3)',
              boxShadow: '0 0 0 1px rgba(139,92,246,0.1), 0 40px 80px rgba(0,0,0,0.7), 0 0 60px rgba(99,102,241,0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top gradient bar */}
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899, #a855f7, #6366f1)', backgroundSize: '200%' }} />

            {/* Modal Header */}
            <div className="px-6 md:px-8 pt-6 pb-5 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid rgba(139,92,246,0.15)' }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.3))', border: '1px solid rgba(139,92,246,0.4)' }}>
                  👥
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-white tracking-wide font-[Orbitron]">
                    Người Chơi
                  </h2>
                  <p className="text-xs text-indigo-300/60 font-medium mt-0.5">{participants.length} thành viên đã đăng ký</p>
                </div>
              </div>
              <button
                onClick={() => setIsManageModalOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full text-indigo-300 hover:text-white transition-colors text-lg font-bold"
                style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}
                title="Đóng"
              >
                ✕
              </button>
            </div>

            {/* Add participant input */}
            <div className="px-6 md:px-8 py-5 shrink-0" style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
              <div className="flex gap-3 rounded-2xl p-2 pl-4" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Nhập tên người tham dự..."
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddParticipant(); }}
                  maxLength={30}
                  className="flex-1 bg-transparent border-none text-white placeholder-indigo-400/40 outline-none font-medium text-[15px] py-2"
                />
                <button
                  onClick={handleAddParticipant}
                  disabled={!inputName.trim()}
                  className="px-5 py-2.5 rounded-xl font-black text-[14px] tracking-wide transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white', boxShadow: '0 4px 15px rgba(99,102,241,0.4)' }}
                >
                  + Thêm
                </button>
              </div>
            </div>

            {/* Participant list */}
            <div className="flex-1 overflow-y-auto px-6 md:px-8 py-4 space-y-2" style={{ maxHeight: '45vh' }}>
              {participants.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                  <span className="text-5xl opacity-30">🫙</span>
                  <p className="text-indigo-300/40 font-semibold">Danh sách đang trống</p>
                  <p className="text-indigo-400/30 text-sm">Thêm người để bắt đầu quay thưởng</p>
                </div>
              ) : (
                participants.map((p, i) => (
                  <div
                    key={p.id}
                    className="group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all"
                    style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.12)')}
                  >
                    {/* Avatar số */}
                    <div
                      className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-[13px] font-black text-white"
                      style={{ background: SEGMENT_COLORS[i % SEGMENT_COLORS.length], boxShadow: `0 0 12px ${SEGMENT_COLORS[i % SEGMENT_COLORS.length]}60` }}
                    >
                      {i + 1}
                    </div>
                    <input
                      value={p.name}
                      onChange={(e) => handleUpdateName(p.id, e.target.value)}
                      className="flex-1 bg-transparent border-none outline-none text-[15px] font-semibold text-white/90 focus:text-white transition-colors"
                      maxLength={30}
                      title="Nhấn để sửa tên"
                    />
                    <button
                      onClick={() => handleRemove(p.id)}
                      className="opacity-0 group-hover:opacity-100 w-8 h-8 shrink-0 flex items-center justify-center rounded-lg transition-all text-red-400 hover:text-white hover:bg-red-500"
                      title="Xóa"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-6 md:px-8 py-5 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3" style={{ borderTop: '1px solid rgba(139,92,246,0.15)', background: 'rgba(10,8,30,0.6)' }}>
              {/* Preset input — ADMIN only */}
              {userRole === "ADMIN" && (
                <div className="flex items-center gap-2 flex-1 rounded-xl px-4 py-2.5" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <span className="text-indigo-400 text-sm shrink-0">🎯</span>
                  <input
                    type="text"
                    placeholder="Ép kết quả (bỏ trống = ngẫu nhiên)..."
                    value={presetResult}
                    onChange={(e) => setPresetResult(e.target.value)}
                    className="bg-transparent border-none text-[14px] text-indigo-200 placeholder-indigo-400/30 outline-none w-full font-medium"
                  />
                </div>
              )}
              <button
                onClick={async () => {
                  if (wheelId) {
                    await wheelService.updateWheelItems(wheelId, participants.map(p => p.name));
                    if (userRole === "ADMIN") {
                      if (presetResult.trim()) {
                        await wheelService.setWheelPreset(wheelId, presetResult.trim());
                      } else {
                        try { await wheelService.clearWheelPreset(wheelId) } catch(e){}
                      }
                    }
                  }
                  setIsManageModalOpen(false);
                }}
                className="shrink-0 px-8 py-3 rounded-xl font-black text-[14px] tracking-widest text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}
              >
                LƯU & ĐÓNG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP KẾT QUẢ */}
      {showResult && winner && (
        <div
          className="result-overlay fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}
          onClick={handleCloseResult}
        >
          {/* Confetti góc dưới trái */}
          <div className="fixed bottom-0 left-0 pointer-events-none" style={{ zIndex: 201 }}>
            {[...Array(18)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                bottom: 0,
                left: `${Math.random() * 220}px`,
                width: `${6 + Math.random() * 8}px`,
                height: `${6 + Math.random() * 8}px`,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                background: ['#f59e0b','#10b981','#6366f1','#ec4899','#f97316','#a855f7','#3b82f6','#22d3ee'][i % 8],
                animation: `confetti-rise ${1.2 + Math.random() * 1.5}s ease-out ${Math.random() * 0.4}s both`,
              }} />
            ))}
          </div>
          {/* Confetti góc dưới phải */}
          <div className="fixed bottom-0 right-0 pointer-events-none" style={{ zIndex: 201 }}>
            {[...Array(18)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                bottom: 0,
                right: `${Math.random() * 220}px`,
                width: `${6 + Math.random() * 8}px`,
                height: `${6 + Math.random() * 8}px`,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                background: ['#f59e0b','#10b981','#6366f1','#ec4899','#f97316','#a855f7','#3b82f6','#22d3ee'][(i + 3) % 8],
                animation: `confetti-rise ${1.2 + Math.random() * 1.5}s ease-out ${Math.random() * 0.4}s both`,
              }} />
            ))}
          </div>

          <style>{`
            @keyframes confetti-rise {
              0%   { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
              60%  { opacity: 1; }
              100% { transform: translateY(-85vh) rotate(${Math.random() > 0.5 ? '' : '-'}720deg) scale(0.3); opacity: 0; }
            }
            @keyframes winner-pop {
              0%   { transform: scale(0.6); opacity: 0; }
              70%  { transform: scale(1.04); }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes name-glow {
              0%, 100% { text-shadow: 0 0 20px rgba(167,139,250,0.8), 0 0 40px rgba(99,102,241,0.4); }
              50%       { text-shadow: 0 0 40px rgba(167,139,250,1), 0 0 80px rgba(99,102,241,0.8), 0 0 120px rgba(236,72,153,0.4); }
            }
          `}</style>

          <div
            className="result-card w-full relative overflow-hidden"
            style={{
              maxWidth: '680px',
              borderRadius: '28px',
              background: 'linear-gradient(160deg, #0d0b1e 0%, #0f0c29 50%, #120e30 100%)',
              border: '1px solid rgba(139,92,246,0.4)',
              boxShadow: '0 0 0 1px rgba(139,92,246,0.15), 0 40px 100px rgba(0,0,0,0.9), 0 0 60px rgba(99,102,241,0.15)',
              animation: 'winner-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
              padding: '48px 48px 40px',
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Gradient top bar */}
            <div className="absolute top-0 left-0 right-0 h-1"
              style={{ background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899, #a855f7, #6366f1)' }} />

            {/* Glow bg */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.18) 0%, transparent 70%)' }} />

            <div className="relative z-10 flex flex-col items-center text-center">
              {/* Trophy emoji */}
              <div style={{ fontSize: '72px', lineHeight: 1, marginBottom: '16px', animation: 'bounce 1s infinite' }}>🏆</div>

              {/* Label */}
              <p className="text-xs font-black tracking-[0.4em] uppercase mb-3"
                style={{ color: '#a78bfa', letterSpacing: '0.35em' }}>
                ✦ CHÚC MỪNG NGƯỜI CHIẾN THẮNG ✦
              </p>

              {/* Tên người thắng */}
              <h2
                className="font-black uppercase mb-6"
                style={{
                  fontSize: 'clamp(2.5rem, 7vw, 4.5rem)',
                  lineHeight: 1.1,
                  fontFamily: "'Orbitron', monospace",
                  background: 'linear-gradient(135deg, #c4b5fd 0%, #f0abfc 40%, #fff 60%, #a5f3fc 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'name-glow 2s ease-in-out infinite',
                  wordBreak: 'break-word',
                }}
              >
                {winner.name}
              </h2>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-4">
                <button
                  onClick={() => { setShowResult(false); executeSpin(); }}
                  className="flex-1 sm:flex-none px-12 py-5 rounded-2xl font-black text-base tracking-widest text-white transition-all hover:opacity-90 hover:scale-105 active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                    boxShadow: '0 4px 24px rgba(99,102,241,0.5)',
                    fontFamily: "'Orbitron', monospace",
                  }}>
                  🔄 QUAY TIẾP
                </button>
                <button
                  onClick={handleCloseResult}
                  className="flex-1 sm:flex-none px-12 py-5 rounded-2xl font-black text-base tracking-widest transition-all hover:opacity-80"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.6)',
                    fontFamily: "'Orbitron', monospace",
                  }}>
                  ĐÓNG
                </button>
              </div>
            </div>

            {/* Session ID — góc dưới trái */}
            <div className="absolute bottom-5 left-6 flex items-center gap-2 opacity-70">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-mono font-bold text-slate-300 tracking-wider">
                Phiên: {sessionId}
              </span>
            </div>
            {/* Thời gian — góc dưới phải */}
            <div className="absolute bottom-5 right-6 opacity-70">
              <span className="text-xs font-mono text-slate-300">
                {new Date().toLocaleTimeString("vi-VN")}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADMIN LOGIN INLINE */}
      {isAdminLoginOpen && (
        <AdminLoginModal
          onSuccess={(role) => { setUserRole(role); setIsAdminLoginOpen(false); }}
          onClose={() => setIsAdminLoginOpen(false)}
        />
      )}
    </>
  );
}
