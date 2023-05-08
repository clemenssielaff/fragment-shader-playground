export { 
    createEntity,
    createBox,
    createSphere,
    createFullscreenQuad,
    createAttributeBuffer,
    createIndexBuffer,
    createShader,
    createTexture,
    createFramebuffer,
};

// =============================================================================
// High-level functions ========================================================
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
///   - vertexBuffers: A map of vertex buffers, named by their attribute.
///   - indexBuffer: The index buffer.
///   - uniform: All uniform values of the shader program.
///   - shader: The shader program.
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
    if(location === undefined) {
      console.warn(`Attribute '${attribute}' of entity '${name}' not used in shader '${shader.name}'`);
      continue;
    }
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

  // Return the entity object.
  return {
    name,
    vertexBuffers,
    indexBuffer,
    uniform: entityUniforms,
    shader,
    render,
  }
}


/// Creates a Box around the origin with the given options.
/// @param gl The WebGL context.
/// @param name The name of the box entity.
/// @param shader The shader program to use for rendering the box.
/// @param options An object containing the following optional properties:
///   - width: The width of the box. Default: 1.0.
///   - height: The height of the box. Default: 1.0.
///   - depth: The depth of the box. Default: 1.0.
///   - positionAttribute: The name of the position attribute. Default: "aPosition".
///   - normalAttribute: The name of the normal attribute. Default: null => no normals.
///   - texCoordAttribute: The name of the texture coordinate attribute. Default: null => no uvs.
///
/// @returns The box entity.
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

  // The normals never change.
  const normals = [
    repeat([ 0,  0,  1], 4),  // front
    repeat([ 0,  0, -1], 4),  // back
    repeat([ 0,  1,  0], 4),  // top
    repeat([ 0, -1,  0], 4),  // bottom
    repeat([ 1,  0,  0], 4),  // right
    repeat([-1,  0,  0], 4),  // left
  ].flat();

  // .. neither do the UVs.
  const texCoords = repeat([
      0, 0, // bottom left
      1, 0, // bottom right
      1, 1, // top right
      0, 1, // top left
    ], 6);

  // Create the interleaved vertex array.
  const interleaved = [positions];
  const quantities = [3];
  let stride = 3;
  let normalOffset = 3;
  let texCoordOffset = 3;
  if (options.normalAttribute) {
    interleaved.push(normals);
    quantities.push(3);
    stride += 3;
    texCoordOffset += 3;
  }
  if (options.texCoordAttribute) {
    interleaved.push(texCoords);
    quantities.push(2);
    stride += 2;
  }
  stride *= Float32Array.BYTES_PER_ELEMENT;
  normalOffset *= Float32Array.BYTES_PER_ELEMENT;
  texCoordOffset *= Float32Array.BYTES_PER_ELEMENT;
  const vertexArray = interleaveArrays(interleaved, quantities);
  const vertexView = new Float32Array(vertexArray);

  // We know that the box requires vertex positions, so we always create a
  // buffer for them.
  const vertexBuffers = {};
  const positionAttribute = options.positionAttribute || "aPosition";
  vertexBuffers[positionAttribute] = createAttributeBuffer(gl, vertexView,
    {
      numComponents: 3,
      stride,
      offset: 0,
    });
  if(options.normalAttribute) {
    vertexBuffers[options.normalAttribute] = createAttributeBuffer(gl, vertexView,
      {
        numComponents: 3,
        stride,
        offset: normalOffset,
        buffer: vertexBuffers[positionAttribute].buffer,
      });
  }
  if(options.texCoordAttribute) {
    vertexBuffers[options.texCoordAttribute] = createAttributeBuffer(gl, vertexView,
      {
        numComponents: 2,
        stride,
        offset: texCoordOffset,
        buffer: vertexBuffers[positionAttribute].buffer,
      });
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
  const indexBuffer = createIndexBuffer(gl, indices);

  // Create the box entity.
  return createEntity(gl, name, vertexBuffers, indexBuffer, shader);
}


