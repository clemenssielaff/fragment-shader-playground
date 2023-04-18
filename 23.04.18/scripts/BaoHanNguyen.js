// Import names from glMatrix
const { mat4 } = glMatrix;

const vShaderSrc = `
attribute vec4 aPosition;
attribute vec4 aVertexColor;

uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;

varying vec4 coordPosition;


void main() {

    gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
    coordPosition = aPosition;
}
`;


const fShaderSrc = `
precision mediump float;
varying vec4 coordPosition;

void main() {
    vec3 red;
    vec3 blue;
    vec3 green;
    
    red = vec3(1.0, 0.0, 0.0);
    green = vec3(0.0, 1.0, 0.0);
    blue = vec3(0.0, 0.0, 1.0);
    
    vec3 color = vec3(0.0);
    color += mix(red, green, coordPosition.x); // yellow
    color += mix(green, blue, coordPosition.y); //cyan
    color += mix(blue, red, coordPosition.z); // magenta
    
    gl_FragColor = vec4(color, 1.0);
    
    if(mod(gl_FragCoord.x, 8.0) > 5.0){
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    // } else if(mod(gl_FragCoord.y, 8.0) > 5.0){
    //     gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    } else {
        gl_FragColor = vec4(color, 1.0);
    }
    
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
    // const canvas = document.querySelector("#canvas");
    // if (!canvas) {
    //     console.log("Canvas not avaiable");
    // } else {
    //     console.log("Canvas is avaiable");
    // }

    // const gl = canvas.getContext('webgl');
    // if (!gl) {
    //     console.log("WebGL Context is not avaiable");
    // } else {
    //     console.log("WebGL Context is avaiable");
    // }

    const shaderProgram = initShaderProgram(gl, vShaderSrc, fShaderSrc);

    // Create empty buffers
    const positionBuffer = createPositionBuffer(gl)
    const colorBuffer = createColorBuffer(gl)
    const indexBuffer = createIndexBuffer(gl)

    const programInfo = {
        program: shaderProgram,
        indexBuffer: indexBuffer,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aPosition'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'), //Position and orientation of camera
            time: gl.getUniformLocation(shaderProgram, 'uTime'),
        }
    };

    // send points data to GPU & connect attributes with vertex shader
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition)

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor)

    return programInfo;

    // // Unbind the position buffer (is not needed to draw)
    // gl.bindBuffer(gl.ARRAY_BUFFER, null);
    // // Bind the index buffer  
    // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    // gl.useProgram(programInfo.program);

    // gl.clearColor(1.0, 1.0, 1.0, 1.0);
    // // clear everything
    // gl.clearDepth(1.0);
    // gl.enable(gl.DEPTH_TEST);
    // gl.depthFunc(gl.LEQUAL);

    // // Start the render loop
    // var last;
    // function render(now) {
    //     drawScene(gl, programInfo);
    //     const deltaTime = now - (last || now)
    //     time += deltaTime / 1000.0
    //     last = now
    //     requestAnimationFrame(render)
    // }
    // requestAnimationFrame(render);
}

function createPositionBuffer(gl) {
    // buffer for cube's vertex points
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const coordinationsCube = [
        // Front face
        -.5, -.5, +.5, // point down left
        +.5, -.5, +.5, // point down right
        +.5, +.5, +.5, // point up right
        -.5, +.5, +.5, // point up left

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

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coordinationsCube), gl.STATIC_DRAW);

    return positionBuffer;
}

function createColorBuffer(gl) {
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

    const faceColors = [
        [0.8, 1.0, 1.0, 1.0],    // hellblau
        [0.7, 0.4, 0.4, 1.0],    // braun
        [0.4, 0.8, 0.5, 1.0],    // hellgrün
        [0.4, 0.0, 0.8, 1.0],    // dunkellila
        [0.0, 1.0, 1.0, 1.0],    // Right face: yellow
        [0.9, 0.6, 0.2, 1.0],    // orange
    ];

    // const faceColors = [
    //     [0.8, 1.0, 1.0, 1.0],
    //     [0.8, 1.0, 1.0, 1.0],
    //     [0.8, 1.0, 1.0, 1.0],
    //     [0.8, 1.0, 1.0, 1.0],
    //     [0.8, 1.0, 1.0, 1.0],
    //     [0.8, 1.0, 1.0, 1.0],
    // ];

    // Convert the array of colors into a table for all the vertices.
    var colors = [];
    for (var j = 0; j < faceColors.length; ++j) {
        const c = faceColors[j];
        // Repeat each color four times for the four vertices of the face
        colors = colors.concat(c, c, c, c);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);


    return colorBuffer;
}


/// Create an index buffer for our cube, which specifies the 
/// indices into the vertex arrays for each face's vertices.
function createIndexBuffer(gl) {
    const indexBuffer = gl.createBuffer();
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

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    return indexBuffer;
}


// Initialize a shader program from vertex- and fragment-shader sources.
function initShaderProgram(gl) {
    const loadShader = (type, source) => {
        const shader = gl.createShader(type)
        gl.shaderSource(shader, source)
        gl.compileShader(shader)
        return shader;
    }
    const vertexShader = loadShader(gl.VERTEX_SHADER, vShaderSrc)
    const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fShaderSrc)

    var success = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
    if (success) {
        console.log('Vertex Shader successfully compiled');
    } else {
        console.error('Vertex Shader compilation failed');
        console.log(gl.getShaderInfoLog(vertexShader));
    }

    var success = gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS);
    if (success) {
        console.log('Fragment Shader successfully compiled.');
    } else {
        console.error('Fragment Shader did not compile.');
        console.log(gl.getShaderInfoLog(fragmentShader));
    }

    // Create the shader program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    return shaderProgram;

}

export function drawScene(gl, programInfo) {
    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, degToRad(45), gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100.0);

    const modelViewMatrix = mat4.clone(programInfo.origin);

    // camera position
    mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -4.0]); //  [displacement left/right, up/downm front/back]

    // rotation of the cube
    mat4.rotate(modelViewMatrix, modelViewMatrix, 0.6 * time, [1, 1, 0]); // [x, y, z]

    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
    gl.uniform1f(programInfo.uniformLocations.time, time);

    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
}
// main();