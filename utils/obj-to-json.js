#!/usr/bin/env node

const fs = require('fs');

const pointsList = [];
const points = new Map();

let hasUV      = false;
let hasNormals = false;

function parseObj(objText) {
    const lines = objText.split(/\s*\n\s*/);

    const vertices = [];
    const uvs      = [];
    const normals  = [];
    const polygons = [];

    const groups = [];
    let currentGroup = null;

    const boundBox = {
        min: [Infinity, Infinity, Infinity],
        max: [-Infinity, -Infinity, -Infinity],
    };

    for (let rawLine of lines) {
        const line = rawLine.replace(/#.*$/, '').trim();

        if (!line) {
            continue;
        }

        const [, command, rest] = line.match(/^(\w+) (.*)$/);

        if (command === 'g') {
            currentGroup = createEmptyGroup(rest);
            groups.push(currentGroup);
            currentGroup.offset = polygons.length;
            continue;
        }

        if (!currentGroup && ['usemtl', 'f'].includes(command)) {
            currentGroup = createEmptyGroup();
            groups.push(currentGroup);
        }

        switch (command) {
            case 'usemtl':
                currentGroup.material = rest.trim().toLowerCase().replace(/[^\w\d]/g, '_');
                break;
            case 'v':
                const [x, y, z] = rest.split(' ').map(Number);

                if (boundBox.min[0] > x) boundBox.min[0] = x;
                if (boundBox.min[1] > y) boundBox.min[1] = y;
                if (boundBox.min[2] > z) boundBox.min[2] = z;

                if (boundBox.max[0] < x) boundBox.max[0] = x;
                if (boundBox.max[1] < y) boundBox.max[1] = y;
                if (boundBox.max[2] < z) boundBox.max[2] = z;

                vertices.push(x, y, z);
                break;
            case 'vt':
                const [u, v] = rest.split(' ').map(Number);
                uvs.push(u, v);
                break;
            case 'vn':
                normals.push(...rest.split(' ').map(Number));
                break;
            case 'f':
                const points = rest.split(' ');

                if (points.length < 3) {
                    break;
                }

                const pPoints = points.map(point => {
                    const parts = point.split('/');

                    const pointInfo = [Number(parts[0]) - 1];

                    if (parts.length >= 2) {
                        pointInfo.push(Number(parts[1]) - 1);
                    }

                    if (parts.length >= 3) {
                        pointInfo.push(Number(parts[2]) - 1);
                    }

                    return pointInfo;
                });

                for (let i = 0; i < pPoints.length - 2; i++) {
                    polygons.push([pPoints[0], pPoints[i + 1], pPoints[i + 2]]);
                    currentGroup.size++;
                }
                break;
        }
    }

    hasUV      = uvs.length > 0;
    hasNormals = normals.length > 0;

    const newPolygons = [];

    for (let polygon of polygons) {
        for (let point of polygon) {
            const [vertex, uv, normal] = point;

            const x = form(vertices[vertex * 3]);
            const y = form(vertices[vertex * 3 + 1]);
            const z = form(vertices[vertex * 3 + 2]);

            let pointKey = `${x},${y},${z}`;

            let u, v, nx, ny, nz;

            if (hasUV) {
                u = form(uvs[uv * 2]);
                v = form(uvs[uv * 2 + 1]);

                pointKey += `_${u},${v}`;
            }

            if (hasNormals) {
                nx = form(normals[normal * 3]);
                ny = form(normals[normal * 3 + 1]);
                nz = form(normals[normal * 3 + 2]);

                pointKey += `_${nx},${ny},${nz}`;
            }

            let vertexNumber;

            let vertexInfo = points.get(pointKey);

            if (vertexInfo) {
                vertexNumber = vertexInfo.n;

            } else {
                vertexNumber = pointsList.length;

                const newVertexInfo = {
                    n:   vertexNumber,
                    pos: [x, y, z],
                };

                if (hasUV) {
                    newVertexInfo.uv = [u, v];
                }

                if (hasNormals) {
                    newVertexInfo.nor = [nx, ny, nz];
                }

                pointsList.push(newVertexInfo);
                points.set(pointKey, newVertexInfo);
            }

            newPolygons.push(vertexNumber);
        }
    }

    const size = [
        boundBox.max[0] - boundBox.min[0],
        boundBox.max[1] - boundBox.min[1],
        boundBox.max[2] - boundBox.min[2],
    ];

    const rx = size[0] / 2;
    const ry = size[1] / 2;
    const rz = size[2] / 2;

    const boundSphere = {
        center: [
            boundBox.min[0] + size[0] / 2,
            boundBox.min[1] + size[1] / 2,
            boundBox.min[2] + size[2] / 2,
        ],
        radius: Math.sqrt(rx * rx + ry * ry + rz * rz),
    };

    return generateJSON({
        polygons: newPolygons,
        pointsList,
        groups,
        boundBox,
        boundSphere,
    });
}

function createEmptyGroup(id) {
    return {
        id:       id || 'default',
        material: null,
        offset:   0,
        size:     0,
    };
}

function form(value) {
    const intLength = Math.abs(Math.floor(value)).toString().length;

    return value.toFixed(7 - intLength).replace(/\.?0+$/, '');
}

function generateJSON({ polygons, pointsList, groups, boundBox, boundSphere }) {
    const pos = [];
    const uv  = [];
    const nor = [];

    const outputObj = {
        groups,
        boundBox,
        boundSphere,
        vertices: '%VERTICES%',
        polygons: '%POLYGONS%',
    };

    for (let point of pointsList) {
        pos.push(point.pos.join(','));

        if (hasUV) {
            uv.push(point.uv.join(','));

            outputObj.uvs = '%UVS%';
        }

        if (hasNormals) {
            nor.push(point.nor.join(','));

            outputObj.normals = '%NORMALS%';
        }
    }

    let json = JSON.stringify(outputObj, null, 2);

    json = json.replace('"%VERTICES%"', '[' + pos.join(',') + ']');

    if (hasUV) {
        json = json.replace('"%UVS%"', '[' + uv.join(',') + ']');
    }

    if (hasNormals) {
        json = json.replace('"%NORMALS%"', '[' + nor.join(',') + ']');
    }

    json = json.replace('"%POLYGONS%"', '[' + polygons.join(',') + ']');

    console.error('Success convert');
    console.error(`  Vertices: ${pos.length}`);
    console.error(`  Polygons: ${polygons.length / 3}`);

    return json;
}

const data = fs.readFileSync(process.argv[process.argv.length - 1], 'utf-8');

const json = parseObj(data);

const rounded = json.replace(/\d\.\d{7,}/g, match => Number(match).toFixed(6));

process.stdout.write(rounded);
