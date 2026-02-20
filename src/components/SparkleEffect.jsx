import { useEffect, useState, useRef } from "react";

/**
 * SparkleEffect
 * Renders gold ★ / ✦ / · particles that burst outward from the
 * notification banner every time `trigger` changes.
 *
 * Props:
 *   trigger  – any value; changing it fires a new burst
 *   count    – number of sparkle particles (default 18)
 */
export default function SparkleEffect({ trigger, count = 18 }) {
    const [particles, setParticles] = useState([]);
    const burstId = useRef(0);

    useEffect(() => {
        // Fire a new burst every time the trigger changes
        burstId.current += 1;
        const id = burstId.current;

        const GLYPHS = ["★", "✦", "✧", "·", "✶", "⋆"];
        const newParticles = Array.from({ length: count }, (_, i) => ({
            id: `${id}-${i}`,
            glyph: GLYPHS[i % GLYPHS.length],
            // random angle in full circle
            angle: Math.random() * 360,
            // travel distance 40–120 px
            dist: 40 + Math.random() * 80,
            // size 10–18 px
            size: 10 + Math.random() * 8,
            // delay 0–300 ms so they don't all fire at once
            delay: Math.random() * 300,
            // duration 600–1000 ms
            dur: 600 + Math.random() * 400,
            // random gold hue: pure gold → amber → pale yellow
            color: `hsl(${38 + Math.random() * 20}, 100%, ${60 + Math.random() * 20}%)`,
        }));

        setParticles(newParticles);

        // Clean up after the longest possible animation finishes
        const cleanup = setTimeout(() => setParticles([]), 1400);
        return () => clearTimeout(cleanup);
    }, [trigger]);

    if (particles.length === 0) return null;

    return (
        <div
            aria-hidden="true"
            style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                overflow: "visible",
                zIndex: 10,
            }}
        >
            {particles.map((p) => {
                const rad = (p.angle * Math.PI) / 180;
                const tx = Math.cos(rad) * p.dist;
                const ty = Math.sin(rad) * p.dist;

                return (
                    <span
                        key={p.id}
                        style={{
                            position: "absolute",
                            // start from horizontal center, vertical middle of banner
                            left: "50%",
                            top: "50%",
                            fontSize: `${p.size}px`,
                            color: p.color,
                            pointerEvents: "none",
                            userSelect: "none",
                            display: "inline-block",
                            animation: `sparkleBurst ${p.dur}ms ease-out ${p.delay}ms both`,
                            // CSS custom properties for the keyframe target
                            "--tx": `${tx}px`,
                            "--ty": `${ty}px`,
                            textShadow: `0 0 6px ${p.color}`,
                        }}
                    >
                        {p.glyph}
                    </span>
                );
            })}
        </div>
    );
}
