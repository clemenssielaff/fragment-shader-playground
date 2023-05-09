#version 300 es         // Use version 300 of OpenGL ES, required for WebGL 2.0
precision highp float;  // Calculate the varying outputs with high precision 

// Vertex attributes
in vec3 aPosition;
in vec3 aNormal;

// Output variables for fragment shader
out vec3 WorldPos;
out vec3 Normal;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;
uniform mat3 uNormalMatrix;

void main()
{
    // The world position is calculated by multiplying the model matrix with the
    // vertex position in model space.
    // The model matrix is a 4x4 matrix, which is why we need to expand the 3D
    // vertex position to a 4D vector by adding a 1.0 as the 4th component.
    // After the transformatin, we can discard the 4th component again.
    WorldPos = vec3(uModelMatrix * vec4(aPosition, 1.0));

    // Normal vectors are perpendicular to the surface of the model, and must be
    // transformed differently than the vertex position.
    // Instead, they are transformed by the inverse transpose of the model 
    // matrix which we pre-calculate in the application, so we don't have to do
    // it for every vertex in the shader.
    // The normal matrix is a 3x3 matrix, because it only rotates and scales
    // the normal vectors, but doesn't translate them.
    Normal = uNormalMatrix * aNormal;   

    // The final vertex position is calculated by multiplying the world position
    // view matrix first and projection matrix second.
    // You can think of it as first moving the world so that the camera is at
    // the center, then rotating the world so that the camera is looking down
    // the negative z-axis.
    // The projection matrix then transforms the 3D world to 2D screen space.
    gl_Position =  uProjectionMatrix * uViewMatrix * vec4(WorldPos, 1.0);
}