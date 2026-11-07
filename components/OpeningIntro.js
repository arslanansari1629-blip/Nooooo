'use client';

import { useEffect, useState } from 'react';

const STAGES = ['INITIALIZING INTELLIGENCE', 'CONNECTING TO NVIDIA NIM', 'YOUR WORKSPACE IS READY'];
const PARTICLES = [
  [12, 23, 0], [22, 72, 1.2], [33, 15, 2.1], [76, 19, .7], [86, 64, 1.8],
  [68, 82, 2.8], [17, 48, 3.1], [91, 35, 2.4], [44, 87, 1.5], [58, 8, 3.5],
];

export default function OpeningIntro({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const startedAt = performance.now();
    const duration = 2500;
    const progressTimer = setInterval(() => {
      const next = Math.min(100, Math.round(((performance.now() - startedAt) / duration) * 100));
      setProgress(next);
      setStage(next < 38 ? 0 : next < 82 ? 1 : 2);
      if (next === 100) clearInterval(progressTimer);
    }, 40);
    const exitTimer = setTimeout(() => setExiting(true), 2700);
    const completeTimer = setTimeout(onComplete, 3400);
    return () => {
      clearInterval(progressTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const skip = () => {
    setExiting(true);
    setTimeout(onComplete, 450);
  };

  return (
    <div className={`opening-intro ${exiting ? 'intro-exiting' : ''}`} role="dialog" aria-label="Opening Nexora">
      <div className="intro-grid" />
      <div className="intro-aurora intro-aurora-one" />
      <div className="intro-aurora intro-aurora-two" />
      <div className="intro-particles" aria-hidden="true">
        {PARTICLES.map(([x, y, delay], index) => <i key={index} style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${delay}s` }} />)}
      </div>

      <div className="intro-topline">
        <div className="intro-system-label"><i /> NEXORA SYSTEM <span>/</span> V1.1</div>
        <div className="intro-developer">ARSLAN <span>/</span> EDITZ900S</div>
      </div>

      <div className="intro-center">
        <div className="intro-emblem" aria-hidden="true">
          <span className="intro-orbit orbit-outer"><i /><i /></span>
          <span className="intro-orbit orbit-middle"><i /></span>
          <span className="intro-orbit orbit-inner" />
          <span className="intro-crosshair horizontal" />
          <span className="intro-crosshair vertical" />
          <svg className="intro-star" viewBox="0 0 64 64" fill="none">
            <defs><linearGradient id="intro-gradient" x1="8" y1="8" x2="56" y2="56"><stop stopColor="#DDD5FF" /><stop offset=".5" stopColor="#A58AF4" /><stop offset="1" stopColor="#7454D2" /></linearGradient></defs>
            <path d="M32 5 38.7 25.3 59 32l-20.3 6.7L32 59l-6.7-20.3L5 32l20.3-6.7L32 5Z" fill="url(#intro-gradient)" />
            <circle cx="50" cy="12" r="4" fill="#D8F9B8" />
          </svg>
          <span className="intro-scan" />
        </div>

        <div className="intro-wordmark" aria-label="Nexora">
          {'nexora'.split('').map((letter, index) => <span key={index} style={{ animationDelay: `${.35 + index * .07}s` }}>{letter}</span>)}<b>.</b>
        </div>
        <p className="intro-tagline">THINK BEYOND.</p>
        <div className="intro-stage" key={stage}><span>{String(stage + 1).padStart(2, '0')}</span>{STAGES[stage]}</div>
      </div>

      <div className="intro-bottom">
        <div className="intro-progress-meta"><span>NEURAL INTERFACE</span><strong>{String(progress).padStart(3, '0')}%</strong></div>
        <div className="intro-progress-track"><span style={{ width: `${progress}%` }} /></div>
        <div className="intro-footer"><span><i /> SECURE CONNECTION</span><button onClick={skip}>SKIP INTRO <b>↗</b></button></div>
      </div>
      <div className="intro-shutter left" /><div className="intro-shutter right" />
    </div>
  );
}
