import { useEffect, useRef } from "react";

interface ParticleCanvasProps {
    onFlagFormed: () => void;
}

interface Particle {
    x: number;
    y: number;
    originX: number;
    originY: number;
    velocityX: number;
    velocityY: number;
    size: number;
    originSize: number;
    targetX: number;
    targetY: number;
    targetSize: number;
    color: string;
    targetColor: string;
}

export const Canva = ({ onFlagFormed }: ParticleCanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const backdropBlurRef = useRef<HTMLDivElement>(null);
    const onFlagFormedRef = useRef(onFlagFormed);

    useEffect(() => {
        onFlagFormedRef.current = onFlagFormed;
    }, [onFlagFormed]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        const backdropBlur = backdropBlurRef.current;

        if (!canvas || !context || !backdropBlur) return;

        let width = 0;
        let height = 0;
        let particles: Particle[] = [];
        let textCanvas: HTMLCanvasElement | null = null;
        let shimmerCanvas: HTMLCanvasElement | null = null;
        let shimmerContext: CanvasRenderingContext2D | null = null;
        let animationFrame = 0;
        let startTime = 0;
        let formationCompleteNotified = false;
        let blurHidden = false;

        const holdDuration = 3700;
        const scatterDuration = 2200;
        const formationDuration = 2500;
        const shimmerDuration = holdDuration;
        const gravity = 25;

        let flagLeft = 0;
        let flagTop = 0;
        let flagWidth = 0;
        let flagHeight = 0;

        const setup = () => {
            width = Math.max(1, Math.floor(canvas.clientWidth));
            height = Math.max(1, Math.floor(canvas.clientHeight));

            const pixelRatio = window.devicePixelRatio || 1;

            canvas.width = Math.round(width * pixelRatio);
            canvas.height = Math.round(height * pixelRatio);

            context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

            textCanvas = document.createElement("canvas");
            textCanvas.width = width;
            textCanvas.height = height;
            shimmerCanvas = document.createElement("canvas");
            shimmerCanvas.width = width;
            shimmerCanvas.height = height;
            shimmerContext = shimmerCanvas.getContext("2d");

            const textContext = textCanvas.getContext("2d");

            if (!textContext) {
                textCanvas = null;
                return;
            }

            const lines = width < 480
                ? [
                    "NIGERIA.",
                    "WE HAIL THEE.",
                    "UNITY FAITH",
                    "PEACE AND PROGRESS.",
                ]
                : [
                    "NIGERIA.",
                    "WE HAIL THEE.",
                    "UNITY FAITH PEACE AND PROGRESS.",
                ];

            let fontSize = Math.min(64, width * 0.075);

            textContext.font = `700 ${fontSize}px Arial, sans-serif`;

            const widestLine = Math.max(
                ...lines.map((line) => textContext.measureText(line).width)
            );

            const maxTextWidth = width * 0.9;

            if (widestLine > maxTextWidth) {
                fontSize *= maxTextWidth / widestLine;
                textContext.font = `700 ${fontSize}px Arial, sans-serif`;
            }

            // Create the text mask.
            textContext.fillStyle = "#ffffff";
            textContext.textAlign = "center";
            textContext.textBaseline = "middle";

            const lineHeight = fontSize * 1.4;
            const totalHeight = lineHeight * (lines.length - 1);
            const startY = (height - totalHeight) / 2;

            lines.forEach((line, index) => {
                textContext.fillText(
                    line,
                    width / 2,
                    startY + index * lineHeight
                );
            });

            // Use the text shape to restrict the backdrop blur to the letters.
            const textMask = `url("${textCanvas.toDataURL("image/png")}")`;

            backdropBlur.style.maskImage = textMask;
            backdropBlur.style.setProperty("-webkit-mask-image", textMask);
            backdropBlur.style.opacity = "1";
            blurHidden = false;

            const imageData = textContext.getImageData(
                0,
                0,
                width,
                height
            );

            const pixels = imageData.data;
            const gap = width < 480 ? 3 : 4;

            particles = [];

            for (let y = 0; y < height; y += gap) {
                for (let x = 0; x < width; x += gap) {
                    const pixelIndex = (y * width + x) * 4;
                    const alpha = pixels[pixelIndex + 3];

                    if (alpha > 100) {
                        particles.push({
                            x,
                            y,
                            originX: x,
                            originY: y,
                            velocityX: (Math.random() - 0.5) * 180,
                            velocityY: (Math.random() - 0.5) * 180,
                            size: gap,
                            originSize: gap,
                            targetX: x,
                            targetY: y,
                            targetSize: gap * 0.4,
                            color: "#008751",
                            targetColor: "#008751",
                        });
                    }
                }
            }

            // Nigerian flag dimensions: width-to-height ratio of 2:1.
            flagWidth = Math.min(width * 0.5, height);
            flagHeight = flagWidth / 2;

            flagLeft = (width - flagWidth) / 2;
            flagTop = height * 0.07;

            if (particles.length === 0) return;

            // Create a complete rectangular particle grid.
            const columns = Math.max(
                1,
                Math.ceil(
                    Math.sqrt(particles.length * (flagWidth / flagHeight))
                )
            );

            const rows = Math.floor(particles.length / columns);

            if (rows === 0) return;

            // Remove the incomplete final row to prevent stray particles.
            particles = particles.slice(0, rows * columns);

            const cellWidth = flagWidth / columns;
            const cellHeight = flagHeight / rows;
            const targetSize = Math.min(cellWidth, cellHeight) * 0.42;

            particles.forEach((particle, index) => {
                const column = index % columns;
                const row = Math.floor(index / columns);
                const horizontalPosition = (column + 0.5) / columns;

                particle.targetX = flagLeft + (column + 0.5) * cellWidth;
                particle.targetY = flagTop + (row + 0.5) * cellHeight;
                particle.targetSize = targetSize;

                // Nigerian flag: green, white, green.
                particle.targetColor =
                    horizontalPosition < 1 / 3 ||
                    horizontalPosition >= 2 / 3
                        ? "#008751"
                        : "#ffffff";
            });
        };

        const blendColor = (
            progress: number,
            targetColor: string
        ): string => {
            const target = targetColor === "#ffffff"
                ? [255, 255, 255]
                : [0, 135, 81];

            const red = Math.round(target[0] * progress);
            const green = Math.round(135 + (target[1] - 135) * progress);
            const blue = Math.round(81 + (target[2] - 81) * progress);

            return `rgb(${red}, ${green}, ${blue})`;
        };

        const drawParticle = (particle: Particle) => {
            context.fillStyle = particle.color;
            context.beginPath();
            context.arc(
                particle.x,
                particle.y,
                particle.size,
                0,
                Math.PI * 2
            );
            context.fill();
        };

        // Draw translucent glass-like text with a light-green-to-white gradient.
        const drawTranslucentText = () => {
            if (!textCanvas) return;

            context.drawImage(textCanvas, 0, 0);

            const gradient = context.createLinearGradient(0, 0, width, 0);

            gradient.addColorStop(0, "rgba(144, 238, 144, 0.20)");
            gradient.addColorStop(0.25, "rgba(200, 255, 200, 0.30)");
            gradient.addColorStop(0.45, "rgba(240, 255, 240, 0.42)");
            gradient.addColorStop(0.52, "rgba(255, 255, 255, 0.52)");
            gradient.addColorStop(0.70, "rgba(220, 255, 220, 0.35)");
            gradient.addColorStop(1, "rgba(144, 238, 144, 0.20)");

            context.globalCompositeOperation = "source-in";
            context.fillStyle = gradient;
            context.fillRect(0, 0, width, height);

            context.globalCompositeOperation = "source-over";
        };

        // Sweep a bright white highlight with a soft light-green glow.
        const drawTextShimmer = (elapsed: number) => {
            if (!textCanvas || !shimmerCanvas || !shimmerContext) return;

            // Repeat the shimmer independently of the text hold duration.
            const progress = (elapsed % shimmerDuration) / shimmerDuration;
            const centerX = -140 + progress * (width + 280);

            shimmerContext.clearRect(0, 0, width, height);

            const gradient = shimmerContext.createLinearGradient(
                centerX - 100,
                0,
                centerX + 100,
                0
            );
        
            gradient.addColorStop(0, "rgba(144, 238, 144, 0)");
            gradient.addColorStop(0.32, "rgba(144, 238, 144, 0.04)");
            gradient.addColorStop(0.42, "rgba(144, 238, 144, 0.28)");
            gradient.addColorStop(0.48, "rgba(210, 255, 210, 0.75)");
            gradient.addColorStop(0.5, "rgba(255, 255, 255, 1)");
            gradient.addColorStop(0.52, "rgba(220, 255, 220, 0.85)");
            gradient.addColorStop(0.60, "rgba(144, 238, 144, 0.25)");
            gradient.addColorStop(0.72, "rgba(144, 238, 144, 0)");
            gradient.addColorStop(1, "rgba(144, 238, 144, 0)");
        
            shimmerContext.fillStyle = gradient;
            shimmerContext.fillRect(0, 0, width, height);
        
            // Restrict the highlight to the actual text glyphs.
            shimmerContext.globalCompositeOperation = "destination-in";
            shimmerContext.drawImage(textCanvas, 0, 0);
            shimmerContext.globalCompositeOperation = "source-over";
        
            // Layer the bright highlight over the translucent text.
            context.globalCompositeOperation = "source-over";
            context.drawImage(shimmerCanvas, 0, 0);
        };

        const animate = (now: number) => {
            if (!textCanvas) return;

            const elapsed = now - startTime;

            // Keep the canvas itself transparent.
            context.clearRect(0, 0, width, height);

            // Phase 1: translucent glass text with a repeating shimmer.
            if (elapsed < holdDuration) {
                if (blurHidden) {
                    backdropBlur.style.opacity = "1";
                    blurHidden = false;
                }

                drawTranslucentText();
                drawTextShimmer(elapsed);

                animationFrame = window.requestAnimationFrame(animate);
                return;
            }

            // Remove the backdrop blur as the text scatters.
            if (!blurHidden) {
                backdropBlur.style.opacity = "0";
                blurHidden = true;
            }

            // Phase 2: scatter the declaration into particles.
            if (elapsed < holdDuration + scatterDuration) {
                const seconds = (elapsed - holdDuration) / 1000;

                for (const particle of particles) {
                    particle.x =
                        particle.originX + particle.velocityX * seconds;

                    particle.y =
                        particle.originY +
                        particle.velocityY * seconds +
                        0.5 * gravity * seconds ** 2;

                    particle.color = "#008751";
                    particle.size = particle.originSize;

                    drawParticle(particle);
                }

                animationFrame = window.requestAnimationFrame(animate);
                return;
            }

            // Phase 3: particles form the Nigerian flag.
            const formationElapsed =
                elapsed - holdDuration - scatterDuration;

            const progress = Math.min(
                formationElapsed / formationDuration,
                1
            );

            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const scatterSeconds = scatterDuration / 1000;

            for (const particle of particles) {
                const scatterX =
                    particle.originX + particle.velocityX * scatterSeconds;

                const scatterY =
                    particle.originY +
                    particle.velocityY * scatterSeconds +
                    0.5 * gravity * scatterSeconds ** 2;

                particle.x =
                    scatterX +
                    (particle.targetX - scatterX) * easedProgress;

                particle.y =
                    scatterY +
                    (particle.targetY - scatterY) * easedProgress;

                particle.size =
                    particle.originSize +
                    (particle.targetSize - particle.originSize) *
                        easedProgress;

                particle.color = blendColor(
                    easedProgress,
                    particle.targetColor
                );

                drawParticle(particle);
            }

            if (progress < 1) {
                animationFrame = window.requestAnimationFrame(animate);
            } else if (!formationCompleteNotified) {
                formationCompleteNotified = true;
                onFlagFormedRef.current();
            }
        };

        setup();

        startTime = performance.now();
        animationFrame = window.requestAnimationFrame(animate);

        const handleResize = () => {
            window.cancelAnimationFrame(animationFrame);

            setup();

            formationCompleteNotified = false;
            startTime = performance.now();

            animationFrame = window.requestAnimationFrame(animate);
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.cancelAnimationFrame(animationFrame);
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return (
        <>
            <div
                ref={backdropBlurRef}
                className="text-backdrop-blur"
                aria-hidden="true"
            />

            <canvas
                ref={canvasRef}
                className="final-canvas"
                aria-label="Nigerian independence declaration transforming into the Nigerian flag"
                role="img"
            />
        </>
    );
};