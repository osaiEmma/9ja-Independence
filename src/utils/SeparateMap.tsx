import { useEffect, useRef } from "react";
import paper from "paper";

type SourcePath = paper.Path | paper.CompoundPath;

type Direction = {
    name: string;
    from: paper.Point;
    to: paper.Point;
    color: string;
};

type SeperateMapProps = {
    divClassName?: string;
    convasClassName?: string;
    divStyle?: React.CSSProperties;
    canvasStyle?: React.CSSProperties;
    onComplete?: () => void;
};

type SliceAnimation = {
    group: paper.Group;
    start: paper.Point;
    target: paper.Point;
    delay: number;
};

export const SeparateMap = (props: SeperateMapProps) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const onCompleteRef = useRef(props.onComplete);
    onCompleteRef.current = props.onComplete;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        canvas.width = Math.max(1, Math.round(rect.width));
        canvas.height = Math.max(1, Math.round(rect.height));

        const scope = new paper.PaperScope();
        scope.setup(canvas);

        let cancelled = false;

        const loadSvg = async () => {
            try {
                const response = await fetch(
                    `${import.meta.env.BASE_URL}map/Nigeria_map.svg`
                );

                if (!response.ok) {
                    throw new Error(`Failed to load SVG: ${response.status}`);
                }

                const svgText = await response.text();
                if (cancelled) return;

                const importedSvg = scope.project.importSVG(svgText, {
                    expandShapes: true,
                    insert: false,
                });

                const collectPaths = (item: paper.Item): SourcePath[] => {
                    if (
                        item instanceof scope.Path ||
                        item instanceof scope.CompoundPath
                    ) {
                        return [item];
                    }

                    if (item instanceof scope.Group) {
                        return item.children.flatMap(collectPaths);
                    }

                    return [];
                };

                const sourcePaths = collectPaths(importedSvg);
                if (!sourcePaths.length) {
                    throw new Error("No SVG paths were found.");
                }

                const mainPath = sourcePaths.reduce((largest, current) =>
                    current.bounds.width * current.bounds.height >
                    largest.bounds.width * largest.bounds.height
                        ? current
                        : largest
                );

                const center = mainPath.bounds.center;
                const bounds = importedSvg.bounds;
                const padding = 1;
                const left = bounds.left - padding;
                const top = bounds.top - padding;
                const right = bounds.right + padding;
                const bottom = bounds.bottom + padding;

                const directions: Direction[] = [
                    {
                        name: "top-left",
                        from: new scope.Point(left, top),
                        to: center,
                        color: "white",
                    },
                    {
                        name: "top-right",
                        from: new scope.Point(center.x, top),
                        to: new scope.Point(right, center.y),
                        color: "#008751",
                    },
                    {
                        name: "bottom-left",
                        from: new scope.Point(left, center.y),
                        to: new scope.Point(center.x, bottom),
                        color: "#008751",
                    },
                    {
                        name: "bottom-right",
                        from: center,
                        to: new scope.Point(right, bottom),
                        color: "white",
                    },
                ];

                const slicedMap = new scope.Group({
                    name: "nigeria-map-sliced",
                    insert: false,
                });

                const sectionGroups: {
                    group: paper.Group;
                    direction: Direction;
                }[] = [];

                for (const direction of directions) {
                    const cuttingBox = new scope.Path.Rectangle({
                        from: direction.from,
                        to: direction.to,
                        insert: false,
                    });

                    const group = new scope.Group({
                        name: direction.name,
                        insert: false,
                    });

                    for (const sourcePath of sourcePaths) {
                        const piece = sourcePath.intersect(cuttingBox, {
                            insert: false,
                        });

                        if (piece.isEmpty()) {
                            piece.remove();
                            continue;
                        }

                        piece.fillColor = new scope.Color(direction.color);
                        piece.strokeColor = null;
                        group.addChild(piece);
                    }

                    cuttingBox.remove();

                    if (group.children.length) {
                        slicedMap.addChild(group);
                        sectionGroups.push({ group, direction });
                    } else {
                        group.remove();
                        console.warn(
                            `No geometry produced for ${direction.name}`
                        );
                    }
                }

                if (!sectionGroups.length) {
                    throw new Error("No map sections were produced.");
                }

                scope.project.activeLayer.addChild(slicedMap);
                slicedMap.fitBounds(scope.view.bounds.scale(0.55));

                const viewport = scope.view.bounds;
                const gap = 24;

                const getStartOffset = (
                    name: string,
                    bounds: paper.Rectangle
                ): paper.Point => {
                    switch (name) {
                        case "top-left":
                            return new scope.Point(
                                viewport.left - gap - bounds.right,
                                viewport.top - gap - bounds.bottom
                            );

                        case "top-right":
                            return new scope.Point(
                                viewport.right + gap - bounds.left,
                                viewport.top - gap - bounds.bottom
                            );

                        case "bottom-left":
                            return new scope.Point(
                                viewport.left - gap - bounds.right,
                                viewport.bottom + gap - bounds.top
                            );

                        default:
                            return new scope.Point(
                                viewport.right + gap - bounds.left,
                                viewport.bottom + gap - bounds.top
                            );
                    }
                };

                const animations: SliceAnimation[] = sectionGroups.map(
                    ({ group, direction }, index) => {
                        const target = group.position.clone();
                        const start = target.add(
                            getStartOffset(direction.name, group.bounds)
                        );

                        group.position = start;
                        group.opacity = 0;

                        return {
                            group,
                            start,
                            target,
                            delay: index * 0.12,
                        };
                    }
                );

                const assemblyDuration = 1.1;
                const zoomDuration = 1.25;
                const targetZoomScale = 4;

                let elapsed = 0;
                let zoomElapsed = 0;
                let previousZoomScale = 1;
                let stage: "assembly" | "zoom" = "assembly";
                let zoomCenter: paper.Point | null = null;

                scope.view.onFrame = (event: any) => {
                    if (!event || cancelled) return;

                    if (stage === "assembly") {
                        elapsed += event.delta;
                        let allFinished = true;

                        for (const animation of animations) {
                            const time = elapsed - animation.delay;

                            if (time <= 0) {
                                allFinished = false;
                                continue;
                            }

                            const progress = Math.min(
                                time / assemblyDuration,
                                1
                            );
                            const eased = 1 - Math.pow(1 - progress, 3);

                            if (progress < 1) allFinished = false;

                            const distance = animation.target.subtract(
                                animation.start
                            );

                            animation.group.position = animation.start.add(
                                distance.multiply(eased)
                            );
                            animation.group.opacity = eased;
                        }

                        if (allFinished) {
                            stage = "zoom";
                            zoomCenter = slicedMap.bounds.center.clone();
                            console.log("Map assembled. Starting zoom.");
                        }

                        return;
                    }

                    zoomElapsed += event.delta;

                    const progress = Math.min(
                        zoomElapsed / zoomDuration,
                        1
                    );
                    const eased = Math.pow(progress, 3);
                    const currentScale =
                        1 + (targetZoomScale - 1) * eased;

                    if (zoomCenter) {
                        slicedMap.scale(
                            currentScale / previousZoomScale,
                            zoomCenter
                        );
                    }

                    previousZoomScale = currentScale;

                    if (progress >= 1) {
                        scope.view.onFrame = null;
                        scope.view.pause();

                        console.log("Map zoom completed.");
                        if (!cancelled) onCompleteRef.current?.();
                    }
                };

                scope.view.play();
                console.log("Map formation animation started.");
            } catch (error) {
                if (!cancelled) {
                    console.error("Error separating Nigeria map:", error);
                }
            }
        };

        void loadSvg();

        return () => {
            cancelled = true;
            scope.view.onFrame = null;
            scope.view.pause();
            scope.project.clear();
        };
    }, []);

    return (
        <div style={props.divStyle} className={props.divClassName}>
            <canvas
                ref={canvasRef}
                width={900}
                height={700}
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "block",
                    width: "100%",
                    height: "100%",
                    maxWidth: "none",
                    ...props.canvasStyle,
                }}
                className={props.convasClassName}
            />
        </div>
    );
};