"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { wheelService, Wheel, SpinHistoryResponse } from "@/services/api";

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
      <svg viewBox={`0 0 ${size} ${size}`} className="spin-wheel">
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
        style={{ transform: `rotate(${rotation}deg)` }}
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
    const textR = innerR + 30; // Chữ nằm dọc, cách tâm innerR + 30px
    const tx = cx + textR * Math.cos(midAngle);
    const ty = cy + textR * Math.sin(midAngle);
    const textRotation = (i + 0.5) * segmentAngle;

    const maxLen = count > 8 ? 14 : 20;
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

  const fontSize = count > 10 ? 16 : count > 6 ? 20 : 24;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={`spin-wheel ${isSpinning ? "is-spinning" : ""}`}
      style={{ transform: `rotate(${rotation}deg)` }}
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
            stroke="#fbbf24"
            strokeWidth="2.5"
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
  const [showResult, setShowResult] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [sessionId, setSessionId] = useState(() => generateSessionId());
  const [history, setHistory] = useState<SpinHistoryResponse[]>([]);
  const [spinDuration, setSpinDuration] = useState<number>(5);

  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  // Theme support
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const totalRotationRef = useRef<number>(0);
  const currentRotationRef = useRef<number>(0);

  const initWheel = useCallback(async () => {
    try {
      setIsInitializing(true);
      let wheels = await wheelService.getWheels();
      let activeWheel: Wheel;
      if (wheels.length === 0) {
        activeWheel = await wheelService.createWheel("Vòng quay may mắn", DEFAULT_PARTICIPANTS.map(p => p.name));
      } else {
        activeWheel = await wheelService.getWheelDetail(wheels[0].id);
      }
      setWheelId(activeWheel.id);
      setParticipants(activeWheel.items.map(name => ({ id: generateUid(), name })));
      if (activeWheel.preset) {
        setPresetResult(activeWheel.preset);
      } else {
        setPresetResult("");
      }
      
      const hist = await wheelService.getWheelHistory(activeWheel.id);
      setHistory(hist.reverse());
    } catch (e) {
      console.error(e);
    } finally {
      setIsInitializing(false);
    }
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
    if (isSpinning || participants.length < 2 || !wheelId) return;

    setIsSpinning(true);
    setIsFetchingResult(true);
    setShowResult(false);
    setWinner(null);
    setShowConfetti(false);

    try {
      const resp = await wheelService.spinWheel(wheelId);
      setIsFetchingResult(false);
      setPresetResult(""); // Clear local preset state since backend clears it after spinning

      const winnerName = resp.result;
      const winnerIndex = participants.findIndex(p => p.name === winnerName);
      if (winnerIndex === -1) {
        setIsSpinning(false);
        return;
      }
      const apiResult = { winner: participants[winnerIndex], winnerIndex };

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
        setShowResult(true);
        setShowConfetti(true);

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
        setTimeout(() => setShowConfetti(false), 4000);
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
          </div>
        </header>

        {/* LAYOUT MỚI: TRÁI (LỊCH SỬ) - PHẢI (VÒNG QUAY) */}
        <div className="main-content flex flex-col lg:flex-row w-full max-w-none 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 py-4 lg:py-10 gap-8 lg:gap-16 xl:gap-24 items-center lg:items-start justify-center">
          
          {/* CỘT TRÁI: NÚT QUẢN LÝ NGƯỜI DÙNG & LỊCH SỬ KẾT QUẢ */}
          <div className="flex flex-col w-full lg:w-[420px] shrink-0 gap-8 order-2 lg:order-1 z-10">
            {/* NÚT QUẢN LÝ NGƯỜI THAM GIA CAO CẤP */}
            <button
              onClick={() => setIsManageModalOpen(true)}
              className="w-full relative overflow-hidden flex items-center justify-between p-4 px-6 md:p-5 md:px-7 bg-white dark:bg-[#0f111a] border border-slate-200 dark:border-indigo-500/30 rounded-[24px] shadow-xl shadow-slate-200/50 dark:shadow-[0_0_30px_rgba(99,102,241,0.15)] transition-all duration-300 group hover:shadow-indigo-500/20 dark:hover:shadow-[0_0_40px_rgba(99,102,241,0.3)] hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-inner shadow-white/20">
                  <span className="text-2xl md:text-3xl text-white drop-shadow-md">👥</span>
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="font-extrabold text-[#1e1b4b] dark:text-white uppercase tracking-widest text-[14px] md:text-[16px]">
                    Quản lý người chơi
                  </span>
                  <span className="text-[11px] md:text-xs text-slate-500 dark:text-indigo-300 font-medium tracking-wide mt-0.5">
                    Thêm, sửa, xoá danh sách
                  </span>
                </div>
              </div>
              <div className="relative z-10 flex flex-col items-center justify-center bg-slate-100 dark:bg-[#150e28] border border-slate-200 dark:border-indigo-500/30 w-12 h-12 md:w-14 md:h-14 rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300">
                <span className="text-indigo-600 dark:text-indigo-400 text-base md:text-xl font-black">{participants.length}</span>
              </div>
            </button>

            {/* LỊCH SỬ KẾT QUẢ - THIÊN THƯ (DIVINE SCROLL) */}
            <section 
              className="history-section flex-1 h-full min-h-[450px] w-full bg-[#1e0a11]/90 backdrop-blur-2xl rounded-2xl p-6 lg:p-8 flex flex-col shadow-2xl shadow-black/50 relative xl:max-w-md overflow-hidden"
              style={{
                borderTop: "8px solid #d97706",
                borderBottom: "8px solid #d97706",
                borderLeft: "2px solid #92400e",
                borderRight: "2px solid #92400e",
                backgroundImage: "radial-gradient(ellipse at center, rgba(217,119,6,0.08) 0%, transparent 80%)"
              }}
              aria-label="Lịch sử kết quả quay thưởng"
            >
              {/* Decorative corners */}
              <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-[#d97706] opacity-50 m-3" />
              <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-[#d97706] opacity-50 m-3" />
              <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-[#d97706] opacity-50 m-3" />
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-[#d97706] opacity-50 m-3" />

              <div className="section-header border-b-2 border-[#d97706]/40 pb-5 flex items-center justify-between relative z-10">
                <div className="text-[#fde68a] flex items-center gap-3 text-xl lg:text-2xl font-[Orbitron] font-black uppercase tracking-widest drop-shadow-md">
                  <span className="text-[28px] drop-shadow-[0_0_10px_rgba(253,230,138,0.8)]">📜</span>
                  THIÊN THƯ
                </div>
                {history.length > 0 && (
                  <span className="text-xs font-bold bg-[#d97706] text-[#fffbeb] px-3 py-1.5 rounded-md tracking-wider border border-[#fcd34d]/50 shadow-[0_0_10px_rgba(217,119,6,0.5)]">
                    {history.length} Lượt
                  </span>
                )}
              </div>

              <div className="history-list flex-1 overflow-y-auto overflow-x-hidden pr-2 mt-6 space-y-4 relative z-10" style={{ maxHeight: "calc(100vh - 350px)", minHeight: "350px", overflowX: "hidden" }}>
                {history.length === 0 ? (
                  <div className="no-history text-[#fcd34d]/50 h-full flex flex-col items-center justify-center italic text-base gap-4 mt-6">
                    <span className="text-5xl opacity-80 drop-shadow-[0_0_15px_rgba(253,230,138,0.4)]">🪶</span>
                    <p className="tracking-widest uppercase font-semibold text-[#fde68a] drop-shadow-md">Chưa có dữ liệu quay!</p>
                  </div>
                ) : (
                  history.map((entry, i) => {
                    const idx = participants.findIndex(p => p.name === entry.result);
                    const color = idx !== -1 ? SEGMENT_COLORS[idx % SEGMENT_COLORS.length] : "#fcd34d";
                    return (
                    <div 
                      className="history-item flex items-center gap-4 md:gap-5 bg-[#3a1614]/80 p-4 px-5 rounded-xl border border-[#d97706]/30 hover:border-[#fcd34d]/60 transition-all hover:shadow-[0_4px_15px_rgba(0,0,0,0.5)] hover:bg-[#451a03]" 
                      key={entry.id}
                    >
                      <span className="history-rank text-sm sm:text-base min-w-[2.5rem] h-10 lg:h-12 shrink-0 flex items-center justify-center bg-gradient-to-b from-[#fef08a] to-[#d97706] text-[#451a03] rounded-md font-black shadow-inner border border-[#fffbeb]">
                        #{history.length - i}
                      </span>
                      <span
                        className="w-4 h-4 rounded-full flex-shrink-0 shadow-[0_0_10px_currentColor] border border-black/30"
                        style={{ background: color, color: color }}
                      />
                      <span className="history-name truncate flex-1 font-black text-[16px] lg:text-[19px] text-[#fef08a] uppercase tracking-widest font-serif drop-shadow-sm">
                        {entry.result}
                      </span>
                      <span className="history-time shrink-0 text-[13px] text-[#fde68a]/90 font-mono bg-[#2a0f08]/80 px-3 py-1.5 rounded border border-[#92400e]/50 font-bold">
                        {entry.spinTime}
                      </span>
                    </div>
                  )})
                )}
              </div>
            </section>
          </div>

          {/* CỘT PHẢI: VÒNG QUAY */}
          <div className="flex-1 w-full flex flex-col items-center justify-center order-1 lg:order-2 lg:self-start lg:mt-0 mt-4">

            <section
              className="wheel-section relative -mt-4"
              aria-label="Khu vực vòng quay bốc thăm"
            >
              <div className="wheel-outer-wrapper">
                {/* Đã xóa wheel-glow-ring */}
                <div className="wheel-container">
                  {/* Center Pointer - Bắn từ tâm ra */}
                  {/* Center Pointer - Mũi tên liền mạch */}
                  <div 
                    className="absolute top-1/2 left-1/2 z-[15] pointer-events-none drop-shadow-[5px_0_15px_rgba(0,0,0,0.3)] dark:drop-shadow-[5px_0_15px_rgba(0,0,0,0.6)]" 
                    style={{ transform: 'translate(45px, -50%)' }}
                  >
                    <svg width="65" height="34" viewBox="0 0 100 50">
                      <defs>
                        <linearGradient id="pointerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#e0e7ff" />
                          <stop offset="60%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#312e81" />
                        </linearGradient>
                      </defs>
                      <path 
                        d="M0,0 L100,25 L0,50 Q12,25 0,0 Z" 
                        fill="url(#pointerGrad)" 
                        stroke="#818cf8" 
                        strokeWidth="1.5"
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
            </section>
          </div>
        </div>
      </div>

      <ConfettiEffect active={showConfetti} />

      {/* MODAL: QUẢN LÝ NGƯỜI CHƠI (Tạo Mới + Cập Nhật + Xóa) - CAO CẤP */}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-[#03010f]/80 backdrop-blur-xl">
          <div className="bg-slate-50 dark:bg-[#0b0616] border border-slate-200 dark:border-indigo-500/20 rounded-[32px] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative animate-[card-pop_0.3s_ease-out]">
            
            {/* Modal Header */}
            <div className="bg-white dark:bg-[#120a26] border-b border-slate-200 dark:border-indigo-500/20 p-6 md:px-8 flex items-center justify-between shrink-0 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl shadow-sm border border-indigo-200 dark:border-indigo-700/50">
                  📋
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-wide">
                    Danh Sách Người Chơi
                  </h2>
                  <p className="text-xs md:text-sm text-slate-500 dark:text-indigo-300/80 font-medium mt-0.5">Tổng cộng {participants.length} thành viên tham gia</p>
                </div>
              </div>
              <button
                onClick={() => setIsManageModalOpen(false)}
                className="w-10 h-10 bg-slate-100 hover:bg-slate-200 dark:bg-[#1a0f35] dark:hover:bg-[#25154d] text-slate-500 hover:text-slate-800 dark:text-indigo-300 dark:hover:text-white rounded-full transition-colors flex items-center justify-center font-bold text-lg"
                title="Đóng cửa sổ"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Thêm Mới */}
            <div className="p-6 md:px-8 pb-4 shrink-0 bg-white dark:bg-[#0b0616]">
              <div className="flex flex-col sm:flex-row gap-3 bg-slate-50 dark:bg-[#120a26] border border-slate-200 dark:border-indigo-500/20 p-3 rounded-2xl shadow-sm">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Nhập tên người tham dự..."
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddParticipant();
                  }}
                  maxLength={30}
                  className="flex-1 bg-transparent border-none px-4 py-3 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none font-medium text-[15px]"
                />
                <button
                  onClick={handleAddParticipant}
                  disabled={!inputName.trim()}
                  className="px-6 md:px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-slate-200 disabled:to-slate-200 dark:disabled:from-slate-800 dark:disabled:to-slate-800 text-white rounded-xl font-bold transition-all disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed shadow-md shadow-indigo-500/20 block w-full sm:w-auto text-[15px]"
                >
                  🚀 Thêm
                </button>
              </div>
            </div>

            {/* Modal Body: Danh sách & Chỉnh Sửa */}
            <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-6 space-y-4 bg-white dark:bg-[#0b0616]">
              {participants.length === 0 ? (
                <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 italic text-sm text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-[#120a26] flex items-center justify-center mb-4 text-3xl opacity-60">📭</div>
                  <p className="font-medium text-base text-slate-500 dark:text-slate-400 not-italic">Danh sách đang trống!</p>
                  <p className="mt-1">Hãy thêm người vào để bắt đầu quay thưởng</p>
                </div>
              ) : (
                participants.map((p, i) => (
                  <div key={p.id} className="group flex items-center gap-4 md:gap-5 bg-white dark:bg-[#120a26] border border-slate-200 dark:border-indigo-500/20 hover:border-indigo-300 dark:hover:border-indigo-500/50 p-4 px-5 md:px-6 rounded-2xl transition-all shadow-sm hover:shadow-md">
                    <span 
                      className="w-4 h-4 rounded-full shrink-0 shadow-[0_0_10px_currentcolor]" 
                      style={{ background: SEGMENT_COLORS[i % SEGMENT_COLORS.length], color: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }} 
                    />
                    
                    {/* Input Edit Inline */}
                    <input
                      value={p.name}
                      onChange={(e) => handleUpdateName(p.id, e.target.value)}
                      className="flex-1 bg-transparent border-b-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-indigo-500 text-[16px] md:text-[18px] font-bold text-slate-800 dark:text-white px-2 py-2 outline-none transition-all rounded-none"
                      maxLength={30}
                      title="Nhấn để sửa tên"
                    />

                    <button
                      onClick={() => handleRemove(p.id)}
                      className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 dark:hover:text-white transition-colors opacity-80 group-hover:opacity-100 font-bold"
                      title="Xóa người này"
                    >
                      X
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 md:px-8 bg-slate-50 dark:bg-[#120a26] border-t border-slate-200 dark:border-indigo-500/20 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
              <div className="flex items-center gap-3 w-full sm:w-auto bg-white dark:bg-[#0b0616] p-2 rounded-xl border border-slate-200 dark:border-indigo-500/30">
                <span className="text-xs text-indigo-600 dark:text-indigo-400 uppercase font-black tracking-widest pl-2">🎯 Preset:</span>
                <input 
                  type="text" 
                  placeholder="Ép kết quả bốc trúng..."
                  value={presetResult}
                  onChange={(e) => setPresetResult(e.target.value)}
                  className="bg-transparent border-none text-[15px] text-slate-800 dark:text-indigo-300 outline-none w-full sm:w-[180px] font-medium"
                />
              </div>
              <button
                onClick={async () => {
                  if (wheelId) {
                    await wheelService.updateWheelItems(wheelId, participants.map(p => p.name));
                    if (presetResult.trim()) {
                      await wheelService.setWheelPreset(wheelId, presetResult.trim());
                    } else {
                      try { await wheelService.clearWheelPreset(wheelId) } catch(e){}
                    }
                  }
                  setIsManageModalOpen(false);
                }}
                className="w-full sm:w-auto px-10 py-3.5 bg-slate-900 hover:bg-black dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold tracking-wide rounded-xl transition-all shadow-lg shadow-slate-900/20 dark:shadow-indigo-500/30 text-[15px]"
              >
                LƯU & ĐÓNG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP KẾT QUẢ ĐẸP HƠN */}
      {showResult && winner && (
        <div className="result-overlay fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/80 backdrop-blur-xl" onClick={handleCloseResult}>
          <div
            className="result-card bg-white dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-12 text-center max-w-lg w-full relative overflow-hidden shadow-2xl dark:shadow-none"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="winner-title"
          >
            <div className="absolute -inset-10 bg-gradient-conic from-transparent via-blue-500/10 dark:via-indigo-500/10 to-transparent animate-[spin_8s_linear_infinite]" />
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="result-emoji text-6xl md:text-7xl mb-4 drop-shadow-md dark:drop-shadow-2xl animate-bounce">🎇</div>
              <p id="winner-title" className="text-xs md:text-sm font-[Orbitron] font-bold text-indigo-700 dark:text-indigo-300 tracking-[0.25em] uppercase opacity-100 mb-2">
                Chúc Mừng Người Chiến Thắng!
              </p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-[Orbitron] font-black text-indigo-800 dark:bg-gradient-to-br dark:from-indigo-300 dark:via-purple-300 dark:to-white dark:bg-clip-text dark:text-transparent pb-3 mb-3 drop-shadow-lg dark:drop-shadow-sm">
                {winner.name}
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base font-semibold tracking-wide mb-8 bg-slate-100 dark:bg-slate-800/80 rounded-full px-5 py-1.5 shadow-sm border border-slate-200 dark:border-slate-700">
                Phiên: {sessionId} · {new Date().toLocaleTimeString("vi-VN")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
                <button
                  onClick={() => { setShowResult(false); executeSpin(); }}
                  className="w-full sm:w-auto px-8 py-3 rounded-full font-[Orbitron] font-bold text-sm tracking-widest text-white bg-indigo-500 hover:bg-indigo-600 shadow-md shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 transition-all"
                >
                  🔄 QUAY TIẾP
                </button>
                <button
                  onClick={handleCloseResult}
                  className="w-full sm:w-auto px-8 py-3 rounded-full font-[Orbitron] font-bold text-sm tracking-widest text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-all border-none"
                >
                  ĐÓNG (X)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
