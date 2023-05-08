#version 300 es
precision highp float;

in vec3 aPosition;
in vec3 aNormal;

out vec3 WorldPos;
out vec3 Normal;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;
uniform mat3 uNormalMatrix;

void main()
{
    WorldPos = vec3(uModelMatrix * vec4(aPosition, 1.0));
    Normal = uNormalMatrix * aNormal;   

    gl_Position =  uProjectionMatrix * uViewMatrix * vec4(WorldPos, 1.0);
}