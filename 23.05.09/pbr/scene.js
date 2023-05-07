// Transated to Javascript from 
//  https://github.com/JoeyDeVries/LearnOpenGL/blob/master/src/6.pbr/2.2.2.ibl_specular_textured/ibl_specular_textured.cpp


const { mat4 } = glMatrix;


// Constants
const SCR_WIDTH = 1280;
const SCR_HEIGHT = 720;

// State
// Camera camera(glm::vec3(0.0f, 0.0f, 3.0f));
let lastX = 800. / 2.;
let lastY = 600. / 2.;
let firstMouse = true;

// timing
let deltaTime = 0.;	
let lastFrame = 0.;


/// The main function, called when the page is loaded.
async function main2() {
  // Get the WebGL context from the canvas element in the DOM.
  const gl = document.querySelector("#canvas").getContext('webgl2');
  if (!gl) {
      console.log('WebGL unavailable');
  } else {
      console.log('WebGL is good to go');
  }

  // TODO: mouse and scroll callbacks


  // Prepare the OpenGL state machine
  gl.enable(gl.DEPTH_TEST);   // Enable depth testing.
  gl.depthFunc(gl.LEQUAL);    // Set depth function to less than AND equal for skybox depth trick.


  // Create the shaders
  const prbShader = await createShader(gl, 
    "PBR Shader",                     // name
    "pbr.vert",                       // vertex shader source file
    "pbr.frag",                       // fragment shader source file
    [                                 // attributes
      "aPosition",                    //  ...
      "aNormal",                      //  ...
      "aTexCoord"                     //  ...
    ], {                              // uniforms
      "uProjectionMatrix": "mat4",    //  ...
      "uViewMatrix": "mat4",          //  ...
      "uModelMatrix": "mat4",         //  ...
      "uNormalMatrix": "mat3",        //  ...
      "uAlbedoMap": "sampler2D",      //  ...
      "uNormalMap": "sampler2D",      //  ...
      "uMetallicMap": "sampler2D",    //  ...
      "uRoughnessMap": "sampler2D",   //  ...
      "uAOMap": "sampler2D",          //  ...
      "uIrradianceMap": "samplerCube",//  ...
      "uPrefilterMap": "samplerCube", //  ...
      "uBrdfLUT": "sampler2D",        //  ...
      // uLightPositions/Colors       //  ...
      "uCamPos": "vec3",              //  ...
    });
  const equirectangularToCubemapShader = await createShader(gl,
    "Equirectangular to Cubemap Shader", // name
    "cubemap.vert",                      // vertex shader source file
    "equirectangular_to_cubemap.frag",   // fragment shader source file
    [                                    // attributes
      "aPosition"                        //  ...
    ], {                                 // uniforms
      "uProjectionMatrix": "mat4",       //  ...
      "uViewMatrix": "mat4",             //  ...
      "uEquirectangularMap": "sampler2D" //  ...
    });
  const irradianceShader = await createShader(gl,
    "Irradiance Shader",                 // name
    "cubemap.vert",                      // vertex shader source file
    "irradiance_convolution.frag",       // fragment shader source file
    [                                    // attributes
      "aPosition"                        //  ...
    ], {                                 // uniforms
      "uProjectionMatrix": "mat4",       //  ...
      "uViewMatrix": "mat4",             //  ...
      "uEnvironmentMap": "samplerCube"   //  ...
    });
  const prefilterShader = await createShader(gl,
    "Prefilter Shader",                  // name
    "cubemap.vert",                      // vertex shader source file
    "prefilter.frag",                    // fragment shader source file
    [                                    // attributes
      "aPosition"                        //  ...
    ], {                                 // uniforms
      "uProjectionMatrix": "mat4",       //  ...
      "uViewMatrix": "mat4",             //  ...
      "uEnvironmentMap": "samplerCube",  //  ...
      "uRoughness": "float"              //  ...
    });
  const brdfShader = await createShader(gl,
    "BRDF Shader",                       // name
    "brdf.vert",                         // vertex shader source file
    "brdf.frag",                         // fragment shader source file
    [                                    // attributes
      "aPosition",                       //  ...
      "aTexCoord"                        //  ...
    ], {}                                // no uniforms   
    );
  const backgroundShader = await createShader(gl,
    "Background Shader",                 // name
    "background.vert",                   // vertex shader source file
    "background.frag",                   // fragment shader source file
    [                                    // attributes
      "aPosition",                       //  ...
    ], {                                   // uniforms
      "uProjectionMatrix": "mat4",       //  ...
      "uViewMatrix": "mat4",             //  ...
      "uEnvironmentMap": "samplerCube"   //  ...
    });

  // let time = 0.0;
  // let lastTime;
  // let rotation = 0.0;
  // let distance = 20.0;

  // // Render loop
  // function render(now) {

  //     // Update the time
  //     const deltaTime = (now - (lastTime || now)) / 1000.0;
  //     lastTime = now;
  //     time += deltaTime * timeScale;
      
  //     // Update the rotation
  //     const rotationDirection = ((leftArrowPressed ? 1.0 : 0.0) - (rightArrowPressed ? 1.0 : 0.0)) * (shiftPressed ? shiftAcceleration : 1.0);
  //     rotation += rotationSpeed * rotationDirection * deltaTime;
      
  //     // Update the distance
  //     const moveDirection = ((downArrowPressed ? 1.0 : 0.0) - (upArrowPressed ? 1.0 : 0.0)) * (shiftPressed ? shiftAcceleration : 1.0);
  //     distance = Math.min(Math.max(distance + moveSpeed * moveDirection * deltaTime, minDistance), maxDistance);

  //     drawScene(gl, programInfo, distance, rotation, time);
      
  //     requestAnimationFrame(render);
  // }
  // requestAnimationFrame(render);   
  console.log("Okay!")
}


