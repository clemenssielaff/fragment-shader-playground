// Code by Sören Winterhalder (c) 2023
// Code by Clemens Sielaff (c) 2023

// Random and noise functions from https://thebookofshaders.com/11/

const { mat4 } = glMatrix;

// Constants
const gridResolution = 100;     // gridResolution^2 = amount of cells
const tilt = 0.6;               // Tilt of the grid in radians
const timeScale = 0.36;         // Time scale
const rotationSpeed = 0.8;      // Rotation speed in degrees per second
const moveSpeed = 6.0;          // Move speed in units per second
const minDistance = 5.0;        // Minimum distance to the grid
const maxDistance = 50.0;       // Maximum distance to the grid
const shiftAcceleration = 4.0;  // Acceleration factor when shift is pressed

// User input state
let leftArrowPressed = false;
let rightArrowPressed = false;
let upArrowPressed = false;
let downArrowPressed = false;
let shiftPressed = false;


async function main() {
  // Get the WebGL context from the canvas element in the DOM
  const gl = document.querySelector("#canvas").getContext('webgl');
  if (!gl) {
      console.log('WebGL unavailable');
  } else {
      console.log('WebGL is good to go');
  }

  // Create the shader program
  const vertexShaderSource = await fetch('./shader.vert').then(response => response.text());
  const fragmentShaderSource = await fetch('./shader.frag').then(response => response.text());
  const programInfo = createProgramInfo(gl, vertexShaderSource, fragmentShaderSource);

  // Prepare the OpenGL state machine
  gl.bindBuffer(gl.ARRAY_BUFFER, null);   // Unbind the position buffer (is not needed to draw)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,  // Bind the index buffer
      programInfo.indexBuffer);
  gl.useProgram(programInfo.program);     // Use the shader program
  gl.clearColor(0.0, 0.0, 0.0, 1.0);      // Clear to black, fully opaque
  gl.clearDepth(1.0);                     // Clear everything
  gl.enable(gl.DEPTH_TEST);               // Enable depth testing
  gl.depthFunc(gl.LEQUAL);                // Near things obscure far things

  let time = 0.0;
  let lastTime;
  let rotation = 0.0;
  let distance = 20.0;

  // Render loop
  function render(now) {

      // Update the time
      const deltaTime = (now - (lastTime || now)) / 1000.0;
      lastTime = now;
      time += deltaTime * timeScale;
      
      // Update the rotation
      const rotationDirection = ((leftArrowPressed ? 1.0 : 0.0) - (rightArrowPressed ? 1.0 : 0.0)) * (shiftPressed ? shiftAcceleration : 1.0);
      rotation += rotationSpeed * rotationDirection * deltaTime;
      
      // Update the distance
      const moveDirection = ((downArrowPressed ? 1.0 : 0.0) - (upArrowPressed ? 1.0 : 0.0)) * (shiftPressed ? shiftAcceleration : 1.0);
      distance = Math.min(Math.max(distance + moveSpeed * moveDirection * deltaTime, minDistance), maxDistance);

      drawScene(gl, programInfo, distance, rotation, time);
      
      requestAnimationFrame(render);
  }
  requestAnimationFrame(render);   
}

// Create the shader program.
function createProgramInfo(gl, vertexShaderSource, fragmentShaderSource) {
  // Load the Vertex- and Fragment-Shader
  function loadShader (type, source) {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    return shader;
  }
  const vertexShader = loadShader(gl.VERTEX_SHADER, vertexShaderSource)
  const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fragmentShaderSource)

  // Create the shader program
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  // Check for errors 
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(`Linking failed: ${gl.getProgramInfoLog(program)}`);
    console.error(`Vertex Shader log: ${gl.getShaderInfoLog(vertexShader)}`);
    console.error(`Fragent Shader log: ${gl.getShaderInfoLog(fragmentShader)}`);
    alert('Unable to initialize the shader program! See console for details')
    return null;
  }

  // Generate the geometry buffers.
  const {positionBuffer, indexBuffer} = createGridPositionBuffers(gl, gridResolution, 0.25); // TODO: calculate cell size from resolution and extend

  // Define the programInfo object with all the information needed to render the scene.
  const programInfo = {
    program,
    indexBuffer,
    attribute: {
      position:         gl.getAttribLocation(program, 'aPosition'),
    },
    uniform: {
      projectionMatrix: gl.getUniformLocation(program, 'uProjectionMatrix'),
      modelViewMatrix:  gl.getUniformLocation(program, 'uModelViewMatrix'),
      time:             gl.getUniformLocation(program, 'uTime'),
    }
  };

  // Tell WebGL how to use the positions from the position buffer as `aPosition` attributes.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(programInfo.attribute.position,
    3,        // components per vertex
    gl.FLOAT, // the data type of each component
    false,    // do not normalize the data (only relevant for integer data)
    0,        // stride
    0);       // offset
  gl.enableVertexAttribArray(programInfo.attribute.position);

  return programInfo;
}


