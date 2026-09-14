/**
 * readme-pet SVG renderer — cute minimalist octocat pet
 * Pure SVG, embeddable as <img> in GitHub README.
 * @module renderer
 */

const COLORS = {
  egg: "#F5E6C8",
  baby: "#FFB5D1",
  child: "#C9A8FF",
  teen: "#7ED957",
  adult: "#57606A",
  legendary: "#FFD700",
};

const STROKES = {
  egg: "#E2CFA8",
  baby: "#F48FB1",
  child: "#A67FF0",
  teen: "#5DBB35",
  adult: "#3D444D",
  legendary: "#C89B00",
};

const MOODS = new Set(["happy", "hungry", "sad", "sick", "sleepy", "excited"]);

/** @param {string} s */
function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function getStageColor(stage) {
  const k = String(stage || "egg").toLowerCase();
  const norm = k === "master" ? "legendary" : k;
  return COLORS[norm] || COLORS.egg;
}

function clamp01(n) {
  return Math.max(0, Math.min(100, Number(n) || 0));
}

function eyes(mood) {
  // eyes centered at (200,78), two eyes at ±16
  const lc = `stroke="#1F2328" stroke-width="2.2" stroke-linecap="round" fill="none"`;
  const dot = (x, y, r = 2.2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#1F2328"/>`;
  switch (mood) {
    case "happy": // ^^
      return `<g class="eyes"><path d="M178 80 l6 -7 l6 7" ${lc}/><path d="M206 80 l6 -7 l6 7" ${lc}/></g>`;
    case "excited": // ^^ with sparkle
      return `<g class="eyes"><path d="M177 80 l6 -8 l6 8" ${lc}/><path d="M205 80 l6 -8 l6 8" ${lc}/><circle cx="176" cy="70" r="1.3" fill="#FFD33D"/><circle cx="224" cy="70" r="1.3" fill="#FFD33D"/><circle cx="224" cy="66" r="0.9" fill="#FFD33D"/></g>`;
    case "hungry": // -- flat + tiny pupils
      return `<g class="eyes"><line x1="176" y1="78" x2="190" y2="78" ${lc}/><line x1="210" y1="78" x2="224" y2="78" ${lc}/>${dot(183, 79, 1.6)}${dot(217, 79, 1.6)}</g>`;
    case "sleepy": // -- closed, low
      return `<g class="eyes"><path d="M176 79 h14" ${lc} opacity="0.9"/><path d="M210 79 h14" ${lc} opacity="0.9"/><text x="232" y="74" font-size="8" font-family="sans-serif" fill="#8B949E">z</text><text x="238" y="68" font-size="10" font-family="sans-serif" fill="#8B949E">z</text></g>`;
    case "sad": // uu droopy
      return `<g class="eyes"><path d="M176 72 q7 12 14 0" ${lc}/><path d="M210 72 q7 12 14 0" ${lc}/><circle cx="183" cy="76" r="1.5" fill="#1F2328"/><circle cx="217" cy="76" r="1.5" fill="#1F2328"/></g>`;
    case "sick": // xx
      return `<g class="eyes"><g stroke="#1F2328" stroke-width="2.2" stroke-linecap="round"><line x1="177" y1="71" x2="189" y2="83"/><line x1="189" y1="71" x2="177" y2="83"/><line x1="211" y1="71" x2="223" y2="83"/><line x1="223" y1="71" x2="211" y2="83"/></g></g>`;
    default:
      return `<g class="eyes">${dot(183, 76)}${dot(217, 76)}<circle cx="184.5" cy="74.5" r="0.9" fill="white" opacity="0.9"/><circle cx="218.5" cy="74.5" r="0.9" fill="white" opacity="0.9"/></g>`;
  }
}

function mouth(mood) {
  const s = `stroke="#1F2328" stroke-width="1.8" stroke-linecap="round" fill="none"`;
  switch (mood) {
    case "happy":
      return `<path d="M192 94 q8 8 16 0" ${s}/>`;
    case "excited":
      return `<path d="M190 92 q8 14 20 0 q-10 4 -20 0 Z" fill="#1F2328" stroke="#1F2328" stroke-width="1.4" stroke-linejoin="round"/><path d="M192 98 q8 4 16 0" stroke="white" stroke-width="1" fill="none" opacity="0.9"/>`;
    case "hungry":
      return `<ellipse cx="200" cy="95" rx="9" ry="7" fill="#1F2328" stroke="#1F2328"/><ellipse cx="200" cy="97.5" rx="4.5" ry="2.2" fill="#FF8182"/>`;
    case "sad":
      return `<path d="M192 98 q8 -6 16 0" ${s}/>`;
    case "sick":
      return `<path d="M190 94 q4 4 8 0 q4 4 8 0" ${s}/>`;
    case "sleepy":
      return `<ellipse cx="200" cy="95" rx="4.5" ry="3.2" fill="#1F2328" opacity="0.9"/>`;
    default:
      return `<path d="M192 94 q8 6 16 0" ${s}/>`;
  }
}

function body(stage) {
  const c = getStageColor(stage);
  const sc = STROKES[stage] || STROKES.egg;
  switch (stage) {
    case "egg":
      return `
      <ellipse cx="200" cy="88" rx="30" ry="38" fill="${c}" stroke="${sc}" stroke-width="2"/>
      <ellipse cx="190" cy="68" rx="7" ry="9" fill="white" opacity="0.55"/>
      <path d="M184 98 l6 8 l7 -5 l6 6 l7 -4" fill="none" stroke="${sc}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      <ellipse cx="200" cy="121" rx="2.2" ry="1.4" fill="${sc}" opacity="0.25"/>`;
    case "baby":
      return `
      <g>
        <circle cx="178" cy="62" r="13" fill="${c}" stroke="${sc}" stroke-width="1.8"/>
        <circle cx="222" cy="62" r="13" fill="${c}" stroke="${sc}" stroke-width="1.8"/>
        <circle cx="178" cy="62" r="5" fill="#FF8FA3" opacity="0.9"/>
        <circle cx="222" cy="62" r="5" fill="#FF8FA3" opacity="0.9"/>
        <rect x="168" y="52" width="64" height="52" rx="20" fill="${c}" stroke="${sc}" stroke-width="2"/>
        <ellipse cx="188" cy="66" rx="5" ry="6" fill="white" opacity="0.5"/>
      </g>`;
    case "child":
      return `
      <g>
        <path d="M168 58 l12 -14 l10 12 Z" fill="${c}" stroke="${sc}" stroke-width="1.7" stroke-linejoin="round"/>
        <path d="M212 58 l12 -14 l10 12 Z" fill="${c}" stroke="${sc}" stroke-width="1.7" stroke-linejoin="round"/>
        <path d="M172 54 l6 -6 l5 6 Z" fill="#FF8FA3"/>
        <path d="M222 54 l6 -6 l5 6 Z" fill="#FF8FA3"/>
        <rect x="158" y="50" width="84" height="62" rx="22" fill="${c}" stroke="${sc}" stroke-width="2"/>
        <ellipse cx="180" cy="66" rx="7" ry="9" fill="white" opacity="0.45"/>
        <circle cx="200" cy="108" r="2.2" fill="white" opacity="0.35"/>
      </g>`;
    case "teen":
      return `
      <g>
        <path d="M164 54 l8 -12 l8 10 l8 -12 l8 12 l8 -12 l8 10 l8 -12 l8 12" fill="${sc}" stroke="${sc}" stroke-linejoin="round"/>
        <rect x="154" y="50" width="92" height="68" rx="20" fill="${c}" stroke="${sc}" stroke-width="2"/>
        <path d="M162 60 l10 -10 l8 8 Z" fill="${c}" stroke="${sc}" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M228 60 l10 -10 l8 8 Z" fill="${c}" stroke="${sc}" stroke-width="1.4" stroke-linejoin="round"/>
        <ellipse cx="176" cy="68" rx="8" ry="10" fill="white" opacity="0.32"/>
        <path d="M172 108 q6 6 12 0 q6 6 12 0 q6 6 12 0 q6 6 12 0" fill="${c}" stroke="${sc}" stroke-width="1.6" stroke-linecap="round"/>
      </g>`;
    case "legendary":
      return `
      <g>
        <path d="M175 44 l9 -16 l14 11 l14 -11 l9 16 Z" fill="#FFC300" stroke="#C89B00" stroke-width="1.6" stroke-linejoin="round"/>
        <circle cx="200" cy="33" r="4.5" fill="white" stroke="#C89B00" stroke-width="1"/>
        <circle cx="183" cy="38" r="2.2" fill="white" stroke="#C89B00" stroke-width="1"/>
        <circle cx="217" cy="38" r="2.2" fill="white" stroke="#C89B00" stroke-width="1"/>
        <rect x="145" y="44" width="110" height="74" rx="24" fill="${c}" stroke="${sc}" stroke-width="2"/>
        <path d="M154 58 l10 -12 l8 10 Z" fill="${c}" stroke="${sc}" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M236 58 l10 -12 l8 10 Z" fill="${c}" stroke="${sc}" stroke-width="1.4" stroke-linejoin="round"/>
        <ellipse cx="168" cy="62" rx="9" ry="11" fill="white" opacity="0.35"/>
        <g fill="${c}" stroke="${sc}" stroke-width="1.6">
          <rect x="152" y="104" width="22" height="18" rx="9"/><rect x="178" y="104" width="22" height="20" rx="9"/><rect x="204" y="104" width="22" height="20" rx="9"/><rect x="230" y="104" width="22" height="18" rx="9"/>
          <circle cx="163" cy="122" r="3" fill="white" opacity="0.5" stroke="none"/><circle cx="189" cy="124" r="3" fill="white" opacity="0.5" stroke="none"/><circle cx="215" cy="124" r="3" fill="white" opacity="0.5" stroke="none"/><circle cx="241" cy="122" r="3" fill="white" opacity="0.5" stroke="none"/>
        </g>
        <g fill="white" opacity="0.9"><text x="128" y="52" font-size="11">*</text><text x="262" y="48" font-size="9">*</text><text x="268" y="68" font-size="7">*</text></g>
      </g>`;
    case "adult":
    default:
      return `
      <g>
        <path d="M158 56 l12 -14 l10 12 Z" fill="${c}" stroke="${sc}" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M230 56 l12 -14 l10 12 Z" fill="${c}" stroke="${sc}" stroke-width="1.6" stroke-linejoin="round"/>
        <rect x="150" y="46" width="100" height="72" rx="22" fill="${c}" stroke="${sc}" stroke-width="2"/>
        <ellipse cx="170" cy="64" rx="8" ry="11" fill="white" opacity="0.32"/>
        <g fill="${c}" stroke="${sc}" stroke-width="1.6">
          <rect x="156" y="104" width="20" height="16" rx="8"/><rect x="179" y="104" width="20" height="18" rx="8"/><rect x="202" y="104" width="20" height="18" rx="8"/><rect x="225" y="104" width="20" height="16" rx="8"/>
        </g>
        <!-- octocat face highlight -->
        <circle cx="200" cy="108" r="1.6" fill="white" opacity="0.25"/>
      </g>`;
  }
}

function bar(label, value, color, x, y) {
  const v = clamp01(value);
  const w = 86;
  const fillW = Math.round((v / 100) * (w - 2));
  return `
  <g>
    <text x="${x}" y="${y - 4}" font-size="6.5" font-weight="700" letter-spacing="0.6" fill="#656D76" font-family="system-ui,-apple-system,Segoe UI,Helvetica,Arial,sans-serif">${label}</text>
    <rect x="${x}" y="${y}" width="${w}" height="8" rx="4" fill="#EAEFF2" stroke="#D0D7DE" stroke-width="1"/>
    <rect x="${x + 1}" y="${y + 1}" width="${fillW}" height="6" rx="3" fill="${color}"/>
  </g>`;
}

export function renderPet(state = {}) {
  const rawStage = String(state.stage || "egg").toLowerCase();
  const stage = (rawStage === "master" ? "legendary" : rawStage) in COLORS ? (rawStage === "master" ? "legendary" : rawStage) : "egg";
  const rawMood = String(state.mood || state.Mood || "happy").toLowerCase();
  const mood = MOODS.has(rawMood) ? rawMood : "happy";
  const labelMood = state.stage === "egg" ? "egg" : mood;
  const name = esc(state.name || "Mochi");
  const level = Number.isFinite(state.level) ? state.level : 1;
  const hunger = clamp01(state.hunger ?? 50);
  const happiness = clamp01(state.happiness ?? 50);
  const health = clamp01(state.health ?? 100);
  const streak = Math.max(0, Number(state.streak) || 0);

  const bobDur = mood === "excited" ? "0.85s" : mood === "sleepy" ? "3.2s" : mood === "sick" ? "3.8s" : mood === "sad" ? "2.8s" : "2.2s";

  const cheeks = `<g opacity="0.95"><circle cx="176" cy="92" r="6.5" fill="#FF8FA3" opacity="0.42"/><circle cx="224" cy="92" r="6.5" fill="#FF8FA3" opacity="0.42"/></g>`;

  const streakEl =
    streak > 0
      ? `<g transform="translate(292,14)">
        <rect x="0" y="0" width="92" height="22" rx="11" fill="#FFF8C5" stroke="#D4A017" stroke-width="1.2"/>
        <g transform="translate(8,4)"><path d="M8 14 C8 7 4 4 8 0 C10 3 14 5 14 8.5 C14 12 11 14 8 14 Z" fill="#FF7B72" stroke="#CF222E" stroke-width="1" stroke-linejoin="round"/><path d="M8 11.5 C8 9 6.5 7.2 8 4.5 C9 6 11 7 11 9 C11 10.6 9.6 11.5 8 11.5 Z" fill="#FFD33D"/></g>
        <text x="26" y="14.5" font-size="10" font-weight="800" fill="#7D4E00" font-family="system-ui,-apple-system,Segoe UI,Helvetica,Arial,sans-serif">${streak} day streak</text>
      </g>`
      : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200" role="img" aria-label="${name} level ${level} ${stage} ${labelMood}">
<style>
  .bob{animation:bob ${bobDur} ease-in-out infinite;transform-origin:200px 90px}
  @keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
  .blink{animation:blink 4.2s infinite;transform-origin:200px 78px}
  @keyframes blink{0%,90%,100%{transform:scaleY(1)}92%,94%{transform:scaleY(0.08)}}
  @keyframes flame{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.12)}}
  @media (prefers-reduced-motion:reduce){.bob,.blink{animation:none}}
</style>
<rect width="400" height="200" rx="12" fill="#FFFFFF" stroke="#D0D7DE" stroke-width="1.2"/>
${streakEl}
<!-- shadow -->
<ellipse cx="200" cy="130" rx="44" ry="6.5" fill="#000" opacity="0.08"/>
<g class="bob">
  ${body(stage)}
  ${cheeks}
  <g class="blink">${eyes(mood)}</g>
  ${mouth(mood)}
</g>
<text x="200" y="148" text-anchor="middle" font-size="13" font-weight="800" fill="#1F2328" font-family="system-ui,-apple-system,Segoe UI,Helvetica,Arial,sans-serif">${name} — Lv.${level}</text>
<text x="200" y="161" text-anchor="middle" font-size="7.5" font-weight="600" letter-spacing="0.7" fill="#656D76" font-family="system-ui,-apple-system,Segoe UI,Helvetica,Arial,sans-serif">${stage.toUpperCase()} • ${labelMood.toUpperCase()}</text>
${bar("HUNGER", hunger, "#FF7B72", 55, 172)}
${bar("HAPPY", happiness, "#7EE787", 157, 172)}
${bar("HEALTH", health, "#58A6FF", 259, 172)}
</svg>`;
}

export default renderPet;
