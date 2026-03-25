"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/* ============================
   TYPES
   ============================ */
export interface Participant {
  id: string;
  name: string;
}

interface HistoryEntry {
  rank: number;
  name: string;
  sessionId: string;
  time: string;
  color: string;
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
async function fetchWinnerFromAPI(
  participants: Participant[]
): Promise<{ winner: Participant; winnerIndex: number }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const winnerIndex = Math.floor(Math.random() * participants.length);
      resolve({ winner: participants[winnerIndex], winnerIndex });
    }, 400); 
  });
}

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
            stroke="rgba(0,0,0,0.25)"
            strokeWidth="1.5"
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
          stroke="rgba(0,0,0,0.35)"
          strokeWidth="1.5"
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
          fill="#fff"
          fontSize={fontSize}
          fontFamily="Inter,sans-serif"
          fontWeight="700"
          style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)", paintOrder: "stroke" }}
          stroke="rgba(0,0,0,0.4)"
          strokeWidth="2"
          paintOrder="stroke"
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
  const [participants, setParticipants] = useState<Participant[]>(
    DEFAULT_PARTICIPANTS
  );
  const [inputName, setInputName] = useState("");
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isFetchingResult, setIsFetchingResult] = useState(false);
  const [winner, setWinner] = useState<Participant | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [sessionId] = useState(() => generateSessionId());
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [spinDuration, setSpinDuration] = useState<number>(5);

  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const totalRotationRef = useRef<number>(0);
  const currentRotationRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

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
    setShowConfetti(false);

    const apiResult = await fetchWinnerFromAPI(participants);

    setIsFetchingResult(false);

    const count = participants.length;
    const segmentAngle = 360 / count;
    const targetMidpoint = (apiResult.winnerIndex + 0.5) * segmentAngle;
    const extraSpins = spinDuration + 1;
    const randomOffset = (Math.random() - 0.5) * (segmentAngle * 0.7);

    const targetAngle =
      extraSpins * 360 + (360 - targetMidpoint + randomOffset + 360) % 360;

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
            rank: prev.length + 1,
            name: apiResult.winner.name,
            sessionId,
            time: now2.toLocaleTimeString("vi-VN"),
            color: SEGMENT_COLORS[apiResult.winnerIndex % SEGMENT_COLORS.length],
          },
          ...prev.slice(0, 19),
        ]);

        setTimeout(() => setShowConfetti(false), 4000);
      }
    }

    animFrameRef.current = requestAnimationFrame(animate);
  }, [isSpinning, participants, sessionId, spinDuration]);

  const handleCloseResult = () => {
    setShowResult(false);
    setWinner(null);
  };

  const statusText = isFetchingResult
    ? "⏳ Kết nối hệ thống..."
    : isSpinning
    ? "⏳ Đang quay..."
    : "🎰 QUAY NGAY";

  return (
    <>
      <div className="starfield" aria-hidden="true" />
      <div className="nebula" aria-hidden="true" />

      <div className="app-wrapper">
        <header className="top-bar">
          <div className="logo cursor-pointer group">
            <div className="logo-icon group-hover:scale-105 transition-transform duration-300">
              🎯
            </div>
            <span className="logo-text">LuckyPick</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="duration-config" aria-label="Cấu hình thời gian quay">
              <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
                Thời gian
              </span>
              <div className="flex gap-1 sm:gap-2 bg-white/5 border border-white/10 rounded-full p-1 backdrop-blur-md">
                {SPIN_DURATIONS.map((dur) => (
                  <button
                    key={dur}
                    onClick={() => setSpinDuration(dur)}
                    className={`px-3 py-1 rounded-full text-xs font-[Orbitron] font-bold transition-all duration-300 ${
                      spinDuration === dur
                        ? "bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-black shadow-[0_0_10px_rgba(255,215,0,0.5)] scale-105"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {dur}s
                  </button>
                ))}
              </div>
            </div>

            <div className="session-badge hidden sm:flex">
              <div className="session-dot" />
              <span className="session-label">Session</span>
              <span className="session-id">{sessionId}</span>
            </div>
          </div>
        </header>

        {/* LAYOUT MỚI: TRÁI (LỊCH SỬ) - PHẢI (VÒNG QUAY) */}
        <div className="main-content flex flex-col lg:flex-row w-full max-w-none 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 py-4 lg:py-10 gap-8 lg:gap-16 xl:gap-24 items-center lg:items-start justify-center">
          
          {/* CỘT TRÁI: NÚT QUẢN LÝ NGƯỜI DÙNG & LỊCH SỬ KẾT QUẢ */}
          <div className="flex flex-col w-full lg:w-[400px] shrink-0 gap-6 order-2 lg:order-1 z-10">
            {/* NÚT QUẢN LÝ NGƯỜI THAM GIA */}
            <button
              onClick={() => setIsManageModalOpen(true)}
              className="w-full relative overflow-hidden flex items-center justify-between p-4 px-6 bg-[#1a0f3d]/80 hover:bg-[#251554] border border-[var(--purple)]/40 hover:border-[var(--purple-light)] rounded-2xl transition-all duration-300 group shadow-[0_0_20px_rgba(124,58,237,0.1)] hover:shadow-[0_0_30px_rgba(124,58,237,0.3)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--purple)]/10 to-transparent transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
              <div className="flex items-center gap-3 relative z-10">
                <span className="text-2xl">👥</span>
                <span className="font-[Orbitron] font-bold text-sm tracking-widest text-[#e2d5ff]">
                  QUẢN LÝ NGƯỜI CHƠI
                </span>
              </div>
              <div className="relative z-10 bg-[var(--purple)] text-white text-xs font-bold px-3 py-1 rounded-full group-hover:scale-110 transition-transform">
                {participants.length}
              </div>
            </button>

            {/* LỊCH SỬ KẾT QUẢ */}
            <section className="history-section flex-1 h-full min-h-[300px] w-full mt-0" aria-label="Lịch sử kết quả quay thưởng">
              <div className="section-header border-b border-white/5 pb-3">
                <div className="section-title text-[var(--gold)]">
                  <span className="section-title-icon">🏆</span>
                  Kết Quả
                </div>
                {history.length > 0 && (
                  <span className="text-xs font-bold text-white/40">
                    {history.length} Lượt
                  </span>
                )}
              </div>

              <div className="history-list max-h-[400px] overflow-y-auto pr-2 mt-4 space-y-2">
                {history.length === 0 ? (
                  <p className="no-history text-white/30 h-[200px] flex items-center justify-center italic text-sm">
                    Trống! Lịch sử bốc thăm sẽ hiện ở đây.
                  </p>
                ) : (
                  history.map((entry, i) => (
                    <div className="history-item flex items-center gap-3 bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/5 transition-colors" key={i}>
                      <span className="history-rank text-[10px] w-7 h-7 flex items-center justify-center bg-[var(--gold)]/10 text-[var(--gold)] rounded-md font-bold">
                        #{entry.rank}
                      </span>
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm shadow-black/80"
                        style={{ background: entry.color }}
                      />
                      <span className="history-name truncate flex-1 font-semibold text-[14px]">
                        {entry.name}
                      </span>
                      <span className="history-time ml-auto text-xs text-white/40 font-mono">
                        {entry.time}
                      </span>
                    </div>
                  ))
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
                <div className="wheel-glow-ring" />
                <div className="wheel-container">
                  {/* Center Pointer - Bắn từ tâm ra */}
                  <div 
                    className="absolute top-1/2 left-1/2 z-[15] pointer-events-none" 
                    style={{ transform: 'translateY(-50%)' }}
                  >
                    <div 
                      className="w-0 h-0" 
                      style={{
                        borderTop: '20px solid transparent',
                        borderBottom: '20px solid transparent',
                        borderLeft: '50px solid var(--gold)',
                        marginLeft: '55px',
                        filter: 'drop-shadow(4px 0 8px rgba(0,0,0,0.5))',
                        transition: 'all 0.2s'
                      }} 
                    />
                    <div 
                      className="absolute top-1/2 w-0 h-0" 
                      style={{
                        transform: 'translateY(-50%)',
                        borderTop: '12px solid transparent',
                        borderBottom: '12px solid transparent',
                        borderLeft: '35px solid var(--gold-light)',
                        marginLeft: '55px',
                        transition: 'all 0.2s'
                      }} 
                    />
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
                        <span className="text-[20px] animate-pulse text-[var(--purple-light)]">...</span>
                      ) : (
                        <span className="text-[24px] tracking-widest text-[#222] drop-shadow-[0_2px_4px_rgba(255,255,255,0.5)] leading-none ml-1">QUAY</span>
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

      {/* MODAL: QUẢN LÝ NGƯỜI CHƠI (Tạo Mới + Cập Nhật + Xóa) */}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-[#03010f]/80 backdrop-blur-md">
          <div className="bg-[#120a2e] border border-purple-500/30 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_0_80px_rgba(124,58,237,0.15)] relative animate-[card-pop_0.3s_ease-out]">
            
            {/* Modal Header */}
            <div className="p-6 sm:px-8 border-b border-white/5 flex items-center justify-between shrink-0">
              <h2 className="text-xl sm:text-2xl font-[Orbitron] font-bold text-white flex items-center gap-3">
                <span className="text-2xl">📋</span>
                Danh Sách Người Chơi
                <span className="text-sm bg-purple-600/30 text-purple-300 px-3 py-1 rounded-full">
                  {participants.length}
                </span>
              </h2>
              <button
                onClick={() => setIsManageModalOpen(false)}
                className="p-2 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-full transition-colors flex items-center justify-center font-bold text-lg"
                title="Đóng cửa sổ"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Thêm Mới */}
            <div className="p-6 sm:px-8 pb-4 shrink-0 bg-white/5">
              <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">Thêm Người Mới</p>
              <div className="flex gap-3">
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
                  className="flex-1 bg-black/40 border border-white/10 focus:border-purple-500 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none transition-all shadow-inner"
                />
                <button
                  onClick={handleAddParticipant}
                  disabled={!inputName.trim()}
                  className="px-6 sm:px-8 py-3 bg-[var(--purple)] hover:bg-[#6d28d9] disabled:bg-white/10 disabled:text-white/30 text-white rounded-xl font-bold transition-all disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(124,58,237,0.3)] hover:-translate-y-1 hover:shadow-[0_6px_25px_rgba(124,58,237,0.5)]"
                >
                  🚀 Thêm
                </button>
              </div>
            </div>

            {/* Modal Body: Danh sách & Chỉnh Sửa */}
            <div className="flex-1 overflow-y-auto p-6 sm:px-8 space-y-3">
              {participants.length === 0 ? (
                <div className="h-full min-h-[150px] flex flex-col items-center justify-center text-white/30 italic text-sm text-center">
                  <span className="text-3xl mb-3 opacity-50">📭</span>
                  <p>Danh sách đang trống!</p>
                  <p>Hãy thêm người vào để bắt đầu quay thưởng nhé.</p>
                </div>
              ) : (
                participants.map((p, i) => (
                  <div key={p.id} className="group relative flex items-center gap-3 bg-[#0a0518] border border-white/5 hover:border-purple-500/40 p-3 pl-4 rounded-xl transition-all">
                    <span 
                      className="w-3 h-3 rounded-full shrink-0 shadow-[0_0_10px_currentcolor]" 
                      style={{ background: SEGMENT_COLORS[i % SEGMENT_COLORS.length], color: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }} 
                    />
                    
                    {/* Input Edit Inline */}
                    <input
                      value={p.name}
                      onChange={(e) => handleUpdateName(p.id, e.target.value)}
                      className="flex-1 bg-transparent border-b border-transparent hover:border-white/20 focus:border-purple-500 focus:bg-white/5 text-[15px] font-medium text-white px-2 py-1 outline-none transition-all rounded-md"
                      maxLength={30}
                      title="Nhấn để sửa tên"
                    />

                    <button
                      onClick={() => handleRemove(p.id)}
                      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors opacity-70 group-hover:opacity-100"
                      title="Xóa người này"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 sm:px-8 border-t border-white/5 shrink-0 flex justify-end">
              <button
                onClick={() => setIsManageModalOpen(false)}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all font-[Orbitron] tracking-widest text-sm"
              >
                XONG (ENTER)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP KẾT QUẢ ĐẸP HƠN */}
      {showResult && winner && (
        <div className="result-overlay fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl" onClick={handleCloseResult}>
          <div
            className="result-card bg-gradient-to-br from-[#1c0f42] to-[#040212] border border-[var(--gold)]/30 rounded-3xl p-8 md:p-12 text-center max-w-lg w-full relative overflow-hidden shadow-[0_0_60px_rgba(255,215,0,0.15)] shadow-[var(--purple)]/20"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="winner-title"
          >
            <div className="absolute -inset-10 bg-gradient-conic from-transparent via-[var(--gold)]/10 to-transparent animate-[spin_8s_linear_infinite]" />
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="result-emoji text-6xl md:text-7xl mb-4 drop-shadow-2xl animate-bounce">🎇</div>
              <p id="winner-title" className="text-[10px] md:text-xs font-[Orbitron] font-bold text-[var(--gold)] tracking-[0.25em] uppercase opacity-80 mb-2">
                Chúc Mừng Người Chiến Thắng!
              </p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-[Orbitron] font-black bg-gradient-to-br from-[var(--gold)] via-[#ffeda3] to-white bg-clip-text text-transparent pb-2 mb-2 drop-shadow-[0_0_20px_rgba(255,215,0,0.4)]">
                {winner.name}
              </h2>
              <p className="text-white/40 text-xs md:text-sm font-medium tracking-wide mb-8 bg-black/30 rounded-full px-4 py-1">
                Phiên: {sessionId} · {new Date().toLocaleTimeString("vi-VN")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
                <button
                  onClick={() => { setShowResult(false); executeSpin(); }}
                  className="w-full sm:w-auto px-8 py-3 rounded-full font-[Orbitron] font-bold text-sm tracking-widest text-[#111] bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] shadow-[0_5px_20px_rgba(255,215,0,0.5)] hover:scale-105 hover:-translate-y-1 transition-all"
                >
                  🔄 QUAY TIẾP
                </button>
                <button
                  onClick={handleCloseResult}
                  className="w-full sm:w-auto px-8 py-3 rounded-full font-[Orbitron] font-bold text-sm tracking-widest text-white/70 bg-white/10 border border-white/20 hover:bg-white/20 hover:text-white transition-all"
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
