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
        const cubedSize = Math.max(250 + (10 * solutionWeight), 100)
        return {
            height: `${cubedSize}px`,
            width: `${cubedSize}px`,
        };
    }

    return <>
        <div className="circle" style={calculateStyle(solution.solutionWeight)}>
            <h1>{createSolutionTitle()}</h1>
        </div>
    </>
}

export default Opinion;