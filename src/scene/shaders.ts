// GLSL sources. All custom materials include the logarithmic depth chunks because the
// renderer uses a log depth buffer (scene spans metres-scale close-ups to thousands of units).

const noise3D = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm(vec3 p){float f=0.,a=.5;for(int i=0;i<5;i++){f+=a*snoise(p);p*=2.03;a*=.5;}return f;}
`;

const raySphere = /* glsl */ `
vec2 raySphere(vec3 ro, vec3 rd, vec3 c, float r){
  vec3 oc = ro - c; float b = dot(oc, rd); float h = b*b - dot(oc, oc) + r*r;
  if (h < 0.0) return vec2(-1.0);
  h = sqrt(h); return vec2(-b - h, -b + h);
}
`;

/** Generic vertex shader: world position/normal + uv. */
export const worldVertex = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
varying vec2 vUv;
varying vec3 vWorld;
varying vec3 vNormalW;
varying vec3 vObj;
void main(){
  vUv = uv;
  vObj = position;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
  #include <logdepthbuf_vertex>
}
`;

export const sunFragment = /* glsl */ `
#include <logdepthbuf_pars_fragment>
uniform sampler2D uMap;
uniform float uTime;
varying vec2 vUv;
varying vec3 vWorld;
varying vec3 vNormalW;
varying vec3 vObj;
${noise3D}
void main(){
  #include <logdepthbuf_fragment>
  vec3 p = normalize(vObj);
  // Granulation (small convective cells) + supergranulation, slowly evolving.
  float gran = snoise(p * 60.0 + vec3(uTime * 0.05)) * 0.5 + snoise(p * 140.0 - vec3(uTime * 0.08)) * 0.25;
  float large = fbm(p * 4.0 + vec3(0.0, uTime * 0.01, 0.0));
  vec3 tex = texture2D(uMap, vUv).rgb;
  float lum = dot(tex, vec3(0.3, 0.5, 0.2));
  float heat = clamp(lum * 1.4 + gran * 0.18 + large * 0.25, 0.0, 1.5);
  vec3 col = mix(vec3(1.0, 0.32, 0.04), vec3(1.0, 0.78, 0.42), smoothstep(0.15, 0.85, heat));
  col = mix(col, vec3(1.0, 0.95, 0.85), smoothstep(0.9, 1.3, heat));
  // Limb darkening (Eddington approximation).
  float mu = clamp(dot(normalize(vNormalW), normalize(cameraPosition - vWorld)), 0.0, 1.0);
  float limb = 0.4 + 0.6 * mu;
  gl_FragColor = vec4(col * limb * 2.1, 1.0);
}
`;

export const coronaVertex = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
varying vec2 vUv;
void main(){
  vUv = uv * 2.0 - 1.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  #include <logdepthbuf_vertex>
}
`;

export const coronaFragment = /* glsl */ `
#include <logdepthbuf_pars_fragment>
uniform float uTime;
uniform float uScale; // plane half-size in sun radii
varying vec2 vUv;
${noise3D}
void main(){
  #include <logdepthbuf_fragment>
  float r = length(vUv) * uScale;
  if (r < 0.98) discard;
  float a = atan(vUv.y, vUv.x);
  vec3 q = vec3(cos(a) * 1.6, sin(a) * 1.6, uTime * 0.03);
  float streak = fbm(q + vec3(0.0, 0.0, r * 0.15)) * 0.5 + 0.5;
  float glow = exp(-(r - 1.0) * 3.2) * 1.1 + exp(-(r - 1.0) * 0.9) * 0.12 * (0.3 + streak);
  glow *= smoothstep(uScale, uScale * 0.6, r);
  vec3 col = mix(vec3(1.0, 0.55, 0.2), vec3(1.0, 0.85, 0.65), exp(-(r - 1.0) * 1.5));
  gl_FragColor = vec4(col * glow, 1.0);
}
`;

export const atmosphereVertex = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
varying vec3 vWorld;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
  #include <logdepthbuf_vertex>
}
`;

/** Single-scattering atmosphere, integrated along the view ray. */
export const atmosphereFragment = /* glsl */ `
#include <logdepthbuf_pars_fragment>
uniform vec3 uCenter;
uniform vec3 uSunPos;
uniform float uRp;
uniform float uRa;
uniform vec3 uColor;
uniform vec3 uSunset;
uniform float uIntensity;
uniform float uFalloff;
uniform float uMie;
varying vec3 vWorld;
${raySphere}
void main(){
  #include <logdepthbuf_fragment>
  vec3 ro = cameraPosition;
  vec3 rd = normalize(vWorld - ro);
  vec2 ta = raySphere(ro, rd, uCenter, uRa);
  if (ta.y < 0.0) discard;
  float t0 = max(ta.x, 0.0);
  float t1 = ta.y;
  vec2 tp = raySphere(ro, rd, uCenter, uRp);
  if (tp.x > 0.0) t1 = min(t1, tp.x);
  float H = uRa - uRp;
  vec3 L = normalize(uSunPos - uCenter);
  const int N = 12;
  float seg = (t1 - t0) / float(N);
  vec3 sum = vec3(0.0);
  float od = 0.0;
  for (int i = 0; i < N; i++) {
    vec3 p = ro + rd * (t0 + seg * (float(i) + 0.5));
    vec3 n = p - uCenter;
    float r = length(n);
    n /= r;
    float h = clamp((r - uRp) / H, 0.0, 1.0);
    float dens = exp(-h * uFalloff) * (1.0 - h);
    float mu = dot(n, L);
    float lit = smoothstep(-0.2, 0.25, mu);
    vec3 c = mix(uSunset, uColor, smoothstep(0.0, 0.4, mu));
    float d = dens * seg / H;
    od += d;
    sum += c * d * lit * exp(-od * 0.35);
  }
  float cosT = dot(rd, L);
  float phaseR = 0.75 * (1.0 + cosT * cosT);
  const float g = 0.76;
  float phaseM = (1.0 - g * g) / (12.566 * pow(1.0 + g * g - 2.0 * g * cosT, 1.5));
  vec3 col = sum * (phaseR + uMie * phaseM) * uIntensity;
  gl_FragColor = vec4(col, 1.0);
}
`;

