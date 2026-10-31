"use client";

import { useEffect, useRef } from "react";
import { useTheme, type Theme } from "@/hooks/use-theme";

/* ============================================================
   LA SCÈNE — terrain filaire en perspective, WebGL écrit à la main.
   Astre posé sur l'horizon, ondulation continue, onde circulaire
   sous le curseur. Repli : canvas 2D, puis dégradé CSS.
   ============================================================ */

type SceneColors = {
  clear: [number, number, number];
  skyTop: [number, number, number];
  skyHor: [number, number, number];
  sun: [number, number, number];
  sunI: number;
  c1: [number, number, number];
  c2: [number, number, number];
  c3: [number, number, number];
  alpha: number;
  fogMix: number;
  additive: boolean;
};

const SCENE_COLORS: Record<Theme, SceneColors> = {
  dark: {
    clear: [0.027, 0.012, 0.059],
    skyTop: [0.02, 0.008, 0.047],
    skyHor: [0.149, 0.035, 0.227],
    sun: [1.0, 0.255, 0.804],
    sunI: 0.95,
    c1: [0.196, 0.086, 0.447],
    c2: [1.0, 0.255, 0.804],
    c3: [0.243, 0.914, 1.0],
    alpha: 0.8,
    fogMix: 0.0,
    additive: true,
  },
  light: {
    clear: [0.953, 0.937, 0.992],
    skyTop: [0.863, 0.843, 0.976],
    skyHor: [1.0, 0.922, 0.816],
    sun: [1.0, 0.8, 0.478],
    sunI: 1.05,
    c1: [0.106, 0.067, 0.275],
    c2: [0.333, 0.102, 0.89],
    c3: [0.714, 0.0, 0.439],
    alpha: 0.54,
    fogMix: 0.9,
    additive: false,
  },
};

const VS_BG = `
attribute vec2 a_p;
varying vec2 v_uv;
void main(){ v_uv = a_p*0.5+0.5; gl_Position = vec4(a_p,0.0,1.0); }`;

const FS_BG = `
precision mediump float;
varying vec2 v_uv;
uniform vec3 u_skyTop, u_skyHor, u_sun;
uniform float u_aspect, u_sunI, u_time, u_horizon, u_sunX;
float hash(vec2 p){ return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5453); }
void main(){
  float d2h = clamp((v_uv.y - u_horizon) / max(0.0001, 1.0 - u_horizon), 0.0, 1.0);
  vec3 col = mix(u_skyHor, u_skyTop, pow(d2h, 0.75));
  /* astre : disque doux posé sur l'horizon */
  vec2 sp = vec2(u_sunX, u_horizon + 0.012);
  vec2 q  = (v_uv - sp) * vec2(u_aspect, 1.0);
  float r = length(q);
  float disc = smoothstep(0.072, 0.056, r);
  float halo = exp(-r*5.2) * 0.65 + exp(-r*1.5) * 0.28;
  col += u_sun * (disc*0.55 + halo) * u_sunI;
  /* voile chaud au ras de l'horizon */
  col += u_sun * exp(-abs(v_uv.y - u_horizon)*22.0) * 0.16 * u_sunI;
  /* tramage léger : évite les bandes dans les dégradés */
  col += (hash(v_uv*vec2(1024.0,768.0)) - 0.5) * 0.004;
  gl_FragColor = vec4(col, 1.0);
}`;

const VS_TERRAIN = `
attribute vec2 a_grid;          /* x: -1..1, y: 0 (près) .. 1 (loin) */
uniform mat4 u_mvp;
uniform float u_time, u_amp, u_ripple;
uniform vec2 u_mouse;           /* position monde du curseur (x,z) */
varying float v_h;
varying float v_far;
void main(){
  float halfW = 15.0 + a_grid.y * 36.0;      /* éventail : densité là où on regarde */
  float x = a_grid.x * halfW;
  float z = -a_grid.y * 82.0;
  float t = u_time;
  float h = 0.0;
  h += sin(x*0.205 + t*0.55) * 1.00;
  h += sin(z*0.170 - t*0.42) * 1.15;
  h += sin((x+z)*0.112 + t*0.27) * 0.85;
  h += sin(x*0.063 - z*0.098 - t*0.19) * 1.55;
  h *= u_amp;
  /* onde circulaire issue du curseur */
  float d = length(vec2(x,z) - u_mouse);
  h += exp(-d*d*0.0042) * sin(d*0.52 - t*2.1) * 2.7 * u_ripple;
  v_h = h;
  v_far = a_grid.y;
  gl_Position = u_mvp * vec4(x, h, z, 1.0);
}`;

