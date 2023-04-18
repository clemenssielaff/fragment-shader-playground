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
attribute vec2 aTextureCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying lowp vec4 vColor;
varying highp vec2 vTextureCoord;

void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
    vColor = aVertexColor; // Face colored cube
    vTextureCoord = aTextureCoord;
}
`;


const fragmentShaderSource = `
varying lowp vec4 vColor;
varying highp vec2 vTextureCoord;
uniform sampler2D uSampler;
        
void main() {
    // gl_FragColor = vColor;
    gl_FragColor = texture2D(uSampler, vTextureCoord + 10.);
}
`;


// Utility functions ======================================================= //

function degToRad(grad) {
    return (grad / 180.0) * Math.PI;
}


function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
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
            textureCoord: gl.getAttribLocation(shaderProgram, "aTextureCoord"),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            sampler: gl.getUniformLocation(shaderProgram, "uSampler"),
        }
    };

    // Initialize the geometry in vertex buffer objects 
    const positionBuffer = createPositionBuffer(gl)
    const colorBuffer = createColorBuffer(gl)
    const indexBuffer = createIndexBuffer(gl)
    const uvBuffer = createUVBuffer(gl);

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

    {
        const num = 2; // every coordinate composed of 2 values
        const type = gl.FLOAT; // the data in the buffer is 32-bit float
        const normalize = false; // don't normalize
        const stride = 0; // how many bytes to get from one set to the next
        const offset = 0; // how many bytes inside the buffer to start from
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.vertexAttribPointer(
          programInfo.attribLocations.textureCoord,
          num,
          type,
          normalize,
          stride,
          offset
        );
        gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
    }

    // Load texture
    const texture = loadTexture(gl, "https://github.com/clemenssielaff/fragment-shader-playground/raw/master/cube.png");
    // Flip image pixels into the bottom-to-top order that WebGL expects.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);


    // Prepare the OpenGL state machine
    gl.bindBuffer(gl.ARRAY_BUFFER, null);   // Unbind the position buffer (is not needed to draw)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,  // Bind the index buffer
        indexBuffer);
    gl.useProgram(programInfo.program);     // Use the shader program
    gl.clearColor(0.0, 0.0, 0.0, 1.0);      // Clear to black, fully opaque
    gl.clearDepth(1.0);                     // Clear everything
    gl.enable(gl.DEPTH_TEST);               // Enable depth testing
    gl.depthFunc(gl.LEQUAL);                // Near things obscure far things

    // Tell WebGL we want to affect texture unit 0
    gl.activeTexture(gl.TEXTURE0);

    // Bind the texture to texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Tell the shader we bound the texture to texture unit 0
    gl.uniform1i(programInfo.uniformLocations.sampler, 0);


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


function createUVBuffer(gl) {
    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
  
    const textureCoordinates = [
      // Front
      0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
      // Back
      0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
      // Top
      0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
      // Bottom
      0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
      // Right
      0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
      // Left
      0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    ];
  
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(textureCoordinates),
      gl.STATIC_DRAW
    );
  
    return textureCoordBuffer;
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


function loadTexture(gl, url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Because images have to be downloaded over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
    gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        internalFormat,
        width,
        height,
        border,
        srcFormat,
        srcType,
        pixel
    );

    const image = new Image();
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            level,
            internalFormat,
            srcFormat,
            srcType,
            image
        );

        // WebGL1 has different requirements for power of 2 images
        // vs. non power of 2 images so check if the image is a
        // power of 2 in both dimensions.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // No, it's not a power of 2. Turn off mips and set
            // wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    };
    image.src = url;

    return texture;
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
    gl.uniform1i(programInfo.uniformLocations.sampler, 
        0);

    // The draw call
    gl.drawElements(
        gl.TRIANGLES,       // primitive type
        36,                 // vertex count
        gl.UNSIGNED_SHORT,  // type of indices 
        0                   // offset
    );

    // Update the rotation for the next draw
    time += deltaTime / 1000.0; // convert milliseconds to seconds
}


// Start the main program
main();