async function main() {
  // Get the WebGL context from the canvas element in the DOM.
  const gl = document.querySelector("#canvas").getContext('webgl2');
  if (!gl) {
      console.log('WebGL unavailable');
  } else {
      console.log('WebGL is good to go');
  }

  // Prepare the OpenGL state machine
  gl.clearColor(0.0, 0.0, 0.0, 1.0); // Set clear color to black, fully opaque
  gl.enable(gl.DEPTH_TEST);   // Enable depth testing.
  gl.depthFunc(gl.LEQUAL);    // Set depth function to less than AND equal for skybox depth trick.

  const texture = await createTexture(gl, "brick_wall_001_diffuse_1k.png");

  const simpleShader = await createShader(gl,
    "Simple Shader",                // name
    "simple.vert",                  // vertex shader source file
    "simple.frag",                  // fragment shader source file
    [                               // attributes
      "aPosition",                  //  ...
      "aTexCoord"                   //  ...
    ], {                            // uniforms
      "uModelViewMatrix": {         //  ...
          type: "mat4",             //  ...
          value: mat4.create()      //  ...
      },                            //  ... 
      "uProjectionMatrix": {        //  ...
          type: "mat4",             //  ...
          value: mat4.create()      //  ...
      },                            //  ... 
      "uTexture": {                 //  ...
          type: "sampler2D",        //  ...
          value: texture            //  ...
      },                            //  ... 
    }
  );

  const box = createBox(gl, 
    "Box", 
    simpleShader, 
    {
      texCoordAttribute: "aTexCoord",
    }
  );

  function render(now) {
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
    mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -5]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, 0.6, [1, 0, 0]);

    box.uniform.uModelViewMatrix = modelViewMatrix;
    box.uniform.uProjectionMatrix = projectionMatrix;
    box.uniform.uTexture = texture;

    box.render();

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

}
main();


// =============================================================================
// Mid-level functions =========================================================
// =============================================================================


