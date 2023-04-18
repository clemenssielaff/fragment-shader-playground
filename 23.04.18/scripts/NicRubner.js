// Import names from glMatrix
const { mat4 } = glMatrix;


// Shader source
const vertexShaderSource = `
    attribute vec4 aPosition;
    attribute vec4 aVertexColor;
    attribute float aFace;

    uniform mat4 uProjectionMatrix;
    uniform mat4 uModelViewMatrix;

    varying lowp vec4 vColor;
    varying float vFace;
    varying vec4 vPosition;

    void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
        vColor = aVertexColor;
        vFace = aFace;
        vPosition = aPosition;
    } 
`;

const fragmentShaderSource = `
    precision mediump float;

    varying vec4 vColor;
    varying float vFace;
    varying vec4 vPosition;

    uniform float uTime;

    void main() {

        if (vFace < 1.001) { 
            float noise = fract(sin(dot(vPosition.xyz, vec3(10.0, 70.0, 45.0))) * 3000.0);
            // Set the fragment color based on the noise value
            gl_FragColor = vec4(noise, noise, 1.0, 1.0);
        }else if (vFace > 1.999 && vFace < 2.001) {
            if( mod(vPosition.x + 0.5, 0.12) < 0.06 ) {  
                gl_FragColor = vColor;
            } else {
                gl_FragColor = vec4(1.0,1.0,1.0,2.0) 
                               - vColor;
            } 
        } else if (vFace > 2.999 && vFace < 3.001) {
            if (abs(vPosition.z) < 0.5) {
                if (mod(floor((vPosition.z + 0.5) * 10.0), 2.0) == 0.0) {
                    gl_FragColor = vColor;
                } else {
                    gl_FragColor = vec4(1.0, 1.0, 1.0, 2.0) - vColor;
                }
            } else {
                gl_FragColor = vColor;
            }
            
        } else if (vFace > 3.999 && vFace < 4.001) {
            for(float i = 0.5; i>0.0; i -= 0.1){
                if(abs(vPosition.x)+abs(vPosition.z) < i){
                    gl_FragColor = vec4(0.2,0.8,0.5,1.0);
                }else if(abs(vPosition.x) < i && abs(vPosition.z) < i){
                    gl_FragColor = vec4(1.0,i,0.0,1.0);
                }
            }
        } else if(vFace > 4.999 && vFace < 5.001) {
            
            if( mod(gl_FragCoord.x, 10.0) < 5.0 ) {  
                gl_FragColor = vec4(1.0,0.0,0.0,1.0);
            } else {
                gl_FragColor = vec4(1.0,1.0,1.0,2.0) - vColor;
            } 
            if( mod(gl_FragCoord.y, 10.0) < 5.0 ) {  
                gl_FragColor = vec4(1.0,1.0,1.0,0.1) ;
            }
        } else if (vFace > 5.999) {
            float distance = sqrt(abs(vPosition.y) * abs(vPosition.y) + abs(vPosition.z) * abs(vPosition.z));
            float radius = 0.2 * sin(uTime) + 0.3;
            if(distance < radius){
                gl_FragColor = vec4(0.0,0.0,0.0,1.0);
            }else{
                gl_FragColor = vColor;
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

//Main Function

export function main(gl) {
    //Get WebGL context
    // const gl = document.querySelector("#canvas").getContext('webgl');
    // if(!gl) {
    //     console.log('WebGL unavailable');
    // } else {
    //     console.log("WebGL is good to go!");
    // }

    //Initialize shader programm
    const shaderProgram = initShaderProgram(gl, vertexShaderSource, fragmentShaderSource);

    //Initialize geometry in vertex buffer objects
    const positionBuffer = createPositionBuffer(gl)
    const colorBuffer = createColorBuffer(gl)
    const indexBuffer = createIndexBuffer(gl)
    const faceIndexBuffer = createFaceIndexBuffer(gl)

    //Collect all info
    const programInfo = {
        program: shaderProgram,
        indexBuffer: indexBuffer,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aPosition'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
            vertexFace: gl.getAttribLocation(shaderProgram, 'aFace'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            time: gl.getUniformLocation(shaderProgram, 'uTime'),
        }
    }

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

    gl.bindBuffer(gl.ARRAY_BUFFER, faceIndexBuffer);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexFace,
        1,        // numComponents
        gl.FLOAT, // type
        false,    // normalize
        0,        // stride
        0         // offset
    )
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexFace)

    return programInfo;

    //    // Prepare the OpenGL state machine
    //    gl.bindBuffer(gl.ARRAY_BUFFER, null);   // Unbind the position buffer (is not needed to draw)
    //    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,  // Bind the index buffer
    //        indexBuffer);
    //    gl.useProgram(programInfo.program);     // Use the shader program
    //    gl.clearColor(0.0, 0.0, 0.0, 1.0);      // Clear to black, fully opaque
    //    gl.clearDepth(1.0);                     // Clear everything
    //    gl.enable(gl.DEPTH_TEST);               // Enable depth testing
    //    gl.depthFunc(gl.LEQUAL);                // Near things obscure far things

    //    drawScene(gl, programInfo);

    //      // Start the render loop
    //     var last
    //     function render(now){
    //         const deltaTime = now - (last || now);
    //         time += deltaTime/1000;
    //         drawScene(gl, programInfo);
    //         last = now;
    //         requestAnimationFrame(render);
    //     }
    //     requestAnimationFrame(render);

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
        [1.0, 1.0, 0.0, 1.0],    // Front face: white
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

function createFaceIndexBuffer(gl) {
    const faceIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, faceIndexBuffer);
    const faceIndeces = [
        1, 1, 1, 1, //front
        2, 2, 2, 2,//back
        3, 3, 3, 3,  //top
        4, 4, 4, 4,//bottom
        5, 5, 5, 5, //right
        6, 6, 6, 6,//left
    ]
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(faceIndeces), gl.STATIC_DRAW);
    return faceIndexBuffer;

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
        console.error(`Fragment Shader log: ${gl.getShaderInfoLog(fragmentShader)}`);
        alert('Unable to initialize the shader program! See console for details')
        return null;
    }

    return shaderProgram;
}

/// Draw the scene.
export function drawScene(gl, programInfo) {
    // Clear the canvas before we start drawing on it.
    gl.uniform1f(programInfo.uniformLocations.time, time);
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
        0.3 * time,                // amount to rotate in radians
        [0, 0, 1]);         // axis to rotate around (Z)
    mat4.rotate(
        modelViewMatrix,    // destination matrix
        modelViewMatrix,    // matrix to rotate
        0.5 * time ,                // amount to rotate in radians
        [0, 1, 0]);         // axis to rotate around (Y)
    mat4.rotate(
        modelViewMatrix,    // destination matrix
        modelViewMatrix,    // matrix to rotate
        0.8 * time,                // amount to rotate in radians
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

//start program
// main();