/// Creates a sphere around the origin with the given options.
/// @param gl The WebGL context.
/// @param name The name of the sphere entity.
/// @param shader The shader program to use for rendering.
/// @param options An object containing the following optional properties:
///   - radius: The radius of the sphere. Default: 1.0.
///   - latitudeBands: The number of latitude bands. Default: 32.
///   - longitudeBands: The number of longitude bands. Default: 32.
///   - positionAttribute: The name of the position attribute. Default: "aPosition".
///   - normalAttribute: The name of the normal attribute. Default: null => no normals.
///   - texCoordAttribute: The name of the texture coordinate attribute. Default: null => no uvs.
///
/// @returns The sphere entity.
function createSphere(gl, name, shader, options={})
{
  // Default options.
  const radius = options.radius || 1.0;
  const latitudeBands = options.latitudeBands || 32;
  const longitudeBands = options.longitudeBands || 32;

  // Create values for all arrays of the sphere.
  // They are easier to create and then discard if unused.
  const positions = [];
  const normals = [];
  const texCoords = [];
 for (let lat = 0; lat <= latitudeBands; lat++) {
    const theta = lat * Math.PI / latitudeBands;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let lon = 0; lon <= longitudeBands; lon++) {
      const phi = lon * 2 * Math.PI / longitudeBands;

      const x = Math.cos(phi) * sinTheta;
      const y = cosTheta;
      const z = Math.sin(phi) * sinTheta;
      const u = 1. - (lon / longitudeBands);
      const v = 1. - (lat / latitudeBands);

      positions.push(radius * x, radius * y, radius * z);
      normals.push(x, y, z);
      texCoords.push(u, v);
    }
  }
  
  // Create the interleaved vertex array.
  const interleaved = [positions];
  const quantities = [3];
  let stride = 3;
  let normalOffset = 3;
  let texCoordOffset = 3;
  if (options.normalAttribute) {
    interleaved.push(normals);
    quantities.push(3);
    stride += 3;
    texCoordOffset += 3;
  }
  if (options.texCoordAttribute) {
    interleaved.push(texCoords);
    quantities.push(2);
    stride += 2;
  }
  stride *= Float32Array.BYTES_PER_ELEMENT;
  normalOffset *= Float32Array.BYTES_PER_ELEMENT;
  texCoordOffset *= Float32Array.BYTES_PER_ELEMENT;
  const vertexArray = interleaveArrays(interleaved, quantities);
  const vertexView = new Float32Array(vertexArray);

  // Create the vertex buffers.
  const vertexBuffers = {};
  const positionAttribute = options.positionAttribute || "aPosition";
  vertexBuffers[positionAttribute] = createAttributeBuffer(gl, vertexView,
    {
      numComponents: 3,
      stride,
      offset: 0,
    });
  if(options.normalAttribute) {
    vertexBuffers[options.normalAttribute] = createAttributeBuffer(gl, vertexView,
      {
        numComponents: 3,
        stride,
        offset: normalOffset,
        buffer: vertexBuffers[positionAttribute].buffer,
      });
  }
  if(options.texCoordAttribute) {
    vertexBuffers[options.texCoordAttribute] = createAttributeBuffer(gl, vertexView,
      {
        numComponents: 2,
        stride,
        offset: texCoordOffset,
        buffer: vertexBuffers[positionAttribute].buffer,
      });
  }

  // Create the indices.
  const indices = [];
  for (let lat = 0; lat < latitudeBands; lat++) {
    for (let lon = 0; lon < longitudeBands; lon++) {
      const first = (lat * (longitudeBands + 1)) + lon;
      const second = first + longitudeBands + 1;

      indices.push(first, first + 1, second);
      indices.push(second, first + 1, second + 1);
    }
  }
  const indexBuffer = createIndexBuffer(gl, indices);

  // Create the sphere entity.
  return createEntity(gl, name, vertexBuffers, indexBuffer, shader);
}


