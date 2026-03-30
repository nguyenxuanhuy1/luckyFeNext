"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { wheelService, SpinHistoryResponse, Wheel, WheelSummary, getAuth, authService } from "@/services/api";

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
  "#6366f1", "#a855f7", "#ec4899", "#22d3ee",
  "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6",
  "#06b6d4", "#84cc16", "#fb923c", "#e879f9",
];

const LIGHT_COLORS = [
  "#c7d2fe", "#e9d5ff", "#fbcfe8", "#a5f3fc",
  "#6ee7b7", "#fde68a", "#fecaca", "#ddd6fe",
  "#7dd3fc", "#d9f99d", "#fed7aa", "#f5d0fe",
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
   CONFETTI
   ============================ */
function ConfettiEffect({ active }: { active: boolean }) {
  const colors = ["#ffd700","#a78bfa","#67e8f9","#f9a8d4","#6ee7b7","#fca5a5","#fff","#fdba74"];
  if (!active) return null;
  return (
    <div className="confetti-container" aria-hidden="true">
      {Array.from({ length: 80 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.6;
        const duration = 2.5 + Math.random() * 2.5;
        const drift = (Math.random() - 0.5) * 220;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 5 + Math.random() * 10;
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
              borderRadius: isCircle ? "50%" : "3px",
              // @ts-expect-error CSS custom property
              "--drift": `${drift}px`,
            }}
          />
        );
      })}
    </div>
  );
}

/* ============================
   SPIN WHEEL SVG
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
  const innerR = 58;

  if (count === 0) {
    return (
      <svg viewBox={`0 0 ${size} ${size}`} className="spin-wheel" style={{ pointerEvents: "none" }}>
        <circle cx={cx} cy={cy} r={r} fill="rgba(99,102,241,0.08)" stroke="rgba(139,92,246,0.3)" strokeWidth="2" />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="rgba(200,195,255,0.35)" fontSize="22" fontFamily="Inter,sans-serif">
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
        style={{ transform: `rotate(${rotation}deg)`, pointerEvents: "none" }}
      >
        <circle cx={cx} cy={cy} r={r} fill={SEGMENT_COLORS[0]} />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="26" fontFamily="Inter,sans-serif" fontWeight="bold">
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

    const midAngleDeg = (i + 0.5) * segmentAngle;
    const midAngle = (midAngleDeg * Math.PI) / 180;

    // Determine if the text is in the "upside-down" zone (right half = 270..360 + 0..90 is fine;
    // left half where rotation would flip text = 90..270 degrees)
    // Since SVG 0° is at 3 o'clock and we want text always readable:
    // Text anchor logic:
    //   For segments where midAngleDeg in [90, 270) → text reads from OUTER edge inward (anchor=end, flip rotation by 180)
    //   Otherwise → text reads from INNER edge outward (anchor=start)
    const isFlipped = midAngleDeg > 90 && midAngleDeg <= 270;

    const textMidR = (innerR + r) / 2 + 8; // middle of the segment radially
    const tx = cx + textMidR * Math.cos(midAngle);
    const ty = cy + textMidR * Math.sin(midAngle);
    // Rotation: always along the segment radius; flip 180° for lower-half segments
    const textRotation = isFlipped ? midAngleDeg + 180 : midAngleDeg;

    const maxLen = Math.max(3, Math.floor(segmentAngle / 4.5));
    const displayName = p.name.length > maxLen ? p.name.slice(0, maxLen - 1) + "…" : p.name;

    // Decorative dot at outer edge
    const edgeDotR = r - 10;
    const edgeX = cx + edgeDotR * Math.cos(midAngle);
    const edgeY = cy + edgeDotR * Math.sin(midAngle);

    return {
      path, tx, ty, textRotation, displayName, isFlipped,
      color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
      lightColor: LIGHT_COLORS[i % LIGHT_COLORS.length],
      edgeX, edgeY, i,
    };
  });

  const fontSize = count > 16 ? 11 : count > 12 ? 13 : count > 8 ? 17 : count > 5 ? 20 : 23;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={`spin-wheel ${isSpinning ? "is-spinning" : ""}`}
      style={{ transform: `rotate(${rotation}deg)`, pointerEvents: "none" }}
    >
      <defs>
        {segments.map((seg) => (
          <radialGradient key={`grad-${seg.i}`} id={`seg-grad-${seg.i}`} cx="45%" cy="35%" r="65%">
            <stop offset="0%" stopColor={seg.lightColor} stopOpacity="0.55" />
            <stop offset="100%" stopColor={seg.color} stopOpacity="1" />
          </radialGradient>
        ))}
        {/* Separator gradient */}
        <linearGradient id="sep-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(0,0,0,0)" />
          <stop offset="50%" stopColor="rgba(0,0,0,0.4)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>
      </defs>

      {/* Segments */}
      {segments.map((seg) => (
        <g key={seg.i}>
          <path d={seg.path} fill={`url(#seg-grad-${seg.i})`} stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" />
          {/* Highlight overlay */}
          <path d={seg.path} fill="url(#highlight-overlay)" />
          {/* Edge dot */}
          <circle cx={seg.edgeX} cy={seg.edgeY} r="5" fill="rgba(255,255,255,0.6)" />
          <circle cx={seg.edgeX} cy={seg.edgeY} r="3" fill="rgba(255,255,255,0.9)" />
        </g>
      ))}

      {/* Highlight overlay */}
      <defs>
        <radialGradient id="highlight-overlay" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="70%" stopColor="rgba(255,255,255,0.03)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
      {/* Inner ring */}
      <circle cx={cx} cy={cy} r={innerR + 3} fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="2" />

      {/* Labels — always readable, text is centered on the segment midpoint */}
      {segments.map((seg) => (
        <text
          key={`txt-${seg.i}`}
          x={seg.tx}
          y={seg.ty}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#ffffff"
          fontSize={fontSize}
          fontFamily="Inter,sans-serif"
          fontWeight="800"
          transform={`rotate(${seg.textRotation}, ${seg.tx}, ${seg.ty})`}
          style={{
            paintOrder: "stroke fill",
            stroke: "rgba(0,0,0,0.6)",
            strokeWidth: "3.5px",
          }}
        >
          {seg.displayName}
        </text>
      ))}

      {/* Center hub */}
      <circle cx={cx} cy={cy} r={innerR} fill="rgba(10,8,26,0.7)" stroke="rgba(0,0,0,0.5)" strokeWidth="2" />
    </svg>
  );
}

