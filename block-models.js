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
  var ret =
            cp[a] .concat(cp[b]).concat(cp[c])
    .concat(cp[a]).concat(cp[c]).concat(cp[d]);

  return ret;
}

// get plane triangle vertices for given normal vector
var planeVertices = function(cp,normal) {
  var planes = {
    '0,0,-1': trianglesQuad(cp,1,0,4,5),
    '0,0,1':  trianglesQuad(cp,3,7,6,2),
    '0,-1,0': trianglesQuad(cp,1,3,2,0),
    '0,1,0':  trianglesQuad(cp,5,4,6,7),
    '-1,0,0': trianglesQuad(cp,1,5,7,3),
    '1,0,0':  trianglesQuad(cp,2,6,4,0),
  };

  return planes[normal.join(',')];
};

// cardinal compass direction to normal vector
var compassDirection2Normal = function(dir) {
  return {
    // TODO: triple-check this - empirically verified, but makes
    // little sense to me. We really ought to make this consistent everywhere.
    north: [-1,0,0],
    south: [1,0,0],

    west: [0,1,0],
    east: [0,-1,0],

    up: [0,0,1],
    down: [0,0,-1]
  }[dir];
};

// "pixelspace" is 16 units per voxel (note: can be fractional)
var fromPixelspace = function(v) {
  return v / 16;
};

// convert one JSON element to its vertices
var element2vertices = function(element, getTextureUV) {
  var from = element.from.map(fromPixelspace);
  var to = element.to.map(fromPixelspace);

  var positions = cubePositions(from, to);
  var vertices = [];
  var uvArray = [];

  // add cells for each cube face (plane) in this element
  for (var direction in element.faceData) {
    // position
    var faceInfo = element.faceData[direction];

    var normal = compassDirection2Normal(direction);
    if (!normal) throw new Error('invalid compass direction: '+direction);

    var theseVertices = planeVertices(positions, normal);
    if (!theseVertices) throw new Error('invalid normal: '+normal);

    vertices = vertices.concat(theseVertices);

    // TODO
    // texturing (textures loaded from voxel-stitch updateTexture event)
    var tileUV = getTextureUV ? getTextureUV(element.texture) : [ [0,0], [0,1], [1,1], [1,0] ]; // TODO
    if (!tileUV) throw new Error('failed to lookup UV texture: ' + element.texture + ' for ' + element);

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

  return {vertices:vertices, uv:uvArray};
};

// convert an array of multiple cuboid elements
var elements2vertices = function(elements, getTextureUV) {
  var result = {vertices:[], uv:[]};

  for (var i = 0; i < elements.length; i += 1) {
    var element = elements[i];
    var thisResult = element2vertices(element, getTextureUV);

    result.vertices = result.vertices.concat(thisResult.vertices);
    result.uv = result.uv.concat(thisResult.uv);
  }

  console.log('vertex count:',result.vertices.length);

  return result;
};

var parseBlockModel = function(elements, getTextureUV) {
  return elements2vertices(elements, getTextureUV);
};


module.exports = parseBlockModel;

