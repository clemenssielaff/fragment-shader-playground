//Random and noise functions from https://thebookofshaders.com/11/

const { mat4 } = glMatrix;

//Time
var then = 0;
export let time = 0.0;
export function setTime(t) {
    time = t;
}

//Grid setup
const gridSize = 100; //gridSize * gridSize = amount of cells
const cellSize = 0.25; //Lower = higher detail

//Generation settings
const islandSize = 4.0; //Radius
const radiusVariance = 5.0; //Noise strength applied to radius, weird results if > islandSize * 2
const heightScale = 1.7; //Stretches the island vertically
const islandFalloff = 1.5; //Distance from radius it takes to reach water level
const offset = 100.0; //Noise offset / "seed"

//Rotation
const rotationSpeed = 0.1;
let rotation = 0.0;

// main();

export function main(gl) {
  // const canvas = document.getElementById("canvas");
  // const gl = canvas.getContext('webgl');
  // if (!gl) {
  //   console.log('WebGL unavailable');
  // } else {
  //   console.log('WebGL is good to go');
  // }

  /*========== Shaders ==========*/

  // define shader sources
  const vsSource = `
        attribute vec4 aPosition;

        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        uniform highp float uTime;
        uniform highp float uIslandSize;
        uniform highp float uIslandFalloff;
        uniform highp float uRadiusVariance;
        uniform highp float uOffset;
        uniform highp float uHeightScale;

        varying highp vec3 vGridPos;

        float random (in vec2 st) {
            return fract(sin(dot(st.xy,
                                 vec2(12.9898,78.233)))
                         * 43758.5453123);
        }
        
        float noise (in vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);
        
            // Four corners in 2D of a tile
            float a = random(i);
            float b = random(i + vec2(1.0, 0.0));
            float c = random(i + vec2(0.0, 1.0));
            float d = random(i + vec2(1.0, 1.0));
        
            // Smooth Interpolation
        
            // Cubic Hermine Curve.  Same as SmoothStep()
            vec2 u = f*f*(3.0-2.0*f);
            // u = smoothstep(0.,1.,f);
        
            // Mix 4 coorners percentages
            return mix(a, b, u.x) +
                    (c - a)* u.y * (1.0 - u.x) +
                    (d - b) * u.x * u.y;
        }

        void main() {
            //Create Island mask
            float radius = distance(aPosition.xz + noise(aPosition.xz) * uRadiusVariance - uRadiusVariance * 0.5, vec2(0));
            float islandMask = smoothstep(uIslandSize + uIslandFalloff, uIslandSize, radius);

            //Generate and apply noise
            vec4 pos = aPosition;
            float noiseRatio = 0.8;
            float shapeNoise = noise((pos.xz + vec2(uOffset)) * 1.0);
            float detailNoise = noise((pos.xz + vec2(uOffset)) * 2.0);
            pos.y = shapeNoise * noiseRatio + detailNoise * (1.0 - noiseRatio);
            pos.y *= islandMask;

            vGridPos = vec3(aPosition.x, pos.y, aPosition.z);
            pos.y *= uHeightScale;
            gl_Position = uProjectionMatrix * uModelViewMatrix * pos;
        }
    `;

  const fsSource = `
        varying highp vec3 vGridPos;

        uniform highp float uTime;

        highp float random (in highp vec2 st) {
          return fract(sin(dot(st.xy,
                               vec2(12.9898,78.233)))
                       * 43758.5453123);
        }
      
        highp float noise (in highp vec2 st) {
          highp vec2 i = floor(st);
          highp vec2 f = fract(st);
      
          // Four corners in 2D of a tile
          highp float a = random(i);
          highp float b = random(i + vec2(1.0, 0.0));
          highp float c = random(i + vec2(0.0, 1.0));
          highp float d = random(i + vec2(1.0, 1.0));
      
          // Smooth Interpolation
      
          // Cubic Hermine Curve.  Same as SmoothStep()
          highp vec2 u = f*f*(3.0-2.0*f);
          // u = smoothstep(0.,1.,f);
      
          // Mix 4 coorners percentages
          return mix(a, b, u.x) +
                  (c - a)* u.y * (1.0 - u.x) +
                  (d - b) * u.x * u.y;
        }

        highp vec3 water(highp vec3 gridPos) {
          //Base color with slight moving gradient based on noise
          highp vec3 color = vec3(.3, .6, 1) - noise(gridPos.xz * .1 + vec2(1) * uTime * 0.3) * .3;

          //Reflections, layered noise
          color += step(noise(gridPos.xz * 20.0) + noise(gridPos.xz * 1.5 + vec2(1) * uTime), .5) * vec3(1);

          return color;
        }

        //Returns if within range of current level
        highp float checkLevel(highp float lowerBound, highp float upperBound, highp float y) {
          return step(lowerBound, y) * step(y, upperBound);
        }

        void main() {
            //Define lower bounds of levels
            highp float levelOffset = noise(vGridPos.xy * 5.0) * 0.08;
            highp float waterLevel = -0.1;
            highp float sandLevel = 0.02; 
            highp float grass1Level = .07 + levelOffset;
            highp float grass2Level = .2 + levelOffset;
            highp float rock1Level = .3 + levelOffset;
            highp float rock2Level = .5 + levelOffset;
            highp float snowLevel = 0.75 + levelOffset;

            //Water
            highp vec3 col = checkLevel(waterLevel, sandLevel, vGridPos.y) * water(vGridPos);
            //Sand
            col += checkLevel(sandLevel, grass1Level, vGridPos.y) * vec3(0.8, 0.8, 0.5);
            //Grass1
            col += checkLevel(grass1Level, grass2Level, vGridPos.y) * vec3(.3, .6, .05);
            //Grass 2
            col += checkLevel(grass2Level, rock1Level, vGridPos.y) * vec3(.25, .35, .0);
            //Rock 1
            col += checkLevel(rock1Level, rock2Level, vGridPos.y) * vec3(.35, .25, .23);
            //Rock 2
            col += checkLevel(rock2Level, snowLevel, vGridPos.y) * vec3(.3, .2, .2);
            //Snow
            col += checkLevel(snowLevel, 1.0, vGridPos.y) * vec3(.9);
           
            //Detail / Color variance
            col += ((noise(vGridPos.xz * 10.0) + noise(vGridPos.xz * 30.0) - 1.0)* 0.1);

            //Set final color
            gl_FragColor = vec4(col, 1.0);
        }
    `;


  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Initialize the geometry in vertex buffer objects 
  const buffers = initBuffers(gl);

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
      islandSize: gl.getUniformLocation(shaderProgram, 'uIslandSize'),
      islandFalloff: gl.getUniformLocation(shaderProgram, 'uIslandFalloff'),
      offset: gl.getUniformLocation(shaderProgram, 'uOffset'),
      heightScale: gl.getUniformLocation(shaderProgram, 'uHeightScale'),
      radiusVariance: gl.getUniformLocation(shaderProgram, 'uRadiusVariance'),
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

  return programInfo;

  // // Draw the scene repeatedly
  // function render(now) {
  //   now *= 0.001;  // convert to seconds
  //   const deltaTime = now - then;
  //   then = now;

  //   drawScene(gl, programInfo, buffers, deltaTime);

  //   requestAnimationFrame(render);
  // }
  // requestAnimationFrame(render);

}

