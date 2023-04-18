/**
 * Example Code #03 for ECG course
 * Render a cube and let it rotate
 * In the lecture an additional time dependent shading has been added.
 *
 * @summary WebGL implementation of a rotating cube
 * @author Uwe Hahne, uwe.hahne (Ã¤t) hs-furtwangen.de
 *
 * Created at     : 2021-11-03 15:25:45 
 * Last modified  : 2021-11-05 10:18:39
 */

var cubeRotation = degToRad(45.0);
var then = 0;
export let time = 0.0;
export function setTime(t) {
    time = t;
}
let time2 = 0.0;

const { mat4 } = glMatrix;

// main();

export function main(gl) {
    /*========== Create a WebGL Context ==========*/
    /** @type {HTMLCanvasElement} */
    // const canvas = document.querySelector("#canvas");
    // /** @type {WebGLRenderingContext} */
    // const gl = canvas.getContext('webgl');
    // if (!gl) {
    //     console.log('WebGL unavailable');
    // } else {
    //     console.log('WebGL is good to go');
    // }

    /*========== Shaders ==========*/

    // define shader sources
    const vsSource = `
    attribute vec4 aPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform float uTime;

    varying lowp vec4 vColor;

    void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
        //vColor = aPosition; // RGB Cube,
        vColor = abs(sin(uTime * 4.0)) * aVertexColor; // Face colored cube
        vColor.a = 1.0;
    }
    `;

    const fsSource = `

    varying lowp vec4 vColor;

    void main() {
      gl_FragColor = vColor;  
        if( mod(gl_FragCoord.y, 5.0) < 2.5 ) {  
            gl_FragColor = vec4(0.0,0.0,0.0,1.0);
        } else if ( mod(gl_FragCoord.x, 5.0) < 2.5 ) {  
            gl_FragColor = vec4(0.0,0.0,0.0,1.0); 
        } else {
            gl_FragColor = vColor;
        }            
    }    
    `;

    // Initialize a shader program; this is where all the lighting
    // for the vertices and so forth is established.
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    // Initialize the geometry in vertex buffer objects 
    const buffers = initBuffers(gl);

    // Collect all the info needed to use the shader program.
    // Look up which attributes our shader program is using
    // for aVertexPosition, aVertexColor and also
    // look up uniform locations.
    const programInfo = {
        program: shaderProgram,
        indexBuffer: buffers.indices,
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
    // buffer into the vertexPosition attribute
    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexPosition);
      }
    
      // Tell WebGL how to pull out the colors from the color buffer
      // into the vertexColor attribute.
      {
        const numComponents = 4;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexColor,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexColor);
      }

    return programInfo;

    // // Draw the scene repeatedly
    // function render(now) {
    //     now *= 0.001;  // convert to seconds
    //     const deltaTime = now - then;
    //     then = now;

    //     drawScene(gl, programInfo, buffers, deltaTime);

    //     requestAnimationFrame(render);
    // }
    // requestAnimationFrame(render);

} // be sure to close the main function with a curly brace.

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple three-dimensional cube.
//
function initBuffers(gl) {

    // Create a buffer for the cube's vertex positions.
  
    const positionBuffer = gl.createBuffer();
  
    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.
  
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  
    // Now create an array of positions for the cube.
  
    const positions = [
      // X, Y, Z
      // Front face
      +.3, +.6, +.3,
      -.3, +.6, +.3,
      -.3, -.6, +.3,
      +.3, -.6, +.3,
      
      // Left face
      -.3, +.6, +.3,
      -.3, +.6, -.3,
      -.3, -.6, -.3,
      -.3, -.6, +.3,

      // Back face
      -.3, +.6, -.3,
      +.3, +.6, -.3,
      +.3, -.6, -.3,
      -.3, -.6, -.3,

      // Right face
      +.3, +.6, -.3,
      +.3, +.6, +.3,
      +.3, -.6, +.3,
      +.3, -.6, -.3,

      // Bottom face
      -.5, -.8, -.5,
      -.5, -.8, +.5,
      +.5, -.8, +.5,
      +.5, -.8, -.5,


      // Front Ceiling
      -.0, +.9, +.0,
      -.3, +.6, +.3,
      +.3, +.6, +.3,
      +.3, +.6, +.3,

      // Left Ceiling
      -.0, +.9, +.0,
      -.3, +.6, -.3,
      -.3, +.6, +.3,
      -.3, +.6, +.3,

      // Back Ceiling
      -.0, +.9, +.0,
      +.3, +.6, -.3,
      -.3, +.6, -.3,
      -.3, +.6, -.3,

      // Right Ceiling
      -.0, +.9, +.0,
      +.3, +.6, +.3,
      +.3, +.6, -.3,
      +.3, +.6, -.3,


      // Front Floor
      +.3, -.6, +.3,
      -.3, -.6, +.3,
      -.5, -.8, +.5,
      +.5, -.8, +.5,

      // Left Floor
      -.3, -.6, +.3,
      -.3, -.6, -.3,
      -.5, -.8, -.5,
      -.5, -.8, +.5,

      // Back Floor
      -.3, -.6, -.3,
      +.3, -.6, -.3,
      +.5, -.8, -.5,
      -.5, -.8, -.5,

      // Right Floor
      +.3, -.6, -.3,
      +.3, -.6, +.3,
      +.5, -.8, +.5,
      +.5, -.8, -.5,
  ];
  
    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
  
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  
    // Now set up the colors for the faces. We'll use solid colors
    // for each face.
  
    const faceColors = [
      [1.0, 1.0, 1.0, 1.0],    // Front face: white
      [1.0, 0.0, 0.0, 1.0],    // Left face: red
      [0.0, 1.0, 0.0, 1.0],    // Back face: green
      [0.0, 0.0, 1.0, 1.0],    // Right face: blue
      [1.0, 1.0, 0.0, 1.0],    // Bottom face: yellow

      [1.0, 0.0, 1.0, 1.0],    // Front ceiling: purple
      [0.0, 1.0, 1.0, 1.0],    // Left ceiling: cyan
      [1.0, 1.0, 0.0, 1.0],    // Back ceiling: yellow
      [1.0, 0.0, 0.0, 1.0],    // Right ceiling: red

      [0.0, 1.0, 0.0, 1.0],    // Front floor: green
      [1.0, 1.0, 1.0, 1.0],    // Left floor: white
      [0.0, 0.0, 1.0, 1.0],    // Back floor: blue
      [1.0, 0.0, 1.0, 1.0],    // Right floor: purple
  ];
  
    // Convert the array of colors into a table for all the vertices.  
    var colors = [];
  
    for (var j = 0; j < faceColors.length; ++j) {
      const c = faceColors[j];
  
      // Repeat each color four times for the four vertices of the face
      colors = colors.concat(c, c, c, c);
    }


    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  
    // Build the element array buffer; this specifies the indices
    // into the vertex arrays for each face's vertices.
  
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  
    // This array defines each face as two triangles, using the
    // indices into the vertex array to specify each triangle's
    // position.
  
    const indices = [
      0, 1, 2, 0, 2, 3,         // front
      4, 5, 6, 4, 6, 7,         // left
      8, 9, 10, 8, 10, 11,      // back
      12, 13, 14, 12, 14, 15,   // right
      16, 17, 18, 16, 18, 19,   // bottom

      20, 21, 22,               // front ceiling
      24, 25, 26,               // left ceiling
      28, 29, 30,               // back ceiling
      32, 33, 34,               // right ceiling

      36, 37, 38, 36, 38, 39,   // front floor
      40, 41, 42, 40, 42, 43,   // left floor
      44, 45, 46, 44, 46, 47,   // back floor
      48, 49, 50, 48, 50, 51,   // right floor
  ];
  
    // Now send the element array to GL
  
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices), gl.STATIC_DRAW);
  
    return {
      position: positionBuffer,
      color: colorBuffer,
      indices: indexBuffer,
    };
  }

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
  
    // Create the shader program
  
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
  
    // If creating the shader program failed, alert
  
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
      return null;
    }
  
    return shaderProgram;
  }
  
