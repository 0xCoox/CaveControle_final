import * as THREE from "./three/three.module.js";

export default function setUpVRScene ( ) {
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0X000000);
	let ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
	scene.add(ambientLight);
	let pointLight = new THREE.PointLight(0xffffff, 100);
	pointLight.position.set(5,4,5);
	scene.add(pointLight);
	
    const gridHelperTable = new THREE.GridHelper(10, 10, 0xAAAA00, 0xAAAA00);
    gridHelperTable.position.set(0, -0.25, 0)
    const tableGroup = new THREE.Group;
    const tablewire = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.5, 1.0, 0.5, 8, 1)),
        new THREE.LineBasicMaterial({color: 0XAAAA00, linewidth: 3})
    );
    const table = new THREE.Mesh(
        new THREE.CylinderGeometry(0.499, 0.999, 0.499, 8, 1),
        new THREE.MeshBasicMaterial({color: 0X000000, polygonOffset:10.5})
    );
    tableGroup.add(table, tablewire)
    tableGroup.add(gridHelperTable);
    scene.add(tableGroup)
    tableGroup.position.y -= 1.25;




	return scene;
}