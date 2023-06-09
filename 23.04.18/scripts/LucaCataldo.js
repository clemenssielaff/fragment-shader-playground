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

uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;

varying lowp vec4 vColor;

void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
    vColor = aVertexColor;
}
`;


const fragmentShaderSource = `
precision mediump float;
varying lowp vec4 vColor;

uniform mediump float uTime;

void main() {
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////Variablen

    //////////////////////////////////////////////////////////////////////
    float centerX = 650.0;
    float centerY = 500.0;

    float strahlenDicke = 10.0;
    float strahlenLaenge = 20.0;
    float strahlenVelocity = 2.0;

    float mittelStrich = 5.0;

    //////////////////////////////////////////////////////////////////////Radiusberechnung für Sonne
    float radius = sqrt(pow(20.0 ,2.0) * pow(20.0 ,2.0));

    float laengeX;
    float laengeY;

    if (gl_FragCoord.x > centerX){
        laengeX = gl_FragCoord.x - centerX;
    } else{
        laengeX = centerX- gl_FragCoord.x;
    }
    if (gl_FragCoord.y > centerY){
        laengeY = gl_FragCoord.y - centerY;
    } else{
        laengeY = centerY- gl_FragCoord.y;
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////Shader

    ////////////////////////////////////////////////////////////////////////////////////////////////////Unterster Bereich (Straßenraster/ Grid)
    if(gl_FragCoord.y < centerY){    
        ////////////////////Zentrum von links zur Mitte versetzen & Ausstrahlen vom Zentrum aus & Dicke der Strahlen durch ''Hintergrundmaske''
        if(mod(gl_FragCoord.x - centerX, gl_FragCoord.y - centerY) < -strahlenDicke){
            gl_FragColor = vec4((35.0/255.0), (1.0/255.0), (77.0/255.0), 1.0);
        }
        ////////////////////Bewegtes Strahlenoverlay mit Sinusfunktion
        else if(sin((1.0/strahlenLaenge) * gl_FragCoord.y + strahlenVelocity * uTime) < 0.0){
            gl_FragColor = vec4((35.0/255.0), (1.0/255.0), (77.0/255.0), 1.0);
        }
        ////////////////////Strahlenfarbe
        else{
            gl_FragColor = vec4((251.0/255.0), (50.0/255.0), (251.0/255.0), 1.0);
        } 
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////Trennlinie zwischen Himmel und Raster
    else if(gl_FragCoord.y >= centerY && gl_FragCoord.y < centerY + mittelStrich){
        gl_FragColor = vec4((251.0/255.0), (50.0/255.0), (251.0/255.0), 1.0);
    }
    
    ////////////////////////////////////////////////////////////////////////////////////////////////////Himmel Bereich
    else{
        ////////////////////Raketenstart-Rauch-Bereich
        if(sqrt(pow(gl_FragCoord.x - centerX, 2.0) * pow(gl_FragCoord.y - centerY, 2.0)) < radius){
            gl_FragColor = vec4((217.0/255.0), (217.0/255.0), (217.0/255.0), 0.0);
        }

        ////////////////////Sonnenbereich
        else if(sqrt(pow(laengeX, 2.0) + pow(laengeY, 2.0)) < radius){

            ////////////////////halber Sonnenbereich definieren
            if(gl_FragCoord.y < (centerY + radius / 2.0)){

                ////////////////////Sonnenflimmern mit Sinusfunktion
                if(sin((1.0/20.0) * gl_FragCoord.y + 2.0 * uTime) < 0.0){
                    gl_FragColor = vec4((252.0/255.0), (218.0/255.0), (0.0/255.0), 1.0);
                }
                else{
                    gl_FragColor = vec4((35.0/255.0), (1.0/255.0), (77.0/255.0), 1.0);
                }
            }
            ////////////////////obere Hälfte der Sonne ohne Flimmern
            else{
                gl_FragColor = vec4((252.0/255.0), (218.0/255.0), (0.0/255.0), 1.0);
            }
        }

        ////////////////////Himmelfarbe
        else{
            gl_FragColor = vec4((40.0/255.0), (10.0/255.0), (48.0/255.0), 1.0);
        }
    }
}
`;

export let time = 0.0;
export function setTime(t) {
    time = t;
}


// Utility functions ======================================================= //

function degToRad(grad) {
    return (grad / 180.0) * Math.PI;
}


// Main function =========================================================== //


export function main(gl) {
    // Get a WebGL context from the canvas element in the DOM
    // const gl = document.querySelector("#canvas").getContext('webgl');
    // if (!gl) {
    //     console.log('WebGL unavailable');
    // } else {
    //     console.log('WebGL is good to go');
    // }

    // Initialize a shader program; this is where all the lighting
    // for the vertices and so forth is established.
    const shaderProgram = initShaderProgram(gl, vertexShaderSource, fragmentShaderSource);

    // Initialize the geometry in vertex buffer objects 
    const positionBuffer = createPositionBuffer(gl)
    const colorBuffer = createColorBuffer(gl)
    const indexBuffer = createIndexBuffer(gl)

    // Collect all the info needed to use the shader program.
    // Look up which attributes our shader program is using
    // for aVertexPosition, aVertexColor and also
    // look up uniform locations.
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
            time: gl.getUniformLocation(shaderProgram, 'uTime'),
        }
    };

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
    // function render(now){
    //     drawScene(gl, programInfo);
    //     const deltaTime = now - (last || now)
    //     time += deltaTime / 1000.0
    //     last = now
    //     requestAnimationFrame(render)
    // }
    // requestAnimationFrame(render);
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
        -1, -1, +1,
        +1, -1, +1,
        +1, +1, +1,
        -1, +1, +1,

        // Back face
        -1, -1, -1,
        -1, +1, -1,
        +1, +1, -1,
        +1, -1, -1,

        // Top face
        -1, +1, -1,
        -1, +1, +1,
        +1, +1, +1,
        +1, +1, -1,

        // Bottom face
        -1, -1, -1,
        +1, -1, -1,
        +1, -1, +1,
        -1, -1, +1,

        // Right face
        +1, -1, -1,
        +1, +1, -1,
        +1, +1, +1,
        +1, -1, +1,

        // Left face
        -1, -1, -1,
        -1, -1, +1,
        -1, +1, +1,
        -1, +1, -1,
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
        [1.0, 1.0, 1.0, 1.0],    // Front face: white
        [1.0, 0.0, 0.0, 1.0],    // Back face: red
        [0.0, 1.0, 0.0, 1.0],    // Top face: green
        [0.0, 0.0, 1.0, 1.0],    // Bottom face: blue
        [1.0, 1.0, 0.0, 1.0],    // Right face: yellow
        [1.0, 0.0, 1.0, 1.0],    // Left face: purple
    ];

    // Convert the array of colors into a table for all the vertices.
    var colors = [];
    for (var j = 0; j < faceColors.length; ++j) {
        const c = faceColors[j];
        // Repeat each color four times for the four vertices of the face
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
        0, 1, 2, 0, 2, 3,         // front
        4, 5, 6, 4, 6, 7,         // back
        8, 9, 10, 8, 10, 11,      // top
        12, 13, 14, 12, 14, 15,   // bottom
        16, 17, 18, 16, 18, 19,   // right
        20, 21, 22, 20, 22, 23,   // left
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
    const loadShader = (type, source) => {
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
export function drawScene(gl, programInfo) {
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
        0.01 * time,         // amount to rotate in radians
        [0, 0, 1]);         // axis to rotate around (Z)
    mat4.rotate(
        modelViewMatrix,    // destination matrix
        modelViewMatrix,    // matrix to rotate
        0.1 * time,         // amount to rotate in radians
        [0, 1, 0]);         // axis to rotate around (Y)
    mat4.rotate(
        modelViewMatrix,    // destination matrix
        modelViewMatrix,    // matrix to rotate
        0.05 * time,         // amount to rotate in radians
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