//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
  }

  return shader;
}

//
// Draw the scene.
//
export function drawScene(gl, programInfo, deltaTime) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
  
    // Clear the canvas before we start drawing on it.
  
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
    // Create a perspective matrix, a special matrix that is
    // used to simulate the distortion of perspective in a camera.
    // Our field of view is 45 degrees, with a width/height
    // ratio that matches the display size of the canvas
    // and we only want to see objects between 0.1 units
    // and 100 units away from the camera.
  
    const fieldOfView = degToRad(45);   // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();
  
    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    mat4.perspective(projectionMatrix,
                     fieldOfView,
                     aspect,
                     zNear,
                     zFar);
    
    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    const modelViewMatrix = mat4.clone(programInfo.origin);
  
    // Now move the drawing position a bit to where we want to
    // start drawing the cube.
    mat4.translate(modelViewMatrix,     // destination matrix
                    modelViewMatrix,    // matrix to translate
                    [0.0, 0.0, -5.0]);  // amount to translate
    
    mat4.rotate(modelViewMatrix,  // destination matrix
                modelViewMatrix,  // matrix to rotate
                cubeRotation * time,     // amount to rotate in radians
                [0, 0, 1]);       // axis to rotate around (Z)
    mat4.rotate(modelViewMatrix,  // destination matrix
                modelViewMatrix,  // matrix to rotate
                cubeRotation * time * 0.7,// amount to rotate in radians
                [0, 1, 0]);       // axis to rotate around (X)
    mat4.rotate(modelViewMatrix,  // destination matrix
                modelViewMatrix,  // matrix to rotate
                cubeRotation * time * 0.2,// amount to rotate in radians
                [1, 0, 0]);       // axis to rotate around (X)
    mat4.translate(modelViewMatrix,     // destination matrix
                modelViewMatrix,     // matrix to translate
                [-0, -0, -0]);  // amount to translate
    
  
    // Tell WebGL which indices to use to index the vertices
    // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
  
    // Tell WebGL to use our program when drawing  
    gl.useProgram(programInfo.program);
  
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
  
    {
      const vertexCount = 66;
      const type = gl.UNSIGNED_SHORT;
      const offset = 0;
      gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }

    // // Update the rotation for the next draw
    // cubeRotation += deltaTime;
    // time += deltaTime;
}

function degToRad(grad)
{
  return (grad/180.0)*Math.PI;
}