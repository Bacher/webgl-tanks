export const v = `
uniform mat4 umCamera;
uniform mat4 umModel;
uniform mat4 umLight;
uniform sampler2D uDepthSampler;
uniform sampler2D uDepthMapSampler;

attribute vec3 aPos;

varying vec2 vUV;
varying float power;

void main(void) {
    vec4 vLight = umLight * umModel * vec4(aPos, 1.0) * 0.5 + 0.5;
    
    float depthZ = texture2D(uDepthMapSampler, vLight.xy).r;
    
    if (depthZ < vLight.z) {
        power = 0.3;
    } else {
        power = 1.0;
    }

    vUV = vec2((1.0 + aPos[0]) * 0.5, (1.0 + aPos[2]) * 0.5);
    //gl_Position = umCamera * umModel * vec4(aPos[0], (texture2D(uDepthSampler, vUV).r - 0.5) * 50.0, aPos[2], 1.0);
    gl_Position = umCamera * umModel * vec4(aPos, 1.0);
}
`;

export const f = `
precision mediump float;

uniform sampler2D uDepthSampler;
uniform sampler2D uSampler1;
uniform sampler2D uSampler2;
uniform vec2 repeat;

varying vec2 vUV;
varying float power;

void main(void) {
    vec2 uv = vec2(vUV[0] * repeat[0], vUV[1] * repeat[1]);
    vec4 color1 = texture2D(uSampler1, uv);
    vec4 color2 = texture2D(uSampler2, uv);

    float mix = texture2D(uDepthSampler, vUV).g;

    vec4 color = color1 * (1.0 - mix) + color2 * mix;

    gl_FragColor = vec4(color.rgb * power, color.a);
}
`;