const FS_TERRAIN = `
precision mediump float;
varying float v_h;
varying float v_far;
uniform vec3 u_c1, u_c2, u_c3, u_fog;
uniform float u_alpha, u_fogMix;
void main(){
  float k = clamp(v_h*0.17 + 0.5, 0.0, 1.0);
  vec3 col = mix(u_c1, u_c2, smoothstep(0.08, 0.62, k));
  col = mix(col, u_c3, smoothstep(0.58, 1.0, k));
  float fade = 1.0 - smoothstep(0.20, 0.97, v_far);
  col = mix(col, u_fog, (1.0 - fade) * u_fogMix);
  gl_FragColor = vec4(col, u_alpha * (0.10 + 0.90*fade));
}`;

/* --- petites mat4 --- */
function mPerspective(fovy: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  // prettier-ignore
  return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
}
function mLookAt(
  eye: number[],
  ctr: number[],
  up: number[]
): number[] {
  let zx = eye[0] - ctr[0];
  let zy = eye[1] - ctr[1];
  let zz = eye[2] - ctr[2];
  let l = Math.hypot(zx, zy, zz) || 1;
  zx /= l;
  zy /= l;
  zz /= l;
  let xx = up[1] * zz - up[2] * zy;
  let xy = up[2] * zx - up[0] * zz;
  let xz = up[0] * zy - up[1] * zx;
  l = Math.hypot(xx, xy, xz) || 1;
  xx /= l;
  xy /= l;
  xz /= l;
  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;
  // prettier-ignore
  return [
    xx, yx, zx, 0,
    xy, yy, zy, 0,
    xz, yz, zz, 0,
    -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
    -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
    -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
    1,
  ];
}
/** a*b, colonne-major */
function mMul(a: number[], b: number[]) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) {
      o[c * 4 + r] =
        a[r] * b[c * 4] +
        a[4 + r] * b[c * 4 + 1] +
        a[8 + r] * b[c * 4 + 2] +
        a[12 + r] * b[c * 4 + 3];
    }
  return o;
}

type Hud = {
  mode: (v: string) => void;
  seg: (v: string) => void;
  fps: (v: string) => void;
};

type SceneHandle = { setTheme: (t: Theme) => void; stop: () => void };

/* ------------------------------------------------------------
   Repli : même terrain, canvas 2D, grille grossière
   ------------------------------------------------------------ */
