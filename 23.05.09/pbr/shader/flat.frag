#version 300 es
precision mediump float;

in highp vec2 TexCoord;

out vec4 FragColor;

uniform sampler2D uTexture;
        
void main() 
{
    FragColor = texture(uTexture, TexCoord);
}