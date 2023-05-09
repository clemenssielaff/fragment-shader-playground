// Transated to Javascript from 
//  https://learnopengl.com/code_viewer_gh.php?code=src/6.pbr/1.1.lighting/lighting.cpp

const { vec3, mat3, mat4 } = glMatrix;

import * as glance from "../glance.js";

async function main() {
  // Get the WebGL context from the canvas element in the DOM.
  const gl = document.querySelector("#canvas").getContext('webgl2');
  if (!gl) {
      console.log('WebGL unavailable');
  } else {
      console.log('WebGL is good to go');
  }

  // Create uniform constants
  const aspectRatio = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix,
    0.7853981633974483, // 45deg field of view in radians
    aspectRatio,        // aspect ratio
    10,                 // near clipping plane
    40,                 // far clipping plane
  );
  
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

  let cameraDistance = 20;
  const worldCenter = vec3.fromValues(0, 0, 0);

  const initialCameraPosition = vec3.fromValues(0, 0, cameraDistance);
  vec3.rotateY(initialCameraPosition, initialCameraPosition, worldCenter, 0);
  const initialViewMatrix = mat4.create();
  mat4.lookAt(initialViewMatrix, initialCameraPosition, worldCenter, vec3.fromValues(0, 1, 0));

  // Create the shaders.
  const pbrShader = await glance.createShader(gl,
    "PBR Shader",                   // name
    "pbr1.vert",                    // vertex shader source file
    "pbr1.frag",                    // fragment shader source file
    [                               // attributes
      "aPosition",
      "aNormal",
    ], {                            // uniforms
      "uProjectionMatrix": {
          type: "mat4",
          value: projectionMatrix
      },
     "uViewMatrix": {
          type: "mat4",
          value: initialViewMatrix
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
          value: vec3.fromValues(.5, 0, 0)
      },
      "uMetallic": {
          type: "float",
          value: 0.0
      },
      "uRoughness": {
          type: "float",
          value: 0.0
      },
      "uAmbientOcclusion": {
          type: "float",
          value: 1.0
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
          value: initialCameraPosition
      },
    });


  // Create the entities.
  const sphereEntity = glance.createSphere(gl, 
    "Sphere Entity",
    pbrShader,
    {
      normalAttribute: "aNormal",
      latitudeBands: 64,
      longitudeBands: 64,
    }
  );

  // Prepare the OpenGL state machine
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Set clear color to black, fully opaque
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing.

  const nRows = 4;
  const nCols = 4;
  const spacing = 2.5;

  // The render loop.
  function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Render a grid of spheres.
    for(let row = 0; row <= nRows; row++) {
      // Update the metallic.
      sphereEntity.uniform.uMetallic = row / nRows;

      for(let col = 0; col <= nCols; col++) {
        // Update the roughness.
        sphereEntity.uniform.uRoughness = Math.min(Math.max(col / nCols, .05), 1);

        // Update the model matrix.
        const modelMatrix = mat4.create();
        mat4.translate(modelMatrix, modelMatrix, [
          (col - nCols / 2) * spacing, 
          (row - nRows / 2) * spacing, 
          0
        ]);
        sphereEntity.uniform.uModelMatrix = modelMatrix;

        // Update the normal matrix.
        const normalMatrix = mat3.create();
        mat3.normalFromMat4(normalMatrix, modelMatrix);
        sphereEntity.uniform.uNormalMatrix = normalMatrix;
    
        sphereEntity.render();
      }
    }
  }

  function handleMouseMove(event) {
    const x = event.clientX;
    const y = event.clientY;
    const rect = event.target.getBoundingClientRect();
    const normalizedX = (x - rect.left) / rect.width;
    const normalizedY = (y - rect.top) / rect.height;
    const clipX = (normalizedX * 2 - 1) * Math.PI;
    const clipY = (normalizedY * 2 - 1) * Math.PI * .4;
    
    const cameraPosition = vec3.fromValues(0, 0, cameraDistance);
    vec3.rotateX(cameraPosition, cameraPosition, worldCenter, clipY);
    vec3.rotateY(cameraPosition, cameraPosition, worldCenter, clipX);
    
    const viewMatrix = mat4.create();
    mat4.lookAt(viewMatrix, cameraPosition, worldCenter, vec3.fromValues(0, 1, 0));

    sphereEntity.uniform.uCamPos = cameraPosition;
    sphereEntity.uniform.uViewMatrix = viewMatrix;

    requestAnimationFrame(render);
  }
  document.addEventListener('mousemove', handleMouseMove);

  // Render the first frame.
  requestAnimationFrame(render);
}

main();