/**
 * ECG Assignement: Shader
 * Renders a rotating cube with a brick-texture and a colorful, pulsating fragment shader
 *
 * @summary Pulsating fragment shader on a cube
 * @author Leon Gobbert, leon.gobbert (ät) hs-furtwangen.de
 *
 * Created at     : 2023-04-14  
 * Last modified  : 2023-04-17
 */


// Import names from glMatrix
const { mat4 } = glMatrix;


// Shader source =========================================================== //

const vertexShaderSource = `
attribute vec4 aPosition;
attribute vec2 aTextureCoord;
attribute vec3 aNormal;
 
uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 uNormalMatrix;

varying highp vec2 vTextureCoord;
varying highp vec3 vLighting;

void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
    vTextureCoord = aTextureCoord;

    // Apply lighting effect
    highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
    highp vec3 directionalLightColor = vec3(1, 1, 1);
    highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

    highp vec4 transformedNormal = uNormalMatrix * vec4(aNormal, 1.0);

    highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);

    //combine ambient and directional light
    vLighting = ambientLight + (directionalLightColor * directional);
}
`;


const fragmentShaderSource = `
varying highp vec2 vTextureCoord;
varying highp vec3 vLighting;

uniform mediump float uTime;
uniform sampler2D uSampler;

void main() {
    //divide the fragment coordinates by the resolution, to put the later added effects into the perspective of the canvas size
    mediump vec2 resolution = vec2(1280, 960);
    mediump vec2 coord = gl_FragCoord.xy / resolution;

    mediump vec3 color = vec3(0.0);

    //The translate vector moves the origin to the center of the fragment coordinate system
    mediump vec2 translate = vec2(-0.5);
    coord += translate;


    //abs prevents the result from being negative
    //-0.6 inverts the color values
    //the color values are then multiplied by a sin or cosine function, which moves at different speed at each color channel
    color.r += abs(0.1 + length(coord) -0.6 * abs(sin(uTime * 0.6 / 4.0)));
    //green is moving in the opposite direction of red and blue, bc it is multiplied by a cosine function
    color.g += abs(0.1 + length(coord) -0.6 * abs(cos(uTime * 0.9 / 12.0)));
    color.b += abs(0.1 + length(coord) -0.6 * abs(sin(uTime * 0.3 / 9.0)));


    //Texture color is applied to the texture coordinates
    highp vec4 texelColor = texture2D(uSampler, vTextureCoord);


    //The color is divided by 0.3, which leads to little more prominent circles forming for each color channel
    //The color is then multiplied by the texelColor and the lighting color
    gl_FragColor = vec4((0.3 / color) * texelColor.rgb * vLighting, 1.0);
}
`;

export let time = 0.0;


// Utility functions ======================================================= //

function degToRad(grad) {
    return (grad / 180.0) * Math.PI;
}
function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}


// Main function =========================================================== //


export function main(gl) {
    // Get a WebGL context from the canvas element in the DOM
    /**@type {WebGLRenderingContext} */
    // const gl = document.querySelector("#canvas").getContext('webgl');
    // if (!gl) {
    //     console.log('WebGL unavailable');
    // } else {
    //     console.log('WebGL is good to go');
    // }


    // Initialize a shader program; this is where all the lighting
    // for the vertices and so forth is established.
    const shaderProgram = initShaderProgram(gl, vertexShaderSource, fragmentShaderSource);

    // Collect all the info needed to use the shader program.
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aPosition'),
            textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
            vertexNormal: gl.getAttribLocation(shaderProgram, 'aNormal'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
            time: gl.getUniformLocation(shaderProgram, 'uTime'),
            uSampler: gl.getUniformLocation(shaderProgram, "uSampler"),
        }
    };

    // Initialize the geometry in vertex buffer objects 
    const positionBuffer = createPositionBuffer(gl)
    const normalBuffer = createNormalBuffer(gl)
    const textureBuffer = createTextureBuffer(gl)
    const indexBuffer = createIndexBuffer(gl)

    // Load texture
    const texture = loadTexture(gl, "assets/brick_texture.jpg"); 
    // Flip image pixels into the bottom-to-top order that WebGL expects.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

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

    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexNormal,
        3, // numComponents
        gl.FLOAT, //type
        false, // normalize
        0, // offset
        0, // stride
    )
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal)

    // tell webgl how to pull out the texture coordinates from buffer
    // into the textureCoord attribute of the vertex shader
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.vertexAttribPointer(
        programInfo.attribLocations.textureCoord,
        2,        // numComponents
        gl.FLOAT, // type
        false,    // normalize
        0,        // stride
        0         // offset
    )
    gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord)

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
        drawScene(gl, programInfo, texture);
        const deltaTime = now - (last || now)
        time += deltaTime / 1000.0
        last = now
        requestAnimationFrame(render)
    }
    requestAnimationFrame(render);
}


// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//Source of the function's code: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
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
            // gl.NEAREST is also allowed, instead of gl.LINEAR, as neither mipmap.
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            // Prevents s-coordinate wrapping (repeating).
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            // Prevents t-coordinate wrapping (repeating).
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        }
    };
    image.src = url;

    return texture;
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

function createNormalBuffer(gl) {
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

    const vertexNormals = [
        // Front
        0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,

        // Back
        0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,

        // Top
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,

        // Bottom
        0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,

        // Right
        1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,

        // Left
        -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
    ];

    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(vertexNormals),
        gl.STATIC_DRAW
    );

    return normalBuffer;
}

function createTextureBuffer(gl) {
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
export function drawScene(gl, programInfo, texture) {
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

    //Initialize the normal matrix
    const normalMatrix = mat4.create();
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);


    // Move the cube back from the camera
    mat4.translate(
        modelViewMatrix,   // destination matrix
        modelViewMatrix,   // matrix to translate
        [0.0, 0.0, -4.0]); // amount to translate

    //Rotate around all axis:
    mat4.rotate(
        modelViewMatrix,    // destination matrix
        modelViewMatrix,    // matrix to rotate
        0.1 * time,         // amount to rotate in radians
        [1, 0, 0]);         // axis to rotate around (X)
    mat4.rotate(
        modelViewMatrix,    // destination matrix
        modelViewMatrix,    // matrix to rotate
        0.3 * time,         // amount to rotate in radians
        [0, 1, 0]);         // axis to rotate around (Y)
    mat4.rotate(
        modelViewMatrix,    // destination matrix
        modelViewMatrix,    // matrix to rotate
        0.1 * time,         // amount to rotate in radians
        [0, 0, 1]);         // axis to rotate around (Z)


    // Set the shader uniforms  
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.normalMatrix,
        false,
        normalMatrix);

    //texture:
    // Tell WebGL we want to affect texture unit 0
    gl.activeTexture(gl.TEXTURE0);
    // Bind the texture to texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Tell the shader we bound the texture to texture unit 0
    gl.uniform1i(programInfo.uniformLocations.uSampler, 0)

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