/// An Entity is a collection of vertex buffers, an index buffer, and a shader.
/// All information needed to render the entity.
///
/// @param gl The WebGL context.
/// @param name The name of the entity.
/// @param vertexBuffers A map of vertex buffers, named by their attribute.
/// @param indexBuffer The index buffer.
/// @param shader The shader program.
///
/// @return The entity object, containing the following properties:
///   - name: The name of the entity.
///   - uniform: All uniform values of the shader program.
///   - render: A function to render the entity.
function createEntity(gl, name, vertexBuffers, indexBuffer, shader)
{
  // Create a new Vertex Array Object (VAO) and bind it.
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  // Bind all attributes to their buffers.
  for(const [attribute, vertexBuffer] of Object.entries(vertexBuffers)) {
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer.buffer);

    const location = shader.attribute[attribute];
    gl.vertexAttribPointer(location,
      vertexBuffer.numComponents, // components per vertex
      vertexBuffer.type,          // the data type of each component
      vertexBuffer.normalize,     // do not normalize the data (only relevant for integer data)
      vertexBuffer.stride,        // stride
      vertexBuffer.offset);       // offset

    gl.enableVertexAttribArray(location);

    // Since we have a VAO bound, we can unbind the array buffer again,
    // without losing the connection from the attribute and the buffer data.
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  // Bind the index buffer.
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer.buffer);
  // Do NOT unbind the index buffer, because it is still needed by the VAO.

  // Unbind the VAO again, so that no other VAO can accidentally change it.
  gl.bindVertexArray(null);

  // An entity uniform can be set and get like a normal variable, and
  // has a private _update() function that copies the uniform into the shader
  // during rendering.
  const entityUniforms = {};
  const updateShaderCalls = [];
  const textures = []
  for(const [uniformName, shaderUniform] of Object.entries(shader.uniform)) {
    // Store the current value of the uniform for the entity uniform object.
    entityUniforms[uniformName] = shaderUniform.value;

    // Create a function that updates the shader uniform from the entity uniform.
    updateShaderCalls.push(
      () => shaderUniform.value = entityUniforms[uniformName]
    )

    // Store textures separately, so that they can be bound to their texture unit.
    if(shaderUniform.type === "sampler2D"){
      textures.push(shaderUniform);
    }
  }

  /// Renders the entity.
  function render() {
    gl.useProgram(shader.program);
    gl.bindVertexArray(vao);

    // Copy all uniforms from the entity into the shader program.
    for(const updateCall of updateShaderCalls) {
      updateCall();
    }

    // Bind all textures to their texture units.
    for(const shaderUniform of textures) {
      gl.activeTexture(gl.TEXTURE0 + shaderUniform.textureId);
      gl.bindTexture(gl.TEXTURE_2D, shaderUniform.value);
    }

    // The draw call.
    gl.drawElements(
        gl.TRIANGLES,      // primitive type
        indexBuffer.size,  // number of indices
        indexBuffer.type,  // type of indices 
        0                  // offset
    );

    // Reset the state.
    gl.bindVertexArray(null);
    gl.useProgram(null);
    for(const shaderUniform of textures) {
      gl.activeTexture(gl.TEXTURE0 + shaderUniform.textureId);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
  }

  return {
    name,
    uniform: entityUniforms,
    render,
  }
}

