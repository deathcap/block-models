'use strict';

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
    '0,0,-1': trianglesQuad(5,4,0,1),
    '0,0,1':  trianglesQuad(2,6,7,3),
    '0,-1,0': trianglesQuad(1,3,2,0),
    '0,1,0':  trianglesQuad(5,4,6,7),
    '-1,0,0': trianglesQuad(1,5,7,3),
    '1,0,0':  trianglesQuad(0,4,6,2),
  }[normal.join(',')];
};

module.exports = function() {
  var from = [0,0,0];
  var to = [16,16,16];

  var positions = cubePositions(from, to);

  //var cells = trianglesQuadCells(1,5,7,3).concat(trianglesQuadCells(0,4,6,2));
  //var cells = planeCells([-1,0,0]).concat(planeCells([1,0,0]));
  var cells = planeCells([0,1,0]).concat(planeCells([0,-1,0]));

  return {positions: positions, cells: cells};
};
