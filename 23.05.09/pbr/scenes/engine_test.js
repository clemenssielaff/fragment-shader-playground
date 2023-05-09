// Transated to Javascript from 
//  https://github.com/JoeyDeVries/LearnOpenGL/blob/master/src/6.pbr/2.2.2.ibl_specular_textured/ibl_specular_textured.cpp


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

  // Create the textures.
  const texture = await glance.createTexture(gl, "brick_wall_001_diffuse_1k.png");

  // Create the framebuffers.
  const offscreenFramebuffer = glance.createFramebuffer(gl, "Offscreen Framebuffer");
  const greyscaleFramebuffer = glance.createFramebuffer(gl, "Greyscale Framebuffer");

  // Create the shaders.
  const flatShader = await glance.createShader(gl,
    "Flat Shader",                  // name
    "flat.vert",                    // vertex shader source file
    "flat.frag",                    // fragment shader source file
    [                               // attributes
      "aPosition",
      "aTexCoord"
    ], {                            // uniforms
      "uModelViewMatrix": {
          type: "mat4",
          value: mat4.create()
      }, 
      "uProjectionMatrix": {
          type: "mat4",
          value: mat4.create()
      }, 
      "uTexture": {
          type: "sampler2D",
          value: texture
      }, 
    });
  const greyscaleShader = await glance.createShader(gl,
    "Greyscale Shader",             // name
    "quad.vert",                    // vertex shader source file
    "greyscale.frag",               // fragment shader source file
    [                               // attributes
      "aPosition",
      "aTexCoord"
    ], {                            // uniforms
      "uTexture": {
          type: "sampler2D",
          value: offscreenFramebuffer.color,
      }
    });
  const quadShader = await glance.createShader(gl,
    "Quad Shader",                  // name
    "quad.vert",                    // vertex shader source file
    "quad.frag",                    // fragment shader source file
    [                               // attributes
      "aPosition",
      "aTexCoord"
    ], {                            // uniforms
      "uTexture": {
          type: "sampler2D",
          value: greyscaleFramebuffer.color,
      }
    });

  // Create the entities.
  const quadEntity = glance.createFullscreenQuad(gl,
    "Quad",
    quadShader,
  );
  const greyscaleEntity = glance.createEntity(gl, // copy the quad entity geometry
    "Greyscale Quad",
    quadEntity.vertexBuffers,
    quadEntity.indexBuffer,
    greyscaleShader,
  );
  const geoEntity = glance.createBox(gl, 
    "Geo Entity", 
    flatShader, 
    {
      texCoordAttribute: "aTexCoord",
    }
  );

  // Prepare the OpenGL state machine
  gl.clearColor(0.0, 0.0, 0.0, 1.0); // Set clear color to black, fully opaque
  gl.enable(gl.DEPTH_TEST);   // Enable depth testing.
  gl.depthFunc(gl.LEQUAL);    // Set depth function to less than AND equal for skybox depth trick.
  // Enable backface culling.
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);

  // Create a perspective projection matrix.
  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix,
    0.7853981633974483,       // 45deg field of view in radians
    (gl.canvas.clientWidth /  // aspect ratio
      gl.canvas.clientHeight),
    0.1,                      // near clipping plane
    100);                     // far clipping plane
  
  // Define static uniforms.
  geoEntity.uniform.uProjectionMatrix = projectionMatrix;
  geoEntity.uniform.uTexture = texture;

  function updateGeo() {
    // Position the model in front of the camera.
    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -5]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, 0.6, [1, 0, 0]);

    geoEntity.uniform.uModelViewMatrix = modelViewMatrix;
  }

  function render(now) {
    updateGeo();

    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    offscreenFramebuffer.use();
    geoEntity.render();
    offscreenFramebuffer.unuse();

    greyscaleFramebuffer.use();
    greyscaleEntity.render();
    greyscaleFramebuffer.unuse();

    quadEntity.render();

    // Call render() again next frame.
    // requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}
main();