/// Creates a Box around the origin with the given options.
/// @param gl The WebGL context.
/// @param name The name of the box entity.
/// @param shader The shader program to use for rendering the box.
/// @param options An object containing optional information about the box (see below).
/// @returns The box entity.
///
/// The options object can contain the following optional properties:
///   - width: The width of the box. Default: 1.0.
///   - height: The height of the box. Default: 1.0.
///   - depth: The depth of the box. Default: 1.0.
///   - positionAttribute: The name of the position attribute. Default: "aPosition".
///   - normalAttribute: The name of the normal attribute. Default: null => no normals.
///   - texCoordAttribute: The name of the texture coordinate attribute. Default: null => no uvs.
function createBox(gl, name, shader, options={})
{
  const halfWidth = (options.width || 1.) / 2.;
  const halfHeight = (options.height || 1.) / 2.;
  const halfDepth = (options.depth || 1.) / 2.;

  // Create an array of positions for the cube.
  const positions = [
    // Front face
    -halfWidth, -halfHeight, halfDepth,
     halfWidth, -halfHeight, halfDepth,
     halfWidth,  halfHeight, halfDepth,
    -halfWidth,  halfHeight, halfDepth,

    // Back face
    -halfWidth, -halfHeight, -halfDepth,
    -halfWidth,  halfHeight, -halfDepth,
     halfWidth,  halfHeight, -halfDepth,
     halfWidth, -halfHeight, -halfDepth,

    // Top face
    -halfWidth,  halfHeight, -halfDepth,
    -halfWidth,  halfHeight,  halfDepth,
     halfWidth,  halfHeight,  halfDepth,
     halfWidth,  halfHeight, -halfDepth,

    // Bottom face
    -halfWidth, -halfHeight, -halfDepth,
     halfWidth, -halfHeight, -halfDepth,
     halfWidth, -halfHeight,  halfDepth,
    -halfWidth, -halfHeight,  halfDepth,

    // Right face
    halfWidth, -halfHeight, -halfDepth,
    halfWidth,  halfHeight, -halfDepth,
    halfWidth,  halfHeight,  halfDepth,
    halfWidth, -halfHeight,  halfDepth,

    // Left face
    -halfWidth, -halfHeight, -halfDepth,
    -halfWidth, -halfHeight,  halfDepth,
    -halfWidth,  halfHeight,  halfDepth,
    -halfWidth,  halfHeight, -halfDepth,
  ];

  // We know that the box requires vertex positions, so we always create a
  // buffer for them.
  const positionAttribute = options.positionAttribute || "aPosition";
  const vertexBuffers = {
    positionAttribute: createAttributeBuffer(gl, new Float32Array(positions))
  }

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.
  const indices = [
    0,  1,  2,    0,  2,  3,   // front
    4,  5,  6,    4,  6,  7,   // back
    8,  9,  10,   8,  10, 11,  // top
    12, 13, 14,   12, 14, 15,  // bottom
    16, 17, 18,   16, 18, 19,  // right
    20, 21, 22,   20, 22, 23,  // left
  ];
  const indexBuffer = createIndexBuffer(gl, new Uint16Array(indices));

  // If the shader program contains a normal attribute, we can generate normals.
  const normalAttribute = options.normalAttribute || null;
  if (normalAttribute) {
    const normals = [
      repeat([ 0,  0,  1], 4),  // front
      repeat([ 0,  0, -1], 4),  // back
      repeat([ 0,  1,  0], 4),  // top
      repeat([ 0, -1,  0], 4),  // bottom
      repeat([ 1,  0,  0], 4),  // right
      repeat([-1,  0,  0], 4),  // left
    ].flat();
    vertexBuffers[normalAttribute] = createAttributeBuffer(gl, new Float32Array(normals));
  }

  // If the shader program contains a tex coordinate attribute, we can generate uvs.
  const texCoordAttribute = options.texCoordAttribute || null;
  if (texCoordAttribute) {
    const texCoords = repeat([
        0, 0, // bottom left
        1, 0, // bottom right
        1, 1, // top right
        0, 1, // top left
      ], 6);
    vertexBuffers[texCoordAttribute] = createAttributeBuffer(gl, 
      new Float32Array(texCoords), 
      {
        numComponents: 2
      }
    );
  }

  // Create the box entity.
  return createEntity(gl, name, vertexBuffers, indexBuffer, shader);
}


// =============================================================================
// Low-level functions =========================================================
// =============================================================================


/// Create an attribute buffer from the given data.
///
/// @param gl The WebGL context.
/// @param data The data to store in the buffer as a TypedArray (e.g. Float32Array).
/// @param info An object containing optional information about the buffer.
///   - numComponents: The number of components per vertex attribute. Default: 3.
///   - normalize: Whether to normalize the data. Default: false.
///   - stride: The stride of each vertex attribute. Default: 0.
///   - offset: The offset of each vertex attribute. Default: 0.
///   - usage: The usage pattern of the data store. Default: gl.STATIC_DRAW.
///
/// @returns The buffer information containing the following properties:
///   - buffer: The WebGL buffer.
///   - type: The type of the data array.
///   - size: The number of elements in the data array.
///   - numComponents: The number of components per vertex attribute.
///   - normalize: Whether the data is normalized.
///   - stride: The stride of each vertex attribute.
///   - offset: The offset of each vertex attribute.
function createAttributeBuffer(gl, data, info={})
{
  // Set default values for optional info properties.
  const numComponents = info.numComponents || 3;
  const normalize = info.normalize || false;
  const stride = info.stride || 0;
  const offset = info.offset || 0;
  const usage = info.usage || gl.STATIC_DRAW;

  // Detect the type of the data array.
  let type;
  if (data instanceof Float32Array) {
    type = gl.FLOAT;
  } else {
    // ... there are more, but we don't need them for this example.
    throw new Error('Unsupported data type for `data` argument of "createAttributeBuffer"');
  }

  // Create the buffer and store the data.
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, usage);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Return the buffer information.
  return {
    buffer,
    type,
    size: data.length,
    numComponents,
    normalize,
    stride,
    offset,
  }
}


