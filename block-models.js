'use strict';

var createGeometry = require('gl-geometry');
var normals = require('normals');

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
    [a[0]       , a[1] + b[1], b[2]       ], // 2
    [a[0]       , a[1] + b[1], b[2] + b[2]], // 3
    [a[0] + b[1], a[1]       , a[2]       ], // 4
    [a[0] + b[1], a[1]       , a[2] + b[2]], // 5
    [a[0] + b[1], a[1] + b[1], b[2]       ], // 6
    [a[0] + b[1], a[1] + b[1], b[2] + b[2]], // 7
  ];
};

// get cells for two triangles covering a quad
// a---d
// | \ |
// b---c
var trianglesQuad = function(a,b,c,d) {
  return [[a,b,c], [a,c,d]];
}

// get plane cells for given normal vector
var planeCells = function(normal) {
  return {
    '0,0,-1': trianglesQuad(1,0,4,5),
    '0,0,1':  trianglesQuad(3,7,6,2),
    '0,-1,0': trianglesQuad(1,3,2,0),
    '0,1,0':  trianglesQuad(5,4,6,7),
    '-1,0,0': trianglesQuad(1,5,7,3),
    '1,0,0':  trianglesQuad(2,6,4,0),
  }[normal.join(',')];
};

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

// convert one JSON element to simplical complex positions and cells
var element2sc = function(element) {
  var from = element.from;
  var to = element.to;

  var positions = cubePositions(from, to);
  var cells = [];

  // add cells for each cube face (plane) in this element
  for (var direction in element.faceData) {
    var faceInfo = element.faceData[direction];

    var normal = compassDirection2Normal(direction);
    if (!normal) throw new Error('invalid compass direction: '+direction);

    var theseCells = planeCells(normal);
    if (!theseCells) throw new Error('invalid normal: '+normal);

    cells = cells.concat(theseCells);
  }

  return {positions: positions, cells: cells};
};

// convert an array of multiple cuboid elements
var elements2sc = function(elements) {
  var sc = {positions: [], cells: []};

  for (var i = 0; i < elements.length; i += 1) {
    var element = elements[i];
    var thisSC = element2sc(element);

    sc.positions = sc.positions.concat(thisSC.positions);
    sc.cells = sc.cells.concat(thisSC.cells);
  }

  return sc;
};

var createBlockGeometry = function(gl, elements) {
  var scPos = elements2sc(elements);
  var scNor = normals.vertexNormals(scPos.cells, scPos.positions);

  var geometry = createGeometry(gl)
    .attr('position', scPos)
    .attr('normal', scNor);

  return geometry;
};

module.exports = createBlockGeometry;

