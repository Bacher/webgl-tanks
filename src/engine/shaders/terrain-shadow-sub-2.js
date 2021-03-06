export const v = `
uniform mat4 umCamera;
uniform mat4 umModel;
uniform sampler2D uDepthSampler;
uniform mat4 umLight;

attribute vec3 aPos;

varying vec2 vUV;
varying vec4 vLight;

void main(void) {
    vLight = umLight * umModel * vec4(aPos, 1.0) * 0.5 + 0.5;
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
uniform sampler2D uDepthMapSampler;
uniform vec2 repeat;

varying vec2 vUV;
varying vec4 vLight;

void main(void) {
    float power = 1.0;

    float depthZ = texture2D(uDepthMapSampler, vLight.xy).r;
    
    if (depthZ < vLight.z) {
        power = 0.9;

        float depthZl = texture2D(uDepthMapSampler, vec2(vLight.x - 0.000488281, vLight.y)).r;
        float depthZr = texture2D(uDepthMapSampler, vec2(vLight.x + 0.000488281, vLight.y)).r;
        float depthZu = texture2D(uDepthMapSampler, vec2(vLight.x, vLight.y - 0.000488281)).r;
        float depthZd = texture2D(uDepthMapSampler, vec2(vLight.x, vLight.y + 0.000488281)).r;

        float shade = 0.0;

        if (depthZl < vLight.z) { shade += 1.0; power -= 0.06 * shade; }
        if (depthZr < vLight.z) { shade += 1.0; power -= 0.06 * shade; }
        if (depthZu < vLight.z) { shade += 1.0; power -= 0.06 * shade; }
        if (depthZd < vLight.z) { shade += 1.0; power -= 0.06 * shade; }
    }

    vec2 uv = vec2(vUV[0] * repeat[0], vUV[1] * repeat[1]);
    vec4 color1 = texture2D(uSampler1, uv);
    vec4 color2 = texture2D(uSampler2, uv);

    float mix = texture2D(uDepthSampler, vUV).g;

    vec4 color = color1 * (1.0 - mix) + color2 * mix;

    gl_FragColor = vec4(color.rgb * power, color.a);
}
`;
