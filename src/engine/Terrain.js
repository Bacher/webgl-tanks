import { mat4 } from 'gl-matrix';
import TerrainMesh from './TerrainMesh';

export default class Model {

    constructor(engine, options) {
        this.e = engine;

        //this.shader = 'terrain';
        this.shader = 'terrainShadow';

        this.scale = [
            options.size[0],
            1,
            options.size[1],
        ];

        this._mPos = mat4.create();

        this._mesh = new TerrainMesh(engine, options.meshInfo, options.repeat || [1, 1]);

        this._textures = options.textures;
        this._depthmap = options.depthmap;
    }

    draw(shader) {
        const s = this.scale;
        const m = this._mPos;

        mat4.identity(m);
        mat4.scale(m, m, s);
        shader.setUniform('umModel', m);
        shader.setUniform('umLight', window.mLightProjection);

        this._depthmap.activate(shader, 'uDepthSampler', 0);

        for (let i = 0; i < this._textures.length; i++) {
            this._textures[i].activate(shader, `uSampler${i + 1}`, i + 1);
        }

        this.e._depthTextureWrapper.activate(shader, 'uDepthMapSampler', this._textures.length + 1);

        this._mesh.applyBuffers(shader);
        this._mesh.draw();
    }

}
