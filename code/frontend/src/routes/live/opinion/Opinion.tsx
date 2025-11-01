import './Opinion.css'
import {CSSProperties} from "react";
import {Solution} from "../../../service/model/Solution";

interface OpinionProps {
    solution: Solution,
    index: number,

}

function Opinion({solution, index}: OpinionProps) {
    function createSolutionTitle() {
        return `L${index}: ${solution.solutionTitle}`
    }

    function calculateStyle(solutionWeight: number): CSSProperties {
        const maxSolutionWeight= 25
        const minSolutionWeight= 11
        const circleSize = 1.3* Math.min(Math.max(solutionWeight, minSolutionWeight), maxSolutionWeight);

        const normalized = solutionWeight / 40;

        const hue = normalized * 120;
        const saturation = 70;
        const lightness = 45;
        const backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

        const textColor = lightness > 60 ? "#1d1d1d" : "#ffffff";
        const waveColor1 = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.25)`;
        const waveColor2 = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.15)`;

        return {
            height: `${circleSize}vh`,
            width: `${circleSize}vh`,
            backgroundColor,
            color: textColor,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
            transition: "background-color 0.5s ease, transform 0.3s ease",
            '--wave-color1': waveColor1, // CSS variable
            '--wave-color2': waveColor2,
        } as CSSProperties;

    }

    return <>
        <div className="circle" style={calculateStyle(solution.solutionWeight)}>
            <h1>{createSolutionTitle()}</h1>
        </div>
    </>
}

export default Opinion;