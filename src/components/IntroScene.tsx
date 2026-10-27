import { useEffect, useState } from "react";
import { SeparateMap } from "../utils/SeparateMap";
import { Stars } from "../utils/Stars";
import { env_config } from "../utils/import";
import "../css/introScene.css";

const spacePath = (name: string, cat: string) =>
    `${env_config}space/${cat}/${name}.png`;

interface IntroSCeneProps {
    onComplete?: () => void;
    currentIntroIndex: number | null;
    introSequenceCompleted: boolean;
}

const IntroText = [
    "Once upon A time",
    "In A far away Land",
    "There Lived A group of great People",
    "Brought together To form A Nation Called",
    "Nigeria",
];

export const IntroSCene = ({
    onComplete,
    currentIntroIndex,
    introSequenceCompleted,
}: IntroSCeneProps) => {
    const [displayMap, setDisplayMap] = useState(false);

    useEffect(() => {
        if (introSequenceCompleted) {
            setDisplayMap(true);
        }
    }, [introSequenceCompleted]);

    const displayText =
        currentIntroIndex !== null
            ? IntroText[currentIntroIndex] ?? ""
            : "";

    return (
        <div className="intro-div">
            <div className="intro-text-div">
                <p>{displayText}</p>
            </div>
            <div>
                <img
                    src={spacePath("Debris_small", "Objects")}
                    alt=""
                    className="debris-img"
                    style={{ top: "70%", left: "50%" }}
                />
                <img
                    src={spacePath("Rocks_small", "Objects")}
                    alt=""
                    className="rocks-img mid"
                    style={{ top: "50%", left: "10%" }}
                />
                <img
                    src={spacePath("Rocks_small", "Objects")}
                    alt=""
                    className="rocks-img big"
                    style={{ top: "80%", left: "70%" }}
                />
                <img
                    src={spacePath("Rocks_small", "Objects")}
                    alt=""
                    className="rocks-img small"
                    style={{ top: "25%", left: "80%" }}
                />
                <img
                    src={spacePath("volcano", "planets")}
                    alt=""
                    className="planet-img"
                    style={{ top: "10%", left: "10%" }}
                />
                <img
                    src={spacePath("moon", "planets")}
                    alt=""
                    className="moon-img"
                    style={{ top: "15%", left: "60%" }}
                />
            </div>
            <Stars />
            {displayMap && (
                <SeparateMap
                    divClassName="intro-map-div"
                    convasClassName="intro-map-canvas"
                    onComplete={onComplete}
                />
            )}
        </div>
    );
};
