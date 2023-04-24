precision mediump float;

varying vec3 vGridPos;

uniform float uTime;

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

void main() {
    //Define lower bounds of levels
    float levelOffset = noise(vGridPos.xy * 5.0) * 0.08;
    float waterLevel = -0.1;
    float sandLevel = 0.02; 
    float grass1Level = .07 + levelOffset;
    float grass2Level = .2 + levelOffset;
    float rock1Level = .3 + levelOffset;
    float rock2Level = .5 + levelOffset;
    float snowLevel = 0.75 + levelOffset;

    //Water
    vec3 col = checkLevel(waterLevel, sandLevel, vGridPos.y) * water(vGridPos);
    //Sand
    col += checkLevel(sandLevel, grass1Level, vGridPos.y) * vec3(0.8, 0.8, 0.5);
    //Grass1
    col += checkLevel(grass1Level, grass2Level, vGridPos.y) * vec3(.3, .6, .05);
    //Grass 2
    col += checkLevel(grass2Level, rock1Level, vGridPos.y) * vec3(.25, .35, .0);
    //Rock 1
    col += checkLevel(rock1Level, rock2Level, vGridPos.y) * vec3(.35, .25, .23);
    //Rock 2
    col += checkLevel(rock2Level, snowLevel, vGridPos.y) * vec3(.3, .2, .2);
    //Snow
    col += checkLevel(snowLevel, 1.0, vGridPos.y) * vec3(.9);
   
    //Detail / Color variance
    col += ((noise(vGridPos.xz * 10.0) + noise(vGridPos.xz * 30.0) - 1.0)* 0.1);

    //Set final color
    gl_FragColor = vec4(col, 1.0);
}