/// Create an index buffer from the given data.
/// Simplified version of the `createAttributeBuffer` function above, used for indices.
///
/// @param gl The WebGL context.
/// @param data The data to store in the buffer as a TypedArray (e.g. Uint16Array).
///
/// @returns The buffer information containing the following properties:
///   - buffer: The WebGL buffer.
///   - type: The type of the data array.
///   - size: The number of elements in the data array.
function createIndexBuffer(gl, data)
{
  // Detect the type of the data array.
  let type;
  if (data instanceof Uint16Array) {
    type = gl.UNSIGNED_SHORT;
  } else {
    // ... there are more, but we don't need them for this example.
    throw new Error('Unsupported data type for `data` argument of "createIndexBuffer"');
  }

  // Create the buffer and store the data.
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  // Return the buffer information.
  return {
    buffer,
    type,
    size: data.length,
  }
}


/// Create a shader program from the given vertex and fragment shader sources.
///
/// @param gl The WebGL context.
/// @param name The name of the shader program.
/// @param vertexPath The path to the vertex shader source (within the "shaders" directory).
/// @param fragmentPath The path to the fragment shader source (within the "shaders" directory).
/// @param attributes An array of attribute names.
/// @param uniforms A map of uniform objects by name.
///   A uniform object contains the following properties:
///   - type: The type of the uniform (e.g. "vec3", see `setUniform` for available types).
///   - value: The value of the uniform.
///   - location: The location of the uniform (set by this function).
///   - textureId: The texture unit to bind the texture to (optional, set by this function).
///
/// @returns A promise that resolves to the shader information containing the following properties:
///   - program: The WebGL shader program.
///   - name: The name of the shader program.
///   - attributes: A map of attribute locations by name.
///   - uniforms: A map of uniform objects by name.
async function createShader(gl, name, vertexPath, fragmentPath, attributes, uniforms) 
{
  // Load the Vertex- and Fragment-Shader.
  async function loadShader (type, path) {
    const source = await fetch(`./shader/${path}`).then(response => response.text());
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }
  const vertexShader = await loadShader(gl.VERTEX_SHADER, vertexPath);
  const fragmentShader = await loadShader(gl.FRAGMENT_SHADER, fragmentPath);
  
  // Link the Shader program.
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  // Check for errors 
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(`Linking of "${name}" failed: ${gl.getProgramInfoLog(program)}`);
    console.error(`Vertex Shader log: ${gl.getShaderInfoLog(vertexShader)}`);
    console.error(`Fragent Shader log: ${gl.getShaderInfoLog(fragmentShader)}`);
    alert(`Unable to initialize shader program "${name}"! See console for details`)
    return null;
  }

  // Delete the Shaders as they are now linked to the program and are no longer needed.
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  // Find all attributes.
  const attributeLocations = {};
  for (const attribute of attributes) {
    const location = gl.getAttribLocation(program, attribute);
    if (location === -1) {
      console.warn(`Attribute "${attribute}" not found in shader program "${name}"!`);
    } else {
      attributeLocations[attribute] = location;
    }
  }

  // Create the uniform objects.
  const uniformObjects = {};
  let textureCounter = 0;
  gl.useProgram(program);
  for (const [uniformName, uniformInfo] of Object.entries(uniforms)) {
    // Find the uniform location.
    const location = gl.getUniformLocation(program, uniformName);
    if (location === null) {
      console.warn(`Uniform "${uniformName}" not found in shader program "${name}"!`);
      continue;
    }
    
    // Create the uniform object.
    const uniformObject = {
      type: uniformInfo.type,
      location,
      _value: null,
      set value(newValue) {
        if(newValue === this._value) { return; }
        this._value = newValue;
        if(this.type != 'sampler2D') {
          // Texture ids do not need to be updated when the texture content changes.
          setUniform(gl, this.location, this.type, this._value);
        }
      },
      get value() {
        return this._value;
      }
    };

    // Set the uniform value.
    if (uniformInfo.type === 'sampler2D') {
      // Textures are a special case, as they need to be bound to a texture unit.
      // We just assign them to a unit here but bind them later.
      uniformObject._value = uniformInfo.value;
      uniformObject.textureId = textureCounter++;
      gl.uniform1i(location, uniformObject.textureId);
    } else {
      uniformObject.value = uniformInfo.value;
    }  

    // Store the uniform object.
    uniformObjects[uniformName] = uniformObject;
  }
  gl.useProgram(null);

  // Create a Shader object with all information necessary to use the shader program.
  return {
    program,
    name,
    attribute: attributeLocations,
    uniform: uniformObjects,
  }
}


