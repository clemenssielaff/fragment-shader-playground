/**
 * Assignment 1 - Alexander Reiprich (263006)
 * The setup of the scene.js file is based on this repository: https://github.com/clemenssielaff/fragment-shader-playground/blob/main/scene.js
 */

// Global state ============================================================ //

// Import names from glMatrix
const { mat4 } = glMatrix;


// Shader source =========================================================== //

const vertexShaderSource = `
    attribute vec4 aPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform mediump float uTime;

    varying lowp vec4 vColor;

    void main() {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
      vColor = aVertexColor;
    }  
`;


const fragmentShaderSource = `
    varying lowp vec4 vColor;
    const lowp vec4 cBlack = vec4(0, 0, 0, 1);

    uniform mediump float uTime;

    void main() {

        // left half    

        if (gl_FragCoord.x < 640.0) { 

            // bottom left quarter

            if (gl_FragCoord.y < 440.0) { 

                // vertical stripes

                if (mod(gl_FragCoord.x, 20.0) > 5.0 ) { 
                    gl_FragColor = cBlack;
                }
                else {
                    gl_FragColor = vec4(vColor.y, vColor.z, vColor.x, 1);
                }
            }

            // top left quarter

            else { 

                // diagonal stripes

                if (mod(gl_FragCoord.x + gl_FragCoord.y, 20.0) > 5.0) { 
                    gl_FragColor = cBlack;
                }
                else {
                    gl_FragColor = vec4(vColor.xyz, 1);
                }
            }
        }

        // right half

        else { 

            // bottom right quarter

            if (gl_FragCoord.y < 440.0) { 

                // vertical and horizontal stripes

                if (mod(gl_FragCoord.x, 20.0) > 5.0 && mod(gl_FragCoord.y, 30.0) > 7.5) { 
                    gl_FragColor = cBlack;
                }
                else {
                    gl_FragColor = vec4(vColor.z, vColor.x, vColor.y, 1);
                }
            }

            // top right quarter

            else { 

                // horizontal stripes

                if (mod(gl_FragCoord.y, 20.0) > 5.0 ) { 
                    gl_FragColor = cBlack;
                }
                else { 
                    gl_FragColor = vec4(vColor.z, vColor.y, vColor.x, 1);
                }
            }
        }
    }
`;

var time = 0.0;


// Utility functions ======================================================= //

function degToRad(grad) {
    return (grad / 180.0) * Math.PI;
}


// Main function =========================================================== //


function main() {
    // Get a WebGL context from the canvas element in the DOM
    const gl = document.querySelector("#main_canvas").getContext('webgl');
    if (!gl) {
        console.log('WebGL unavailable');
    } else {
        console.log('WebGL is good to go');
    }

    // Initialize a shader program
    const shaderProgram = initShaderProgram(gl, vertexShaderSource, fragmentShaderSource);

    // Collect all the info needed to use the shader program.
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aPosition'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            time: gl.getUniformLocation(shaderProgram, 'uTime'),
        }
    };

    // Initialize the geometry in vertex buffer objects 
    positionBuffer = createPositionBuffer(gl)
    colorBuffer = createColorBuffer(gl)
    indexBuffer = createIndexBuffer(gl)

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute of the vertex shader
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        3,        // numComponents
        gl.FLOAT, // type
        false,    // normalize
        0,        // stride
        0         // offset
    )
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition)

    // Tell WebGL how to pull out the colors from the color buffer
    // into the vertexColor attribute of the vertex shader
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        4,        // numComponents
        gl.FLOAT, // type
        false,    // normalize
        0,        // stride
        0         // offset
    )
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor)

    // Prepare the OpenGL state machine
    gl.bindBuffer(gl.ARRAY_BUFFER, null);   // Unbind the position buffer (is not needed to draw)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,  // Bind the index buffer
        indexBuffer);
    gl.useProgram(programInfo.program);     // Use the shader program
    gl.clearColor(0.0, 0.0, 0.0, 1.0);      // Clear to black, fully opaque
    gl.clearDepth(1.0);                     // Clear everything
    gl.enable(gl.DEPTH_TEST);               // Enable depth testing
    gl.depthFunc(gl.LEQUAL);                // Near things obscure far things

    // Start the render loop
    var last;
    function render(now) {
        drawScene(gl, programInfo);
        const deltaTime = now - (last || now);
        time += deltaTime / 1000.0;
        last = now;
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}


