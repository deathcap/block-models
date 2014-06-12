'use strict';

var createGeometry = require('gl-geometry');

// get all coordinates for a cube ranging from vertex a to b
//   ____
//  /   /|
// a---+ |
// |   | b
// +---+/
var cubePositions = function(a, b) {
  return [
    [a[0]       , a[1]       , a[2]       ], // 0
    [a[0]       , a[1]       , a[2] + b[2]], // 1
    [a[0]       , a[1] + b[1], a[2]       ], // 2
    [a[0]       , a[1] + b[1], a[2] + b[2]], // 3
    [a[0] + b[0], a[1]       , a[2]       ], // 4
    [a[0] + b[0], a[1]       , a[2] + b[2]], // 5
    [a[0] + b[0], a[1] + b[1], a[2]       ], // 6
    [a[0] + b[0], a[1] + b[1], a[2] + b[2]], // 7
  ];
};

// get cells for two triangles covering a quad
// a---d
// | \ |
// b---c
// cp = cubePositions
var trianglesQuad = function(cp,a,b,c,d) {
  return [
    [cp[a],cp[b],cp[c]],
    [cp[a],cp[c],cp[d]]];
}

// get plane triangle vertices for given normal vector
var planeVertices = function(cp,normal) {
  return {
    '0,0,-1': trianglesQuad(cp,1,0,4,5),
    '0,0,1':  trianglesQuad(cp,3,7,6,2),
    '0,-1,0': trianglesQuad(cp,1,3,2,0),
    '0,1,0':  trianglesQuad(cp,5,4,6,7),
    '-1,0,0': trianglesQuad(cp,1,5,7,3),
    '1,0,0':  trianglesQuad(cp,2,6,4,0),
  }[normal.join(',')];
};

// cardinal compass direction to normal vector
var compassDirection2Normal = function(dir) {
  return {
    north: [1,0,0],
    south: [-1,0,0],
    up: [0,1,0],
    down: [0,-1,0],
    east: [0,0,1],
    west: [0,0,-1]
  }[dir];
};

// "pixelspace" is 16 units per voxel (note: can be fractional)
var fromPixelspace = function(v) {
  return v / 16;
};

// convert one JSON element to its vertices
var element2vertices = function(element) {
  var from = element.from.map(fromPixelspace);
  var to = element.to.map(fromPixelspace);

  var positions = cubePositions(from, to);
  var vertices = [];

  // add cells for each cube face (plane) in this element
  for (var direction in element.faceData) {
    var faceInfo = element.faceData[direction];

    var normal = compassDirection2Normal(direction);
    if (!normal) throw new Error('invalid compass direction: '+direction);

    var theseVertices = planeVertices(positions, normal);
    if (!theseVertices) throw new Error('invalid normal: '+normal);

    vertices = vertices.concat(theseVertices);
  }
  // TODO: uv

  return vertices;
};

// convert an array of multiple cuboid elements
var elements2vertices = function(elements) {
  var vertices = [];

  for (var i = 0; i < elements.length; i += 1) {
    var element = elements[i];
    var theseVertices = element2vertices(element);

    vertices = vertices.concat(theseVertices);
  }

  return vertices;
};

var createBlockGeometry = function(gl, elements) {
  var vertices = elements2vertices(elements);

  console.log(vertices);
  console.log(JSON.stringify(vertices));

  // gl-geometry accepts an array-of-arrays, e.g. [[0, 0, 0], [1, 0, 0], [1, 1, 0]]
  // but not an array-of-array-of-arrays
  var flat = [];
  for (var i = 0; i < vertices.length; i += 1) {
    var triangle = vertices[i];
    flat = flat.concat(triangle);
  }

  var geometry = createGeometry(gl)
    .attr('position', flat)

  return geometry;
};

module.exports = createBlockGeometry;

