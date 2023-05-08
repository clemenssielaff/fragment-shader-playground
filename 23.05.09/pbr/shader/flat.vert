#version 300 es
precision highp float;

in vec3 aPosition;
in vec2 aTexCoord;

out vec2 TexCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

void main() 
{
    TexCoord = aTexCoord;
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
}