function build2DFallback(
  canvas: HTMLCanvasElement,
  hud: Hud,
  reduced: boolean,
  localeTag: string
): SceneHandle {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    document.body.classList.add("no-webgl");
    hud.mode("CSS");
    hud.seg("repli");
    hud.fps("—");
    return { setTheme() {}, stop() {} };
  }
  hud.mode("Canvas 2D");
  let theme: Theme = "dark";
  let W = 0;
  let H = 0;
  let dpr = 1;
  const COLS = 34;
  const ROWS = 26;
  hud.seg(
    (COLS * (ROWS - 1) + ROWS * (COLS - 1)).toLocaleString(localeTag) + " seg"
  );

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function h(x: number, z: number, t: number) {
    return (
      Math.sin(x * 0.205 + t * 0.55) * 1.0 +
      Math.sin(z * 0.17 - t * 0.42) * 1.15 +
      Math.sin((x + z) * 0.112 + t * 0.27) * 0.85 +
      Math.sin(x * 0.063 - z * 0.098 - t * 0.19) * 1.55
    );
  }
  function proj(
    x: number,
    y: number,
    z: number,
    camY: number,
    hz: number
  ): [number, number] | null {
    const f = 1.1;
    const d = -(z - 13.0);
    if (d <= 0.3) return null;
    return [W / 2 + (x * f * H) / d, H * hz - ((y - camY) * f * H) / d];
  }
  let last = 0;
  let frames = 0;
  let fpsT = 0;
  let vis = true;
  let alive = true;
  const onVis = () => {
    vis = !document.hidden;
  };
  document.addEventListener("visibilitychange", onVis);

  function draw(t: number) {
    resize();
    const dark = theme === "dark";
    const g = ctx!.createLinearGradient(0, 0, 0, H);
    if (dark) {
      g.addColorStop(0, "#050210");
      g.addColorStop(0.55, "#13062a");
      g.addColorStop(1, "#2a0a3f");
    } else {
      g.addColorStop(0, "#e6dffb");
      g.addColorStop(0.55, "#f3eeff");
      g.addColorStop(1, "#fff2e0");
    }
    ctx!.fillStyle = g;
    ctx!.fillRect(0, 0, W, H);
    const scrollMax = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight
    );
    const s = Math.min(1, Math.max(0, window.scrollY / scrollMax));
    const camY = 4.6 + s * 8.4;
    const hz = window.innerWidth < 768 ? 0.74 - s * 0.2 : 0.62 - s * 0.15;
    ctx!.lineWidth = 1;
    for (let r = 0; r < ROWS; r++) {
      const fy = r / (ROWS - 1);
      const alpha = (1 - fy * 0.85) * (dark ? 0.5 : 0.32);
      ctx!.strokeStyle = dark
        ? "rgba(190,120,255," + alpha.toFixed(3) + ")"
        : "rgba(70,30,140," + alpha.toFixed(3) + ")";
      ctx!.beginPath();
      let started = false;
      for (let c = 0; c < COLS; c++) {
        const halfW = 15 + fy * 36;
        const x = ((c / (COLS - 1)) * 2 - 1) * halfW;
        const z = -fy * 82;
        const p = proj(x, h(x, z, t), z, camY, hz);
        if (!p) {
          started = false;
          continue;
        }
        if (!started) {
          ctx!.moveTo(p[0], p[1]);
          started = true;
        } else ctx!.lineTo(p[0], p[1]);
      }
      ctx!.stroke();
    }
    for (let c = 0; c < COLS; c += 1) {
      ctx!.strokeStyle = dark
        ? "rgba(255,80,210,0.16)"
        : "rgba(120,40,200,0.13)";
      ctx!.beginPath();
      let started = false;
      for (let r = 0; r < ROWS; r++) {
        const fy = r / (ROWS - 1);
        const halfW = 15 + fy * 36;
        const x = ((c / (COLS - 1)) * 2 - 1) * halfW;
        const z = -fy * 82;
        const p = proj(x, h(x, z, t), z, camY, hz);
        if (!p) {
          started = false;
          continue;
        }
        if (!started) {
          ctx!.moveTo(p[0], p[1]);
          started = true;
        } else ctx!.lineTo(p[0], p[1]);
      }
      ctx!.stroke();
    }
  }
  function loop(now: number) {
    if (!alive) return;
    requestAnimationFrame(loop);
    if (!vis) return;
    if (now - last < 1000 / 30) return;
    last = now;
    draw(now / 1000);
    frames++;
    if (now - fpsT > 600) {
      hud.fps(Math.round((frames * 1000) / (now - fpsT)) + " fps");
      frames = 0;
      fpsT = now;
    }
  }
  const onResizeStill = () => draw(6);
  if (reduced) {
    draw(6);
    hud.fps("figée");
    window.addEventListener("resize", onResizeStill);
  } else requestAnimationFrame(loop);

  return {
    setTheme(t) {
      theme = t;
      if (reduced) draw(6);
    },
    stop() {
      alive = false;
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", onResizeStill);
    },
  };
}

/* ------------------------------------------------------------
   WebGL
   ------------------------------------------------------------ */
