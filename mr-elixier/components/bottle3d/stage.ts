import {
  BackSide,
  BoxGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Group,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  NoColorSpace,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  SRGBColorSpace,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
  type Material,
  type BufferGeometry,
  type Texture,
} from "three";
import type { SizeMl } from "@/lib/config";
import { drawLabel, type LabelScent } from "./label";
import { CAP_GAP, SPECS, labelArc, totalHeight } from "./specs";

/*
 * 3D-Bühne für einen Mr.-Elixier-Flakon (three.js): klares Glas mit echter Lichtbrechung,
 * Flüssigkeit in der Duftfarbe, massiver Glasboden, glänzend schwarze Kappe mit Chromring
 * und das Etikett als Textur. Animation: Auftritt, sanftes Pendeln und Schweben, Neigen zur
 * Maus, Drehen per Ziehen – und beim Duftwechsel eine Drehung, bei der das Etikett auf der
 * Rückseite getauscht wird, während die Flüssigkeit die Farbe wechselt.
 */

export interface StageOptions {
  ml: SizeMl;
  scent: LabelScent;
  /** Seitenhintergrund hinter dem Flakon – färbt den massiven Glasboden passend */
  background: string;
  /** Ausschnitt in mm: Höhe des sichtbaren Bereichs und dessen Mitte über dem Glasboden */
  view: { height: number; centerY: number };
  reducedMotion: boolean;
  /** Start des Auftritts mit Drehung (Sekunden, Zeitbasis performance.now) – null = ohne */
  introAt: number | null;
  /** Pendeln und Schweben im Ruhezustand */
  idle: boolean;
}

export interface Stage {
  /** Zeichenfläche der Bühne (liegt im Container) */
  canvas: HTMLCanvasElement;
  setScent(scent: LabelScent): Promise<void>;
  /** Mausposition relativ zur Bühne, jeweils -0.5 … 0.5 */
  setPointer(x: number, y: number): void;
  /** Scroll-Fortschritt 0 … 1 */
  setScroll(progress: number): void;
  dragStart(): void;
  /** Ziehen um dx Pixel */
  dragMove(dx: number): void;
  dragEnd(): void;
  setActive(active: boolean): void;
  resize(): void;
  dispose(): void;
}

const LIQUID_VERTEX = /* glsl */ `
  varying vec3 vNormalView;
  varying vec3 vViewDir;
  varying float vUp;
  varying float vY;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormalView = normalize(normalMatrix * normal);
    vViewDir = normalize(-mv.xyz);
    vUp = normalize(mat3(modelMatrix) * normal).y;
    vY = position.y;
    gl_Position = projectionMatrix * mv;
  }
`;