/// Creates a simple 3D pyramid geometry
function createPositionBuffer(gl) {
    // Create a buffer for the pyramid's vertex positions.
    const positionBuffer = gl.createBuffer();

    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Now create an array of positions for the pyramid.
    const positions = [
        // Front face
        -.5, -.5, +.5,
        +.5, -.5, +.5,
        0.0, +.5, 0.0,

        // Back face
        -.5, -.5, -.5,
        +.5, -.5, -.5,
        0.0, +.5, 0.0,

        // Right face
        +.5, -.5, +.5,
        +.5, -.5, -.5,
        0.0, +.5, 0.0,

        // Left face
        -.5, -.5, +.5,
        -.5, -.5, -.5,
        0.0, +.5, 0.0,

        // Bottom face
        -.5, -.5, +.5,
        +.5, -.5, +.5,
        -.5, -.5, -.5,
        +.5, -.5, -.5,
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    return positionBuffer;
}

function createColorBuffer(gl) {
    // Create a buffer for the pyramid's vertex colors.
    const colorBuffer = gl.createBuffer();

    // Select the colorBuffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

    // Now create an array of colors for the pyramid.
    const faceColors = [
        [Math.random(), Math.random(), Math.random(), 1.0],    // Front face
        [Math.random(), Math.random(), Math.random(), 1.0],    // Back face
        [Math.random(), Math.random(), Math.random(), 1.0],    // Left face
        [Math.random(), Math.random(), Math.random(), 1.0],    // Right face
        [Math.random(), Math.random(), Math.random(), 1.0],    // Bottom face, triangle 1
        [Math.random(), Math.random(), Math.random(), 1.0]     // Bottom face, triangle 2
    ];

    // Convert the array of colors into a table for all the vertices.
    var colors = [];
    for (var j = 0; j < faceColors.length; ++j) {
        const c = faceColors[j];
        // Repeat each color three times for the three vertices of the face
        colors = colors.concat(c, c, c);
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    return colorBuffer;
}


/// Create an index buffer
function createIndexBuffer(gl) {
    // Create a buffer for the indices.
    const indexBuffer = gl.createBuffer();

    // Select the indexBuffer as the one to apply (element
    // array) buffer operations to from here out.
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // Define triangles
    const indices = [
        0, 1, 2,         // front
        3, 4, 5,         // back
        6, 7, 8,         // right
        9, 10, 11,       // left
        12, 13, 15,      // bottom part 1
        12, 14, 15       // bottom part 2
    ];

    // Now send the element array to GL
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return indexBuffer;
}


/// Initialize a shader program from vertex- and fragment-shader sources.
function initShaderProgram(gl) {
    // Load the Vertex- and Fragment-Shader
    loadShader = (type, source) => {
        const shader = gl.createShader(type)
        gl.shaderSource(shader, source)
        gl.compileShader(shader)
        return shader;
    }
    const vertexShader = loadShader(gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fragmentShaderSource)

    // Create the shader program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // Check for errors 
    // See https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#dont_check_shader_compile_status_unless_linking_fails
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error(`Linking failed: ${gl.getProgramInfoLog(shaderProgram)}`);
        console.error(`Vertex Shader log: ${gl.getShaderInfoLog(vertexShader)}`);
        console.error(`Fragent Shader log: ${gl.getShaderInfoLog(fragmentShader)}`);
        alert('Unable to initialize the shader program! See console for details')
        return null;
    }

    return shaderProgram;
}


/// Draw the scene.
function drawScene(gl, programInfo) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const projectionMatrix = mat4.create();
    mat4.perspective(
        projectionMatrix,
        degToRad(45),                                   // field of view in radians
        gl.canvas.clientWidth / gl.canvas.clientHeight, // aspect ratio
        0.1,                                            // near clipping plane                  
        100.0                                           // far clipping plane
    );

    const modelViewMatrix = mat4.create();

    // Move the pyramid back from the camera
    mat4.translate(
        modelViewMatrix,   // destination matrix
        modelViewMatrix,   // matrix to translate
        [0.0, 0.0, -3.0]); // amount to translate

    // Rotate the pyramid around the Y-axis
    mat4.rotate(
        modelViewMatrix,    // destination matrix
        modelViewMatrix,    // matrix to rotate
        0.75 * time,        // amount to rotate in radians
        [0, 1, 0]);         // axis to rotate around (Y)


    // Set the shader uniforms  
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix);
    gl.uniform1f(
        programInfo.uniformLocations.time,
        time);

    // The draw call
    gl.drawElements(
        gl.TRIANGLES,       // primitive type
        18,                 // vertex count
        gl.UNSIGNED_SHORT,  // type of indices 
        0                   // offset
    );
}


// Start the main program
main();