import { useCallback, useEffect, useRef, useState } from "react";
import { env_config } from "../utils/import";

const voiceByScene: Record<number, string> = {
    0: `${env_config}audio/our_culture.mp3`,
    1: `${env_config}audio/our_heritage.mp3`,
    2: `${env_config}audio/our_tribes.mp3`,
    3: `${env_config}audio/our_people.mp3`,
    4: `${env_config}audio/our_delicacies.mp3`,
};

const introVoice: string[] = [
    `${env_config}audio/Intro0.mp3`,
    `${env_config}audio/Intro1.mp3`,
    `${env_config}audio/Intro2.mp3`,
    `${env_config}audio/Intro3.mp3`,
    `${env_config}audio/Nigeria.mp3`,
];

type VoiceKind = "intro" | "scene" | null;

const clearVoiceHandlers = (voice: HTMLAudioElement) => {
    voice.onplaying = null;
    voice.onended = null;
    voice.onerror = null;
};

const isNotAllowedError = (error: unknown): boolean =>
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "NotAllowedError";

export const useHeritageAudio = () => {
    const drumRef = useRef<HTMLAudioElement | null>(null);
    const voiceRef = useRef<HTMLAudioElement | null>(null);

    const audioEnabledRef = useRef(false);
    const currentSceneRef = useRef(0);
    const currentIntroIndexRef = useRef<number | null>(null);
    const introSequenceCompletedRef = useRef(false);

    const playbackTokenRef = useRef(0);
    const activeVoiceKindRef = useRef<VoiceKind>(null);
    const activeVoiceSrcRef = useRef<string | null>(null);

    const sceneVoiceCompletionRef = useRef<(() => void) | null>(null);
    const sceneVoiceStartRef = useRef<(() => void) | null>(null);

    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [isIntro, setIsIntro] = useState(false);
    const [currentIntroIndex, setCurrentIntroIndex] =
        useState<number | null>(null);
    const [introSequenceCompleted, setIntroSequenceCompleted] =
        useState(false);

    useEffect(() => {
        const drum = new Audio(`${env_config}audio/moja.mp3`);
        drum.preload = "auto";
        drum.loop = true;
        drum.volume = 0.6;

        const voice = new Audio();
        voice.preload = "auto";
        voice.volume = 1;

        drumRef.current = drum;
        voiceRef.current = voice;

        drum.load();

        return () => {
            playbackTokenRef.current += 1;

            sceneVoiceCompletionRef.current?.();
            sceneVoiceCompletionRef.current = null;

            drum.pause();
            voice.pause();

            clearVoiceHandlers(voice);

            drum.removeAttribute("src");
            voice.removeAttribute("src");

            drum.load();
            voice.load();

            drumRef.current = null;
            voiceRef.current = null;
            activeVoiceKindRef.current = null;
            activeVoiceSrcRef.current = null;
            sceneVoiceStartRef.current = null;
        };
    }, []);

    const finishIntroSequence = useCallback(() => {
        currentIntroIndexRef.current = null;
        introSequenceCompletedRef.current = true;

        setCurrentIntroIndex(null);
        setIntroSequenceCompleted(true);
        setIsIntro(false);

        if (drumRef.current) {
            drumRef.current.volume = 0.6;
        }
    }, []);

    const playIntroClip = useCallback(
        (index: number, resume = false) => {
            const voice = voiceRef.current;
            const src = introVoice[index];

            if (!voice || !src) {
                finishIntroSequence();
                return;
            }

            const sameSource = voice.getAttribute("src") === src;
            const canResume = resume && sameSource;

            const token = ++playbackTokenRef.current;

            currentIntroIndexRef.current = index;
            introSequenceCompletedRef.current = false;

            activeVoiceKindRef.current = "intro";
            activeVoiceSrcRef.current = src;

            setCurrentIntroIndex(null);
            setIntroSequenceCompleted(false);
            setIsIntro(true);

            voice.pause();
            clearVoiceHandlers(voice);

            if (!canResume) {
                voice.src = src;
                voice.currentTime = 0;
                voice.load();
            }

            voice.volume = 1;
            voice.playbackRate = 0.8;
            voice.preservesPitch = true;

            const advance = () => {
                if (token !== playbackTokenRef.current) {
                    return;
                }

                clearVoiceHandlers(voice);

                if (index + 1 < introVoice.length) {
                    playIntroClip(index + 1);
                } else {
                    activeVoiceKindRef.current = null;
                    finishIntroSequence();
                }
            };

            voice.onplaying = () => {
                if (token !== playbackTokenRef.current) {
                    return;
                }

                setCurrentIntroIndex(index);
                setIsAudioPlaying(true);
            };

            voice.onended = advance;

            voice.onerror = () => {
                if (token !== playbackTokenRef.current) {
                    return;
                }

                console.error("Intro narration failed:", {
                    src,
                    errorCode: voice.error?.code,
                    errorMessage: voice.error?.message,
                });

                advance();
            };

            void voice.play().catch((error: unknown) => {
                if (token !== playbackTokenRef.current) {
                    return;
                }

                console.error("Unable to play intro narration:", src, error);

                if (isNotAllowedError(error)) {
                    setIsAudioPlaying(false);
                    return;
                }

                advance();
            });
        },
        [finishIntroSequence]
    );



    const playVoiceForScene = useCallback(
        (
            sceneIndex: number,
            restart: boolean,
            onVoiceStart?: () => void
        ): Promise<void> => {
            const voice = voiceRef.current;
            const drum = drumRef.current;
            const audioPath = voiceByScene[sceneIndex];

            if (!voice || !audioPath) {
                onVoiceStart?.();
                return Promise.resolve();
            }

            sceneVoiceStartRef.current = onVoiceStart ?? null;

            sceneVoiceCompletionRef.current?.();
            sceneVoiceCompletionRef.current = null;

            const token = ++playbackTokenRef.current;

            const sameSource = voice.getAttribute("src") === audioPath;

            voice.pause();
            clearVoiceHandlers(voice);

            if (restart || !sameSource || voice.ended) {
                voice.src = audioPath;
                voice.currentTime = 0;
                voice.load();
            }

            activeVoiceKindRef.current = "scene";
            activeVoiceSrcRef.current = audioPath;

            voice.volume = 1;
            voice.playbackRate = 0.8;
            voice.preservesPitch = true;

            if (drum) {
                drum.volume = 0.25;
            }

            return new Promise<void>((resolve) => {
                let completed = false;
                let didStart = false;

                const markStarted = () => {
                    if (didStart) {
                        return;
                    }

                    didStart = true;
                    sceneVoiceStartRef.current?.();
                };

                const finish = (showTextOnFailure = false) => {
                    if (completed) {
                        return;
                    }

                    completed = true;

                    if (!didStart && showTextOnFailure) {
                        markStarted();
                    }

                    if (sceneVoiceCompletionRef.current === finish) {
                        sceneVoiceCompletionRef.current = null;
                    }

                    if (drumRef.current) {
                        drumRef.current.volume = 0.6;
                    }

                    clearVoiceHandlers(voice);
                    resolve();
                };

                sceneVoiceCompletionRef.current = finish;

                voice.onplaying = () => {
                    if (token !== playbackTokenRef.current) {
                        return;
                    }

                    markStarted();
                    setIsAudioPlaying(true);
                };

                voice.onended = () => {
                    if (token !== playbackTokenRef.current) {
                        return;
                    }

                    finish();
                };

                voice.onerror = () => {
                    if (token !== playbackTokenRef.current) {
                        return;
                    }

                    console.error("Scene narration failed:", {
                        src: audioPath,
                        errorCode: voice.error?.code,
                        errorMessage: voice.error?.message,
                    });

                    finish(true);
                };

                void voice.play().catch((error: unknown) => {
                    if (token !== playbackTokenRef.current) {
                        return;
                    }

                    console.error(
                        "Unable to play scene narration:",
                        audioPath,
                        error
                    );

                    if (isNotAllowedError(error)) {
                        setIsAudioPlaying(false);
                        return;
                    }

                    finish(true);
                });
            });
        },
        []
    );



    const startAudio = useCallback(
        (playCurrentScene = true) => {
            audioEnabledRef.current = true;
            setIsAudioPlaying(true);

            const drum = drumRef.current;
            const voice = voiceRef.current;

            if (drum) {
                void drum.play().catch((error: unknown) => {
                    console.error("Unable to start background drum:", error);
                });
            }

            if (playCurrentScene) {
                const scenePath = voiceByScene[currentSceneRef.current];

                if (
                    voice &&
                    activeVoiceKindRef.current === "scene" &&
                    activeVoiceSrcRef.current === scenePath &&
                    sceneVoiceCompletionRef.current
                ) {
                    void voice.play().catch((error: unknown) => {
                        console.error("Unable to retry scene narration:", error);

                        if (isNotAllowedError(error)) {
                            setIsAudioPlaying(false);
                        } else {
                            sceneVoiceStartRef.current?.();
                            sceneVoiceCompletionRef.current?.();
                        }
                    });

                    return;
                }

                void playVoiceForScene(
                    currentSceneRef.current,
                    false,
                    sceneVoiceStartRef.current ?? undefined
                );

                return;
            }

            if (introSequenceCompletedRef.current) {
                return;
            }

            const index = currentIntroIndexRef.current;

            if (index === null) {
                playIntroClip(0);
            } else {
                playIntroClip(index, true);
            }
        },
        [playIntroClip, playVoiceForScene]
    );



    const pauseAudio = useCallback(() => {
        audioEnabledRef.current = false;

        const voice = voiceRef.current;

        voice?.pause();
        drumRef.current?.pause();

        sceneVoiceCompletionRef.current?.();
        sceneVoiceCompletionRef.current = null;

        if (drumRef.current) {
            drumRef.current.volume = 0.6;
        }

        setIsIntro(false);
        setIsAudioPlaying(false);
    }, []);

    const playSceneVoice = useCallback(
        (
            sceneIndex: number,
            onVoiceStart: () => void
        ): Promise<void> => {
            currentSceneRef.current = sceneIndex;
            sceneVoiceStartRef.current = onVoiceStart;

            if (!audioEnabledRef.current) {
                onVoiceStart();
                return Promise.resolve();
            }

            return playVoiceForScene(sceneIndex, true, onVoiceStart);
        },
        [playVoiceForScene]
    );

    return {
        startAudio,
        pauseAudio,
        playSceneVoice,
        isAudioPlaying,
        isIntro,
        currentIntroIndex,
        introSequenceCompleted,
    };
};