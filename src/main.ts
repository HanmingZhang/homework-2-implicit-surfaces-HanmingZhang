import {vec3} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import { currentId } from 'async_hooks';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.

const LERPFUN = 'LerpFun';
const CHESS   = 'Chess';

const controls = {
  // TODO: add any controls you want
  AO : true,
  LensEffect : false,
  DarkScene: false,
  BarrelDistortion: false,
  SceneSelect: LERPFUN,
};

let screenQuad: Square;

let time: number;
let lerpStage: number;
let lerpValue: number;
let sceneSelect: number;

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // TODO: add any controls you need to the gui
  const gui = new DAT.GUI();
  // E.G. gui.add(controls, 'tesselations', 0, 8).step(1);

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');

  function setSize(width: number, height: number) {
    canvas.width = width;
    canvas.height = height;
  }

  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  screenQuad = new Square(vec3.fromValues(0, 0, 0));
  screenQuad.create();

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  gl.clearColor(0.0, 0.0, 0.0, 1);
  gl.disable(gl.DEPTH_TEST);

  const raymarchShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/screenspace-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/raymarch-frag.glsl')),
  ]);

  function setAO(){
    raymarchShader.setAO(controls.AO);
  }

  function setLensEffect(){
    raymarchShader.setLensFX(controls.LensEffect);
  }

  function setDarkScene(){
    raymarchShader.setDarkScene(controls.DarkScene);
  }

  function setDistortion(){
    raymarchShader.setBarrelDistortion(controls.BarrelDistortion);
  }

  gui.add(controls, 'AO').onChange(setAO);
  gui.add(controls, 'LensEffect').onChange(setLensEffect);
  gui.add(controls, 'DarkScene').onChange(setDarkScene);
  gui.add(controls, 'BarrelDistortion').onChange(setDistortion);

  setAO();
  setLensEffect();
  setDarkScene();
  setDistortion();

  lerpStage = 0;
  lerpValue = 0.0;


  function setSceneSelect(){
    switch(controls.SceneSelect) {
        case LERPFUN:
          sceneSelect = 0.0;
          time = 0.0;
          break;
        case CHESS:
          sceneSelect = 1.0;
          time = 0.0;
          break;
      }
  }

  setSceneSelect()

  gui.add(controls, 'SceneSelect', [LERPFUN, CHESS]).onChange(setSceneSelect);

  raymarchShader.setResolution(window.innerWidth, window.innerHeight);


  function coroutine(f: any) {
    var o = f(); // instantiate the coroutine
    o.next(); // execute until the first yield
    return function(x : any) {
        o.next(x);
    }
  }

  // set continously changing lerp stage
  var clockSetStage = coroutine(function*() :Iterable<number> {
    while(true){
      console.log(lerpStage);
      lerpValue = .0;
      lerpStage = (lerpStage + 1) % 5;
      yield 0;
    }
  });
  setInterval(clockSetStage, 12000);

  var currentTime;
  var lastTime = 0.0;

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();

    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    currentTime = time;

    // TODO: get / calculate relevant uniforms to send to shader here
    // TODO: send uniforms to shader
    if(lerpValue < 1.0){
      lerpValue = lerpValue + 0.005;
    }

    raymarchShader.setTime(time / 50.0);
    raymarchShader.setLerpValue(lerpValue);
    raymarchShader.setLerpStage((lerpStage + 4) % 5);
    raymarchShader.setSceneSelect(sceneSelect);

    // March!
    raymarchShader.draw(screenQuad);
    
    lastTime = currentTime;

    // TODO: more shaders to layer / process the first one? (either via framebuffers or blending)
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  
    time += 0.5;
    if(time > 100000000.0){
      time = 0.0;
    }
  }

  window.addEventListener('resize', function() {
    setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();

    raymarchShader.setResolution(window.innerWidth, window.innerHeight);
    // console.log(window.innerWidth);
    // console.log(window.innerHeight);
  }, false);

  setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();
