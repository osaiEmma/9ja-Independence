import { useEffect, useRef } from "react";
import paper from "paper";

type Star = {
    dot: paper.Path;
    minOpacity: number;
    twinkleAmount: number;
    twinkleSpeed: number;
    twinklePhase: number;
};

export const Stars = () => {
    const starsCanvaRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = starsCanvaRef.current;

        if (!canvas) return;

        const scope = new paper.PaperScope();

        // Match the canvas drawing dimensions to its actual screen size.
        const initialBounds = canvas.getBoundingClientRect();

        canvas.width = Math.max(1, Math.round(initialBounds.width));
        canvas.height = Math.max(1, Math.round(initialBounds.height));

        scope.setup(canvas);

        let stars: Star[] = [];

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        const createStars = () => {
            // Remove old stars when rebuilding after a resize.
            stars.forEach(({ dot }) => dot.remove());
            stars = [];

            const { width, height } = scope.view.viewSize;

            const starCount = Math.min(
                250,
                Math.max(
                    100,
                    Math.round((width * height) / 5000)
                )
            );

            for (let i = 0; i < starCount; i++) {
                // Each star has a fixed position.
                const position = new scope.Point(
                    Math.random() * width / (i + 1) * 100,
                    Math.random() * height / (i + 1) * 100
                );

                const radius =  Math.random() * 5;

                const dot = new scope.Path.Circle({
                    center: position,
                    radius,
                    fillColor: new scope.Color(
                        Math.random() < 0.15 ? "#b8dfff" : "#ffffff"
                    ),
                });

                stars.push({
                    dot,
                    minOpacity: 0.3 + Math.random() * 0.3,
                    twinkleAmount: 0.9 + Math.random() * 0.4,
                    twinkleSpeed: 1 + Math.random() * 2.5,
                    twinklePhase: Math.random() * Math.PI * 2,
                });
            }

            scope.view.update();
        };

        createStars();

        // Twinkle without changing the stars' positions.
        if (!prefersReducedMotion) {
            scope.view.onFrame = (event: any) => {
                for (const star of stars) {
                    const wave =
                        (Math.sin(
                            event.time * star.twinkleSpeed +
                            star.twinklePhase
                        ) + 1) / 2;

                    star.dot.opacity =
                        star.minOpacity +
                        wave * star.twinkleAmount;
                }
            };

            scope.view.play();
        }

        // Recreate the starfield if the canvas changes size.
        const resizeObserver = new ResizeObserver(() => {
            const rect = canvas.getBoundingClientRect();

            const width = Math.max(1, Math.round(rect.width));
            const height = Math.max(1, Math.round(rect.height));

            if (
                scope.view.viewSize.width === width &&
                scope.view.viewSize.height === height
            ) {
                return;
            }

            scope.view.viewSize = new scope.Size(width, height);

            createStars();
        });

        resizeObserver.observe(canvas);

        return () => {
            resizeObserver.disconnect();

            scope.view.onFrame = null;
            scope.view.pause();
            scope.project.clear();
        };
    }, []);

    return (
        <canvas
            ref={starsCanvaRef}
            aria-hidden="true"
            style={{
                position: "absolute",
                inset: 0,
                display: "block",
                width: "100%",
                height: "100%",
                pointerEvents: "none",
            }}
        />
    );
};