/// Creates a fullscreen quad with the given options.
/// @param gl The WebGL context.
/// @param name The name of the fullscreen entity.
/// @param shader The shader program to use for rendering.
/// @param options An object containing the following optional properties:
///   - positionAttribute: The name of the position attribute. Default: "aPosition".
///   - texCoordAttribute: The name of the texture coordinate attribute. Default: "aTexCoord".
///
/// @returns The fullscreen entity.
function createFullscreenQuad(gl, name, shader, options={})
{
  // Position and texture coordinates for a quad that fills the entire screen
  // in Normalized Device Coordinates.
  const vertices = [
    // positions  // texCoords
    -1,  1,       0, 1,
    -1, -1,       0, 0,
     1, -1,       1, 0,
     1,  1,       1, 1,
  ];

  // From experience, we know that the fullscreen quad requires vertex positions
  // and texture coordinates, so we always create buffers for them.
  const vertexBuffers = {};
  const vertexView = new Float32Array(vertices);
  const positionAttribute = options.positionAttribute || "aPosition";
  vertexBuffers[positionAttribute] = createAttributeBuffer(gl, vertexView, {
      numComponents: 2,
      stride: 4 * Float32Array.BYTES_PER_ELEMENT,
    });
  const texCoordAttribute = options.texCoordAttribute || "aTexCoord";
  vertexBuffers[texCoordAttribute] = createAttributeBuffer(gl, vertexView, {
      numComponents: 2,
      stride: 4 * Float32Array.BYTES_PER_ELEMENT,
      offset: 2 * Float32Array.BYTES_PER_ELEMENT,
    });

  // Create the index buffer.
  const indices = [
    0, 1, 2, 
    0, 2, 3
  ];
  const indexBuffer = createIndexBuffer(gl, indices);

  // Create the fullscreen quad entity.
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
///   - buffer: Existing buffer to use instead of creating a new one. Default: null.
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
  const existingBuffer = info.buffer || null;

  // Detect the type of the data array.
  let type;
  if (data instanceof Float32Array) {
    type = gl.FLOAT;
  } else {
    // ... there are more, but we don't need them for this example.
    throw new Error('Unsupported data type for `data` argument of "createAttributeBuffer"');
  }

  // Create the buffer and store the data.
  let buffer;
  if(existingBuffer) {
    buffer = existingBuffer;
  } else {
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, usage);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

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
/// @param indices A JavaScript array containing the indices.
///
/// @returns The buffer information containing the following properties:
///   - buffer: The WebGL buffer.
///   - type: The type of the data array.
///   - size: The number of elements in the data array.
function createIndexBuffer(gl, indices)
{
  // Find the highest index.
  let highestIndex = 0;
  for(const index of indices) {
    highestIndex = Math.max(highestIndex, index);
  }

  // Determine the type of the index buffer.
  let type;
  let data;
  if (highestIndex < 256) {
    type = gl.UNSIGNED_BYTE;
    data = new Uint8Array(indices);
  } else if (highestIndex < 65536) {
    type = gl.UNSIGNED_SHORT;
    data = new Uint16Array(indices);
  } else if (highestIndex < 4294967296){
    type = gl.UNSIGNED_INT;
    data = new Uint32Array(indices);
  } else {
    throw new Error(`Index ${highestIndex} does not fit in a 32-bit unsigned integer`);
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
        // Texture ids do not need to be updated when the texture content changes.
        if(this.type != 'sampler2D') {
          setUniform(gl, this);
        }
      },
      get value() {
        return this._value;
      }
    };

    // Set the initial value.
    uniformObject.value = uniformInfo.value;

    // Textures are a special case.
    // We want to store the texture as the uniform value, but we also need to 
    // bind it to a texture unit, which is never updated.
    // So we just assign a texture unit here, and store the texture id in the 
    // uniform object, so it can be used during rendering.
    if (uniformInfo.type === 'sampler2D') {  
      uniformObject.textureId = textureCounter++;
      gl.uniform1i(location, uniformObject.textureId);
    }

    // Store the augmented uniform object.
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
  let image = new Image();
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
      image = null;
  };
  image.src = `./texture/${path}`;

  // Return the OpenGL texture object before the image has loaded.
  return texture;
}


/// Stack of all bound framebuffers.
const _globalFramebufferStack = [];

/// Create a new framebuffer object with a texture in the color attachment,
/// and a renderbuffer in the depth/stencil attachment.
///
/// @param gl The WebGL context.
/// @param name The name of the framebuffer.
/// @param width The width of the framebuffer, defaults to the canvas width.
/// @param height The height of the framebuffer, defaults to the canvas height.
///
/// @returns The framebuffer object with the following properties:
///   - name: The name of the framebuffer.
///   - framebuffer: The OpenGL framebuffer object.
///   - colorTexture: The OpenGL texture object in the color attachment.
///   - depthStencilRenderbuffer: The OpenGL renderbuffer object in the depth/stencil attachment.
///   - width: The width of the framebuffer.
///   - height: The height of the framebuffer.
///   - use: A function to bind the framebuffer.
///   - unuse: A function to unbind the framebuffer.
function createFramebuffer(gl, name, width=null, height=null)
{
  width = width || gl.canvas.width;
  height = height || gl.canvas.height;

  // Create the Framebuffer.
  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

  // Create and attach the color texture.
  const colorTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, colorTexture);
  gl.texImage2D(gl.TEXTURE_2D,
    0,                // level
    gl.RGB,           // internalFormat
    width,            // width
    height,           // height
    0,                // border
    gl.RGB,           // format
    gl.UNSIGNED_BYTE, // type
    null              // data
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0, // attachment
    gl.TEXTURE_2D,        // texture target
    colorTexture,         // texture
    0                     // level
  );
  gl.bindTexture(gl.TEXTURE_2D, null);

  // Create and attach the depth/stencil renderbuffer.
  const depthStencilRenderbuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthStencilRenderbuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER,
    gl.DEPTH24_STENCIL8, // internalFormat
    width,               // width
    height               // height
  );
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER,
    gl.DEPTH_STENCIL_ATTACHMENT, // attachment
    gl.RENDERBUFFER,             // renderbuffer target
    depthStencilRenderbuffer     // renderbuffer
  );
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);

  // Check that the framebuffer is complete.
  if(gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    console.error(`Failed to complete Framebuffer "${name}"!`);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  // Create the framebuffer object.
  const framebufferObject = {
    name,
    framebuffer,
    color: colorTexture,
    depthStencil: depthStencilRenderbuffer,
    width,
    height,
  }

  // The `use` function binds the framebuffer and sets the viewport.
  framebufferObject.use = () => {
    if(_globalFramebufferStack.at(-1) === framebufferObject) {
      return;
    }
    _globalFramebufferStack.push(framebufferObject);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.viewport(0, 0, width, height);
  };

  // The `unuse` function unbinds the framebuffer and restores the viewport.
  framebufferObject.unuse = () => {
    if(_globalFramebufferStack.at(-1) !== framebufferObject) {
      return;
    }
    _globalFramebufferStack.pop();

    const previousFramebuffer = _globalFramebufferStack.at(-1);
    if(previousFramebuffer) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, previousFramebuffer.framebuffer);
      gl.viewport(0, 0, previousFramebuffer.width, previousFramebuffer.height);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    }
  };

  // Return the augmented framebuffer object.
  return framebufferObject;
}


