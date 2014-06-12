'use strict';

// TODO: refactor with voxel-decals, voxel-wireframe, voxel-chunkborder, draw-billboard..?

var createBuffer = require('gl-buffer');
var createVAO = require('gl-vao');
var glslify = require('glslify');
var glm = require('gl-matrix');
var mat4 = glm.mat4;

var createPlaneShader = function(gl) {
  return glslify({
    inline: true,
    vertex: "\
attribute vec3 position;\
attribute vec2 uv;\
\
uniform mat4 projection;\
uniform mat4 view;\
uniform mat4 model;\
varying vec2 vUv;\
\
void main() {\
  gl_Position = projection * view * model * vec4(position, 1.0);\
  vUv = uv;\
}",

  fragment: "\
precision highp float;\
\
uniform sampler2D texture;\
varying vec2 vUv;\
\
void main() {\
  gl_FragColor = texture2D(texture, vUv);\
}"})(gl);
};

var createPlaneMesh = function(gl, info) {
  // cube face vertices, indexed by normal (based on box-geometry)
  var cube = {
    // Back face
    '0|0|1': [
    0, 0, 1,
    1, 0, 1,
    1, 1, 1,

    0, 0, 1,
    1, 1, 1,
    0, 1, 1],

    // Front face
    '0|0|-1': [
    0, 0, 0,
    0, 1, 0,
    1, 1, 0,

    0, 0, 0,
    1, 1, 0,
    1, 0, 0],

    // Top face
    '0|1|0': [
    0, 1, 0,
    0, 1, 1,
    1, 1, 1,

    0, 1, 0,
    1, 1, 1,
    1, 1, 0],

    // Bottom face
    '0|-1|0': [
    0, 0, 0,
    1, 0, 0,
    1, 0, 1,

    0, 0, 0,
    1, 0, 1,
    0, 0, 1],

    // Left face
    '1|0|0': [
    1, 0, 0,
    1, 1, 0,
    1, 1, 1,

    1, 0, 0,
    1, 1, 1,
    1, 0, 1],

    // Right face
    '-1|0|0': [
    0, 0, 0,
    0, 0, 1,
    0, 1, 1,

    0, 0, 0,
    0, 1, 1,
    0, 1, 0],
  };

  var vertices = [];
  var uvArray = [];

  for (var i = 0; i < info.length; i += 1) {
    // start with plane corresponding to desired cube face
    var normal = info[i].normal;
    var plane = cube[normal.join('|')].slice(0);

    // translate into position
    for (var j = 0; j < plane.length; j += 1) {
      plane[j] += info[i].position[j % 3];

      // and raise out of surface by a small amount to prevent z-fighting
      plane[j] += normal[j % 3] * 0.001;
    }

    vertices = vertices.concat(plane);

    // texturing (textures loaded from voxel-stitch updateTexture event)
    var tileUV = info.getTextureUV ? info.getTextureUV(info[i].texture) : [ [0,0], [0,1], [1,1], [1,0] ]; // TODO
    if (!tileUV) throw new Error('failed to load decal texture: ' + info[i].texture + ' for ' + info[i]);

    // cover the texture tile over the two triangles forming a flat plane
    var planeUV = [
      tileUV[3],
      tileUV[0],
      tileUV[1],

      tileUV[2],
    ];

    // rotate UVs so texture is always facing up
    var r = 0;
    if (normal[0] === -1 || 
        normal[1] === -1 ||
        normal[2] === 1) { // TODO: -1?
      r = 3;
    }

    uvArray.push(planeUV[(0 + r) % 4][0]); uvArray.push(planeUV[(0 + r) % 4][1]);
    uvArray.push(planeUV[(1 + r) % 4][0]); uvArray.push(planeUV[(1 + r) % 4][1]);
    uvArray.push(planeUV[(2 + r) % 4][0]); uvArray.push(planeUV[(2 + r) % 4][1]);

    uvArray.push(planeUV[(0 + r) % 4][0]); uvArray.push(planeUV[(0 + r) % 4][1]);
    uvArray.push(planeUV[(2 + r) % 4][0]); uvArray.push(planeUV[(2 + r) % 4][1]);
    uvArray.push(planeUV[(3 + r) % 4][0]); uvArray.push(planeUV[(3 + r) % 4][1]);
  }

  var uv = new Float32Array(uvArray);

  var verticesBuf = createBuffer(gl, new Float32Array(vertices));
  var uvBuf = createBuffer(gl, uv);

  var mesh = createVAO(gl, [
      { buffer: verticesBuf,
        size: 3
      },
      {
        buffer: uvBuf,
        size: 2
      }
      ]);
  mesh.length = vertices.length/3;

  return mesh;
};

var scratch0 = mat4.create();

module.exports = {
  createPlaneShader: createPlaneShader,
  createPlaneMesh: createPlaneMesh,
};
