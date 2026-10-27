import { sceneData } from "../components/Scenes";
import { env_config } from "./import";

const audioCache = new Map<string, HTMLAudioElement>();

export const getPreloadedAudio = (
    src: string
): HTMLAudioElement => {
    const existingAudio = audioCache.get(src);

    if (existingAudio) {
        return existingAudio;
    }

    const audio = new Audio();

    audio.preload = "auto";
    audio.src = src;

    audio.onerror = () => {
        console.error("Audio resource failed to load:", {
            src: audio.currentSrc || src,
            errorCode: audio.error?.code,
            errorMessage: audio.error?.message,
        });
    };

    audioCache.set(src, audio);
    audio.load();

    return audio;
};

export const preloadAssets = (): (() => void) => {
    const images: HTMLImageElement[] = [];
    const videos: HTMLVideoElement[] = [];
    const audios: { src: string; element: HTMLAudioElement }[] = [];

    const imageUrls = new Set<string>([
        `${env_config}coatOfArm/Nigeria_coat_of_arm.webp`,
        `${env_config}map/Nigeria_map.svg`,
        `${env_config}culture/culture-backdrop.jpg`,
        `${env_config}heritage/heritage-backdrop.jpg`,

        `${env_config}space/Objects/Debris_small.png`,
        `${env_config}space/Objects/Rocks_small.png`,
        `${env_config}space/planets/volcano.png`,
        `${env_config}space/planets/moon.png`,
    ]);

    const videoUrls = new Set<string>();

    for (const scene of sceneData) {
        for (const media of scene.media) {
            if (media.type === "video") {
                videoUrls.add(media.src);

                if (media.backdropImageUrl) {
                    imageUrls.add(media.backdropImageUrl);
                }
            } else {
                imageUrls.add(media.src);
            }
        }
    }

    const audioUrls = new Set<string>([
        `${env_config}audio/Intro0.mp3`,
        `${env_config}audio/Intro1.mp3`,
        `${env_config}audio/Intro2.mp3`,
        `${env_config}audio/Intro3.mp3`,
        `${env_config}audio/Nigeria.mp3`,

        `${env_config}audio/our_culture.mp3`,
        `${env_config}audio/our_heritage.mp3`,
        `${env_config}audio/our_tribes.mp3`,
        `${env_config}audio/our_people.mp3`,
        `${env_config}audio/our_delicacies.mp3`,

        `${env_config}audio/moja.mp3`,
    ]);

    for (const src of imageUrls) {
        const image = new Image();

        image.decoding = "async";
        image.onerror = () => {
            console.error("Image preload failed:", src);
        };

        image.src = src;
        images.push(image);
    }

    for (const src of videoUrls) {
        const video = document.createElement("video");

        video.preload = "auto";
        video.muted = true;
        video.playsInline = true;
        video.setAttribute("playsinline", "");

        video.onerror = () => {
            console.error("Video preload failed:", {
                src: video.currentSrc || src,
                errorCode: video.error?.code,
                errorMessage: video.error?.message,
            });
        };

        video.src = src;
        video.load();

        videos.push(video);
    }

    for (const src of audioUrls) {
        const audio = getPreloadedAudio(src);

        audios.push({
            src,
            element: audio,
        });
    }

    return () => {
        for (const video of videos) {
            video.pause();
            video.onerror = null;
            video.removeAttribute("src");
            video.load();
        }

        for (const { src, element } of audios) {
            element.pause();
            element.onended = null;
            element.onerror = null;
            element.onplaying = null;

            element.removeAttribute("src");
            element.load();

            if (audioCache.get(src) === element) {
                audioCache.delete(src);
            }
        }

        for (const image of images) {
            image.onload = null;
            image.onerror = null;
        }

        videos.length = 0;
        audios.length = 0;
        images.length = 0;
    };
};