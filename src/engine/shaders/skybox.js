export const v = `
uniform mat4 umCamera;

attribute vec3 aPos;
attribute vec2 aUV;

varying vec2 vUV;

void main(void) {
    vUV = aUV;
    gl_Position = umCamera * vec4(aPos, 1.0);
}
`;

export const f = `
precision mediump float;

uniform sampler2D uSampler;

varying vec2 vUV;

void main(void) {
    gl_FragColor = texture2D(uSampler, vUV);
}
`;
