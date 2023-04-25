precision mediump float;

varying vec3 vGridPos;
varying vec3 vNormal;
varying vec4 vViewPos;

uniform float uTime;

const float PI = 3.1415926535897932384626433832795;

float random (in vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float degToRad(in float grad) {
    return (grad / 180.0) * PI;
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

vec3 water(vec3 gridPos) {
  //Base color with slight moving gradient based on noise
  vec3 color = vec3(.3, .6, 1) - noise(gridPos.xz * .1 + vec2(1) * uTime * 0.3) * .3;

  //Reflections, layered noise
  color += step(noise(gridPos.xz * 20.0) + noise(gridPos.xz * 1.5 + vec2(1) * uTime), .5) * vec3(1);

  return color;
}

//Returns if within range of current level
float checkLevel(float lowerBound, float upperBound, float y) {
  return step(lowerBound, y) * step(y, upperBound);
}

mat4 rotateX(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    
    return mat4(
        1.0, 0.0, 0.0, 0.0,
        0.0, c, -s, 0.0,
        0.0, s, c, 0.0,
        0.0, 0.0, 0.0, 1.0
    );
}

mat4 rotateY(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    
    return mat4(
        c, 0.0, s, 0.0,
        0.0, 1.0, 0.0, 0.0,
        -s, 0.0, c, 0.0,
        0.0, 0.0, 0.0, 1.0
    );
}

void main() {
    //Define lower bounds of levels
    float waterLevel = -0.1;
    float sandLevel = 0.02; 
    float grassLevel = .07 + noise((vGridPos.xy + vec2(0.0)) * 10.0) * 0.05;
    float rockLevel = .2 + noise((vGridPos.xy + vec2(5.0)) * 10.0) * 0.05;
    float snowLevel = .5 + noise((vGridPos.xy + vec2(8.0)) * 10.0) * 0.05;

    // Water
    vec3 col = checkLevel(waterLevel, sandLevel, vGridPos.y) * water(vGridPos);
    // Sand
    col += checkLevel(sandLevel, grassLevel, vGridPos.y) * vec3(0.8, 0.8, 0.5);
    // Grass
    col += checkLevel(grassLevel, rockLevel, vGridPos.y) * vec3(.3, .6, .05);
    // Rock
    col += checkLevel(rockLevel, snowLevel, vGridPos.y) * vec3(.35, .25, .23);
    // Snow
    col += checkLevel(snowLevel, 1.0, vGridPos.y) * vec3(.9);
    // Detail / Color variance
    col += ((noise(vGridPos.xz * 10.0) + noise(vGridPos.xz * 30.0) - 1.0)* 0.1);

    // Ambient term
    const float ambientFactor = 0.2;
    vec3 ambient = ambientFactor * col;

    // Diffuse term
    mat4 lightTilt = rotateX(degToRad(15.0));
    // mat4 lightPan = rotateY(degToRad(uTime * 180. * 0.8));
    mat4 lightPan = rotateY(degToRad(-45.0));
    vec3 lightDirection = (lightPan * lightTilt * vec4(0, 0, -1, 1)).xyz;
    float diffuseFactor = clamp(dot(vNormal, lightDirection), 0.0, 1.0);
    vec3 diffuse = diffuseFactor * col;

    // Specular term
    const float shininess = 32.0;
    vec3 viewDirection = normalize(-vViewPos.xyz);
    vec3 reflectionDirection = reflect(-lightDirection, vNormal);
    float specularFactor = pow(max(dot(reflectionDirection, viewDirection), 0.0), shininess);
    vec3 specular = specularFactor * col;

    //Set final color
    gl_FragColor = vec4(ambient + diffuse + specular, 1.0);
}