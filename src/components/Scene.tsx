import React from "react";

export interface SceneInterface {
    imageUrl?: string;
    videoUrl?: string;
    backdropImageUrl?: string;
    text?: string;
    showText?: boolean;
    sceneStyle?: React.CSSProperties;
    sceneClass?: string;
    mediaStyle?: React.CSSProperties;
    mediaClass?: string;
    mediaDivStyle?: React.CSSProperties;
    mediaDivClass?: string;
    textStyle?: React.CSSProperties;
    textClass?: string;
    textDivStyle?: React.CSSProperties;
    textDivClass?: string;
    onComplete?: () => void;
}

export const Scene = (props: SceneInterface) => {
    const hasVideo = Boolean(props.videoUrl);
    const hasImage = Boolean(props.imageUrl);
    const hasMedia = hasVideo || hasImage;

    const reportImageError = (src?: string) => {
        console.error("Scene image failed to load:", src);
    };

    return (
        <div className={props.sceneClass} style={props.sceneStyle}>
            {hasMedia && (
                <div
                    className={props.mediaDivClass}
                    style={props.mediaDivStyle}
                >
                    {hasVideo && props.backdropImageUrl && (
                        <img
                            src={props.backdropImageUrl}
                            alt=""
                            className="scene-backdrop"
                            aria-hidden="true"
                            onError={() =>
                                reportImageError(props.backdropImageUrl)
                            }
                        />
                    )}

                    {!hasVideo && hasImage && (
                        <img
                            src={props.imageUrl}
                            alt=""
                            className="scene-backdrop"
                            aria-hidden="true"
                            onError={() =>
                                reportImageError(props.imageUrl)
                            }
                        />
                    )}

                    {hasVideo ? (
                        <video
                            src={props.videoUrl}
                            className={`${props.mediaClass ?? ""} scene-foreground`}
                            style={props.mediaStyle}
                            autoPlay
                            muted
                            loop
                            playsInline
                            preload="auto"
                            onLoadedData={() => {
                                console.log(
                                    "Video data loaded:",
                                    props.videoUrl
                                );
                            }}
                            onPlaying={() => {
                                console.log(
                                    "Video playing:",
                                    props.videoUrl
                                );
                            }}
                            onWaiting={() => {
                                console.warn(
                                    "Video waiting for data:",
                                    props.videoUrl
                                );
                            }}
                            onError={(event) => {
                                const video = event.currentTarget;

                                console.error("Video failed:", {
                                    src: video.currentSrc || props.videoUrl,
                                    errorCode: video.error?.code,
                                    errorMessage: video.error?.message,
                                });
                            }}
                        />
                    ) : (
                        <img
                            src={props.imageUrl}
                            alt={props.text || "Scene image"}
                            className={`${props.mediaClass ?? ""} scene-foreground`}
                            style={props.mediaStyle}
                            onError={() =>
                                reportImageError(props.imageUrl)
                            }
                        />
                    )}
                </div>
            )}

            {props.text && props.showText !== false && (
                <div
                    className={props.textDivClass}
                    style={props.textDivStyle}
                >
                    <h1
                        className={props.textClass}
                        style={props.textStyle}
                    >
                        {props.text}
                    </h1>
                </div>
            )}
        </div>
    );
};