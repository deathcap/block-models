'use strict'

// based on https://github.com/hughsk/gl-geometry/blob/master/test.js
var createCamera  = require('canvas-orbit-camera')
var mat4          = require('gl-matrix').mat4
var createContext = require('gl-context')
var glslify       = require('glslify')

var createBlockGeometry = require('./')

var canvas     = document.body.appendChild(document.createElement('canvas'))
var gl         = createContext(canvas, render)
var camera     = createCamera(canvas)
var projection = mat4.create()
var shader     = glslify({
    inline: true,
    vert: '\
precision mediump float;\
\
attribute vec3 position;\
attribute vec3 normal;\
varying vec3 vnormal;\
uniform mat4 uProjection;\
uniform mat4 uView;\
uniform mat4 uModel;\
\
void main() {\
vnormal = (uView * vec4(normal, 1.0)).xyz / 2.0 + 0.5;\
\
gl_Position = (\
    uProjection\
  * uView\
  * uModel\
  * vec4(position, 1.0)\
);\
}'
  , frag: '\
precision mediump float;\
\
varying vec3 vnormal;\
\
void main() {\
gl_FragColor = vec4(vnormal, 1.0);\
}'
})(gl)

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
    to: [16,16,16],
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

var geom = createBlockGeometry(gl, exampleData)

window.setInterval(function() {
  var text = textarea.value
  if (text.length === oldText.length && text === oldText) return // no change
  oldText = text

  var data = JSON.parse(text)
  geom = createBlockGeometry(gl, data)
  console.log('updated geometry',geom)
}, 200)

var modelMatrix = mat4.create()
var s = 5
mat4.scale(modelMatrix, modelMatrix, [s,s,s])

function render() {
  var width  = canvas.width
  var height = canvas.height

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.enable(gl.CULL_FACE)
  gl.enable(gl.DEPTH_TEST)
  gl.viewport(0, 0, width, height)

  geom.bind(shader)
  shader.attributes.position.location = 0
  shader.uniforms.uView = camera.view()
  shader.uniforms.uModel = modelMatrix
  shader.uniforms.uProjection = mat4.perspective(projection
    , Math.PI / 4
    , width / height
    , 0.001
    , 10000
  )

  geom.draw()
  geom.unbind()

  camera.tick()
}
