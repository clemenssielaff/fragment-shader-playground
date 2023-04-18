import * as reiprich from "./scripts/AlexanderReiprich.js";
import * as nguyen from "./scripts/BaoHanNguyen.js";
import * as meisler from "./scripts/DanielMeisler.js";
import * as grabs from "./scripts/DominikGrabs.js";
import * as kowatsch from "./scripts/FabianKowatsch.js";
import * as mieg from "./scripts/FabianMieg.js";
import * as goepfert from "./scripts/FerdinandGoepfert.js";
import * as gobbert from "./scripts/LeonGobbert.js";
import * as cataldo from "./scripts/LucaCataldo.js";
import * as rubner from "./scripts/NicRubner.js";
import * as gaertner from "./scripts/NikitaGaertner.js";
import * as weiden from "./scripts/SarahWeidenhiller.js";
import * as winter from "./scripts/SoerenWinterhalder.js";


/// Get a student project by id (in aphabetical order)
function getProject(id) {
    switch (id) {
        case 0:
            return reiprich
        case 1:
            return nguyen
        case 2:
            return meisler
        case 3:
            return grabs
        case 4:
            return kowatsch
        case 5:
            return mieg
        case 6:
            return goepfert
        case 7:
            return gobbert
        case 8:
            return cataldo
        case 9:
            return rubner
        case 10:
            return gaertner
        case 11:
            return weiden
        case 12:
            return winter
    }
}

function main() {
    // Get a WebGL context from the canvas element in the DOM
    const gl = document.querySelector("#canvas").getContext('webgl');
    if (!gl) {
        console.log('WebGL unavailable');
    } else {
        console.log('WebGL is good to go');
    }

    const project = getProject(12);
    project.main(gl);

    // // Prepare the OpenGL state machine
    // gl.bindBuffer(gl.ARRAY_BUFFER, null);   // Unbind the position buffer (is not needed to draw)
    // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,  // Bind the index buffer
    //     indexBuffer);
    // gl.useProgram(programInfo.program);     // Use the shader program
    // gl.clearColor(0.0, 0.0, 0.0, 1.0);      // Clear to black, fully opaque
    // gl.clearDepth(1.0);                     // Clear everything
    // gl.enable(gl.DEPTH_TEST);               // Enable depth testing
    // gl.depthFunc(gl.LEQUAL);                // Near things obscure far things

    // let lastTime;
    // function renderProject(now) {
    //     drawScene(gl, programInfo);
    //     const deltaTime = now - (lastTime || now);
    //     project.time += deltaTime / 1000.0;
    //     last = now;
    //     requestAnimationFrame(renderProject);
    // }
    // requestAnimationFrame(renderProject);
}
main();