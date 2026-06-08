import * as THREE from "../three/three.module.js";
import Screen from './Screen.js';

export default class ScreenHelper extends THREE.Object3D {
	#screen;
	#screenFace;
	#screenEdge;

	constructor ( screen, color = 0xFFFFFF ) {
		super();

		this.type = 'ScreenHelper';

		this.#screen = screen;

		const corners = screen.corners;

		const indices = [ 0, 1, 2,	1, 3, 2  ]
		const vertices = new Float32Array([	...corners[0].toArray(), ...corners[1].toArray(), ...corners[2].toArray(), ...corners[3].toArray() ]);

		const geometry = new THREE.BufferGeometry( );
		geometry.setAttribute( "position", new THREE.BufferAttribute( vertices, 3 ) );
		geometry.setIndex( indices );
		geometry.computeVertexNormals( );

		const material = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide, transparent: true, opacity: 0.2 });
		this.#screenFace = new THREE.Mesh( geometry, material );

		const edgeGeometry = new THREE.EdgesGeometry( geometry );
		const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
		this.#screenEdge = new THREE.LineSegments( edgeGeometry, edgeMaterial );

		this.add( this.#screenEdge, this.#screenFace );
	}

	setLayer ( layer ) {
		this.layers.set( layer );
		this.#screenEdge.layers.set( layer );
		this.#screenFace.layers.set( layer );
	}
}