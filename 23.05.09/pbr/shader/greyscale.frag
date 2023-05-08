#version 300 es
precision mediump float;

in highp vec2 TexCoord;

out vec4 FragColor;

uniform sampler2D uTexture;
        
void main() 
{
    FragColor = texture(uTexture, TexCoord);
    float grey = 0.2126 * FragColor.r + 0.7152 * FragColor.g + 0.0722 * FragColor.b;
    FragColor = vec4(grey, grey, grey, 1.0);
}