import * as THREE from "./three/three.module.js";
import { OrbitControls } from "./three/controls/OrbitControls.js";
import { PLYLoader } from "./three/loaders/PLYLoader.js";
import ScreenWindow from "./Cave/ScreenWindow.js";
import ClientNetwork from "./ClientNetwork.js"; // 1. L'import est parfait ici tout en haut

export default class MultiScreenViewer {
    #worker;
    #camera;
    #caveWindow;
    #reseauCave; // 2. On déclare une variable privée pour stocker le réseau

    constructor ( ) {
        console.log( `MultiScreenViewer - constructor` );

        window.addEventListener( "beforeunload", this.#beforeUnload.bind( this ) );
        
        this.#worker = new Worker( "./renderWorker.js", { type: "module" } );
        this.#worker.addEventListener( "error", ( event ) => { console.log( "worker error", event ); });
    
        this.#initializeMainWindow( );

       // this.#initializeCaveWindow( );

        // 3. On appelle la configuration réseau une fois que tout le reste est prêt
        this.#initializeNetwork( );
    }

    // 4. Nouvelle méthode dédiée au réseau, bien rangée dans la classe
    #initializeNetwork( ) {
        this.#reseauCave = new ClientNetwork();

        this.#reseauCave.setCallbacks({
            onOpen: () => {
                console.log("CAVE connecté au serveur Node !");
                
                // On s'identifie auprès du serveur (Instance CAVE)
                this.#reseauCave.send(JSON.stringify({
                    scope: "IDENTIFY",
                    UUID: "00000000-0000-0000-0000-000000000000"
                }));
            },
        onMessage: (messageBrut) => {
            // 🌟 On affiche DIRECTEMENT le texte brut reçu du serveur dans la console du PC
            console.log("📥 [RÉSEAU CAVE] Message brut reçu du serveur :", messageBrut);

            try {
                const message = JSON.parse(messageBrut);
                console.log("Matière décodée (JSON) :", message);

                // Analyse ultra-large pour attraper le flipEyes où qu'il soit :
                if (messageBrut.includes("flipEyes")) {
                    console.log("Le mot 'flipEyes' a été détecté dans le signal !");
                    this.#worker.postMessage({ type: "flipEyes" });
                }
            } catch (e) {
                console.error("Erreur de lecture du message JSON :", e);
            }
        }
        });

        // Connexion au serveur local (localhost)
        this.#reseauCave.connect("ws://localhost", "3000");
    }

    #initializeMainWindow ( ) {
        const canvas = document.createElement( "canvas" );
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        document.body.appendChild( canvas );

        const offScreenCanvas = canvas.transferControlToOffscreen( );
        this.#worker.postMessage({ type: "monitorCanvas", canvas: offScreenCanvas }, [offScreenCanvas] );

        const worldUp = new THREE.Vector3(0, 0, 1);
        this.#camera = new THREE.PerspectiveCamera( 70, 800/600, 0.1, 1 );
        this.#camera.up.copy(worldUp);
        this.#camera.position.set( -2, -4, 3 );
        this.#camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.#camera.updateMatrixWorld()

        this.#worker.postMessage({ type: "monitorCamera", position: this.#camera.position.toArray(), quaternion: this.#camera.quaternion.toArray()});

        const controls = new OrbitControls(this.#camera, canvas);
        controls.addEventListener("change", () => {
            this.#worker.postMessage({ type: "monitorCamera", position: this.#camera.position.toArray(), quaternion: this.#camera.quaternion.toArray()});
        })
    }

    #initializeCaveWindow ( ) {
        this.#caveWindow = new ScreenWindow({
            onLoad: ( ) => {
                console.log(this.#caveWindow.canvas)
                const offScreenCanvas = this.#caveWindow.canvas.transferControlToOffscreen( );
                this.#worker.postMessage({ type: "caveCanvas", canvas: offScreenCanvas }, [offScreenCanvas] );
            },
            onResize: ( ) => {
                this.#worker.postMessage({ type: "caveCanvasResize", width: this.#caveWindow.width, height: this.#caveWindow.height } );
            },
            onMouseUp: ( ) => {
                console.log("clicked")
                this.#worker.postMessage({ type: "flipEyes" } );
            }
        });
        this.#caveWindow.open();
    }

    #beforeUnload ( ) {
        this.#caveWindow.close();
    }
}