/* ============================
   SLOT MACHINE SPINNER
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
    const idx = participants.findIndex((x) => x.id === p.id);
    return idx >= 0 ? SEGMENT_COLORS[idx % SEGMENT_COLORS.length] : "#6366f1";
  };

  useEffect(() => {
    if (!isSpinning || !targetWinner) return;
    const extraCount = Math.max(35, Math.round(spinDuration * 7));
    const list: Participant[] = [];
    for (let i = 0; i < extraCount; i++) list.push(participants[i % participants.length]);
    list.push(targetWinner);
    for (let i = 1; i <= CENTER_IDX + 1; i++) list.push(participants[(extraCount + i) % participants.length]);

    setItems(list);
    setOffset(0);

    const finalOffset = -((extraCount - CENTER_IDX) * ITEM_H);
    const startTime = performance.now();
    const durationMs = spinDuration * 1000;

    function easeOut(t: number) { return 1 - Math.pow(1 - t, 5); }
    function animate(now: number) {
      const progress = Math.min((now - startTime) / durationMs, 1);
      setOffset(finalOffset * easeOut(progress));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isSpinning, targetWinner, spinDuration, participants, CENTER_IDX]);

  const displayItems = items.length > 0 ? items : [...participants, ...participants].slice(0, VISIBLE + 2);
  const frameH = ITEM_H * VISIBLE;

  return (
    <div className="flex flex-col items-center w-full max-w-[520px]">
      <div
        className="relative w-full rounded-[28px] overflow-hidden"
        style={{
          background: "linear-gradient(160deg, rgba(12,9,30,0.97) 0%, rgba(18,13,45,0.97) 100%)",
          border: "1px solid rgba(139,92,246,0.35)",
          boxShadow: "0 0 60px rgba(99,102,241,0.15), 0 30px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Top gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, #6366f1, #a855f7, #ec4899)" }} />

        {/* Status bar */}
        <div className="flex items-center justify-between px-6 py-3" style={{ borderBottom: "1px solid rgba(139,92,246,0.15)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#6366f1", boxShadow: "0 0 8px #6366f1" }} />
            <span style={{ fontFamily: "'Orbitron',monospace", fontSize: "10px", fontWeight: 700, color: "rgba(129,140,248,0.7)", letterSpacing: "0.15em", textTransform: "uppercase" }}>DRUM SPIN</span>
          </div>
          <span style={{ fontFamily: "'Orbitron',monospace", fontSize: "10px", fontWeight: 600, color: "rgba(139,92,246,0.5)", letterSpacing: "0.12em" }}>{participants.length} PLAYERS</span>
        </div>

        {/* Drum viewport */}
        <div className="relative mx-5 my-4 rounded-2xl overflow-hidden" style={{ height: frameH, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(139,92,246,0.12)" }}>
          {/* Top/bottom fades */}
          <div className="absolute inset-x-0 top-0 z-10 pointer-events-none" style={{ height: ITEM_H * 2, background: "linear-gradient(to bottom, rgba(12,9,30,0.98) 0%, transparent 100%)" }} />
          <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none" style={{ height: ITEM_H * 2, background: "linear-gradient(to top, rgba(12,9,30,0.98) 0%, transparent 100%)" }} />

          {/* Center highlight band */}
          <div className="absolute inset-x-0 z-10 pointer-events-none" style={{ top: CENTER_IDX * ITEM_H, height: ITEM_H, background: "rgba(99,102,241,0.08)", borderTop: "1.5px solid rgba(139,92,246,0.5)", borderBottom: "1.5px solid rgba(139,92,246,0.5)", boxShadow: "inset 0 0 30px rgba(99,102,241,0.08)" }} />
          {/* Arrow ticks */}
          <div className="absolute left-0 z-20 pointer-events-none" style={{ top: CENTER_IDX * ITEM_H + ITEM_H / 2 - 9, width: 0, height: 0, borderTop: "9px solid transparent", borderBottom: "9px solid transparent", borderLeft: "11px solid rgba(139,92,246,0.65)" }} />
          <div className="absolute right-0 z-20 pointer-events-none" style={{ top: CENTER_IDX * ITEM_H + ITEM_H / 2 - 9, width: 0, height: 0, borderTop: "9px solid transparent", borderBottom: "9px solid transparent", borderRight: "11px solid rgba(139,92,246,0.65)" }} />

          {/* Names */}
          <div style={{ transform: `translateY(${offset}px)`, willChange: "transform" }}>
            {displayItems.map((p, i) => {
              const color = getColor(p);
              return (
                <div key={i} className="flex items-center justify-center gap-4 px-10" style={{ height: ITEM_H }}>
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 10px ${color}90` }} />
                  <span className="font-black text-[21px] tracking-wide text-white/90 truncate max-w-[350px]" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.9)", fontFamily: "Inter, sans-serif" }}>
                    {p.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Spin button */}
        <div className="px-5 pb-5">
          <button
            className="relative w-full overflow-hidden flex items-center justify-center gap-3 font-black text-white rounded-2xl transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              height: "54px",
              background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
              boxShadow: "0 6px 25px rgba(99,102,241,0.45)",
              fontSize: "16px",
              letterSpacing: "0.18em",
              fontFamily: "'Orbitron', monospace",
            }}
            onClick={onSpinClick}
            disabled={disabled}
          >
            <div className="absolute inset-0 bg-[linear-gradient(105deg,transparent_30%,rgba(255,255,255,0.12)_50%,transparent_70%)] translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
            {isFetchingResult ? (
              <span className="animate-pulse text-[13px]">⏳ KẾT NỐI...</span>
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
   ADMIN LOGIN MODAL
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      className="modal-overlay"
      onClick={onClose}
    >
      <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Top bar */}
        <div className="h-[2px] w-full" style={{ background: "linear-gradient(90deg,#6366f1,#a855f7,#ec4899)" }} />

        <div className="px-7 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(139,92,246,0.35)" }}>
                🔐
              </div>
              <div>
                <h2 className="text-white font-black text-base tracking-wide">Admin Login</h2>
                <p style={{ color: "rgba(192,132,252,0.5)", fontSize: "12px", marginTop: "2px" }}>Chỉ dành cho quản trị viên</p>
              </div>
            </div>
            <button onClick={onClose} className="modal-close-btn">✕</button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="admin-form-field">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(139,92,246,0.6)" strokeWidth="2" strokeLinecap="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              <input type="text" placeholder="Tên đăng nhập" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" />
            </div>

            <div className="admin-form-field">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(139,92,246,0.6)" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input type={showPass ? "text" : "password"} placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
              <button type="button" onClick={() => setShowPass((v) => !v)} style={{ color: "rgba(139,92,246,0.5)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                {showPass
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>

            {error && <p style={{ color: "#f87171", fontSize: "12px", padding: "0 4px", fontWeight: 600 }}>{error}</p>}

            <button type="submit" disabled={loading}
              className="mt-1 py-3 rounded-xl font-black text-[13px] tracking-widest text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)", boxShadow: "0 4px 20px rgba(99,102,241,0.4)", fontFamily: "'Orbitron', monospace" }}
            >
              {loading ? <span className="animate-pulse">Đang đăng nhập...</span> : "ĐĂNG NHẬP"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ============================
   ADMIN WHEEL PANEL
   ============================ */
function AdminWheelPanel({
  currentWheelId,
  onSelectWheel,
}: {
  currentWheelId: string | number | null;
  onSelectWheel: (wheel: WheelSummary) => void;
}) {
  const [open, setOpen] = useState(false);
  const [wheels, setWheels] = useState<WheelSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [wheelDetails, setWheelDetails] = useState<Record<string | number, Wheel>>({});
  const [loadingDetail, setLoadingDetail] = useState<string | number | null>(null);
  const [presetInputs, setPresetInputs] = useState<Record<string | number, string>>({})
  const [saving, setSaving] = useState<string | number | null>(null);
  const [msg, setMsg] = useState<{ id: string | number; text: string; ok: boolean } | null>(null);
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [copiedName, setCopiedName] = useState<string | null>(null);
  const [itemSearch, setItemSearch] = useState<Record<string | number, string>>({});
  const [itemSearchOpen, setItemSearchOpen] = useState<Record<string | number, boolean>>({});

  const load = async () => {
    setLoading(true);
    try {
      const data = await wheelService.getWheels(0, 10);
      setWheels(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  // Fetch chi tiết 1 wheel (có items), cache lại
  const fetchDetail = async (id: string | number) => {
    if (wheelDetails[id]) {
      setExpandedId(expandedId === id ? null : id);
      return;
    }
    setLoadingDetail(id);
    setExpandedId(id);
    try {
      const detail = await wheelService.getWheelDetail(id);
      setWheelDetails(prev => ({ ...prev, [id]: detail }));
    } catch { /* ignore */ }
    setLoadingDetail(null);
  };

  // Search by ID: nếu nhập số thuần tú → fetch detail trực tiếp
  const handleSearch = async (val: string) => {
    setSearch(val);
    const trimmed = val.trim();
    if (/^\d+$/.test(trimmed) && !wheels.find(w => String(w.id) === trimmed)) {
      try {
        const detail = await wheelService.getWheelDetail(trimmed);
        setWheelDetails(prev => ({ ...prev, [detail.id]: detail }));
        // Chèn vào list nếu chưa có
        setWheels(prev => prev.find(w => w.id === detail.id) ? prev : [detail, ...prev]);
      } catch { /* không tìm thấy */ }
    }
  };

  useEffect(() => { if (open) load(); }, [open]);

  const filtered = wheels.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    String(w.id).includes(search)
  );

  const handleSetPreset = async (wheel: WheelSummary) => {
    const val = (presetInputs[wheel.id] ?? "").trim();
    setSaving(wheel.id);
    try {
      if (val) {
        await wheelService.setWheelPreset(wheel.id, val);
        setMsg({ id: wheel.id, text: `✓ Đã chèn "${val}"`, ok: true });
      } else {
        await wheelService.clearWheelPreset(wheel.id);
        setMsg({ id: wheel.id, text: "✓ Đã xoá preset", ok: true });
      }
      await load();
    } catch {
      setMsg({ id: wheel.id, text: "✗ Lỗi, thử lại", ok: false });
    }
    setSaving(null);
    setTimeout(() => setMsg(null), 3000);
  };


  return (
    <>
      {/* Float button */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Quản lý vòng quay (Admin)"
        style={{
          position: "fixed",
          bottom: "1.75rem",
          right: "1.75rem",
          zIndex: 900,
          width: 54,
          height: 54,
          borderRadius: "50%",
          background: open
            ? "linear-gradient(135deg,#f43f5e,#a855f7)"
            : "linear-gradient(135deg,#6366f1,#a855f7)",
          border: "2px solid rgba(255,255,255,0.15)",
          boxShadow: "0 8px 32px rgba(99,102,241,0.55), 0 2px 8px rgba(0,0,0,0.5)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.5rem",
          transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          transform: open ? "rotate(45deg) scale(1.05)" : "rotate(0deg) scale(1)",
        }}
      >
        {open ? "✕" : "⚙"}
      </button>

      {/* Slide panel */}
      <div
        style={{
          position: "fixed",
          bottom: "5.5rem",
          right: open ? "1.75rem" : "-420px",
          zIndex: 899,
          width: 380,
          maxWidth: "calc(100vw - 2rem)",
          maxHeight: "70vh",
          borderRadius: 20,
          background: "linear-gradient(160deg,rgba(10,8,26,0.97) 0%,rgba(18,13,45,0.97) 100%)",
          border: "1px solid rgba(139,92,246,0.35)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 40px rgba(99,102,241,0.15)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: "right 0.35s cubic-bezier(0.34,1.2,0.64,1), opacity 0.25s",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "all" : "none",
        }}
      >
        {/* Top bar */}
        <div style={{ height: 2, background: "linear-gradient(90deg,#6366f1,#a855f7,#ec4899)", flexShrink: 0 }} />

        {/* Header */}
        <div style={{ padding: "1rem 1.25rem 0.75rem", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.75rem" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0, boxShadow: "0 0 16px rgba(99,102,241,0.5)" }}>⚙</div>
            <div>
              <div style={{ fontFamily: "'Orbitron',monospace", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.12em", color: "#c4b5fd" }}>QUẢN LÝ VÒNG QUAY</div>
              <div style={{ fontSize: "0.68rem", color: "rgba(192,132,252,0.5)", marginTop: 2 }}>{wheels.length} vòng quay · Admin only</div>
            </div>
            <button onClick={load} title="Làm mới" style={{ marginLeft: "auto", width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(192,132,252,0.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", transition: "all 0.2s" }}>↻</button>
          </div>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(139,92,246,0.5)" strokeWidth="2" strokeLinecap="round" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc ID..."
              style={{ width: "100%", paddingLeft: 30, paddingRight: 12, paddingTop: 7, paddingBottom: 7, borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(139,92,246,0.2)", color: "#e2d9f3", fontSize: "0.78rem", outline: "none", fontFamily: "Inter,sans-serif" }}
            />
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0.6rem" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "rgba(192,132,252,0.4)", fontSize: "0.78rem" }}>Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "rgba(192,132,252,0.3)", fontSize: "0.78rem" }}>Không có vòng quay nào</div>
          ) : (
            filtered.map((wheel) => {
              const isActive = wheel.id === currentWheelId;
              const presetVal = presetInputs[wheel.id] ?? (wheel.preset ?? "");
              const isSaving = saving === wheel.id;
              const wheelMsg = msg?.id === wheel.id ? msg : null;
              return (
                <div
                  key={wheel.id}
                  style={{
                    borderRadius: 13,
                    marginBottom: "0.45rem",
                    background: isActive ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.03)",
                    border: isActive ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(255,255,255,0.05)",
                    overflow: "hidden",
                    transition: "all 0.2s",
                  }}
                >
                  {/* Wheel info row */}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.6rem 0.75rem", cursor: "pointer" }}
                    onClick={() => fetchDetail(wheel.id)}
                  >
                    {/* ID badge — click = load wheel vào giao diện */}
                    <div
                      onClick={(e) => { e.stopPropagation(); onSelectWheel(wheel); }}
                      title="Tải vòng quay này vào giao diện"
                      style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontFamily: "'Orbitron',monospace", fontWeight: 700, color: "#fff", flexShrink: 0, cursor: "pointer", boxShadow: "0 0 10px rgba(99,102,241,0.4)" }}
                    >
                      {String(wheel.id).slice(-2)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.82rem", color: isActive ? "#c4b5fd" : "#e2d9f3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{wheel.name}</div>
                      <div style={{ fontSize: "0.65rem", color: "rgba(192,132,252,0.45)", marginTop: 1 }}>
                        {wheelDetails[wheel.id] ? `${wheelDetails[wheel.id].items.length} người` : "···"} · ID #{wheel.id} <span style={{ color: "rgba(139,92,246,0.5)" }}>{expandedId === wheel.id ? "▲" : "▼"}</span>
                      </div>
                    </div>
                    {wheel.preset && (
                      <span style={{ fontSize: "0.62rem", fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: "rgba(251,146,60,0.15)", border: "1px solid rgba(251,146,60,0.35)", color: "#fb923c", whiteSpace: "nowrap" }}>🎯 {wheel.preset}</span>
                    )}
                    {isActive && (
                      <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399", whiteSpace: "nowrap" }}>● Live</span>
                    )}
                  </div>

                  {/* Expandable items list */}
                  {expandedId === wheel.id && (
                    <div style={{ padding: "0 0.75rem 0.5rem", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      {loadingDetail === wheel.id ? (
                        <div style={{ textAlign: "center", padding: "0.6rem", fontSize: "0.72rem", color: "rgba(192,132,252,0.4)" }}>Đang tải...</div>
                      ) : wheelDetails[wheel.id] ? (() => {
                        const allItems = wheelDetails[wheel.id].items;
                        const q = (itemSearch[wheel.id] ?? "").toLowerCase();
                        const filtered = q ? allItems.filter((n: string) => n.toLowerCase().includes(q)) : allItems;
                        const searchOpen = !!itemSearchOpen[wheel.id];
                        return (
                          <>
                            {/* Header row: label + search toggle */}
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0 0.3rem" }}>
                              <span style={{ fontSize: "0.6rem", color: "rgba(192,132,252,0.4)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", flex: 1 }}>
                                {q ? `${filtered.length}/${allItems.length}` : allItems.length} người — click tên → preset
                              </span>
                              {/* Toggle search button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setItemSearchOpen(prev => ({ ...prev, [wheel.id]: !searchOpen }));
                                  if (searchOpen) setItemSearch(prev => ({ ...prev, [wheel.id]: "" }));
                                }}
                                title={searchOpen ? "Đóng tìm kiếm" : "Tìm kiếm trong danh sách"}
                                style={{
                                  width: 22, height: 22, borderRadius: 6, border: "none", cursor: "pointer",
                                  background: searchOpen ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.06)",
                                  color: searchOpen ? "#c4b5fd" : "rgba(192,132,252,0.5)",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  transition: "all 0.2s", flexShrink: 0,
                                }}
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                                </svg>
                              </button>
                            </div>

                            {/* Inline search input */}
                            {searchOpen && (
                              <div style={{ marginBottom: "0.4rem", position: "relative" }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(139,92,246,0.45)" strokeWidth="2.5" strokeLinecap="round"
                                  style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                                </svg>
                                <input
                                  autoFocus
                                  type="text"
                                  value={itemSearch[wheel.id] ?? ""}
                                  onChange={(e) => setItemSearch(prev => ({ ...prev, [wheel.id]: e.target.value }))}
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder={`Tìm trong ${allItems.length} người...`}
                                  style={{
                                    width: "100%", paddingLeft: 26, paddingRight: 8, paddingTop: 5, paddingBottom: 5,
                                    borderRadius: 8, background: "rgba(99,102,241,0.08)",
                                    border: "1px solid rgba(139,92,246,0.25)", color: "#e2d9f3",
                                    fontSize: "0.72rem", outline: "none", fontFamily: "Inter,sans-serif",
                                  }}
                                />
                                {(itemSearch[wheel.id] ?? "") && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setItemSearch(prev => ({ ...prev, [wheel.id]: "" })); }}
                                    style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(192,132,252,0.4)", cursor: "pointer", fontSize: "0.75rem", lineHeight: 1 }}
                                  >✕</button>
                                )}
                              </div>
                            )}

                            {/* Items grid */}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", maxHeight: 140, overflowY: "auto" }}>
                              {filtered.length === 0 ? (
                                <div style={{ fontSize: "0.68rem", color: "rgba(192,132,252,0.3)", padding: "0.3rem 0" }}>Không tìm thấy</div>
                              ) : filtered.map((name: string, idx: number) => (
                                <button
                                  key={idx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPresetInputs((prev) => ({ ...prev, [wheel.id]: name }));
                                    navigator.clipboard?.writeText(name).catch(() => {});
                                    setCopiedName(name);
                                    setTimeout(() => setCopiedName(null), 1500);
                                  }}
                                  style={{
                                    padding: "3px 10px", borderRadius: 99, fontSize: "0.7rem", fontWeight: 600, cursor: "pointer",
                                    background: copiedName === name ? "rgba(16,185,129,0.18)" : "rgba(99,102,241,0.1)",
                                    border: `1px solid ${copiedName === name ? "rgba(16,185,129,0.45)" : "rgba(139,92,246,0.25)"}`,
                                    color: copiedName === name ? "#34d399" : "#c4b5fd",
                                    transition: "all 0.15s", whiteSpace: "nowrap",
                                  }}
                                >
                                  {copiedName === name ? "✓ " : ""}{name}
                                </button>
                              ))}
                            </div>
                          </>
                        );
                      })() : null}
                    </div>
                  )}

                  {/* Preset row */}
                  <div style={{ display: "flex", gap: "0.4rem", padding: "0 0.75rem 0.4rem", alignItems: "center" }}>
                    <input
                      type="text"
                      value={presetVal}
                      onChange={(e) => setPresetInputs((prev) => ({ ...prev, [wheel.id]: e.target.value }))}
                      placeholder="Chèn kết quả..."
                      onClick={(e) => e.stopPropagation()}
                      style={{ flex: 1, padding: "5px 10px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(139,92,246,0.18)", color: "#e2d9f3", fontSize: "0.72rem", outline: "none", fontFamily: "Inter,sans-serif" }}
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSetPreset(wheel); }}
                      disabled={isSaving}
                      style={{ padding: "5px 12px", borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#a855f7)", border: "none", color: "#fff", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer", flexShrink: 0, opacity: isSaving ? 0.5 : 1, fontFamily: "'Orbitron',monospace", letterSpacing: "0.05em" }}
                    >
                      {isSaving ? "..." : "LƯU"}
                    </button>
                  </div>


                  {wheelMsg && (
                    <div style={{ padding: "0 0.75rem 0.55rem", fontSize: "0.68rem", fontWeight: 600, color: wheelMsg.ok ? "#34d399" : "#f87171" }}>{wheelMsg.text}</div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
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

  const [sessionId, setSessionId] = useState<string>("----");
  const [history, setHistory] = useState<SpinHistoryResponse[]>([]);
  const [spinDuration, setSpinDuration] = useState<number>(16);
  const [userRole, setUserRole] = useState<"ADMIN" | "USER" | null>(null);

  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const totalRotationRef = useRef<number>(0);
  const currentRotationRef = useRef<number>(0);

  useEffect(() => {
    const auth = getAuth();
    if (auth) setUserRole(auth.role);
    setParticipants(DEFAULT_PARTICIPANTS);
    setIsInitializing(false);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, []);

  /* QUẢN LÝ NGƯỜI CHƠI */
  const handleAddParticipant = useCallback(() => {
    const name = inputName.trim();
    if (!name) return;
    setParticipants((prev) => [...prev, { id: generateUid(), name }]);
    setInputName("");
    inputRef.current?.focus();
  }, [inputName]);

  const handleRemove = useCallback((id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleUpdateName = useCallback((id: string, newName: string) => {
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, name: newName } : p)));
  }, []);

  /* LOGIC QUAY */
  const executeSpin = useCallback(async () => {
    if (isSpinning || participants.length < 2) return;

    setIsSpinning(true);
    setIsFetchingResult(true);
    setShowResult(false);
    setWinner(null);

    try {
      let activeWheelId = wheelId;
      if (!activeWheelId) {
        const newWheel = await wheelService.createWheel("Vòng quay may mắn", participants.map((p) => p.name));
        activeWheelId = newWheel.id;
        setWheelId(newWheel.id);
        setSessionId(String(newWheel.id).slice(0, 8).toUpperCase());
      }

      const resp = await wheelService.spinWheel(activeWheelId);
      setIsFetchingResult(false);
      setPresetResult("");

      const winnerName = resp.result;
      const winnerIndex = participants.findIndex((p) => p.name === winnerName);
      if (winnerIndex === -1) { setIsSpinning(false); return; }

      const apiResult = { winner: participants[winnerIndex], winnerIndex };
      setPendingWinner(apiResult.winner);

      const count = participants.length;
      const segmentAngle = 360 / count;
      const targetMidpoint = (apiResult.winnerIndex + 0.5) * segmentAngle;
      const extraSpins = spinDuration + 1;
      const randomOffset = (Math.random() - 0.5) * (segmentAngle * 0.65);
      const finalAngle = (360 - targetMidpoint + randomOffset + 360) % 360;
      let delta = finalAngle - (currentRotationRef.current % 360);
      if (delta <= 0) delta += 360;
      const targetAngle = extraSpins * 360 + delta;
      const durationMs = spinDuration * 1000;

      startTimeRef.current = performance.now();
      totalRotationRef.current = targetAngle;

      function easeOutQuint(t: number): number { return 1 - Math.pow(1 - t, 5); }
      function animate(now: number) {
        const elapsed = now - startTimeRef.current;
        const progress = Math.min(elapsed / durationMs, 1);
        const currentAngle = totalRotationRef.current * easeOutQuint(progress);
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
            { id: Date.now(), wheelId: wheelId as string, result: apiResult.winner.name, spinTime: now2.toLocaleTimeString("vi-VN") },
            ...prev.slice(0, 19),
          ]);
          // sessionId giữ nguyên = wheelId từ API, không reset
        }
      }
      animFrameRef.current = requestAnimationFrame(animate);
    } catch (err) {
      console.error(err);
      setIsSpinning(false);
      setIsFetchingResult(false);
    }
  }, [isSpinning, participants, spinDuration, wheelId]);

  const handleCloseResult = () => { setShowResult(false); setWinner(null); };

  const statusText = isFetchingResult ? "⏳ Đang kết nối..." : isSpinning ? "🎡 Đang quay..." : participants.length < 2 ? "Cần ít nhất 2 người" : "Nhấn QUAY để bắt đầu";

  if (isInitializing) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: "#a855f7", borderRightColor: "#6366f1" }} />
          <p style={{ fontFamily: "'Orbitron', monospace", color: "rgba(192,132,252,0.6)", fontSize: "0.8rem", letterSpacing: "0.15em" }}>ĐANG TẢI...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Animated background */}
      <div className="bg-mesh" aria-hidden="true" />

      <div className="app-wrapper">
        {/* ── HEADER ── */}
        <header className="top-bar">
          <div className="logo">
            <div className="logo-icon">🎯</div>
            <span className="logo-text hidden sm:block">LuckyPick</span>
          </div>

          <div className="header-controls">
            {/* Duration selector */}
            <div className="duration-pills" aria-label="Thời gian quay">
              {SPIN_DURATIONS.map((dur) => (
                <button
                  key={dur}
                  onClick={() => setSpinDuration(dur)}
                  className={`duration-pill ${spinDuration === dur ? "active" : ""}`}
                >
                  {dur}s
                </button>
              ))}
            </div>

            {/* Session badge */}
            <div className="session-badge">
              <div className="session-dot" />
              <span className="session-label hidden sm:block">Session</span>
              <span className="session-id">{sessionId}</span>
            </div>

            {/* Admin */}
            {userRole ? (
              <button
                onClick={() => { authService.logout(); setUserRole(null); }}
                className="btn-admin"
                style={{ color: "#a78bfa", gap: 6, display: "flex", alignItems: "center", fontSize: "0.72rem", fontWeight: 700 }}
                title="Đăng xuất admin"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                <span className="hidden sm:inline">{getAuth()?.username}</span>
              </button>
            ) : (
              <button onClick={() => window.location.href = "/login"} className="btn-admin" title="Đăng nhập Admin">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </button>
            )}
          </div>
        </header>

        {/* ── MAIN LAYOUT ── */}
        <div className="main-content">

          {/* LEFT PANEL */}
          <aside className="left-panel">
            {/* Manage players btn */}
            <button className="manage-btn" onClick={() => setIsManageModalOpen(true)} aria-label="Quản lý người chơi">
              <div className="manage-btn-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="manage-btn-info">
                <div className="manage-btn-title">Quản lý người chơi</div>
                <div className="manage-btn-sub">Thêm · Sửa · Xoá danh sách</div>
              </div>
              <div className="manage-btn-count">
                <span className="manage-btn-count-num">{participants.length}</span>
                <span className="manage-btn-count-label">người</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(192,132,252,0.4)" strokeWidth="2.5" strokeLinecap="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            {/* History */}
            <section className="history-card" aria-label="Lịch sử kết quả">
              <div className="history-top-bar" />
              <div className="history-card-glow" />

              <div className="history-header">
                <div className="history-title">
                  <div className="history-title-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.85)" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
                    </svg>
                  </div>
                  <h2>Lịch Sử</h2>
                </div>
                {history.length > 0 && (
                  <span className="history-count-badge">{history.length} lượt</span>
                )}
              </div>

              {history.length === 0 ? (
                <div className="history-empty">
                  <div className="history-empty-icon">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(139,92,246,0.5)" strokeWidth="1.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
                    </svg>
                  </div>
                  <p>Chưa có kết quả</p>
                  <span>Hãy quay để bắt đầu!</span>
                </div>
              ) : (
                <div className="history-list">
                  {history.map((entry, i) => {
                    const idx = participants.findIndex((p) => p.name === entry.result);
                    const color = idx !== -1 ? SEGMENT_COLORS[idx % SEGMENT_COLORS.length] : "#6366f1";
                    const isFirst = i === 0;
                    return (
                      <div key={entry.id} className={`history-item ${isFirst ? "is-latest" : ""}`}>
                        <span className={`history-rank ${isFirst ? "latest" : "old"}`}>{history.length - i}</span>
                        <span className="history-dot" style={{ background: color, boxShadow: `0 0 6px ${color}99` }} />
                        <span className={`history-name ${isFirst ? "latest" : "old"}`}>{entry.result}</span>
                        {isFirst && <span style={{ fontSize: "0.75rem", flexShrink: 0 }}>🏆</span>}
                        <span className="history-time">{entry.spinTime}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </aside>

          {/* RIGHT (WHEEL) AREA */}
          <main className="wheel-area">
            <div className="wheel-title">
              <h1>VÒNG QUAY MAY MẮN</h1>
              <p>Nhấn QUAY · Số phận sẽ quyết định ✦</p>
            </div>

            <section aria-label="Khu vực vòng quay">
              {participants.length > 20 ? (
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
                <div className="wheel-outer-wrapper">
                  <div className="wheel-ambient" />
                  <div className="wheel-pulse-ring" />

                  <div className="wheel-container">
                    {/* Pointer */}
                    <div className="wheel-pointer" style={{ width: 60, height: 32 }}>
                      <svg width="60" height="32" viewBox="0 0 100 52">
                        <defs>
                          <linearGradient id="ptr-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fff8dc" />
                            <stop offset="30%" stopColor="#ffd700" />
                            <stop offset="60%" stopColor="#c8960a" />
                            <stop offset="100%" stopColor="#8b6914" />
                          </linearGradient>
                          <filter id="ptr-shadow">
                            <feDropShadow dx="1" dy="2" stdDeviation="2.5" floodColor="#00000077" />
                          </filter>
                        </defs>
                        <path d="M0,0 L100,26 L0,52 Q14,26 0,0 Z" fill="url(#ptr-grad)" stroke="#a0720a" strokeWidth="1.5" filter="url(#ptr-shadow)" />
                        <path d="M0,0 L100,26 L65,14 Q10,6 0,0 Z" fill="rgba(255,255,255,0.25)" stroke="none" />
                      </svg>
                    </div>

                    <div className={`wheel-3d ${isSpinning ? "spinning" : ""}`}>
                      <div className="wheel-rim" />
                      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
                        const rad = (angle * Math.PI) / 180;
                        const bx = 50 + 47.5 * Math.cos(rad);
                        const by = 50 + 47.5 * Math.sin(rad);
                        return (
                          <div key={angle} className="wheel-bolt" style={{ left: `${bx}%`, top: `${by}%`, transform: "translate(-50%,-50%)" }} />
                        );
                      })}

                      <SpinWheelSVG participants={participants} rotation={rotation} isSpinning={isSpinning} />

                      <button
                        className="wheel-center-btn"
                        onClick={executeSpin}
                        disabled={isSpinning || participants.length < 2}
                        title="Quay!"
                        aria-label="Nhấn để quay"
                      >
                        {isFetchingResult ? (
                          <span style={{ fontSize: "0.7rem", animation: "status-pulse 1s infinite" }}>Wait</span>
                        ) : isSpinning ? (
                          <span style={{ fontSize: "0.85rem", animation: "status-pulse 0.8s infinite", letterSpacing: "0.05em" }}>...</span>
                        ) : (
                          "QUAY"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Status */}
            <p className={`wheel-status ${isSpinning || isFetchingResult ? "spinning" : ""}`}>
              {statusText}
            </p>
          </main>
        </div>
      </div>

      {/* ── CONFETTI ── */}
      <ConfettiEffect active={showResult} />

      {/* ── MANAGE MODAL ── */}
      {isManageModalOpen && (
        <div className="modal-overlay" onClick={() => setIsManageModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top-bar" />

            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon">👥</div>
                <div>
                  <h2 className="modal-title">Người Chơi</h2>
                  <p className="modal-subtitle">{participants.length} thành viên · chỉnh sửa tự do</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {participants.length > 0 && (
                  <button
                    onClick={() => setParticipants([])}
                    title="Xoá tất cả"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "0.3rem 0.7rem",
                      borderRadius: "8px",
                      background: "rgba(244,63,94,0.1)",
                      border: "1px solid rgba(244,63,94,0.3)",
                      color: "#f87171",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      letterSpacing: "0.04em",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(244,63,94,0.2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(244,63,94,0.1)")}
                  >
                    🗑 Xoá tất cả
                  </button>
                )}
                <button className="modal-close-btn" onClick={() => setIsManageModalOpen(false)} title="Đóng">✕</button>
              </div>
            </div>

            <div className="modal-add-row">
              <div className="add-input-group">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Nhập tên người tham dự..."
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddParticipant(); }}
                  maxLength={30}
                  className="add-input"
                />
                <button onClick={handleAddParticipant} disabled={!inputName.trim()} className="add-btn">
                  + Thêm
                </button>
              </div>
            </div>

            <div className="modal-list">
              {participants.length === 0 ? (
                <div className="modal-empty">
                  <span className="modal-empty-emoji">🫙</span>
                  <p>Danh sách đang trống</p>
                  <span>Thêm người để bắt đầu quay thưởng</span>
                </div>
              ) : (
                participants.map((p, i) => (
                  <div key={p.id} className="participant-row">
                    <div className="participant-avatar" style={{ background: SEGMENT_COLORS[i % SEGMENT_COLORS.length], boxShadow: `0 0 10px ${SEGMENT_COLORS[i % SEGMENT_COLORS.length]}55` }}>
                      {i + 1}
                    </div>
                    <input
                      value={p.name}
                      onChange={(e) => handleUpdateName(p.id, e.target.value)}
                      className="participant-name-input"
                      maxLength={30}
                      title="Nhấn để sửa tên"
                    />
                    <button onClick={() => handleRemove(p.id)} className="participant-remove-btn" title="Xóa">
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                        <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="modal-footer">
              {userRole === "ADMIN" && (
                <div className="preset-row">
                  <span style={{ color: "rgba(192,132,252,0.6)", fontSize: "0.85rem", flexShrink: 0 }}>🎯</span>
                  <input
                    type="text"
                    placeholder="Ép kết quả (bỏ trống = ngẫu nhiên)..."
                    value={presetResult}
                    onChange={(e) => setPresetResult(e.target.value)}
                  />
                </div>
              )}
              <button
                className="btn-save-modal"
                onClick={async () => {
                  if (wheelId) {
                    await wheelService.updateWheelItems(wheelId, participants.map((p) => p.name));
                    if (userRole === "ADMIN") {
                      if (presetResult.trim()) await wheelService.setWheelPreset(wheelId, presetResult.trim());
                      else { try { await wheelService.clearWheelPreset(wheelId); } catch (e) {} }
                    }
                  }
                  setIsManageModalOpen(false);
                }}
              >
                LƯU & ĐÓNG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RESULT MODAL ── */}
      {showResult && winner && (
        <div className="result-overlay" onClick={handleCloseResult}>
          <div className="result-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="result-top-bar" />
            <div className="result-glow-bg" />
            <div className="result-orbit" />

            <div className="result-content">
              <div className="result-trophy">🏆</div>
              <p className="result-label">✦ Chúc mừng người chiến thắng ✦</p>
              <h2 className="result-winner-name">{winner.name}</h2>

              <div className="result-buttons">
                <button
                  className="btn-spin-again"
                  onClick={() => { setShowResult(false); executeSpin(); }}
                >
                  🔄 QUAY TIẾP
                </button>
                <button className="btn-close-result" onClick={handleCloseResult}>
                  ĐÓNG
                </button>
              </div>
            </div>

            <div className="result-meta">
              <span>
                <span className="result-meta-dot" />
                Phiên: {sessionId}
              </span>
              <span>{new Date().toLocaleTimeString("vi-VN")}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── ADMIN LOGIN ── */}
      {isAdminLoginOpen && (
        <AdminLoginModal
          onSuccess={(role) => { setUserRole(role); setIsAdminLoginOpen(false); }}
          onClose={() => setIsAdminLoginOpen(false)}
        />
      )}

      {/* ── ADMIN WHEEL PANEL (float, bottom-right) ── */}
      {userRole === "ADMIN" && (
        <AdminWheelPanel
          currentWheelId={wheelId}
          onSelectWheel={async (summary) => {
            setWheelId(summary.id);
            setSessionId(String(summary.id));
            setPresetResult(summary.preset ?? "");
            setHistory([]);
            setRotation(0);
            currentRotationRef.current = 0;
            // Fetch detail để lấy items
            try {
              const detail = await wheelService.getWheelDetail(summary.id);
              setParticipants(detail.items.map((name) => ({ id: generateUid(), name })));
            } catch {
              setParticipants([]);
            }
          }}
        />
      )}
    </>
  );
}