function buildScene(
  canvas: HTMLCanvasElement,
  hud: Hud,
  reduced: boolean,
  localeTag: string,
  onSceneVisibility: (onScene: boolean) => void
): SceneHandle {
  let gl: WebGLRenderingContext | null = null;
  try {
    const opts: WebGLContextAttributes = {
      alpha: false,
      antialias: true,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
      failIfMajorPerformanceCaveat: false,
    };
    gl = (canvas.getContext("webgl", opts) ||
      canvas.getContext(
        "experimental-webgl",
        opts
      )) as WebGLRenderingContext | null;
  } catch {
    gl = null;
  }
  if (!gl) return build2DFallback(canvas, hud, reduced, localeTag);
  const g = gl;

  const compile = (type: number, src: string) => {
    const s = g.createShader(type)!;
    g.shaderSource(s, src);
    g.compileShader(s);
    if (!g.getShaderParameter(s, g.COMPILE_STATUS))
      throw new Error(g.getShaderInfoLog(s) ?? "shader");
    return s;
  };
  const program = (vs: string, fs: string) => {
    const p = g.createProgram()!;
    g.attachShader(p, compile(g.VERTEX_SHADER, vs));
    g.attachShader(p, compile(g.FRAGMENT_SHADER, fs));
    g.linkProgram(p);
    if (!g.getProgramParameter(p, g.LINK_STATUS))
      throw new Error(g.getProgramInfoLog(p) ?? "program");
    return p;
  };

  let pBg: WebGLProgram;
  let pTer: WebGLProgram;
  try {
    pBg = program(VS_BG, FS_BG);
    pTer = program(VS_TERRAIN, FS_TERRAIN);
  } catch {
    return build2DFallback(canvas, hud, reduced, localeTag);
  }

  const mobile = () => window.innerWidth < 768;
  let COLS = 0;
  let ROWS = 0;
  let idxCount = 0;
  const bufGrid = g.createBuffer();
  const bufIdx = g.createBuffer();
  const bufQuad = g.createBuffer();
  g.bindBuffer(g.ARRAY_BUFFER, bufQuad);
  g.bufferData(
    g.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    g.STATIC_DRAW
  );

  function buildGrid() {
    COLS = mobile() ? 46 : 88;
    ROWS = mobile() ? 36 : 70;
    const verts = new Float32Array(COLS * ROWS * 2);
    let k = 0;
    for (let r = 0; r < ROWS; r++) {
      const fy = r / (ROWS - 1);
      for (let c = 0; c < COLS; c++) {
        verts[k++] = (c / (COLS - 1)) * 2 - 1;
        verts[k++] = fy;
      }
    }
    /* lignes de crête à pleine densité, méridiens une sur deux :
       même lecture visuelle pour ~35 % de segments en moins */
    const idx: number[] = [];
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS - 1; c++) {
        const a = r * COLS + c;
        idx.push(a, a + 1);
      }
    for (let c = 0; c < COLS; c += 2)
      for (let r = 0; r < ROWS - 1; r++) {
        const a = r * COLS + c;
        idx.push(a, a + COLS);
      }
    idxCount = idx.length;
    g.bindBuffer(g.ARRAY_BUFFER, bufGrid);
    g.bufferData(g.ARRAY_BUFFER, verts, g.STATIC_DRAW);
    g.bindBuffer(g.ELEMENT_ARRAY_BUFFER, bufIdx);
    g.bufferData(g.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), g.STATIC_DRAW);
    hud.seg(((idxCount / 2) | 0).toLocaleString(localeTag) + " seg");
  }
  buildGrid();

  const U = (p: WebGLProgram, n: string) => g.getUniformLocation(p, n);
  const uBg = {
    skyTop: U(pBg, "u_skyTop"),
    skyHor: U(pBg, "u_skyHor"),
    sun: U(pBg, "u_sun"),
    aspect: U(pBg, "u_aspect"),
    sunI: U(pBg, "u_sunI"),
    time: U(pBg, "u_time"),
    horizon: U(pBg, "u_horizon"),
    sunX: U(pBg, "u_sunX"),
  };
  const uT = {
    mvp: U(pTer, "u_mvp"),
    time: U(pTer, "u_time"),
    amp: U(pTer, "u_amp"),
    ripple: U(pTer, "u_ripple"),
    mouse: U(pTer, "u_mouse"),
    c1: U(pTer, "u_c1"),
    c2: U(pTer, "u_c2"),
    c3: U(pTer, "u_c3"),
    fog: U(pTer, "u_fog"),
    alpha: U(pTer, "u_alpha"),
    fogMix: U(pTer, "u_fogMix"),
  };
  const aBgP = g.getAttribLocation(pBg, "a_p");
  const aGrid = g.getAttribLocation(pTer, "a_grid");

  /* le redimensionnement ne tourne PAS dans la boucle de rendu :
     lire clientWidth à chaque image forcerait un calcul de mise en page */
  let W = 1;
  let H = 1;
  let dpr = 1;
  let needResize = true;
  function resize() {
    needResize = false;
    dpr = Math.min(window.devicePixelRatio || 1, mobile() ? 1.5 : 1.9);
    W = Math.max(1, Math.round(canvas.clientWidth * dpr));
    H = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }
    g.viewport(0, 0, W, H);
  }
  const onResize = () => {
    needResize = true;
  };
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("orientationchange", onResize);

  // curseur + défilement
  const ptr = { tx: 0, ty: 0.62, x: 0, y: 0.62, inf: 0, tinf: 0 };
  const onPointerMove = (e: PointerEvent) => {
    ptr.tx = (e.clientX / window.innerWidth) * 2 - 1;
    ptr.ty = e.clientY / window.innerHeight;
    ptr.tinf = 1;
  };
  const onPointerOut = () => {
    ptr.tinf = 0;
  };
  if (!reduced) {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerOut);
    window.addEventListener("blur", onPointerOut);
  }

  let scrollN = 0;
  const readScroll = () => {
    const vh = window.innerHeight;
    const max = Math.max(1, document.documentElement.scrollHeight - vh);
    scrollN = Math.min(1, Math.max(0, window.scrollY / max));
    // le HUD n'a de sens que là où la scène est visible
    onSceneVisibility(
      window.scrollY < vh * 0.72 || window.scrollY > max - vh * 0.55
    );
  };
  window.addEventListener("scroll", readScroll, { passive: true });
  readScroll();

  let theme: Theme = "dark";
  let visible = true;
  let running = true;
  let alive = true;
  const onVis = () => {
    visible = !document.hidden;
  };
  document.addEventListener("visibilitychange", onVis);
  let io: IntersectionObserver | null = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        running = e.isIntersecting;
      });
    });
    io.observe(canvas);
  }

  const t0 = performance.now();
  let last = t0;
  let frames = 0;
  let fpsT = t0;
  let lastGridKey = mobile();

  const FOV = (52 * Math.PI) / 180;
  const FOCAL = 1 / Math.tan(FOV / 2);

  function draw(time: number) {
    if (needResize) resize();
    const C = SCENE_COLORS[theme];
    const aspect = W / H;
    const t = reduced ? 6.0 : time;
    const narrow = mobile();

    ptr.x += (ptr.tx - ptr.x) * 0.07;
    ptr.y += (ptr.ty - ptr.y) * 0.07;
    ptr.inf += (ptr.tinf - ptr.inf) * 0.05;
    const s = reduced ? 0 : scrollN;

    /* On vise une position d'horizon précise : le texte du héros reste
       au-dessus de la ligne, sur du ciel propre. En défilant on prend de
       l'altitude et on redescend le regard — vue aérienne en fin de page. */
    const horizon = narrow ? 0.7 - s * 0.18 : 0.62 - s * 0.15;
    const tanPitch = (2 * horizon - 1) / FOCAL;
    const camY = 4.6 + s * 8.4;
    const FWD = 46;
    const eye = [ptr.x * 2.2, camY, 13.0 - s * 2.0];
    const ctr = [ptr.x * 0.8, camY + tanPitch * FWD, eye[2] - FWD];
    const mvp = mMul(
      mPerspective(FOV, aspect, 0.1, 240),
      mLookAt(eye, ctr, [0, 1, 0])
    );

    g.clearColor(C.clear[0], C.clear[1], C.clear[2], 1);
    g.clear(g.COLOR_BUFFER_BIT);
    g.disable(g.DEPTH_TEST);

    // --- 1. ciel ---
    g.disable(g.BLEND);
    g.useProgram(pBg);
    g.bindBuffer(g.ARRAY_BUFFER, bufQuad);
    g.enableVertexAttribArray(aBgP);
    g.vertexAttribPointer(aBgP, 2, g.FLOAT, false, 0, 0);
    g.uniform3fv(uBg.skyTop, C.skyTop);
    g.uniform3fv(uBg.skyHor, C.skyHor);
    g.uniform3fv(uBg.sun, C.sun);
    g.uniform1f(uBg.sunI, C.sunI);
    g.uniform1f(uBg.aspect, aspect);
    g.uniform1f(uBg.time, t);
    /* v_uv.y part du BAS en WebGL : on renvoie l'horizon dans ce repère
       pour que le ciel et l'astre se calent sur la ligne de fuite réelle */
    g.uniform1f(uBg.horizon, 1.0 - horizon);
    g.uniform1f(uBg.sunX, narrow ? 0.6 : 0.74);
    g.drawArrays(g.TRIANGLE_STRIP, 0, 4);

    // --- 2. terrain filaire ---
    g.enable(g.BLEND);
    if (C.additive) g.blendFunc(g.SRC_ALPHA, g.ONE);
    else g.blendFunc(g.SRC_ALPHA, g.ONE_MINUS_SRC_ALPHA);
    g.useProgram(pTer);
    g.bindBuffer(g.ARRAY_BUFFER, bufGrid);
    g.enableVertexAttribArray(aGrid);
    g.vertexAttribPointer(aGrid, 2, g.FLOAT, false, 0, 0);
    g.bindBuffer(g.ELEMENT_ARRAY_BUFFER, bufIdx);
    g.uniformMatrix4fv(uT.mvp, false, mvp);
    g.uniform1f(uT.time, t);
    g.uniform1f(uT.amp, 1.0 + s * 0.55);
    g.uniform1f(uT.ripple, narrow || reduced ? 0 : ptr.inf);
    // curseur -> point approximatif du plan
    const near = Math.min(1, Math.max(0, ptr.y));
    const zW = -(2 + Math.pow(1 - near, 1.5) * 62);
    const xW = ptr.x * (15 + 30 * (1 - near));
    g.uniform2f(uT.mouse, xW, zW);
    g.uniform3fv(uT.c1, C.c1);
    g.uniform3fv(uT.c2, C.c2);
    g.uniform3fv(uT.c3, C.c3);
    g.uniform3fv(uT.fog, C.skyHor);
    g.uniform1f(uT.alpha, C.alpha);
    g.uniform1f(uT.fogMix, C.fogMix);
    g.drawElements(g.LINES, idxCount, g.UNSIGNED_SHORT, 0);
  }

  function frame(now: number) {
    if (!alive) return;
    requestAnimationFrame(frame);
    if (!visible || !running) {
      last = now;
      return;
    }
    const budget = mobile() ? 1000 / 34 : 1000 / 61; // allège le mobile
    if (now - last < budget - 1) return;
    last = now;
    if (lastGridKey !== mobile()) {
      lastGridKey = mobile();
      buildGrid();
    }
    draw((now - t0) / 1000);
    frames++;
    if (now - fpsT > 500) {
      hud.fps(Math.round((frames * 1000) / (now - fpsT)) + " fps");
      frames = 0;
      fpsT = now;
    }
  }

  hud.mode("WebGL");
  const onResizeStill = () => draw(6.0);
  if (reduced) {
    draw(6.0);
    hud.fps("figée");
    window.addEventListener("resize", onResizeStill);
  } else {
    requestAnimationFrame(frame);
  }

  return {
    setTheme(t) {
      theme = t;
      if (reduced) draw(6.0);
    },
    stop() {
      alive = false;
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      window.removeEventListener("resize", onResizeStill);
      window.removeEventListener("scroll", readScroll);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerOut);
      window.removeEventListener("blur", onPointerOut);
    },
  };
}

