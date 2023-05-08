#version 300 es
precision highp float;

in vec2 aPosition;
in vec2 aTexCoord;

out vec2 TexCoord;

void main() 
{
    TexCoord = aTexCoord;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}