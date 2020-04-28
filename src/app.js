var THREE = require("three");
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
// import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

// import { Mesh, Sphere } from 'three';
var renderer, scene, camera, orbit;
var perspectiveCamera;
var flash_light, light_ray, spotLight;
var fl_target_loc;
var ball, fl_target;
var middle_y = 170;
var hemiLight;
var readyCount = 0;
var readyCountMax = 4;

function init() {
    var view_3d = document.getElementById("view-3d");

    var body = document.body,
        html = document.documentElement;

    var height = Math.max(body.scrollHeight, body.offsetHeight,
        html.clientHeight, html.scrollHeight, html.offsetHeight);

    view_3d.style.width = 100 + "%"
    view_3d.style.height = height + "px";

    var position_info = view_3d.getBoundingClientRect();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.canvas = view_3d;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(position_info.width, position_info.height);
    renderer.setClearColor('black', 0);
    view_3d.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.background = 0xffffff;

    perspectiveCamera = new THREE.PerspectiveCamera(45, position_info.width / position_info.height, 1, 9000);
    camera = perspectiveCamera;
    camera.position.set(360, 230, 400)
    camera.lookAt(new THREE.Vector3(0, 70, 0))

    orbit = new OrbitControls(camera, renderer.domElement);
    orbit.addEventListener("change", renderForControlChanged)
    orbit.target = new THREE.Vector3(0, 100, 0)
    orbit.maxPolarAngle = Math.PI * 0.55;
    orbit.minDistance = 10;
    orbit.maxDistance = 5000;
    orbit.update();
    orbit.saveState();

    // scene.add(new THREE.AxesHelper(100))

    var loader = new GLTFLoader();

    loader.load("models/flash_light2.glb",
        function (gltf) {
            flash_light = gltf.scene;
            flash_light.rotation.z = Math.PI
            flash_light.position.set(90, middle_y, 0)
            scene.add(gltf.scene);

            readyCount += 1;
            if (readyCount == readyCountMax) {
                finishedLoading();
            }
        }, undefined,
        function (err) {
            console.error(err);
        }
    )

    var material_table = new THREE.MeshPhongMaterial({ color: 0x808080, dithering: true });
    var geometry_table = new THREE.PlaneBufferGeometry(270, 150);

    var table = new THREE.Mesh(geometry_table, material_table);
    table.position.set(0, 0, 0);
    table.rotation.x = - Math.PI * 0.5;
    table.receiveShadow = true;
    // scene.add(table);

    var ballTextureLoader = new THREE.TextureLoader();
    ballTextureLoader.load("textures/Earth_Contemporary_Basic.png",
        function (texture) {

            var geometryBall = new THREE.SphereBufferGeometry(40, 50, 50);
            var materialBall = new THREE.MeshPhongMaterial({
                // color: 0xfaff00,
                shininess: 2,
                map: texture,
            });

            ball = new THREE.Mesh(geometryBall, materialBall);
            ball.rotateY(.4)
            ball.position.set(-100, middle_y, 0)

            var geoEquator = new THREE.CircleGeometry(40 + .1, 50);
            geoEquator.vertices.shift();
            var matEquator = new THREE.MeshBasicMaterial({ color: 0x004993 });
            var equator = new THREE.LineLoop(geoEquator, matEquator);
            equator.rotateX(Math.PI / 2);
            equator.position.set(-100, middle_y, 0);

            scene.add(ball);

            readyCount += 1;
            if (readyCount == readyCountMax) {
                finishedLoading();
            }
            // scene.add(equator);    
        }, undefined,
        function (error) {
            console.log(error);
        })

    fl_target_loc = new THREE.Vector3(-90, middle_y, 0);

    var geometry_fl_target = new THREE.SphereBufferGeometry(1, 2, 2);
    var material_fl_target = new THREE.MeshLambertMaterial({ color: 0xeeeeee});
    fl_target = new THREE.Mesh(geometry_fl_target, material_fl_target);
    fl_target.visible = false;
    fl_target.position.set(fl_target_loc.x, fl_target_loc.y, fl_target_loc.z)
    scene.add(fl_target)

    var ambient = new THREE.AmbientLight(0xffffff, 0.22);
    scene.add(ambient);

    var geometry_flashL_glass = new THREE.CircleBufferGeometry(5, 32);
    var flashL_glass = new THREE.Mesh(geometry_flashL_glass, new THREE.MeshBasicMaterial({ color: 0xffffff }))
    flashL_glass.rotation.y = -Math.PI / 2;

    var geometry = new THREE.CylinderGeometry(4, 15, 180, 32 * 2, 20, true);
    geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, -geometry.parameters.height / 2, 0));
    geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

    var material = new THREEx.VolumetricSpotLightMaterial();
    light_ray = new THREE.Mesh(geometry, material);
    light_ray.position.set(89, fl_target_loc.y, 0);

    light_ray.lookAt(fl_target_loc);
    material.uniforms.lightColor.value.set('white');
    material.uniforms.spotPosition.value = light_ray.position;
    scene.add(light_ray);

    spotLight = new THREE.SpotLight()
    spotLight.position.set(89, fl_target_loc.y, 0)
    spotLight.color = light_ray.material.uniforms.lightColor.value
    spotLight.angle = Math.PI / 30;
    spotLight.penumbra = .99;
    spotLight.intensity = 3.5
    spotLight.decay = 2.8;
    spotLight.distance = 360;
    spotLight.target = fl_target;
    spotLight.add(flashL_glass)

    scene.add(spotLight)

    light_ray.visible = false;
    spotLight.visible = false;

    var textureLoader = new THREE.TextureLoader();
    textureLoader.load("textures/wood_texture_2.jpg",
        function (texture) {

            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;

            texture.repeat.set(3, 2);

            var tableLoader = new GLTFLoader();

            // load a resource
            tableLoader.load(
                'models/simple_table.glb',
                function (gltf) {
                    var table = gltf.scene;
                    table.scale.set(65, 55, 55);

                    var material = new THREE.MeshLambertMaterial({ color: 0xcccccc, map: texture });

                    var tableMesh = table.children[0]

                    tableMesh.material = material;

                    var materialForLegs = new THREE.MeshLambertMaterial({ color: 0x999999, map: texture });
                    tableMesh.children[0].material = materialForLegs;
                    tableMesh.children[1].material = materialForLegs;
                    tableMesh.children[2].material = materialForLegs;
                    tableMesh.children[3].material = materialForLegs;
                    tableMesh.children[4].material = materialForLegs;

                    table.translateZ(-15)

                    scene.add(table);

                    readyCount += 1;
                    if (readyCount == readyCountMax) {
                        finishedLoading();
                    }

                }, undefined,
                function (error) { console.log('An error happened'); }
            );
        });

    var geoForRodOfBall = new THREE.BoxBufferGeometry(3, 50, 3);
    var matForRodOfBall = new THREE.MeshLambertMaterial({ color: 0x9b8861 });
    var rodOfBall = new THREE.Mesh(geoForRodOfBall, matForRodOfBall);
    rodOfBall.position.set(-100, middle_y - 35, 0);
    scene.add(rodOfBall);

    var geoBase = new THREE.BoxBufferGeometry(40, 3, 40);
    var matBase = new THREE.MeshLambertMaterial({ color: 0x827251 });
    var base = new THREE.Mesh(geoBase, matBase);
    base.position.set(-100, middle_y - 58, 0);
    scene.add(base);

    hemiLight = new THREE.HemisphereLight(0xffffff, 0x080820, 1);
    hemiLight.visible = false;
    scene.add(hemiLight);


    handleActions();
    window.addEventListener( 'resize', onWindowResize, false );

    scene.fog = new THREE.Fog(0x000000, 8000, 10000);

    var groundTextureLoader = new THREE.TextureLoader();
    groundTextureLoader.load("textures/floor-texture-1.jpg",
        function (groundTexture) {
            groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
            groundTexture.repeat.set(160, 160);
            groundTexture.anisotropy = 32;
            groundTexture.encoding = THREE.sRGBEncoding;

            var groundMaterial = new THREE.MeshLambertMaterial({ map: groundTexture });

            var mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(20000, 20000), groundMaterial);
            mesh.position.y = 0;
            mesh.rotation.x = - Math.PI / 2;
            // mesh.receiveShadow = true;
            scene.add(mesh);

            readyCount += 1;
            if (readyCount == readyCountMax) {
                finishedLoading();
            }
        }, undefined, function (err) {
            console.log(err)
        })
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    render();

}