function initBuffers(gl) {
  //Create grid
  let positions = []
  let indices = []

  for (let x = 0; x < gridSize; x++) {
    for (let z = 0; z < gridSize; z++) {
      const x_cell = x * cellSize - gridSize / 2 * cellSize
      const z_cell = z * cellSize - gridSize / 2 * cellSize

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

      let xz = z + (x * gridSize)
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

  //Position buffer
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  //Index buffer
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices), gl.STATIC_DRAW);

  //Return buffers
  return {
    position: positionBuffer,
    indices: indexBuffer,
  };
}


// Initialize a shader program
function initShaderProgram(gl, vsSource, fsSource) {
  //Load shaders
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  //Setup program
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

// Creates shader
function loadShader(gl, type, source) {
  
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  // Alert if failed
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}


// Draw the scene.
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


  mat4.translate(modelViewMatrix,     // destination matrix
    modelViewMatrix,    // matrix to translate
    [0.0, 3.0, -30.0]);  // amount to translate

  mat4.rotate(modelViewMatrix,  // destination matrix
    modelViewMatrix,  // matrix to rotate
    .6,// amount to rotate in radians
    [1, 0, 0]);

  mat4.rotate(modelViewMatrix,  // destination matrix
    modelViewMatrix,  // matrix to rotate
    time * rotationSpeed * -0.7,// amount to rotate in radians
    [0, 1, 0]);       // axis to rotate around (X)
  mat4.translate(modelViewMatrix,     // destination matrix
    modelViewMatrix,     // matrix to translate
    [-0.5, -0.5, -0.5]);  // amount to translate

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
  gl.uniform1f(
    programInfo.uniformLocations.islandSize,
    islandSize);
  gl.uniform1f(
    programInfo.uniformLocations.offset,
    offset);
  gl.uniform1f(
    programInfo.uniformLocations.islandFalloff,
    islandFalloff);
  gl.uniform1f(
    programInfo.uniformLocations.heightScale,
    heightScale);
  gl.uniform1f(
    programInfo.uniformLocations.radiusVariance,
    radiusVariance);
  
  {
    const count = 6 * gridSize * gridSize;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, count, type, offset);
  }

  // // Update the rotation for the next draw
  // rotation += deltaTime * rotationSpeed;
  // time += deltaTime;
}

function degToRad(grad) {
  return (grad / 180.0) * Math.PI;
}