export function Scene({ localeTag }: { localeTag: string }) {
  const { resolvedTheme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modeRef = useRef<HTMLSpanElement | null>(null);
  const segRef = useRef<HTMLSpanElement | null>(null);
  const fpsRef = useRef<HTMLElement | null>(null);
  const hudRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<SceneHandle | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    const hud: Hud = {
      mode: (v) => {
        if (modeRef.current) modeRef.current.textContent = v;
      },
      seg: (v) => {
        if (segRef.current) segRef.current.textContent = v;
      },
      fps: (v) => {
        if (fpsRef.current) fpsRef.current.textContent = v;
      },
    };
    const onSceneVisibility = (onScene: boolean) => {
      hudRef.current?.classList.toggle("away", !onScene);
    };

    let handle: SceneHandle;
    try {
      handle = buildScene(canvas, hud, reduced, localeTag, onSceneVisibility);
    } catch {
      document.body.classList.add("no-webgl");
      hud.mode("CSS");
      hud.seg("repli");
      hud.fps("—");
      handle = { setTheme() {}, stop() {} };
    }
    sceneRef.current = handle;
    return () => {
      handle.stop();
      sceneRef.current = null;
      document.body.classList.remove("no-webgl");
    };
  }, [localeTag]);

  useEffect(() => {
    sceneRef.current?.setTheme(resolvedTheme);
  }, [resolvedTheme]);

  return (
    <>
      <canvas id="scene" ref={canvasRef} aria-hidden="true" />
      <div id="scene-fallback" aria-hidden="true" />
      <div className="hud" ref={hudRef} aria-hidden="true">
        <span ref={modeRef}>WebGL</span>
        <span className="sep">/</span>
        <span ref={segRef}>—</span>
        <span className="sep">/</span>
        <b ref={fpsRef}>—</b>
      </div>
    </>
  );
}
