# block-models

Generate custom (non-cube) block models

![screenshot](http://i.imgur.com/245cXLp.png "Screenshot model")

For an example, run `npm start` or try the **[live demo](http://deathcap.github.io/block-models)**.

Usable with [voxel-mesher](https://github.com/deathcap/voxel-mesher) and [voxel-shader](https://github.com/deathcap/voxel-shader)
to show the custom model in a [voxel.js](http://voxeljs.com/) world:

![screenshot](http://i.imgur.com/VKJ3L2x.png "Screenshot in-game")

## Usage

    var parseBlockModel = require('block-models');

    var model = parseBlockModel(modelDefn[, getTextureUV[, x, y, z]])

Returns an object with `vertices` and `uv` properties set to arrays
suitable for passing to WebGL. Parameters:

* `modelDefn`: model definition (see format below)

* `getTextureUV`: optional callback to lookup UV coordinates for textures in an atlas (defaults to 0.0-1.0)

* `x, y, z`: optional vertex offset

## Model definition

Blocks are composed of textured planes, faces from an array of one or more cubes. Slab example:

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

* `from`, `to`: coordinates defining the cube
* `faceData`: object with properties for each face to show (`down`, `up`, `north`, `south`, `west`, `east`)
 * face names can be omitted to not display the corresponding plane
* `texture`: texture name for `getTextureUV` UV coordinate mapping

Note: this format is similar to [Minecraft 1.8's block model system](https://pay.reddit.com/r/Minecraft/comments/22vu5w/upcoming_changes_to_the_block_model_system/),
but not completely compatible or as powerful.

You can experiment changing the model definition and viewing the results in realtime using the
[demo](http://deathcap.github.io/block-models).

## License

MIT