/** Flüssigkeit: zum Rand dunkler (mehr Weg durch die Flüssigkeit), mittig durchleuchtet */
const LIQUID_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uBottom;
  uniform float uTop;
  varying vec3 vNormalView;
  varying vec3 vViewDir;
  varying float vUp;
  varying float vY;
  void main() {
    vec3 n = normalize(vNormalView);
    float facing = clamp(dot(n, normalize(vViewDir)), 0.0, 1.0);
    float edge = pow(1.0 - facing, 1.1);
    vec3 col = uColor * (1.14 - 0.86 * edge);
    // Licht scheint links der Mitte durch die Flüssigkeit, rechts liegt die Schattenseite
    float glow = exp(-pow(n.x + 0.3, 2.0) / 0.07);
    col += uColor * 0.55 * glow + vec3(0.03) * glow;
    col *= 1.0 - 0.28 * max(n.x, 0.0);
    // schmaler Lichtreflex innen an der rechten Wand
    col += uColor * 0.5 * exp(-pow(n.x - 0.86, 2.0) / 0.003);
    float h = clamp((vY - uBottom) / (uTop - uBottom), 0.0, 1.0);
    col *= mix(0.78, 1.04, smoothstep(0.0, 1.0, h));
    // Flüssigkeitsspiegel glänzt hell
    float top = smoothstep(0.7, 1.0, vUp);
    col = mix(col, uColor * 1.35 + vec3(0.06), top * 0.85);
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const BASE_VERTEX = /* glsl */ `
  varying vec3 vNormalView;
  varying vec3 vViewDir;
  varying float vY;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormalView = normalize(normalMatrix * normal);
    vViewDir = normalize(-mv.xyz);
    vY = position.y;
    gl_Position = projectionMatrix * mv;
  }
`;

/**
 * Massiver Glasboden: halb durchsichtig (vormultipliziertes Alpha), oben spiegelt sich die
 * Duftfarbe, nach unten wird er klarer, die Kanten leuchten.
 */
const BASE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uBackground;
  uniform float uHeight;
  varying vec3 vNormalView;
  varying vec3 vViewDir;
  varying float vY;
  void main() {
    float facing = clamp(dot(normalize(vNormalView), normalize(vViewDir)), 0.0, 1.0);
    float edge = pow(1.0 - facing, 2.0);
    float h = clamp(vY / uHeight, 0.0, 1.0);
    // vor hellem Hintergrund dunkle Glaskanten, vor dunklem helle
    float light = step(0.4, dot(uBackground, vec3(0.2126, 0.7152, 0.0722)));
    vec3 col = mix(uBackground, uColor, 0.45 + 0.4 * h * h);
    col = mix(col, mix(vec3(1.0), vec3(0.1), light), edge * mix(0.2, 0.5, light));
    col *= mix(1.0, 0.9 + 0.1 * h, light);
    float alpha = clamp(0.12 + 0.5 * h * h + edge * mix(0.22, 0.4, light), 0.0, 1.0);
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    gl_FragColor = vec4(gl_FragColor.rgb * alpha, alpha);
  }
`;

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smooth = (a: number, b: number, t: number) => {
  const x = clamp01((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const TURN = Math.PI * 2;

/** Punkte eines Viertelkreises (für runde Kanten im Profil) */
function arc(cx: number, cy: number, r: number, from: number, to: number, steps = 10): [number, number][] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = from + ((to - from) * i) / steps;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
}

function lathe(points: [number, number][], segments = 128) {
  return new LatheGeometry(
    points.map(([x, y]) => new Vector2(Math.max(0, x), y)),
    segments,
  );
}

/**
 * Dunkles Fotostudio mit Lichtflächen: Glas und Kappe spiegeln schmale, helle Streifen –
 * wie auf Produktfotos – statt eines hellen Raums. Vor dunklem Hintergrund setzen Lichter
 * von hinten helle Kanten; vor hellem Hintergrund bleiben die Kanten dunkel (wie mit
 * schwarzen Abschattern fotografiert), sonst verschwimmt das Glas mit dem Hintergrund.
 */
function studio(light: boolean) {
  const scene = new Scene();
  const room = new Mesh(new BoxGeometry(40, 24, 40), new MeshBasicMaterial({ color: new Color(0.012, 0.011, 0.01), side: BackSide }));
  room.position.y = 6;
  scene.add(room);
  const panel = (w: number, h: number, intensity: number, x: number, y: number, z: number, tint = "#ffffff") => {
    const material = new MeshBasicMaterial({ color: new Color(tint).multiplyScalar(intensity) });
    const mesh = new Mesh(new PlaneGeometry(w, h), material);
    mesh.position.set(x, y, z);
    mesh.lookAt(0, y * 0.4, 0);
    scene.add(mesh);
  };
  panel(2.2, 14, 7, -7, 3, 5);
  panel(1.1, 14, 4.5, 7.5, 3, 3.5, "#fff4e2");
  panel(10, 6, 2.2, 0, 11, 1);
  if (!light) {
    panel(3, 12, 3.2, -5, 3, -8, "#fff1dc");
    panel(2, 12, 2.4, 6, 3, -7);
  }
  panel(16, 3, 0.5, 0, -2, 9, "#f2e6d0");
  return scene;
}

function disposeScene(scene: Scene) {
  scene.traverse((object) => {
    if (object instanceof Mesh) {
      object.geometry.dispose();
      (object.material as Material).dispose();
    }
  });
}

function shadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(0,0,0,0.75)");
    g.addColorStop(0.35, "rgba(0,0,0,0.42)");
    g.addColorStop(0.7, "rgba(0,0,0,0.1)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  }
  const texture = new CanvasTexture(c);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * Legt eine eigene Zeichenfläche im Container an (so überlebt nichts einen Neustart der
 * Komponente) und baut die Szene. Wirft, wenn WebGL nicht verfügbar ist.
 */
export async function createStage(container: HTMLElement, options: StageOptions): Promise<Stage> {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
  container.appendChild(canvas);
  try {
    return await buildStage(canvas, options);
  } catch (error) {
    canvas.remove();
    throw error;
  }
}

async function buildStage(canvas: HTMLCanvasElement, options: StageOptions): Promise<Stage> {
  const spec = SPECS[options.ml];
  const { radius: R, height: H, fillet: f, wall, base, headspace, cap } = spec;

  // selbst prüfen statt three.js scheitern zu lassen – sonst landen Fehler in der Konsole
  const context = canvas.getContext("webgl2", { antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: "high-performance" });
  if (!context) throw new Error("WebGL 2 nicht verfügbar");
  const renderer = new WebGLRenderer({ canvas, context, antialias: true, alpha: true });
  // three.js füllt den Hintergrund für die Lichtbrechung bei transparenter Zeichenfläche mit
  // halbtransparentem Weiß – das Glas würde milchig. Durchsichtig lassen, die Seite scheint durch.
  const setClearColor = renderer.setClearColor.bind(renderer);
  renderer.setClearColor = (color, alpha) =>
    alpha === 0.5 && new Color(color).getHex() === 0xffffff ? setClearColor(0x000000, 0) : setClearColor(color, alpha);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const background = new Color(options.background);
  const lightBackground = background.r * 0.2126 + background.g * 0.7152 + background.b * 0.0722 > 0.4;
  const room = studio(lightBackground);
  const environment = pmrem.fromScene(room, 0.02).texture;
  disposeScene(room);
  scene.environment = environment;
  scene.environmentIntensity = 1;

  const key = new DirectionalLight(0xffffff, 1.5);
  key.position.set(-70, 140, 120);
  const rim = new DirectionalLight(0xfff0d8, 2.6);
  rim.position.set(110, 70, -130);
  const fill = new DirectionalLight(0xffffff, 0.45);
  fill.position.set(90, 10, 110);
  scene.add(key, rim, fill);

  const camera = new PerspectiveCamera(20, 1, 10, 4000);

  // ---- Modell ------------------------------------------------------------
  const geometries: BufferGeometry[] = [];
  const materials: Material[] = [];
  const track = <T extends BufferGeometry>(g: T) => (geometries.push(g), g);
  const own = <T extends Material>(m: T) => (materials.push(m), m);

  const neck = cap.radius * 0.62;
  const glassGeometry = track(
    lathe([
      [0, 0],
      ...arc(R - f, f, f, -Math.PI / 2, 0),
      ...arc(R - f, H - f, f, 0, Math.PI / 2),
      [neck, H],
      [neck, H + 2],
      [0, H + 2],
    ]),
  );
  const glass = new Mesh(
    glassGeometry,
    own(
      new MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.02,
        transmission: 1,
        thickness: R * 0.6,
        ior: 1.5,
        specularIntensity: 1,
        envMapIntensity: 1.25,
        attenuationColor: new Color("#eef7f2"),
        attenuationDistance: 600,
      }),
    ),
  );

  const liquidTop = H - headspace;
  const rl = R - wall;
  const fl = Math.min(f * 1.4, rl * 0.25);
  const color = new Color(options.scent.tint);
  const liquidMaterial = own(
    new ShaderMaterial({
      uniforms: { uColor: { value: color.clone() }, uBottom: { value: base }, uTop: { value: liquidTop } },
      vertexShader: LIQUID_VERTEX,
      fragmentShader: LIQUID_FRAGMENT,
    }),
  );
  const liquid = new Mesh(
    track(lathe([[0, base], ...arc(rl - fl, base + fl, fl, -Math.PI / 2, 0), [rl, liquidTop], [0, liquidTop]])),
    liquidMaterial,
  );

  const baseMaterial = own(
    new ShaderMaterial({
      uniforms: {
        uColor: { value: color.clone() },
        uBackground: { value: background },
        uHeight: { value: base },
      },
      vertexShader: BASE_VERTEX,
      fragmentShader: BASE_FRAGMENT,
    }),
  );
  const inset = 0.25;
  const baseBlock = new Mesh(
    track(lathe([[0, inset], ...arc(R - inset - f, f, f - inset, -Math.PI / 2, 0), [R - inset, base], [0, base]])),
    baseMaterial,
  );

  // Etikett: Zylinderausschnitt direkt auf dem Glas, mittig nach vorn
  const { theta } = labelArc(spec);
  // „transparent“ nur, damit das Etikett nicht im Brechungsbild des Glases landet – es klebt
  // außen auf dem Glas und würde sonst neben sich selbst verzerrt durchscheinen
  const labelMaterial = own(new MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0, transparent: true }));
  const label = new Mesh(
    track(new CylinderGeometry(R + 0.06, R + 0.06, spec.label.height, 96, 1, true, -theta / 2, theta)),
    labelMaterial,
  );
  label.position.y = H - spec.label.top - spec.label.height / 2;

  // Kappe mit Chromring
  const ringTop = H + cap.ring;
  const capBottom = cap.ring > 0 ? ringTop + CAP_GAP : H + 0.25;
  const capTop = capBottom + cap.height;
  const fc = Math.min(1.4, cap.radius * 0.12);
  const capMesh = new Mesh(
    track(lathe([[0, capBottom], [cap.radius, capBottom], ...arc(cap.radius - fc, capTop - fc, fc, 0, Math.PI / 2), [0, capTop]])),
    own(
      new MeshPhysicalMaterial({
        color: 0x070707,
        roughness: 0.2,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.035,
        envMapIntensity: 1.35,
      }),
    ),
  );
  const parts: Mesh[] = [glass, baseBlock, liquid, label, capMesh];
  if (cap.ring > 0) {
    const b = 0.3;
    const ring = new Mesh(
      track(
        lathe([
          [0, H],
          [cap.radius - b, H],
          [cap.radius, H + b],
          [cap.radius, ringTop - b],
          [cap.radius - b, ringTop],
          [0, ringTop],
        ]),
      ),
      own(new MeshStandardMaterial({ color: 0xf4f4f4, metalness: 1, roughness: 0.09, envMapIntensity: 1.4 })),
    );
    const gap = new Mesh(
      track(new CylinderGeometry(cap.radius - 0.45, cap.radius - 0.45, CAP_GAP + 0.2, 96)),
      own(new MeshStandardMaterial({ color: 0x050505, roughness: 0.6 })),
    );
    gap.position.y = ringTop + CAP_GAP / 2;
    parts.push(ring, gap);
  }

  const spin = new Group();
  spin.add(...parts);
  const pivot = totalHeight(spec) * 0.45;
  spin.position.y = -pivot;
  const tilt = new Group();
  tilt.position.y = pivot;
  tilt.add(spin);
  const root = new Group();
  root.add(tilt);
  scene.add(root);

  const shadowMap = shadowTexture();
  const shadowMaterial = own(new MeshBasicMaterial({ map: shadowMap, transparent: true, depthWrite: false, opacity: 0.6 }));
  const shadow = new Mesh(track(new PlaneGeometry(R * 3.6, R * 3.6)), shadowMaterial);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  scene.add(shadow);

  // ---- Etikett-Texturen ---------------------------------------------------
  const anisotropy = renderer.capabilities.getMaxAnisotropy();
  const makeTextures = async (scent: LabelScent) => {
    const images = await drawLabel(options.ml, scent);
    const map = new CanvasTexture(images.color);
    map.colorSpace = SRGBColorSpace;
    map.anisotropy = anisotropy;
    let foil: Texture | undefined;
    if (images.foil) {
      foil = new CanvasTexture(images.foil);
      foil.colorSpace = NoColorSpace;
      foil.anisotropy = anisotropy;
    }
    return { map, foil };
  };
  let textures = await makeTextures(options.scent);
  const applyTextures = (next: typeof textures) => {
    labelMaterial.map = next.map;
    labelMaterial.roughnessMap = next.foil ?? null;
    labelMaterial.metalnessMap = next.foil ?? null;
    labelMaterial.roughness = next.foil ? 1 : 0.55;
    labelMaterial.metalness = next.foil ? 1 : 0;
    labelMaterial.needsUpdate = true;
    if (next !== textures) {
      textures.map.dispose();
      textures.foil?.dispose();
      textures = next;
    }
  };
  applyTextures(textures);

  // ---- Kamera ------------------------------------------------------------
  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const distance = options.view.height / 2 / Math.tan((camera.fov * Math.PI) / 360);
    // leicht erhöhter Blick: Kappe und Boden wirken rund
    const lift = distance * Math.tan((3.2 * Math.PI) / 180);
    camera.position.set(0, options.view.centerY + lift, distance);
    camera.lookAt(0, options.view.centerY, 0);
    camera.updateProjectionMatrix();
  };
  resize();

  // ---- Animation ---------------------------------------------------------
  const reduced = options.reducedMotion;
  const start = performance.now() / 1000;
  let introStart = options.introAt !== null && !reduced ? options.introAt : -Infinity;
  let pointer = { x: 0, y: 0 };
  let tiltX = 0;
  let tiltZ = 0;
  let scrollTarget = 0;
  let scrollAngle = 0;
  let dragging = false;
  let dragAngle = 0;
  let velocity = 0;
  let lastMove = 0;
  let spinState: null | {
    start: number;
    from: Color;
    to: Color;
    next: typeof textures;
    swapped: boolean;
  } = null;
  let spinBase = 0;
  let queued: LabelScent | null = null;
  let disposed = false;
  let active = false;
  let last = start;

  const frame = () => {
    const now = performance.now() / 1000;
    const dt = Math.min(0.05, now - last);
    last = now;

    // Auftritt: dreht sich von der Seite nach vorn und hebt sich leicht
    const intro = easeOutCubic(clamp01((now - introStart) / 2));
    const introAngle = (1 - intro) * -2.1;
    const introLift = (1 - intro) * -7;

    // Duftwechsel: eine volle Drehung, Etikett wird auf der Rückseite getauscht
    let spinAngle = spinBase;
    if (spinState) {
      const p = clamp01((now - spinState.start) / 1.7);
      const e = easeInOutCubic(p);
      spinAngle = spinBase + e * TURN;
      const c = smooth(0.18, 0.82, p);
      liquidMaterial.uniforms.uColor.value.copy(spinState.from).lerp(spinState.to, c);
      baseMaterial.uniforms.uColor.value.copy(liquidMaterial.uniforms.uColor.value);
      if (!spinState.swapped && e >= 0.5) {
        applyTextures(spinState.next);
        spinState.swapped = true;
      }
      if (p >= 1) {
        spinState = null;
        spinAngle = spinBase;
        if (queued) {
          const nextScent = queued;
          queued = null;
          void setScent(nextScent);
        }
      }
    }

    // Ziehen: Schwung klingt aus, danach dreht der Flakon sein Etikett wieder nach vorn
    if (!dragging) {
      dragAngle += velocity * dt;
      velocity *= Math.exp(-dt * 2.6);
      if (Math.abs(velocity) < 0.35) {
        const target = Math.round(dragAngle / TURN) * TURN;
        dragAngle += (target - dragAngle) * (1 - Math.exp(-dt * 2.4));
      }
    }

    scrollAngle += (scrollTarget - scrollAngle) * (1 - Math.exp(-dt * 6));
    const sway = reduced || !options.idle ? 0 : Math.sin((now - start) * 0.55) * 0.2 + Math.sin((now - start) * 1.37) * 0.04;
    spin.rotation.y = introAngle + spinAngle + sway + dragAngle + scrollAngle;

    const k = 1 - Math.exp(-dt * 3.5);
    tiltX += (pointer.y * 0.2 - tiltX) * k;
    tiltZ += (-pointer.x * 0.1 - tiltZ) * k;
    tilt.rotation.x = tiltX;
    tilt.rotation.z = tiltZ;

    const float = reduced || !options.idle ? 0 : Math.sin((now - start) * 0.9) * 1.1;
    root.position.y = float + introLift;
    shadowMaterial.opacity = 0.6 - Math.max(0, root.position.y) * 0.05;
    if (!reduced) scene.environmentRotation.y = Math.sin((now - start) * 0.2) * 0.6;

    renderer.render(scene, camera);
  };

  const setActive = (next: boolean) => {
    if (disposed || next === active) return;
    active = next;
    last = performance.now() / 1000;
    renderer.setAnimationLoop(active ? frame : null);
  };

  async function setScent(scent: LabelScent) {
    if (disposed) return;
    if (spinState) {
      queued = scent;
      return;
    }
    const next = await makeTextures(scent);
    if (disposed) {
      next.map.dispose();
      next.foil?.dispose();
      return;
    }
    const to = new Color(scent.tint);
    if (reduced || !active) {
      applyTextures(next);
      liquidMaterial.uniforms.uColor.value.copy(to);
      baseMaterial.uniforms.uColor.value.copy(to);
      if (!active) renderer.render(scene, camera);
      return;
    }
    spinState = {
      start: performance.now() / 1000,
      from: liquidMaterial.uniforms.uColor.value.clone(),
      to,
      next,
      swapped: false,
    };
  }

  // erstes Bild sofort, damit nichts aufblitzt
  frame();

  return {
    canvas,
    setScent,
    setPointer(x, y) {
      pointer = { x, y };
    },
    setScroll(progress) {
      scrollTarget = reduced ? 0 : progress * 1.3;
    },
    dragStart() {
      dragging = true;
      velocity = 0;
      lastMove = performance.now();
      introStart = -Infinity;
    },
    dragMove(dx) {
      const width = canvas.clientWidth || 1;
      const delta = (dx / width) * 4.2;
      const now = performance.now();
      const elapsed = Math.max(8, now - lastMove) / 1000;
      dragAngle += delta;
      velocity = velocity * 0.6 + (delta / elapsed) * 0.4;
      lastMove = now;
    },
    dragEnd() {
      dragging = false;
      if (performance.now() - lastMove > 90) velocity = 0;
      velocity = Math.max(-9, Math.min(9, velocity));
    },
    setActive,
    resize,
    dispose() {
      disposed = true;
      renderer.setAnimationLoop(null);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.map.dispose();
      textures.foil?.dispose();
      spinState?.next.map.dispose();
      spinState?.next.foil?.dispose();
      shadowMap.dispose();
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
