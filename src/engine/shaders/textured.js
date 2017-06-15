export const v = `
uniform mat4 umCamera;
uniform mat4 umModel;

attribute vec3 aPos;
attribute vec2 aUV;
attribute vec3 aNormal;

varying vec2 vUV;
varying vec3 vNormal;

void main(void) {
    vUV = aUV;
    vNormal = aNormal;
    gl_Position = umCamera * umModel * vec4(aPos, 1.0);
}
`;

export const f = `
precision mediump float;

uniform vec3 uLightDir;
uniform sampler2D uSampler;

varying vec2 vUV;
varying vec3 vNormal;

void main(void) {
    //gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    
    vec4 color = texture2D(uSampler, vUV);
    float power = 0.3 + 0.7 * dot(uLightDir, vNormal);
    gl_FragColor = vec4(color.rgb * power, color.a);
}
`;
