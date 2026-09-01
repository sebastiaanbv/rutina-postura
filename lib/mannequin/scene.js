/* PARCHE LOCAL -- ver PARCHES.md

   El scene.js original monta, al importarse, un WebGLRenderer a pantalla
   completa pegado a document.body, mas un favicon y un meta viewport, y
   arranca su propio bucle de render con OrbitControls. Para incrustar el
   maniqui dentro de la app eso sobra entero: nosotros ponemos la camara
   ortografica, el lienzo y el bucle.

   Se conservan los mismos nombres exportados para no tocar el resto de la
   libreria. Mannequin.js solo necesita "scene" para hacer scene.add(this);
   nosotros lo reparentamos despues.

   Efecto util y buscado: Joint.point() hace (window.scene ?? localScene)
   .worldToLocal(...). Como no definimos window.scene, usa una escena vacia
   con matriz identidad, asi que point() devuelve coordenadas de MUNDO. Es
   justo lo que necesita el validador para medir apoyos y choques.
*/

import * as THREE from "three";

var scene = new THREE.Scene();
scene.name = "mannequin-headless";

var renderer = null, camera = null, light = null, controls = null;
var clock = new THREE.Clock();

var stage = {
	renderer: null,
	scene: scene,
	camera: null,
	light: null,
	animationLoop: null,
};

function createStage( animationLoop ) {

	stage.animationLoop = animationLoop || null;
	return stage;

}

function getStage() {

	return stage;

}

function systemAnimate() {}

export { renderer, scene, camera, light, controls, createStage, getStage, systemAnimate, clock };