/// Creates a grid of cells with the given size and cell size.
/// Returns a position buffer and an index buffer.
function createGridPositionBuffers(gl, resolution, cellSize) {
  
  // Create the grid
  let positions = []
  let indices = []
  for (let x = 0; x < resolution; x++) {
    for (let z = 0; z < resolution; z++) {
      const x_cell = x * cellSize - resolution / 2 * cellSize
      const z_cell = z * cellSize - resolution / 2 * cellSize

      positions.push(x_cell)
      positions.push(0.0)
      positions.push(z_cell)

      positions.push(x_cell + cellSize)
      positions.push(0.0)
      positions.push(z_cell)

      positions.push(x_cell + cellSize)
      positions.push(0.0)
      positions.push(z_cell + cellSize)

      positions.push(x_cell)
      positions.push(0.0)
      positions.push(z_cell + cellSize)

      let xz = z + (x * resolution)
      let xz4 = xz * 4
      let xz6 = xz * 6

      indices[xz6 + 0] = xz4
      indices[xz6 + 1] = xz4 + 1
      indices[xz6 + 2] = xz4 + 2
      indices[xz6 + 3] = xz4
      indices[xz6 + 4] = xz4 + 2
      indices[xz6 + 5] = xz4 + 3
    }
  }

  // Position buffer
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // Index buffer
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  return {positionBuffer, indexBuffer};
}


// Draw the scene.
export function drawScene(gl, programInfo, distance, rotation, time) {
  // Clear the canvas before we start drawing on it.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create a perspective projection matrix.
  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix,
    0.7853981633974483,       // 45deg field of view in radians
    (gl.canvas.clientWidth /  // aspect ratio
      gl.canvas.clientHeight),
    0.1,                      // near clipping plane
    100);                     // far clipping plane

  // Position the model in front of the camera.
  const modelViewMatrix = mat4.create();
  // Translate the model back from the camera.
  mat4.translate(modelViewMatrix, modelViewMatrix,
    [0.0, 0.0, -distance]);
  // Tilt the model down a bit.
  mat4.rotate(modelViewMatrix, modelViewMatrix, tilt, [1, 0, 0]);
  // Rotate the model around its vertical axis.
  mat4.rotate(modelViewMatrix, modelViewMatrix, rotation, [0, 1, 0]);

  // Tell WebGL to use our program when drawing  
  gl.useProgram(programInfo.program);

  // Set the shader uniforms  
  gl.uniformMatrix4fv(programInfo.uniform.projectionMatrix, false, projectionMatrix);
  gl.uniformMatrix4fv(programInfo.uniform.modelViewMatrix, false, modelViewMatrix);
  gl.uniform1f(programInfo.uniform.time, time);
  
  // Draw the scene.
  gl.drawElements(
    gl.TRIANGLES,                         // primitive type
    6 * gridResolution * gridResolution,  // number of indices to use
    gl.UNSIGNED_SHORT,                    // the data type of each index
    0);                                   // offset in the index buffer
}


// Update the keyboard state.
window.addEventListener('keydown', function(event) {
  switch (event.key) {
    case 'ArrowRight':
      rightArrowPressed = true;
      break;
    case 'ArrowLeft':
      leftArrowPressed = true;
      break;
    case 'ArrowUp':
      upArrowPressed = true;
      break;
    case 'ArrowDown':
      downArrowPressed = true;
      break;
    case 'Shift':
      shiftPressed = true;
      break;
  }
});
window.addEventListener('keyup', function(event) {
  switch (event.key) {
    case 'ArrowRight':
      rightArrowPressed = false;
      break;
    case 'ArrowLeft':
      leftArrowPressed = false;
      break;
    case 'ArrowUp':
      upArrowPressed = false;
      break;
    case 'ArrowDown':
      downArrowPressed = false;
      break;
    case 'Shift':
      shiftPressed = false;
      break;
  }
});


await main();