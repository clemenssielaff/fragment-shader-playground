import * as THREE from 'https://unpkg.com/three@0.120.1/build/three.module.js';

const scene = new THREE.Scene();
const width = window.innerWidth
const height = window.innerHeight;
const camera = new THREE.PerspectiveCamera( 70, width/height, 1, 1000 );

const bufferScene = new THREE.Scene();
const bufferTarget = new THREE.WebGLRenderTarget(
    window.innerWidth, 
    window.innerHeight, 
    { 
      minFilter: THREE.LinearFilter, 
      magFilter: THREE.NearestFilter
    });

const renderer = new THREE.WebGLRenderer(); 
renderer.setSize( width,height);
document.body.appendChild( renderer.domElement );

// Let's create a red box
var redMaterial = new THREE.MeshBasicMaterial({color:0xF06565});
var boxGeometry = new THREE.BoxGeometry( 5, 5, 5 );
var redBox = new THREE.Mesh( boxGeometry, redMaterial );
redBox.position.z = -10;
bufferScene.add(redBox);

// Let's create a box for rendering the texture onto
var bufferMaterial = new THREE.MeshBasicMaterial({map:bufferTarget.texture});
var box2Geometry = new THREE.BoxGeometry( 5, 5, 5 );
var bufferBoxObject = new THREE.Mesh( box2Geometry, bufferMaterial );
bufferBoxObject.position.z = -10;
scene.add(bufferBoxObject);

function render(delta) {
  redBox.rotation.x += 0.01;
  redBox.rotation.y += 0.01;

	requestAnimationFrame( render );
  
  renderer.setRenderTarget(bufferTarget);
	renderer.render( bufferScene, camera );

  renderer.setRenderTarget(null);
	renderer.render( scene, camera );
}
render(); // Render everything!
