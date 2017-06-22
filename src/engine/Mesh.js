import { vec3 } from 'gl-matrix';
import MeshPart from './MeshPart';

export default class Mesh {

    constructor(engine, meshInfo) {
        if (engine === -1) return;

        this.e = engine;

        const gl = this.e.gl;

        this.boundBox    = meshInfo.boundBox;
        this.boundSphere = meshInfo.boundSphere;

        const { min, max } = meshInfo.boundBox;

        this.boundBoxPoints = [
            vec3.fromValues(...min),
            vec3.fromValues(min[0], min[1], max[2]),
            vec3.fromValues(max[0], min[1], max[2]),
            vec3.fromValues(max[0], min[1], min[2]),
            vec3.fromValues(min[0], max[1], min[2]),
            vec3.fromValues(min[0], max[1], max[2]),
            vec3.fromValues(...max),
            vec3.fromValues(max[0], max[1], min[2]),
        ];

        this._pos = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._pos);
        gl.bufferData(gl.ARRAY_BUFFER, meshInfo.vertices, gl.STATIC_DRAW);

        this._uvs = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._uvs);
        gl.bufferData(gl.ARRAY_BUFFER, meshInfo.uvs, gl.STATIC_DRAW);

        this._nor = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._nor);
        gl.bufferData(gl.ARRAY_BUFFER, meshInfo.normals, gl.STATIC_DRAW);

        this._ele = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._ele);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, meshInfo.polygons, gl.STATIC_DRAW);

        this.parts = [];
        this._hasRelations = false;

        for (let group of meshInfo.groups) {
            this.parts.push(new MeshPart(engine, this, group));

            if (group.relation) {
                this._hasRelations = true;
            }
        }

        this._fillPartsHash();
    }

    clone() {
        if (!this._hasRelations) {
            return this;
        }

        const newMesh = new Mesh(-1);

        newMesh.e = this.e;
        newMesh._pos = this._pos;
        newMesh._uvs = this._uvs;
        newMesh._nor = this._nor;
        newMesh._ele = this._ele;

        newMesh.boundBox = this.boundBox;
        newMesh.boundSphere = this.boundSphere;
        newMesh.boundBoxPoints = this.boundBoxPoints;

        newMesh.parts = this.parts.map(part => part.clone());

        newMesh._fillPartsHash();

        return newMesh;
    }

    _fillPartsHash() {
        this._partsHash = {};

        for (let part of this.parts) {
            this._partsHash[part.id] = part;
        }
    }

    getPart(name) {
        return this._partsHash[name];
    }

    applyBuffers(shader, isDepthMap) {
        const gl = this.e.gl;

        shader.setAttribute('aPos', this._pos);

        if (!isDepthMap) {
            shader.setAttribute('aUV', this._uvs);
            shader.setAttribute('aNormal', this._nor);
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._ele);
    }

}
