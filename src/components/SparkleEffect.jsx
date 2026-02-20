import { useEffect, useState, useRef } from "react";

/**
 * SparkleEffect – Premium notification attention effect.
 *
 * TWO layers on every notification switch:
 *  1. Gold shimmer wipe  – a bright golden light sweeps left→right across
 *     the entire banner, like sunlight glinting off glass.
 *  2. Rising ✨ embers   – 10 sparkle glyphs rise from the banner floor
 *     and fade out, staggered at random horizontal positions.
 *
 * Props:
 *   trigger – any value; change fires a new effect cycle.
 */
export default function SparkleEffect({ trigger }) {
    const [visible, setVisible] = useState(false);
    const [particles, setParticles] = useState([]);
    const waveId = useRef(0);

    useEffect(() => {
        waveId.current += 1;
        const id = waveId.current;

        // 1. Trigger shimmer wipe
        setVisible(false);
        // force reflow so animation restarts
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (waveId.current === id) setVisible(true);
            });
        });

        // 2. Generate rising ember particles
        const GLYPHS = ["✨", "✨", "⋆", "✦", "✧", "✨", "★", "✨", "⋆", "✦"];
        const newParticles = GLYPHS.map((g, i) => ({
            id: `${id}-${i}`,
            glyph: g,
            leftPct: 4 + Math.random() * 92,   // spread across full width
            size: 13 + Math.random() * 9,
            delay: Math.random() * 500,         // staggered start
            dur: 900 + Math.random() * 400,
            riseHeight: 30 + Math.random() * 35, // px rise upward
            wobble: (Math.random() - 0.5) * 20,  // slight horizontal drift
        }));
        setParticles(newParticles);

        // Clean up after all animations finish
        const cleanup = setTimeout(() => {
            if (waveId.current === id) {
                setVisible(false);
                setParticles([]);
            }
        }, 1600);

        return () => clearTimeout(cleanup);
    }, [trigger]);

    return (
        <>
            {/* ── Layer 1: Gold shimmer wipe ── */}
            {visible && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "inherit",
                        pointerEvents: "none",
                        overflow: "hidden",
                        zIndex: 5,
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "60%",
                            height: "100%",
                            background:
                                "linear-gradient(90deg, transparent 0%, rgba(255, 215, 0, 0.18) 40%, rgba(255, 255, 200, 0.35) 50%, rgba(255, 215, 0, 0.18) 60%, transparent 100%)",
                            animation: "shimmerWipe 0.85s cubic-bezier(0.4, 0, 0.2, 1) both",
                        }}
                    />
                </div>
            )}

            {/* ── Layer 2: Rising ✨ ember particles ── */}
            {particles.length > 0 && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "inherit",
                        pointerEvents: "none",
                        overflow: "hidden",
                        zIndex: 6,
                    }}
                >
                    {particles.map((p) => (
                        <span
                            key={p.id}
                            style={{
                                position: "absolute",
                                left: `${p.leftPct}%`,
                                bottom: "0%",
                                fontSize: `${p.size}px`,
                                lineHeight: 1,
                                display: "inline-block",
                                pointerEvents: "none",
                                userSelect: "none",
                                animation: `emberRise ${p.dur}ms ease-out ${p.delay}ms both`,
                                filter: "drop-shadow(0 0 5px rgba(255, 210, 0, 0.95))",
                                // pass CSS custom props for keyframe targets
                                "--rise": `-${p.riseHeight}px`,
                                "--wobble": `${p.wobble}px`,
                            }}
                        >
                            {p.glyph}
                        </span>
                    ))}
                </div>
            )}
        </>
    );
}
