#version 300 es
precision mediump float;

in highp vec2 TexCoord;

out vec4 FragColor;

uniform sampler2D uTexture;


/// Applies a 3x3 kernel to a texture.
/// @param image Image to sample from.
/// @param uv Texture coordinate to sample around.
/// @param kernel 3x3 kernel to apply to the image.
/// @param offset Offset of the texture coordinates around the center.
///     Texture coordinates are in the range [0, 1], regardless of the size of 
//      the texture.
vec3 applyKernel(sampler2D image, vec2 uv, float kernel[9], float offset) 
{
    const vec2 offsets[9] = vec2[](
        vec2(-1,  1), // top-left
        vec2( 0,  1), // top-center
        vec2( 1,  1), // top-right
        vec2(-1,  0), // center-left
        vec2( 0,  0), // center-center
        vec2( 1,  0), // center-right
        vec2(-1, -1), // bottom-left
        vec2( 0, -1), // bottom-center
        vec2( 1, -1)  // bottom-right    
    );

    vec3 color = vec3(0.0);
    for(int i = 0; i < 9; i++) {
        color += texture(image, uv + offsets[i] * offset).rgb * kernel[i];
    }
    return color;
}

const float sharpenKernel[9] = float[](
    -1., -1., -1.,
    -1.,  9., -1.,
    -1., -1., -1.
);

const float blurKernel[9] = float[](
    1./ 16., 2./16., 1./16.,
    2./ 16., 4./16., 2./16.,
    1./ 16., 2./16., 1./16.  
);

vec3 greyscale(vec3 color) 
{
    return vec3(0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b);
}

void main() 
{
    // vec3 color = texture(uTexture, TexCoord).rgb;
    vec3 color = applyKernel(uTexture, TexCoord, blurKernel, 1.0 / 500.0);
    FragColor = vec4(greyscale(color), 1.0);
}