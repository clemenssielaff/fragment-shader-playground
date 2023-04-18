const { mat4 } = glMatrix;

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

const projects = [
    reiprich,
    nguyen,
    meisler,
    grabs,
    kowatsch,
    mieg,
    goepfert,
    gobbert,
    cataldo,
    rubner,
    gaertner,
    weiden,
    winter,
]

const studentNames = [
    "Alexander Reiprich",
    "Bao Han Nguyen",
    "Daniel Meisler",
    "Dominik Grabs",
    "Fabian Kowatsch",
    "Fabian Mieg",
    "Ferdinand Goepfert",
    "Leon Gobbert",
    "Luca Cataldo",
    "Nic Rubner",
    "Nikita Gaertner",
    "Sarah Weidenhiller",
    "Soeren Winterhalder",
]


// The ID of the current project to display.
// This is incremented/decremented by the arrow keys.
let projectId = 0;
window.addEventListener('keydown', function(event) {
    if (event.key === 'ArrowRight') {
      projectId = (projectId + projects.length + 1) % projects.length;
    } else if (event.key === 'ArrowLeft') {
        projectId = (projectId + projects.length - 1) % projects.length;
    }
  });


function main() {
    // Get a WebGL context from the canvas element in the DOM
    const gl = document.querySelector("#canvas").getContext('webgl');
    if (!gl) {
        console.log('WebGL unavailable');
    } else {
        console.log('WebGL is good to go');
    }

    let lastProject = -1;
    let lastTime;
    let project, programInfo;

    // Render loop
    function render(now ) {
        if(lastProject != projectId) {
            lastProject = projectId;
            document.querySelector("#project-name").innerHTML = `${projectId + 1}: ${studentNames[projectId]}`;

            project = projects[projectId];
            programInfo = project.main(gl);
            programInfo.origin = mat4.create();
        
            // Prepare the OpenGL state machine
            gl.bindBuffer(gl.ARRAY_BUFFER, null);   // Unbind the position buffer (is not needed to draw)
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,  // Bind the index buffer
                programInfo.indexBuffer);
            gl.useProgram(programInfo.program);     // Use the shader program
            gl.clearColor(0.0, 0.0, 0.0, 1.0);      // Clear to black, fully opaque
            gl.clearDepth(1.0);                     // Clear everything
            gl.enable(gl.DEPTH_TEST);               // Enable depth testing
            gl.depthFunc(gl.LEQUAL);                // Near things obscure far things
        }

        // Start the render loop
        project.drawScene(gl, programInfo);
        const deltaTime = now - (lastTime || now);
        project.setTime(project.time + (deltaTime / 1000.0));
        lastTime = now;
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);   
}

main();


  