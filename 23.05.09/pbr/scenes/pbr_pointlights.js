// Transated to Javascript from 
//  https://learnopengl.com/code_viewer_gh.php?code=src/6.pbr/1.1.lighting/lighting.cpp

const { vec3, mat3, mat4 } = glMatrix;

import * as glance from "../glance.js";


// =============================================================================
// Application State
// =============================================================================


// Glance
let gl;                   // the WebGL context
let sphere;               // the sphere entity
let cameraDistance = 20;  // distance of the camera from the origin
let cameraPan = 0;        // rotation of the camera around the vertical axis
let cameraTilt = 0;       // rotation of the camera around the horizontal axis
const cameraFov = 45;     // field of view of the camera in degrees
const nearPlane = 2;      // near clipping plane
const farPlane = 50;      // far clipping plane

// User Input
const panAcceleration = 0.008;
const tiltAcceleration = 0.008;
const zoomAcceleration = 0.01;
const cameraMinDistance = 11;
const cameraMaxDistance = 40;

// Scene
const rowCount = 4;
const colCount = 4;
const spacing = 2.5;


// =============================================================================
// Application
// =============================================================================


async function main() 
{
  // Get the WebGL context from the canvas element in the DOM.
  gl = glance.getContext("canvas");

  // Create uniform constants 
  const lightPositions = [
    -10,  10, 10,
     10,  10, 10,
    -10, -10, 10,
     10, -10, 10,
  ]
  const lightColors = [
    300, 300, 300,
    300, 300, 300,
    300, 300, 300,
    300, 300, 300,
  ]
  const albedo = vec3.fromValues(.5, 0, 0);
  const ambient = 0.03;

  // Create the shaders.
  const pbrShader = await glance.createShader(gl,
    "PBR Shader",                   // name
    "pbr.vert",                     // vertex shader source file
    "pbr.frag",                     // fragment shader source file
    [                               // attributes
      "aPosition",
      "aNormal",
    ], {                            // uniforms
      "uProjectionMatrix": {
          type: "mat4",
          value: mat4.create()
      },
     "uViewMatrix": {
          type: "mat4",
          value: mat4.create()
      },
     "uModelMatrix": {
          type: "mat4",
          value: mat4.create()
      },
     "uNormalMatrix": {
          type: "mat3",
          value: mat3.create()
      },
      "uAlbedo": {
          type: "vec3",
          value: albedo
      },
      "uMetalness": {
          type: "float",
          value: 0.0
      },
      "uRoughness": {
          type: "float",
          value: 0.0
      },
      "uAmbient": {
          type: "float",
          value: ambient
      },
      "uLightPositions": {
          type: "vec3",
          value: lightPositions
      },
      "uLightColors": {
          type: "vec3",
          value: lightColors
      },
      "uCamPos": {
          type: "vec3",
          value: vec3.create()
      },
    });

  // Create the entities.
  sphere = glance.createSphere(gl, 
    "Sphere Entity",
    pbrShader,
    {
      normalAttribute: "aNormal",
      latitudeBands: 64,
      longitudeBands: 64,
    }
  );

  // Connect the user interaction handlers.
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('wheel', handleWheel);
  window.addEventListener('resize', updateProjection);

  // Prepare the OpenGL state machine
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Set clear color to black, fully opaque
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing.
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things.
  gl.clearDepth(1.0);                 // Clear everything.
  gl.enable(gl.CULL_FACE);            // Enable backface culling.
  gl.cullFace(gl.BACK);               // Cull back-facing triangles.

  // Update the projection and camera position to render the first frame.
  updateProjection();
  updateCameraPosition();
}


// =============================================================================
// Render Loop
// =============================================================================


function render() 
{
  // Clear the canvas.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Render a grid of spheres.
  for(let row = 0; row <= rowCount; row++) 
  {
    // Increase the "metalness" from bottom to top.
    sphere.uniform.uMetalness = row / rowCount;

    for(let col = 0; col <= colCount; col++) 
    {
      // Increase the roughness from left to right.
      sphere.uniform.uRoughness = Math.min(Math.max(col / colCount, .05), 1);

      // Update the model matrix.
      const modelMatrix = mat4.create();
      mat4.translate(modelMatrix, modelMatrix, [
        (col - colCount / 2) * spacing, 
        (row - rowCount / 2) * spacing, 
        0
      ]);
      sphere.uniform.uModelMatrix = modelMatrix;

      // Update the normal matrix.
      const normalMatrix = mat3.create();
      mat3.normalFromMat4(normalMatrix, modelMatrix);
      sphere.uniform.uNormalMatrix = normalMatrix;
  
      // Render the next sphere.
      sphere.render();
    }
  }
}


// =============================================================================
// User Interaction
// =============================================================================


function handleMouseMove(event)
{
  // Only proceed if left mouse button is pressed.
  if ((event.buttons & 1) === 0) { 
    return;
  }

  // Update the application state.
  cameraTilt = clamp(
    cameraTilt - event.movementY * tiltAcceleration,
    -Math.PI / 2,
    Math.PI / 2)
  cameraPan -= event.movementX * panAcceleration;
  
  // Apply the changes and render the next frame.
  updateCameraPosition();
}

function handleWheel(event)
{
  // Update the application state.
  cameraDistance = clamp(
    cameraDistance + event.deltaY * zoomAcceleration, 
    cameraMinDistance, 
    cameraMaxDistance);

  // Apply the changes and render the next frame.
  updateCameraPosition();
}

function updateProjection()
{
  // Get the canvas element and its client size.
  const canvas = gl.canvas;
  const clientWidth = canvas.clientWidth;
  const clientHeight = canvas.clientHeight;

  // Update the projection matrix.
  const aspectRatio = clientWidth / clientHeight;
  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix,
    degreeToRadians(cameraFov),
    aspectRatio,
    nearPlane,
    farPlane,
  );

  // Update the uniforms.
  sphere.uniform.uProjectionMatrix = projectionMatrix;

  // Render the next frame.
  requestAnimationFrame(render);
}

function updateCameraPosition()
{
  const worldZero = vec3.fromValues(0, 0, 0);
  const verticalAxis = vec3.fromValues(0, 1, 0);

  // Define the camera position based on the application state.
  const cameraPosition = vec3.fromValues(0, 0, cameraDistance);
  vec3.rotateX(cameraPosition, cameraPosition, worldZero, cameraTilt);
  vec3.rotateY(cameraPosition, cameraPosition, worldZero, cameraPan);

  // Derive the view matrix from the camera position.
  const viewMatrix = mat4.create();
  mat4.lookAt(viewMatrix, cameraPosition, worldZero, verticalAxis);

  // Update the uniforms.
  sphere.uniform.uCamPos = cameraPosition;
  sphere.uniform.uViewMatrix = viewMatrix;

  // Render the next frame.
  requestAnimationFrame(render);
}


// =============================================================================
// Utils
// =============================================================================


function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function degreeToRadians(degrees) {
  return degrees * Math.PI / 180.;
}


// =============================================================================


/// Start the application.
main();