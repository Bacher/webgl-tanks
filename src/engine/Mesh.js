
export default class Mesh {

    constructor(engine, meshInfo) {
        this.e = engine;

        const gl = this.e.gl;

        this.groups      = meshInfo.groups;
        this._groupsHash = {};

        for (let group of this.groups) {
            this._groupsHash[group.id] = group;
        }

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
    }

    applyBuffers(shader) {
        const gl = this.e.gl;

        shader.setAttribute('aPos', this._pos);
        shader.setAttribute('aUV', this._uvs);
        //shader.setAttribute('aNormal', this._nor);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._ele);
    }

    draw(groupName = 'default') {
        const gl = this.e.gl;

        const group = this._groupsHash[groupName];

        if (!group) {
            throw new Error(`Group [${groupName}] not found`);
        }

        gl.drawElements(gl.TRIANGLES, group.size * 3, gl.UNSIGNED_SHORT, group.offset * 6);
    }

}
