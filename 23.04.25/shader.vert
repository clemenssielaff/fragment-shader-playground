precision mediump float;

attribute vec4 aPosition;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform float uTime;

varying vec3 vGridPos;

const float ISLAND_SIZE = 3.0;      // Radius
const float RADIUS_VARIANCE = 5.0;  // Noise strength applied to radius, weird results if > islandSize * 2
const float ISLAND_FALLOFF = 2.5;   // Distance from radius it takes to reach water level
const float NOISE_RATIO = 0.9;      // Ratio of shape noise to detail noise
const float HEIGHT_SCALE = 3.0;     // Stretches the island vertically

float random (in vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float noise (in vec2 st) {
    // Four corners in 2D of a tile
    vec2 i = floor(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Smooth Interpolation
    vec2 u = smoothstep(0., 1., fract(st));

    // Mix 4 coorners percentages
    return mix(a, b, u.x) +
            (c - a) * u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

float calculateHeight(vec2 pos) {
    float radius = distance(pos + noise(pos) * RADIUS_VARIANCE - RADIUS_VARIANCE * 0.5, vec2(0));
    float islandMask = smoothstep(ISLAND_SIZE + ISLAND_FALLOFF, ISLAND_SIZE, radius);
    float shapeNoise = noise(pos * 1.0);
    float detailNoise = noise(pos * 2.0);
    return (shapeNoise * NOISE_RATIO + detailNoise * (1.0 - NOISE_RATIO)) * islandMask;
}

void main() {
    // Calculate the height of the grid point
    vec4 pos = aPosition;
    pos.y = calculateHeight(pos.xz);
    vGridPos = pos.xyz;
    // Scale the height of the vertex before placing it in the world
    pos.y *= HEIGHT_SCALE;
    gl_Position = uProjectionMatrix * uModelViewMatrix * pos;
}