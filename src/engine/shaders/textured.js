export const v = `
uniform mat4 umCamera;
uniform mat4 umModel;

attribute vec3 aPos;
attribute vec3 aNormal;
attribute vec2 aUV;

varying vec2 vUV;

void main(void) {
    vUV = aUV;
    gl_Position = umCamera * umModel * vec4(aPos, 1.0);
}
`;

export const f = `
precision mediump float;

uniform sampler2D uSampler;

varying vec2 vUV;

void main(void) {
    //gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    gl_FragColor = texture2D(uSampler, vUV);
}
`;