/// Creates a texture from an image in the "texture" directory.
/// From https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
///
/// @param gl The WebGL context.
/// @param path The path of the image to load.
/// @param options An object with the following optional properties:
///   - repeat: Whether the texture should repeat in both directions.
///         Defaults to false.
///   - placeholderColor: The color to use while the image is loading.
///         Defaults to [0, 0, 255, 255] (blue).
///
/// @returns The WebGL texture, not yet loaded.
function createTexture(gl, path, options = {})
{
  const repeat = options.repeat || false;
  const placeholderColor = options.placeholderColor || [0, 0, 255, 255];

  // Constants.
  const level = 0;
  const internalFormat = gl.RGBA;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  
  // Create a texture.
  const texture = gl.createTexture();
  
  // Initialize the texture to a single blue pixel 
  // while waiting for the image to load.
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
    1,  // width
    1,  // height
    0,  // border
    srcFormat, srcType, new Uint8Array(placeholderColor)
  );
  gl.bindTexture(gl.TEXTURE_2D, null);

  // Asynchronously load an image into the texture.
  const image = new Image();
  image.onload = () => {
      // Upload the image into the texture.
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
          gl.TEXTURE_2D,
          level,
          internalFormat,
          srcFormat,
          srcType,
          image
      );

      // Generate mipmaps if the image is a power of 2 in both dimensions.
      if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
          gl.generateMipmap(gl.TEXTURE_2D);
      } else {
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }

      // Disable repeating of the texture if requested.
      if(!repeat){
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }

      // Cleanup
      gl.bindTexture(gl.TEXTURE_2D, null);
      // image = null; // TODO: does this work?
  };
  image.src = `./texture/${path}`;

  // Return the OpenGL texture object before the image has loaded.
  return texture;
}


/// Helper function to call the corret gl.uniform* function based on the uniform type.
///
/// @param gl The WebGL context.
/// @param location The uniform location.
/// @param type The uniform type.
/// @param value The value to set.
function setUniform(gl, location, type, value)
{
  switch(type) {
    case 'float':
      gl.uniform1f(location, value);
      break;
    case 'vec2':
      gl.uniform2fv(location, value);
      break;
    case 'vec3':
      gl.uniform3fv(location, value);
      break;
    case 'vec4':
      gl.uniform4fv(location, value);
      break;
    case 'mat2':
      gl.uniformMatrix2fv(location, false, value);
      break;
    case 'mat3':
      gl.uniformMatrix3fv(location, false, value);
      break;
    case 'mat4':
      gl.uniformMatrix4fv(location, false, value);
      break;
    case 'int':
      gl.uniform1i(location, value);
      break;
    default:
      throw new Error(`Unsupported uniform type "${type}"`);
  }
}


// =============================================================================
// Utility functions ===========================================================
// =============================================================================


/// Creates a new array with the given pattern repeated the given number of times.
function repeat(pattern, times) 
{
  return Array.from({length: times}, () => pattern).flat()
}


/// Returns true if the given value is a power of 2.
function isPowerOf2(value) 
{
  return (value & (value - 1)) === 0;
}