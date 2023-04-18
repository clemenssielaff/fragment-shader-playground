/**
 * Fragment Shader Playground
 */

// Global state ============================================================ //

// Import names from glMatrix
const { mat4 } = glMatrix;

// Global time
var time = 0.0;


// Shader source =========================================================== //

const vertexShaderSource = `
attribute vec4 aPosition;
attribute vec4 aVertexColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying lowp vec4 vColor;

void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
    vColor = aVertexColor; // Face colored cube
}
`;


const fragmentShaderSource = `
varying lowp vec4 vColor;
        
void main() {
    gl_FragColor = vColor;
}
`;


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

    // Initialize a shader program; this is where all the lighting
    // for the vertices and so forth is established.
    const shaderProgram = initShaderProgram(gl, vertexShaderSource, fragmentShaderSource);

    // Collect all the info needed to use the shader program.
    // Look up which attributes our shader program is using
    // for aVertexPosition, aVertexColor and also
    // look up uniform locations.
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aPosition'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
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
        // Render the scene
        const deltaTime = now - (last || now);
        drawScene(gl, programInfo, deltaTime);
        last = now;
        
        // Request another frame when this one is done
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}


/// Creates a simple 3D cube geometry, centered at the origin
/// and with a side length of 1 units.
function createPositionBuffer(gl) {
    // Create a buffer for the cube's vertex positions.
    const positionBuffer = gl.createBuffer();

    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Now create an array of positions for the cube.
    const positions = [
        // Front face
        -.5, +0., +.5,
        +.5, +0., +.5,
        +0., +1., +0.,

        // Back face
        +.5, +0., -.5,
        -.5, +0., -.5,
        +0., +1., +0.,

        // Right face
        +.5, +0., +.5,
        +.5, +0., -.5,
        +0., +1., +0.,

        // Left face
        -.5, +0., +.5,
        -.5, +0., -.5,
        +0., +1., +0.,
    ];

    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    return positionBuffer;
}


/// Every side of the cube is a different color.
/// This way, we can avoid having to calculate lighting for now.
function createColorBuffer(gl) {
    // Create a buffer for the cube's vertex colors.
    const colorBuffer = gl.createBuffer();

    // Select the colorBuffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

    // Now create an array of colors for the cube.
    const faceColors = [
        [1.0, 0.0, 0.0, 1.0],    // Front face: red
        [0.0, 1.0, 0.0, 1.0],    // Top face: green
        [0.0, 0.0, 1.0, 1.0],    // Right face: blue
        [1.0, 1.0, 0.0, 1.0],    // Left face: yellow
    ];

    // Convert the array of colors into a table for all the vertices.
    var colors = [];
    for (var j = 0; j < faceColors.length; ++j) {
        const c = faceColors[j];
        // Repeat each color three times for the three vertices of the face
        colors = colors.concat(c, c, c, c);
    }

    // Now pass the list of vertex colors into WebGL.
    // We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    return colorBuffer;
}


/// Create an index buffer for our cube, which specifies the 
/// indices into the vertex arrays for each face's vertices.
function createIndexBuffer(gl) {
    // Create a buffer for the indices.
    // Even though we are using it as an element array buffer,
    // we still need to create it as a regular buffer.
    const indexBuffer = gl.createBuffer();

    // Select the indexBuffer as the one to apply (element
    // array) buffer operations to from here out.
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // This array defines each face as two triangles, using the
    // indices into the vertex array to specify each triangle's
    // position.
    const indices = [
        0, 1, 2,    // front
        3, 4, 5,    // back
        6, 7, 8,    // right
        9, 10, 11,  // left
    ];

    // Now send the element array to GL
    // Since indices are integers, we do not use a float array here,
    // but a Uint16Array. Indices are never negative, so we can store
    // them as unsigned integers - and our largest index is 23, so
    // 16 bits are more than enough.
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
function drawScene(gl, programInfo, deltaTime) {
    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Create a perspective projection matrix that is
    // used to simulate the distortion of perspective in a camera.
    // Our field of view is 45 degrees, with a width/height
    // ratio that matches the display size of the canvas
    // and we only want to see objects between 0.1 units
    // and 100 units away from the camera.
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
    const modelViewMatrix = mat4.create();

    // Move the cube back from the camera
    mat4.translate(
        modelViewMatrix,   // destination matrix
        modelViewMatrix,   // matrix to translate
        [0.0, 0.0, -3.0]); // amount to translate

    // Rotate the cube around all three axes
    mat4.rotate(
        modelViewMatrix,    // destination matrix
        modelViewMatrix,    // matrix to rotate
        time * 0.3,         // amount to rotate in radians
        [0, 0, 1]);         // axis to rotate around (Z)
    mat4.rotate(
        modelViewMatrix,    // destination matrix
        modelViewMatrix,    // matrix to rotate
        time * 0.5,         // amount to rotate in radians
        [0, 1, 0]);         // axis to rotate around (Y)
    mat4.rotate(
        modelViewMatrix,    // destination matrix
        modelViewMatrix,    // matrix to rotate
        time * 0.8,         // amount to rotate in radians
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

    // The draw call
    gl.drawElements(
        gl.TRIANGLES,       // primitive type
        13,                 // vertex count
        gl.UNSIGNED_SHORT,  // type of indices 
        0                   // offset
    );

    // Update the rotation for the next draw
    time += deltaTime / 1000.0; // convert milliseconds to seconds
}


// Start the main program
main();
