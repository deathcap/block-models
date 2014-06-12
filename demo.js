'use strict'

// based on https://github.com/hughsk/gl-geometry/blob/master/test.js
var createCamera  = require('canvas-orbit-camera')
var mat4          = require('gl-matrix').mat4
var createContext = require('gl-context')
var glslify       = require('glslify')

var createBlockMesh = require('./')
var planeUtils = require('./gl-plane.js')

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

var mesh = createBlockMesh(gl, exampleData)

window.setInterval(function() {
  var text = textarea.value
  if (text.length === oldText.length && text === oldText) return // no change
  oldText = text

  var data = JSON.parse(text)
  mesh = createBlockMesh(gl, data)
  console.log('updated geometry',mesh)
}, 200)

var modelMatrix = mat4.create()
var s = 2
mat4.scale(modelMatrix, modelMatrix, [s,s,s])

var shader = planeUtils.createPlaneShader(gl)
  /*
var mesh = planeUtils.createPlaneMesh(gl,
    // TODO: replace with createBlockGeometry
  [
    {position:[0,0,0], normal:[-1,0,0], texture:'furnace_top'},
    {position:[0,1,0], normal:[+1,0,0], texture:'furnace_top'},
    {position:[0,2,0], normal:[0,+1,0], texture:'furnace_top'},
    {position:[0,3,0], normal:[0,-1,0], texture:'furnace_top'},
    {position:[0,4,0], normal:[0,0,+1], texture:'furnace_front_on'},
    {position:[0,5,0], normal:[0,0,-1], texture:'furnace_top'},
  ])
  */

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
  // use same atlas from voxel-shader TODO: can we reliably avoid binding? if already bound, seems to reuse
  //if (this.stitchPlugin.texture) this.shader.uniforms.texture = this.stitchPlugin.texture.bind();

  mesh.bind();
  mesh.draw(gl.TRIANGLES, mesh.length);
  mesh.unbind();

  camera.tick()
}