/// Helper function to call the corret gl.uniform* function based on the uniform type.
///
/// @param gl The WebGL context.
/// @param uniform The uniform object as defined by `createShader` with the following properties:
///   - type: The uniform type.
///   - value: The value to set.
///   - location: The uniform location.
function setUniform(gl, uniform)
{
  switch(uniform.type) {
    case 'float':
      gl.uniform1f(uniform.location, uniform.value);
      break;
    case 'vec2':
      gl.uniform2fv(uniform.location, uniform.value);
      break;
    case 'vec3':
      gl.uniform3fv(uniform.location, uniform.value);
      break;
    case 'vec4':
      gl.uniform4fv(uniform.location, uniform.value);
      break;
    case 'mat2':
      gl.uniformMatrix2fv(uniform.location, false, uniform.value);
      break;
    case 'mat3':
      gl.uniformMatrix3fv(uniform.location, false, uniform.value);
      break;
    case 'mat4':
      gl.uniformMatrix4fv(uniform.location, false, uniform.value);
      break;
    case 'int':
      gl.uniform1i(uniform.location, uniform.value);
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

/// Interleave the given arrays, taking a number of elements (quantity) from each array in turn.
///
/// @param arrays An array of arrays to interleave.
/// @param quantities Either an array of quantities to take from each array, 
///   or a single quantity to take from each array. Defaults to 1.
///
/// @returns A new array with the interleaved values.
function interleaveArrays(arrays, quantities=1)
{
    // Ensure that all arrays are the same size.
    if (arrays.length === 0) {
        return [];
    }

    // If there is only one array, return it.
    if (arrays.length === 1) {
        return arrays[0];
    }

    // Ensure that quantities is an array of the correct size.
    if(!Array.isArray(quantities)) {
        quantities = repeat([quantities], arrays.length);
    } else if (quantities.length !== arrays.length) {
        throw new Error(`'quantities' must be either a number or an array with the same length as 'arrays'.\n` +
            `    'quantities' length: ${quantities.length}\n` + 
            `    'arrays' length: ${arrays.length}`
        );
    }

    // Ensure that the every quantity is valid.
    const bandCount = arrays[0].length / quantities[0];
    for(let i = 0; i < arrays.length; i++) {
        const quantity = quantities[i];
        if(quantity < 1) {
            throw new Error(`'quantity' must be greater than 0, but the value at index ${i} is ${quantity}`);
        }
        if(quantity % 1 !== 0) {
            throw new Error(`'quantity' must be an integer, but the value at index ${i} is ${quantity}`);
        }
        if(arrays[i].length % quantity !== 0) {
            throw new Error(`The length of the corresponding array must be a multiple of 'quantity'\n` +
            `    but the quantity at index ${i} is ${quantity}\n` +
            `    whereas the length of the corresponding array is ${arrays[i].length}`
            );
        }
        if (arrays[i].length / quantity !== bandCount) {
            throw new Error(`All arrays must have the same number of quantities,\n`+
            `    but array ${i} of size ${arrays[i].length} contains ${arrays[i].length / quantity} times ${quantity} quantities,\n` +
            `    whereas the first array conttains ${arrays[0].length / quantity} times ${quantities[0]} quantities.`
            );
        }
    }

    // Interleave the arrays.
    const interleaved = [];
    for(let band = 0; band < bandCount; band++) {
        for(let arrayIndex = 0; arrayIndex < arrays.length; arrayIndex++) {
            const array = arrays[arrayIndex];
            const quantity = quantities[arrayIndex];
            interleaved.push(...array.slice(band * quantity, (band + 1) * quantity));
        }
    }

    return interleaved;
}