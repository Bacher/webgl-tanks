#!/usr/bin/env node

const fs = require('fs');

function parseObj(objText) {
    const lines = objText.split(/\s*\n\s*/);

    const vertices   = [];
    const uvs        = [];
    const preNormals = [];
    const polygons   = [];

    const groups = [];
    let currentGroup = null;

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

        if (!currentGroup && ['usemtl', 'v', 'vt', 'f'].includes(command)) {
            currentGroup = createEmptyGroup();
            groups.push(currentGroup);
        }

        switch (command) {
            case 'usemtl':
                currentGroup.material = rest.trim().toLowerCase().replace(/[^\w\d]/g, '_');
                break;
            case 'v':
                vertices.push(...rest.split(' ').map(Number));
                break;
            case 'vt':
                const [u, v] = rest.split(' ').map(Number);
                uvs.push(u, v);
                break;
            case 'vn':
                preNormals.push(...rest.split(' ').map(Number));
                break;
            case 'f':
                currentGroup.size++;
                polygons.push(rest.split(' ').map(point => {
                    const parts = point.split('/');

                    const pointInfo = [Number(parts[0]) - 1];

                    if (parts.length === 3) {
                        pointInfo.push(
                            Number(parts[1]) - 1,
                            Number(parts[2]) - 1
                        );
                    } else if (parts.length === 2) {
                        pointInfo.push(
                            Number(parts[1]) - 1
                        );
                    }

                    return pointInfo;
                }));
                break;
        }
    }

    const normals = new Array(vertices.length);

    const newPolygons = [];

    for (let polygon of polygons) {
        for (let point of polygon) {
            const vertex = point[0];
            const normal = point[2];

            normals[vertex * 3]     = preNormals[normal * 3];
            normals[vertex * 3 + 1] = preNormals[normal * 3 + 1];
            normals[vertex * 3 + 2] = preNormals[normal * 3 + 2];

            newPolygons.push(vertex);
        }
    }

    return {
        vertices,
        uvs,
        normals,
        polygons: newPolygons,
        groups,
    };
}

function createEmptyGroup(id) {
    return {
        id:       id || 'default',
        material: null,
        offset:   0,
        size:     0,
    };
}

const data = fs.readFileSync(process.argv[process.argv.length - 1], 'utf-8');

const model = parseObj(data);

process.stdout.write(JSON.stringify(model));
