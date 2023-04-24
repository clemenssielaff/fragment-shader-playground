precision mediump float;

attribute vec4 aPosition;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform float uTime;

varying vec3 vGridPos;

const float ISLAND_SIZE = 4.0;      // Radius
const float RADIUS_VARIANCE = 5.0;  // Noise strength applied to radius, weird results if > islandSize * 2
const float ISLAND_FALLOFF = 1.5;   // Distance from radius it takes to reach water level
const float HEIGHT_SCALE = 1.7;     // Stretches the island vertically

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

void main() {
    // Create Island mask
    float radius = distance(aPosition.xz + noise(aPosition.xz) * RADIUS_VARIANCE - RADIUS_VARIANCE * 0.5, vec2(0));
    float islandMask = smoothstep(ISLAND_SIZE + ISLAND_FALLOFF, ISLAND_SIZE, radius);

    // Generate and apply noise
    vec4 pos = aPosition;
    float noiseRatio = 0.8;
    float shapeNoise = noise(pos.xz * 1.0);
    float detailNoise = noise(pos.zx * 2.0);
    pos.y = shapeNoise * noiseRatio + detailNoise * (1.0 - noiseRatio);
    pos.y *= islandMask;

    vGridPos = vec3(aPosition.x, pos.y, aPosition.z);
    pos.y *= HEIGHT_SCALE;
    gl_Position = uProjectionMatrix * uModelViewMatrix * pos;
}