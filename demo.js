'use strict'

// based on https://github.com/hughsk/gl-geometry/blob/master/test.js
var createCamera  = require('canvas-orbit-camera')
var mat4          = require('gl-matrix').mat4
var createContext = require('gl-context')
var glShader      = require('gl-shader')
var glslify       = require('glslify')
var createTexture = require('gl-texture2d')
var createBuffer  = require('gl-buffer')
var createVAO     = require('gl-vao')
var getPixels     = require('get-pixels')

var parseBlockModel = require('./')


var canvas     = document.body.appendChild(document.createElement('canvas'))
var gl         = createContext(canvas, render)
var camera     = createCamera(canvas)
var projection = mat4.create()

canvas.width = 512
canvas.height = 512
canvas.style.margin = '1em'
canvas.style.border = '1px solid black'

var textarea = document.createElement('textarea')
textarea.id = 'q'
textarea.rows = '50'
textarea.cols = '80'
var exampleData =
   // example parsed JSON
  [
    {from: [0,0,0],
    to: [16,8,16],
    faceData: {
      down: {},
      up: {},
      north: {},
      south: {},
      west: {},
      east: {}},
    }
  ]

var oldText = textarea.value = JSON.stringify(exampleData, null, '  ')
document.body.appendChild(textarea)

document.body.appendChild(document.createElement('br'))
var errorNode = document.createTextNode('')
document.body.appendChild(errorNode)

// create a mesh ready for rendering
var createBlockMesh = function(gl, vertices, uv) {
  var verticesBuf = createBuffer(gl, new Float32Array(vertices))
  var uvBuf = createBuffer(gl, new Float32Array(uv))

  var mesh = createVAO(gl, [
      { buffer: verticesBuf,
        size: 3
      },
      {
        buffer: uvBuf,
        size: 2
      }
      ])
  mesh.length = vertices.length/3

  return mesh
};

var model = parseBlockModel(exampleData)//, undefined, 0,0,0)//1,1,1)
var mesh = createBlockMesh(gl, model.vertices, model.uv)

window.setInterval(function() {
  var text = textarea.value
  if (text.length === oldText.length && text === oldText) return // no change
  oldText = text

  errorNode.textContent = ''
  try {
    var data = JSON.parse(text)
    var model = parseBlockModel(data)
    mesh = createBlockMesh(gl, model.vertices, model.uv)
    console.log('updated geometry',mesh)
  } catch (e) {
    errorNode.textContent = e.toString()
  }

}, 200)

var modelMatrix = mat4.create()
var s = 5
mat4.scale(modelMatrix, modelMatrix, [s,s,s])

var shader = glShader(gl,
  glslify("\
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
}", {inline: true}),

  glslify("\
precision highp float;\
\
uniform sampler2D texture;\
varying vec2 vUv;\
\
void main() {\
  gl_FragColor = texture2D(texture, vUv);\
}", {inline: true}));

// from https://github.com/deathcap/ProgrammerArt/blob/master/textures/blocks/glass_blue.png
var blueGlass = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAIElEQVQ4T2NgYGD4TyEGEf+NycOjBowaMGoAtQ0gHwMAeYYmHC+xF4EAAAAASUVORK5CYII='
var texture
getPixels(blueGlass, function(err, pixels) {
  if (err) throw err

  texture = createTexture(gl, pixels)
})

function render() {
  var width  = canvas.width
  var height = canvas.height

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.enable(gl.CULL_FACE)
  gl.enable(gl.DEPTH_TEST)
  gl.viewport(0, 0, width, height)

  shader.bind()
  shader.attributes.position.location = 0
  shader.uniforms.view = camera.view()
  shader.uniforms.model = modelMatrix
  shader.uniforms.projection = mat4.perspective(projection
    , Math.PI / 4
    , width / height
    , 0.001
    , 10000
  )
  if (texture) shader.uniforms.texture = texture.bind()
  // TODO: use same atlas from voxel-shader TODO: can we reliably avoid binding? if already bound, seems to reuse
  //if (this.stitchPlugin.texture) this.shader.uniforms.texture = this.stitchPlugin.texture.bind();

  mesh.bind();
  mesh.draw(gl.TRIANGLES, mesh.length);
  mesh.unbind();

  camera.tick()
}
