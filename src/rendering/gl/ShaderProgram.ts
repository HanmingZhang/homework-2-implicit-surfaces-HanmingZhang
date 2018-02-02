import {vec4, mat4} from 'gl-matrix';
import Drawable from './Drawable';
import {gl} from '../../globals';

var activeProgram: WebGLProgram = null;

export class Shader {
  shader: WebGLShader;

  constructor(type: number, source: string) {
    this.shader = gl.createShader(type);
    gl.shaderSource(this.shader, source);
    gl.compileShader(this.shader);

    if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(this.shader);
    }
  }
};

class ShaderProgram {
  prog: WebGLProgram;

  attrPos: number;

  unifView: WebGLUniformLocation;
  unifWidth: WebGLUniformLocation;
  unifHeight: WebGLUniformLocation;
  unifTime: WebGLUniformLocation;
  unifLerpStage: WebGLUniformLocation;
  unifLerpValue: WebGLUniformLocation;
  unifAmbientOcclusion: WebGLUniformLocation;
  unifLensFX: WebGLUniformLocation;
  unifDarkScene: WebGLUniformLocation;
  unifBarrelDistortion: WebGLUniformLocation;
  unifSceneSelect: WebGLUniformLocation;

  constructor(shaders: Array<Shader>) {
    this.prog = gl.createProgram();

    for (let shader of shaders) {
      gl.attachShader(this.prog, shader.shader);
    }
    gl.linkProgram(this.prog);
    if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
      throw gl.getProgramInfoLog(this.prog);
    }

    // Raymarcher only draws a quad in screen space! No other attributes
    this.attrPos = gl.getAttribLocation(this.prog, "vs_Pos");

    // TODO: add other attributes here
    this.unifView   = gl.getUniformLocation(this.prog, "u_View");
    this.unifWidth  = gl.getUniformLocation(this.prog, "u_Width");
    this.unifHeight = gl.getUniformLocation(this.prog, "u_Height");
    this.unifTime   = gl.getUniformLocation(this.prog, "u_Time");
    this.unifLerpStage = gl.getUniformLocation(this.prog, "u_LerpStage");
    this.unifLerpValue = gl.getUniformLocation(this.prog, "u_LerpValue");

    this.unifAmbientOcclusion = gl.getUniformLocation(this.prog, "u_kAmbientOcclusion");
    this.unifLensFX = gl.getUniformLocation(this.prog, "u_kLensFX");
    this.unifDarkScene = gl.getUniformLocation(this.prog, "u_kDarkScene");
    this.unifBarrelDistortion = gl.getUniformLocation(this.prog, "u_kBarrelDistortion");

    this.unifSceneSelect = gl.getUniformLocation(this.prog, "u_SceneSelect");

  }

  use() {
    if (activeProgram !== this.prog) {
      gl.useProgram(this.prog);
      activeProgram = this.prog;
    }
  }

  // TODO: add functions to modify uniforms
  setResolution(width: number, height: number){
    this.use();

    if(this.unifWidth !== -1){
      gl.uniform1f(this.unifWidth, width);
    }

    if(this.unifHeight !== -1){
      gl.uniform1f(this.unifHeight, height);
    }
  }

  setTime(time: number){
    this.use();

    if(this.unifTime !== -1){
      gl.uniform1f(this.unifTime, time);
    }
  }

  setLerpStage(stage: number){
    this.use();

    if(this.unifLerpStage !== -1){
      gl.uniform1i(this.unifLerpStage, stage);
    }
  }

  setLerpValue(value: number){
    this.use();

    if(this.unifLerpValue !== -1){
      gl.uniform1f(this.unifLerpValue, value);
    }
  }

  setAO(isOn: boolean){
    this.use();

    if(this.unifAmbientOcclusion !== -1){
      if(isOn){
        gl.uniform1i(this.unifAmbientOcclusion, 1);
      }
      else{
        gl.uniform1i(this.unifAmbientOcclusion, 0);
      }
    }
  }

  setLensFX(isOn: boolean){
    this.use();

    if(this.unifLensFX !== -1){
      if(isOn){
        gl.uniform1i(this.unifLensFX, 1);
      }
      else{
        gl.uniform1i(this.unifLensFX, 0);
      }
    }
  }

  setDarkScene(isOn: boolean){
    this.use();

    if(this.unifDarkScene !== -1){
      if(isOn){
        gl.uniform1i(this.unifDarkScene, 1);
      }
      else{
        gl.uniform1i(this.unifDarkScene, 0);
      }
    }
  }

  setBarrelDistortion(isOn: boolean){
    this.use();

    if(this.unifBarrelDistortion !== -1){
      if(isOn){
        gl.uniform1i(this.unifBarrelDistortion, 1);
      }
      else{
        gl.uniform1i(this.unifBarrelDistortion, 0);
      }
    }
  }

  setSceneSelect(select: number){
    this.use();

    if(this.unifSceneSelect !== -1){
      gl.uniform1f(this.unifSceneSelect, select);
    }
  }


  draw(d: Drawable) {
    this.use();

    if (this.attrPos != -1 && d.bindPos()) {
      gl.enableVertexAttribArray(this.attrPos);
      gl.vertexAttribPointer(this.attrPos, 4, gl.FLOAT, false, 0, 0);
    }

    d.bindIdx();
    gl.drawElements(d.drawMode(), d.elemCount(), gl.UNSIGNED_INT, 0);

    if (this.attrPos != -1) gl.disableVertexAttribArray(this.attrPos);

  }
};

export default ShaderProgram;
