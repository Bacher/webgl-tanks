
export const v = `
uniform mat4 umCamera;
uniform mat4 umModel;

attribute vec3 aPos;

void main(void) {
    gl_Position = umCamera * umModel * vec4(aPos, 1.0);
}
`;

export const f = `
precision mediump float;

void main(void) {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;
