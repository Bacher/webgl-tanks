export const v = `
uniform mat4 umCamera;
uniform mat4 umModel;
uniform vec3 uLightDir;

attribute vec3 aPos;
attribute vec2 aUV;
attribute vec3 aNormal;

varying vec2 vUV;
varying float power;

void main(void) {
    vUV = aUV;
    power = 0.5 + 0.5 * dot(uLightDir, aNormal);
    gl_Position = umCamera * umModel * vec4(aPos, 1.0);
}
`;

export const f = `
precision mediump float;

uniform sampler2D uSampler;

varying vec2 vUV;
varying float power;

void main(void) {
    vec4 color = texture2D(uSampler, vUV);

    gl_FragColor = vec4(color.rgb * power, color.a);
}
`;