function finishedLoading() {
    render();
    $(".dimmer").dimmer('hide');
}

function render() {
    renderer.render(scene, camera);
}

function renderForControlChanged() {
    renderer.render(scene, camera)
}

function handleActions() {
    var slider_y_pos = document.getElementById("flashLight-y-pos");
    var fl_switch = document.getElementById("fl-switch-checkbox")

    fl_switch.onchange = function (e) {
        var checked = fl_switch.checked;

        light_ray.visible = checked;
        spotLight.visible = checked;
        render();
    }

    slider_y_pos.oninput = function (e) {
        fl_target_loc.y = ball.position.y - slider_y_pos.value
        flash_light.position.set(90, fl_target_loc.y, 0)
        fl_target.position.set(fl_target_loc.x, fl_target_loc.y, fl_target_loc.z)
        spotLight.position.set(89, fl_target_loc.y, 0)
        light_ray.position.set(89, fl_target_loc.y, 0)
        light_ray.lookAt(fl_target_loc)
        render();
    }
}

var THREEx = THREEx || {}

/**
 * from http://stemkoski.blogspot.fr/2013/07/shaders-in-threejs-glow-and-halo.html
 * @return {[type]} [description]
 */
THREEx.VolumetricSpotLightMaterial = function () {
    // 
    var vertexShader = [
        'varying vec3 vNormal;',
        'varying vec3 vWorldPosition;',

        'void main(){',
        '// compute intensity',
        'vNormal		= normalize( normalMatrix * normal );',

        'vec4 worldPosition	= modelMatrix * vec4( position, 1.0 );',
        'vWorldPosition		= worldPosition.xyz;',

        '// set gl_Position',
        'gl_Position	= projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '}',
    ].join('\n')
    var fragmentShader = [
        'varying vec3		vNormal;',
        'varying vec3		vWorldPosition;',

        'uniform vec3		lightColor;',

        'uniform vec3		spotPosition;',

        'uniform float		attenuation;',
        'uniform float		anglePower;',

        'void main(){',
        'float intensity;',

        //////////////////////////////////////////////////////////
        // distance attenuation					//
        //////////////////////////////////////////////////////////
        'intensity	= distance(vWorldPosition, spotPosition)/attenuation;',
        'intensity	= 1.0 - clamp(intensity, 0.0, 1.0);',

        //////////////////////////////////////////////////////////
        // intensity on angle					//
        //////////////////////////////////////////////////////////
        'vec3 normal	= vec3(vNormal.x, vNormal.y, abs(vNormal.z));',
        'float angleIntensity	= pow( dot(normal, vec3(0.0, 0.0, 1.0)), anglePower );',
        'intensity	= intensity * angleIntensity;',
        // 'gl_FragColor	= vec4( lightColor, intensity );',

        //////////////////////////////////////////////////////////
        // final color						//
        //////////////////////////////////////////////////////////

        // set the final color
        'gl_FragColor	= vec4( lightColor, intensity);',
        '}',
    ].join('\n')

    // create custom material from the shader code above
    //   that is within specially labeled script tags
    var material = new THREE.ShaderMaterial({
        uniforms: {
            attenuation: {
                type: "f",
                value: 152
                // value: 100
            },
            anglePower: {
                type: "f",
                value: 2
            },
            spotPosition: {
                type: "v3",
                value: new THREE.Vector3(0, 0, 0)
            },
            lightColor: {
                type: "c",
                value: new THREE.Color('white')
            },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        // side		: THREE.DoubleSide,
        // blending	: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
    });
    return material
}

function resetView() {
    orbit.reset();
}

function switchLight(onOff) {
    hemiLight.visible = onOff;
    render();
}

init();

export { resetView, switchLight }