export const earthFragment = /* glsl */ `
#include <logdepthbuf_pars_fragment>
uniform sampler2D uDay;
uniform sampler2D uNight;
uniform sampler2D uSpec;
uniform sampler2D uClouds;
uniform vec3 uSunPos;
uniform float uCloudShift;
uniform float uAmbient;
varying vec2 vUv;
varying vec3 vWorld;
varying vec3 vNormalW;
void main(){
  #include <logdepthbuf_fragment>
  vec3 n = normalize(vNormalW);
  vec3 L = normalize(uSunPos - vWorld);
  vec3 V = normalize(cameraPosition - vWorld);
  float NdL = dot(n, L);
  vec3 day = texture2D(uDay, vUv).rgb;
  vec3 night = texture2D(uNight, vUv).rgb;
  float ocean = texture2D(uSpec, vUv).r;
  float cloud = texture2D(uClouds, vec2(vUv.x - uCloudShift, vUv.y)).r;
  float diff = max(NdL, 0.0);
  float shadow = 1.0 - cloud * 0.55;
  vec3 col = day * (diff * shadow + uAmbient);
  // Sun glint on water, strongest at grazing angles (Fresnel).
  vec3 H = normalize(L + V);
  float fres = 0.02 + 0.98 * pow(1.0 - max(dot(n, V), 0.0), 5.0);
  float nh = max(dot(n, H), 0.0);
  float glint = pow(nh, 600.0) * 2.5 + pow(nh, 60.0) * 0.12;
  col += vec3(1.0, 0.93, 0.8) * glint * ocean * diff * (1.0 - cloud);
  col += vec3(0.08, 0.16, 0.3) * fres * ocean * diff * 0.6;
  // City lights fade in through the terminator; clouds dim them.
  float nightMix = 1.0 - smoothstep(-0.12, 0.08, NdL);
  col += night * vec3(1.0, 0.82, 0.55) * 1.8 * nightMix * (1.0 - cloud * 0.75);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;

export const ringVertex = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
varying vec3 vWorld;
varying float vR;
uniform float uInner;
uniform float uOuter;
void main(){
  vR = (length(position.xy) - uInner) / (uOuter - uInner);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
  #include <logdepthbuf_vertex>
}
`;

export const ringFragment = /* glsl */ `
#include <logdepthbuf_pars_fragment>
uniform sampler2D uMap;
uniform vec3 uSunPos;
uniform vec3 uCenter;
uniform vec3 uNormal;
uniform float uPlanetR;
varying vec3 vWorld;
varying float vR;
${raySphere}
void main(){
  #include <logdepthbuf_fragment>
  if (vR < 0.0 || vR > 1.0) discard;
  vec4 t = texture2D(uMap, vec2(vR, 0.5));
  float alpha = t.a;
  if (alpha < 0.01) discard;
  vec3 L = normalize(uSunPos - vWorld);
  vec3 V = normalize(cameraPosition - vWorld);
  // Planet shadow on rings.
  vec2 hit = raySphere(vWorld, L, uCenter, uPlanetR);
  float lit = hit.x > 0.0 ? 0.0 : 1.0;
  // Unlit face: only light diffusing through thin parts of the rings.
  float sameSide = sign(dot(L, uNormal)) * sign(dot(V, uNormal));
  float through = sameSide > 0.0 ? 1.0 : 0.45 * (1.0 - alpha) + 0.12;
  // Forward scattering brightens rings when looking toward the Sun.
  float fwd = 1.0 + 0.6 * pow(max(dot(-V, L), 0.0), 8.0);
  vec3 col = t.rgb * (lit * through * fwd + 0.03);
  gl_FragColor = vec4(col, alpha);
  #include <colorspace_fragment>
}
`;

/** Injected into Saturn's standard material: shadow cast by the rings onto the planet. */
export const ringShadowChunk = /* glsl */ `
{
  vec3 L = normalize(uSunPos - vRingWorld);
  float denom = dot(L, uRingNormal);
  if (abs(denom) > 1e-4) {
    float t = dot(uRingCenter - vRingWorld, uRingNormal) / denom;
    if (t > 0.0) {
      vec3 hp = vRingWorld + L * t;
      float rr = (length(hp - uRingCenter) - uRingInner) / (uRingOuter - uRingInner);
      if (rr > 0.0 && rr < 1.0) {
        float a = texture2D(uRingMap, vec2(rr, 0.5)).a;
        reflectedLight.directDiffuse *= 1.0 - a * 0.85;
        reflectedLight.directSpecular *= 1.0 - a * 0.85;
      }
    }
  }
}
`;
