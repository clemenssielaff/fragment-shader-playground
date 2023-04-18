/**
 * Fragment Shader Playground
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
    varying lowp vec4 vColor;

    void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
        vColor = aVertexColor;
    }  
`;


const fragmentShaderSource = `
    precision mediump float;
    varying vec4 vColor;
    uniform float u_time;
    vec4 mixColorVertical;
    vec4 mixColorHorizontal;
    float pi = 3.14159265359;
    float intesity = 0.16; // AMD Fix: float intensity = 0.0016; 

    void main() {
        if( mod(gl_FragCoord.x,40.0) < 5.0 == mod(gl_FragCoord.y,40.0) < 5.0) {  
            mixColorHorizontal = vColor;
        } else {
            mixColorHorizontal = vec4(1.0,1.0,1.0,2.0) 
                           - vColor;
        }
        if( mod(gl_FragCoord.y,40.0) < 5.0 == mod(gl_FragCoord.x,40.0) < 5.0) {  
            mixColorVertical = vColor;
        } else {
            mixColorVertical = vec4(1.0,1.0,1.0,2.0) 
                           - vColor;
        }
        gl_FragColor = 0.5 * mixColorVertical + 0.5 * mixColorHorizontal;        
    }
`;

export let time = 0.0;
export function setTime(t) {
    time = t;
}

function degToRad(grad) {
    return (grad / 180.0) * Math.PI;
}

export function main(gl) {
    // const gl = document.querySelector("#canvas").getContext('webgl');
    // if (!gl) {
    //     console.log('WebGL unavailable');
    // } else {
    //     console.log('WebGL is good to go');
    // }

    const shaderProgram = initShaderProgram(gl, vertexShaderSource, fragmentShaderSource);

    // Initialize the geometry in vertex buffer objects 
    const positionBuffer = createPositionBuffer(gl);
    const colorBuffer = createColorBuffer(gl);
    const indexBuffer = createIndexBuffer(gl);

    const programInfo = {
        program: shaderProgram,
        indexBuffer: indexBuffer,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aPosition'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        }
    };

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        3,        // numComponents
        gl.FLOAT, // type
        false,    // normalize
        0,        // stride
        0         // offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        4,        // numComponents
        gl.FLOAT, // type
        false,    // normalize
        0,        // stride
        0         // offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);

    return programInfo;

    // // Prepare the OpenGL state machine
    // gl.bindBuffer(gl.ARRAY_BUFFER, null);   // Unbind the position buffer (is not needed to draw)
    // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,  // Bind the index buffer
    //     indexBuffer);
    // gl.useProgram(programInfo.program);     // Use the shader program
    // gl.clearColor(0.0, 0.0, 0.0, 1.0);      // Clear to black, fully opaque
    // gl.clearDepth(1.0);                     // Clear everything
    // gl.enable(gl.DEPTH_TEST);               // Enable depth testing
    // gl.depthFunc(gl.LEQUAL);                // Near things obscure far things

    // // Start the render loop
    // var last;
    // function render(now) {
    //     drawScene(gl, programInfo);
    //     const deltaTime = now - (last || now);
    //     time += deltaTime / 1000.0;
    //     last = now;
    //     requestAnimationFrame(render);
    // }
    // requestAnimationFrame(render);
}

/* Define vertices */
function createPositionBuffer(gl) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // array of positions for the cube
    const positions = [
        // Front face
        -.5, -.5, +.5,
        +.5, -.5, +.5,
        +.5, +.5, +.5,
        -.5, +.5, +.5,

        // Back face
        -.5, -.5, -.5,
        -.5, +.5, -.5,
        +.5, +.5, -.5,
        +.5, -.5, -.5,

        // Top face
        -.5, +.5, -.5,
        -.5, +.5, +.5,
        +.5, +.5, +.5,
        +.5, +.5, -.5,

        // Bottom face
        -.5, -.5, -.5,
        +.5, -.5, -.5,
        +.5, -.5, +.5,
        -.5, -.5, +.5,

        // Right face
        +.5, -.5, -.5,
        +.5, +.5, -.5,
        +.5, +.5, +.5,
        +.5, -.5, +.5,

        // Left face
        -.5, -.5, -.5,
        -.5, -.5, +.5,
        -.5, +.5, +.5,
        -.5, +.5, -.5,
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    return positionBuffer;
}

