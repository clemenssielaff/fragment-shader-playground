 /*========== Define Global Variables ==========*/
let colors = []
let centroids = []
let resolution = []
let then = 0.0;
let time = 0.0
const speed = 0.00003

main();

function main() {
    /*========== Create a WebGL Context ==========*/
    /** @type {HTMLCanvasElement} */
    const canvas = document.querySelector("#canvas");
    /** @type {WebGLRenderingContext} */
    const gl = canvas.getContext('webgl');
    if (!gl) {
        console.log('WebGL unavailable');
    } else {
        console.log('WebGL is good to go');
    }
    /*========== Define and Store the Geometry ==========*/

    // Define the points in the scene
    const coordinates = [
        -1.0, 1.0, 0.0,
        -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0,

        1.0, 1.0, 0.0,
        1.0, -1.0, 0.0,
        -1.0, 1.0, 0.0
    ];

    // Define Buffer
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coordinates), gl.STATIC_DRAW);

    /*========== Shaders ==========*/

    // Define shader sources
    const vsSource = `
    precision mediump float;
    attribute vec4 aPosition;
            
    void main() {
        gl_Position = aPosition;
    }
`;

    const fsSource = `
    precision mediump float;
    uniform vec2 uResolution;
    uniform vec2 uCentroids[8];
    uniform vec3 uColors[8];
    uniform float uTime;
    uniform float uSpeed;
  
    void main() {
        float min_distance = 1.0;
        vec3 color = vec3(0.0);
        vec2 pos_converted = gl_FragCoord.xy/uResolution.xy;


        for (int i = 0; i < 8; i++) {
            vec2 moving_point =  0.5 + 0.5 * sin(uTime * uSpeed + 6.2 * uCentroids[i]);
            float dist = distance(pos_converted, moving_point);
            if(dist <= min_distance) {
                min_distance = dist;
                color = uColors[i];
            }
        }
        float inverse_distance = 1.0 - min_distance;
        gl_FragColor = vec4(color.x * inverse_distance, color.y * inverse_distance, color.z * inverse_distance, 1.0);
    }
`;


    /*====== Create shaders ======*/
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(vertexShader, vsSource);
    gl.shaderSource(fragmentShader, fsSource);

    /*====== Compile shaders ======*/
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the vertex shader: ' + gl.getShaderInfoLog(vertexShader));
        gl.deleteShader(vertexShader);
        return null;
    }
    else {
        console.log('Vertex shader successfully compiled.');
    }
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the fragment shader: ' + gl.getShaderInfoLog(fragmentShader));
        gl.deleteShader(fragmentShader);
        return null;
    }
    else {
        console.log('Fragment shader successfully compiled.');
    }

    /*====== Create shader program ======*/
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    /*====== Link shader program ======*/
    gl.linkProgram(program);
    gl.useProgram(program);

    const programInfo = {
        program: program,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(program, 'aPosition'),
        },
        uniformLocations: {
            centroids: gl.getUniformLocation(program, 'uCentroids'),
            colors: gl.getUniformLocation(program, 'uColors'),
            time: gl.getUniformLocation(program, 'uTime'),
            speed: gl.getUniformLocation(program, 'uSpeed'),
            resolution: gl.getUniformLocation(program, 'uResolution')
        }
    };

    /*========== Connect the attributes with the vertex shader ===================*/
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

    resolution = [parseFloat(canvas.width), parseFloat(canvas.height)]
    const centroidCount = 8;
    centroids = createRandomPoints(centroidCount)
    colors = createRandomColors(centroidCount);


    function render(now) {
        now *= 0.001;  // convert to seconds
        const deltaTime = now - then;
        then = now;
        drawScene(gl, programInfo, now);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

}

function createRandomPoints(count) {
    let array = new Array(count * 2);
    for (let index = 0; index < array.length; index++) {
        array[index] = Math.random();
    }
    return array;
}

function createRandomColors(count) {
    let array = new Array(count * 3);
    for (let index = 0; index < array.length; index++) {
        array[index] = Math.random();
    }
    return array;
}


function drawScene(gl, programInfo, deltaTime) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    // Clear the canvas before we start drawing on it.

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Tell WebGL to use our program when drawing  
    gl.useProgram(programInfo.program);

    // Set the shader uniforms  

    gl.uniform1f(programInfo.uniformLocations.time, time);
    gl.uniform1f(programInfo.uniformLocations.speed, speed);
    gl.uniform3fv(programInfo.uniformLocations.colors, new Float32Array(colors));
    gl.uniform2fv(programInfo.uniformLocations.centroids, new Float32Array(centroids));
    gl.uniform2fv(programInfo.uniformLocations.resolution, new Float32Array(resolution));

    // Draw the points on the screen
    const mode = gl.TRIANGLES;
    const first = 0;
    const count = 6;
    gl.drawArrays(mode, first, count);

    time += deltaTime;
}