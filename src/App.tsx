import { useState, useEffect, useCallback } from "react";
import { IntroSCene } from "./components/IntroScene";
import { Scenes } from "./components/Scenes";
import { FinalScene } from "./components/FinalScenes";
import { useHeritageAudio } from "./hooks/audio";
import { preloadAssets } from "./utils/preloadAssets";
import "./css/scene.css";
import "./css/finalScene.css";
import "./App.css";

const App = () => {
    type AppStage = "intro" | "scenes" | "final";
    const [stage, setStage] = useState<AppStage>("intro");

    const handleComplete = useCallback(() => {
        setStage("final");
    }, []);

    const {
        startAudio,
        pauseAudio,
        playSceneVoice,
        isAudioPlaying,
        currentIntroIndex,
        introSequenceCompleted,
    } = useHeritageAudio();


    const handleAudioToggle = () => {
        if (isAudioPlaying) {
            pauseAudio();
            return;
        }

        startAudio(stage !== "intro");
    };

    useEffect(() => {
        const cleanup = preloadAssets();

        return () => {
            cleanup();
        };
    }, []);

    useEffect(() => {
        if (stage !== "final") return;

        const timer = window.setTimeout(() => pauseAudio(), 14000);
        return () => window.clearTimeout(timer);
    }, [stage, pauseAudio]);

    return (
        <main>
            <button
                onClick={handleAudioToggle}
                className="audio-toggle-button"
                type="button"
                aria-pressed={isAudioPlaying}
            >
                {isAudioPlaying ? "Pause Audio" : "Play Audio"}
            </button>

            {stage === "intro" && (
                <IntroSCene
                    onComplete={() => setStage("scenes")}
                    currentIntroIndex={currentIntroIndex}
                    introSequenceCompleted={introSequenceCompleted}
                />
            )}

            {stage === "scenes" && (
                <Scenes
                    onComplete={handleComplete}
                    onSceneChange={playSceneVoice}
                />
            )}

            {stage === "final" && <FinalScene />}
        </main>
    );
};

export default App;
