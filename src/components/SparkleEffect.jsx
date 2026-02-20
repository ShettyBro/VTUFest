import { useEffect, useState, useRef } from "react";

/**
 * SparkleEffect – Left-to-Right ✨ sweep on every notification change.
 *
 * Props:
 *   trigger  – any value; changing it fires a new sweep wave
 *   count    – number of sparkle glyphs in the wave (default 12)
 */
export default function SparkleEffect({ trigger, count = 12 }) {
    const [sparkles, setSparkles] = useState([]);
    const waveId = useRef(0);

    useEffect(() => {
        waveId.current += 1;
        const id = waveId.current;

        const GLYPHS = ["✨", "⋆", "✦", "✧", "★", "✨"];

        // Stagger each sparkle so they travel left → right as a wave
        const newSparkles = Array.from({ length: count }, (_, i) => ({
            id: `${id}-${i}`,
            glyph: GLYPHS[i % GLYPHS.length],
            // Spread evenly across 0% → 100% width, each starting slightly later
            startX: (i / (count - 1)) * 100, // percent X position across banner
            // vertically scattered between 10% and 90%
            topPct: 10 + Math.random() * 70,
            size: 14 + Math.random() * 10,
            // delay increases left → right so the sweep travels across
            delay: (i / (count - 1)) * 600,
            dur: 700 + Math.random() * 300,
        }));

        setSparkles(newSparkles);

        // Clean up after all animations finish (max delay + max dur + buffer)
        const cleanup = setTimeout(() => setSparkles([]), 1600);
        return () => clearTimeout(cleanup);
    }, [trigger]);

    if (sparkles.length === 0) return null;

    return (
        <div
            aria-hidden="true"
            style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                overflow: "hidden",
                zIndex: 10,
                borderRadius: "inherit",
            }}
        >
            {sparkles.map((s) => (
                <span
                    key={s.id}
                    style={{
                        position: "absolute",
                        left: `${s.startX}%`,
                        top: `${s.topPct}%`,
                        fontSize: `${s.size}px`,
                        lineHeight: 1,
                        display: "inline-block",
                        animation: `sparkleSweep ${s.dur}ms ease-out ${s.delay}ms both`,
                        pointerEvents: "none",
                        userSelect: "none",
                        filter: "drop-shadow(0 0 4px rgba(255,220,50,0.9))",
                    }}
                >
                    {s.glyph}
                </span>
            ))}
        </div>
    );
}