/* Define colors */
function createColorBuffer(gl) {
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

    // array of colors for the cube
    const faceColors = [
        // Front face
        0.0, 0.0, 1.0, 1.0,
        1.0, 0.0, 1.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        0.0, 0.0, 0.0, 1.0,

        // Back face
        0.0, 1.0, 1.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 1.0, 1.0,

        // Top face
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,

        // Bottom face
        0.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,

        // Right face
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 1.0, 1.0,

        // Left face
        0.0, 1.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(faceColors), gl.STATIC_DRAW);

    return colorBuffer;
}

/* specify indices into vertex arrays */
function createIndexBuffer(gl) {
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    const indices = [
        0, 1, 2, 0, 2, 3,         // front
        4, 5, 6, 4, 6, 7,         // back
        8, 9, 10, 8, 10, 11,      // top
        12, 13, 14, 12, 14, 15,   // bottom
        16, 17, 18, 16, 18, 19,   // right
        20, 21, 22, 20, 22, 23,   // left
    ];

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return indexBuffer;
}


/// Initialize a shader program from vertex- and fragment-shader sources.
function initShaderProgram(gl) {
    // Load the Vertex- and Fragment-Shader
    const loadShader = (type, source) => {
        const shader = gl.createShader(type)
        gl.shaderSource(shader, source)
        gl.compileShader(shader)
        return shader;
    }
    const vertexShader = loadShader(gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fragmentShaderSource)

    /* Create and link the shader program */
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    /* Check for errors  */
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error(`Linking failed: ${gl.getProgramInfoLog(shaderProgram)}`);
        console.error(`Vertex Shader log: ${gl.getShaderInfoLog(vertexShader)}`);
        console.error(`Fragent Shader log: ${gl.getShaderInfoLog(fragmentShader)}`);
        alert('Unable to initialize the shader program! See console for details')
        return null;
    }

    return shaderProgram;
}


/* Draw the scene */
export function drawScene(gl, programInfo) {
    // Clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Connect the uniforms with the vertex shader */
    const projectionMatrix = mat4.create();
    mat4.perspective(
        projectionMatrix,
        degToRad(45),                                   // field of view in radians
        gl.canvas.clientWidth / gl.canvas.clientHeight, // aspect ratio
        0.1,                                            // near clipping plane                  
        100.0                                           // far clipping plane
    );

    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    const modelViewMatrix = mat4.clone(programInfo.origin);

    // Move the cube back from the camera
    mat4.translate(
        modelViewMatrix,   // destination matrix
        modelViewMatrix,   // matrix to translate
        [0.0, 0.0, -3.0]); // amount to translate

    // Rotate the cube around all three axes
    mat4.rotate(
        modelViewMatrix,    // destination matrix
        modelViewMatrix,    // matrix to rotate
        0.3 * time,                // amount to rotate in radians
        [0, 0, 1]);         // axis to rotate around (Z)
    mat4.rotate(
        modelViewMatrix,    // destination matrix
        modelViewMatrix,    // matrix to rotate
        0.5 * time,                // amount to rotate in radians
        [0, 1, 0]);         // axis to rotate around (Y)
    mat4.rotate(
        modelViewMatrix,    // destination matrix
        modelViewMatrix,    // matrix to rotate
        0.8* time,                // amount to rotate in radians
        [1, 0, 0]);         // axis to rotate around (X)


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
        36,                 // vertex count
        gl.UNSIGNED_SHORT,  // type of indices 
        0                   // offset
    );
}


// Start the main program
// main();