/**
 * readme-pet interactive demo — a self-contained playground that renders the
 * pet SVG in the browser. Duplicates the stage colors + mood faces from
 * src/renderer.js and the feed / play / heal / tick deltas from src/engine.js.
 * Zero dependencies, no build step, works from any static file server.
 * @module demo/main
 */

/** @typedef {Object} PetState
 *  @property {string} name
 *  @property {string} stage - egg|baby|child|teen|adult|legendary
 *  @property {number} level
 *  @property {number} xp
 *  @property {number} hunger - 0 (full) to 100 (starving)
 *  @property {number} happiness - 0 to 100
 *  @property {number} health - 0 to 100
 *  @property {number} streak
 *  @property {number} totalCommits */

// — Design tokens: same palette as src/renderer.js —
/** @type {Record<string, {c: string, s: string}>} Stage fill + stroke colors. */
const STAGES = {
  egg: { c: '#F5E6C8', s: '#E2CFA8' },
  baby: { c: '#FFB5D1', s: '#F48FB1' },
  child: { c: '#C9A8FF', s: '#A67FF0' },
  teen: { c: '#7ED957', s: '#5DBB35' },
  adult: { c: '#57606A', s: '#3D444D' },
  legendary: { c: '#FFD700', s: '#C89B00' },
};
/** @type {Record<string, string>} Mood -> plain-text label. */
const MOODS = { happy: 'happy', hungry: 'hungry', sad: 'sad', sick: 'sick', sleepy: 'sleepy', excited: 'excited' };
/** @type {string[]} Name pool for breeding. */
const NAMES = ['Mochi', 'Pixel', 'Nibbles', 'Waffles', 'Socks', 'Gizmo', 'Miso', 'Biscuit', 'Sprinkle', 'Crumbs', 'Toffee', 'Bubbles'];
/** @type {Record<string, [number, number]>} Plausible level range per stage. */
const LEVEL_RANGES = { egg: [1, 2], baby: [3, 4], child: [5, 6], teen: [7, 9], adult: [10, 15], legendary: [16, 20] };
/** @type {string} Shared font stack from src/renderer.js. */
const FONT = 'system-ui,-apple-system,Segoe UI,Helvetica,Arial,sans-serif';

// — Helpers —
/** Clamp a number to [0, 100]. @param {number} n @returns {number} */
const clamp = (n) => Math.max(0, Math.min(100, n));
/** Escape text for SVG markup. @param {unknown} s @returns {string} */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** Random int in [min, max] inclusive. @param {number} min @param {number} max @returns {number} */
const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
/** Random element of an array. @param {unknown[]} a @returns {unknown} */
const pick = (a) => a[Math.floor(Math.random() * a.length)];
/**
 * Derive the pet's mood — same priority as PetEngine#getMood:
 * sick > hungry > sad > sleepy > excited > happy.
 * @param {Pick<PetState, 'hunger'|'happiness'|'health'>} s
 * @returns {keyof typeof MOODS}
 */
function getMood(s) {
  if (s.health < 30) return 'sick';
  if (s.hunger > 75) return 'hungry';
  if (s.happiness < 25) return 'sad';
  if (s.health < 60 && s.hunger > 50) return 'sleepy';
  if (s.happiness > 85 && s.hunger < 30 && s.health > 70) return 'excited';
  return 'happy';
}

// — SVG renderer: stage bodies + mood faces ported from src/renderer.js —
/** Eyes for a mood, centered around (200, 78), eyes at ±16. @param {string} mood @returns {string} */
function eyes(mood) {
  const lc = 'stroke="#1F2328" stroke-width="2.2" stroke-linecap="round" fill="none"';
  const dot = (x, y, r = 2.2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#1F2328"/>`;
  switch (mood) {
    case 'happy': return `<g class="eyes"><path d="M178 80 l6 -7 l6 7" ${lc}/><path d="M206 80 l6 -7 l6 7" ${lc}/></g>`;
    case 'excited': return `<g class="eyes"><path d="M177 80 l6 -8 l6 8" ${lc}/><path d="M205 80 l6 -8 l6 8" ${lc}/><circle cx="176" cy="70" r="1.3" fill="#FFD33D"/><circle cx="224" cy="70" r="1.3" fill="#FFD33D"/></g>`;
    case 'hungry': return `<g class="eyes"><line x1="176" y1="78" x2="190" y2="78" ${lc}/><line x1="210" y1="78" x2="224" y2="78" ${lc}/>${dot(183, 79, 1.6)}${dot(217, 79, 1.6)}</g>`;
    case 'sleepy': return `<g class="eyes"><path d="M176 79 h14" ${lc}/><path d="M210 79 h14" ${lc}/><text x="232" y="73" font-size="8" fill="#8B949E">z</text><text x="238" y="67" font-size="10" fill="#8B949E">z</text></g>`;
    case 'sad': return `<g class="eyes"><path d="M176 72 q7 12 14 0" ${lc}/><path d="M210 72 q7 12 14 0" ${lc}/>${dot(183, 76, 1.5)}${dot(217, 76, 1.5)}</g>`;
    case 'sick': return `<g class="eyes" stroke="#1F2328" stroke-width="2.2" stroke-linecap="round"><line x1="177" y1="71" x2="189" y2="83"/><line x1="189" y1="71" x2="177" y2="83"/><line x1="211" y1="71" x2="223" y2="83"/><line x1="223" y1="71" x2="211" y2="83"/></g>`;
    default: return `<g class="eyes">${dot(183, 76)}${dot(217, 76)}<circle cx="184.5" cy="74.5" r="0.9" fill="white" opacity="0.9"/><circle cx="218.5" cy="74.5" r="0.9" fill="white" opacity="0.9"/></g>`;
  }
}
/** Mouth for a mood, at (200, 94). @param {string} mood @returns {string} */
function mouth(mood) {
  const s = 'stroke="#1F2328" stroke-width="1.8" stroke-linecap="round" fill="none"';
  switch (mood) {
    case 'happy': return `<path d="M192 94 q8 8 16 0" ${s}/>`;
    case 'excited': return `<path d="M190 92 q8 14 20 0 q-10 4 -20 0 Z" fill="#1F2328" stroke="#1F2328" stroke-width="1.4" stroke-linejoin="round"/>`;
    case 'hungry': return `<ellipse cx="200" cy="95" rx="9" ry="7" fill="#1F2328"/><ellipse cx="200" cy="97.5" rx="4.5" ry="2.2" fill="#FF8182"/>`;
    case 'sad': return `<path d="M192 98 q8 -6 16 0" ${s}/>`;
    case 'sick': return `<path d="M190 94 q4 4 8 0 q4 4 8 0" ${s}/>`;
    case 'sleepy': return `<ellipse cx="200" cy="95" rx="4.5" ry="3.2" fill="#1F2328" opacity="0.9"/>`;
    default: return `<path d="M192 94 q8 6 16 0" ${s}/>`;
  }
}
/** Octocat body silhouette for a stage. @param {string} stage @returns {string} */
function body(stage) {
  const { c, s } = STAGES[stage] || STAGES.egg; // fill, stroke
  switch (stage) {
    case 'egg':
      return `<ellipse cx="200" cy="88" rx="30" ry="38" fill="${c}" stroke="${s}" stroke-width="2"/><ellipse cx="190" cy="68" rx="7" ry="9" fill="white" opacity="0.55"/><path d="M184 98 l6 8 l7 -5 l6 6 l7 -4" fill="none" stroke="${s}" stroke-width="1.6" stroke-linecap="round"/>`;
    case 'baby':
      return `<circle cx="178" cy="62" r="13" fill="${c}" stroke="${s}" stroke-width="1.8"/><circle cx="222" cy="62" r="13" fill="${c}" stroke="${s}" stroke-width="1.8"/><circle cx="178" cy="62" r="5" fill="#FF8FA3" opacity="0.9"/><circle cx="222" cy="62" r="5" fill="#FF8FA3" opacity="0.9"/><rect x="168" y="52" width="64" height="52" rx="20" fill="${c}" stroke="${s}" stroke-width="2"/><ellipse cx="188" cy="66" rx="5" ry="6" fill="white" opacity="0.5"/>`;
    case 'child':
      return `<path d="M168 58 l12 -14 l10 12 Z" fill="${c}" stroke="${s}" stroke-width="1.7" stroke-linejoin="round"/><path d="M212 58 l12 -14 l10 12 Z" fill="${c}" stroke="${s}" stroke-width="1.7" stroke-linejoin="round"/><path d="M172 54 l6 -6 l5 6 Z" fill="#FF8FA3"/><path d="M222 54 l6 -6 l5 6 Z" fill="#FF8FA3"/><rect x="158" y="50" width="84" height="62" rx="22" fill="${c}" stroke="${s}" stroke-width="2"/><ellipse cx="180" cy="66" rx="7" ry="9" fill="white" opacity="0.45"/><circle cx="200" cy="108" r="2.2" fill="white" opacity="0.35"/>`;
    case 'teen':
      return `<path d="M164 54 l8 -12 l8 10 l8 -12 l8 10 l8 -12 l8 10 l8 -12 l8 10" fill="${s}" stroke="${s}" stroke-linejoin="round"/><rect x="154" y="50" width="92" height="68" rx="20" fill="${c}" stroke="${s}" stroke-width="2"/><path d="M162 60 l10 -10 l8 8 Z" fill="${c}" stroke="${s}" stroke-width="1.4" stroke-linejoin="round"/><path d="M228 60 l10 -10 l8 8 Z" fill="${c}" stroke="${s}" stroke-width="1.4" stroke-linejoin="round"/><ellipse cx="176" cy="68" rx="8" ry="10" fill="white" opacity="0.32"/><path d="M172 108 q6 6 12 0 q6 6 12 0 q6 6 12 0 q6 6 12 0" fill="${c}" stroke="${s}" stroke-width="1.6" stroke-linecap="round"/>`;
    case 'legendary':
      return `<path d="M175 44 l9 -16 l14 11 l14 -11 l9 16 Z" fill="#FFC300" stroke="#C89B00" stroke-width="1.6" stroke-linejoin="round"/><circle cx="200" cy="33" r="4.5" fill="white" stroke="#C89B00" stroke-width="1"/><circle cx="183" cy="38" r="2.2" fill="white" stroke="#C89B00" stroke-width="1"/><circle cx="217" cy="38" r="2.2" fill="white" stroke="#C89B00" stroke-width="1"/><rect x="145" y="44" width="110" height="74" rx="24" fill="${c}" stroke="${s}" stroke-width="2"/><path d="M154 58 l10 -12 l8 10 Z" fill="${c}" stroke="${s}" stroke-width="1.4" stroke-linejoin="round"/><path d="M236 58 l10 -12 l8 10 Z" fill="${c}" stroke="${s}" stroke-width="1.4" stroke-linejoin="round"/><ellipse cx="168" cy="62" rx="9" ry="11" fill="white" opacity="0.35"/><g fill="${c}" stroke="${s}" stroke-width="1.6"><rect x="152" y="104" width="22" height="18" rx="9"/><rect x="178" y="104" width="22" height="20" rx="9"/><rect x="204" y="104" width="22" height="20" rx="9"/><rect x="230" y="104" width="22" height="18" rx="9"/></g><g fill="white" opacity="0.9"><text x="128" y="52" font-size="11">*</text><text x="262" y="48" font-size="9">*</text><text x="268" y="68" font-size="7">*</text></g>`;
    default: // adult
      return `<path d="M158 56 l12 -14 l10 12 Z" fill="${c}" stroke="${s}" stroke-width="1.6" stroke-linejoin="round"/><path d="M230 56 l12 -14 l10 12 Z" fill="${c}" stroke="${s}" stroke-width="1.6" stroke-linejoin="round"/><rect x="150" y="46" width="100" height="72" rx="22" fill="${c}" stroke="${s}" stroke-width="2"/><ellipse cx="170" cy="64" rx="8" ry="11" fill="white" opacity="0.32"/><g fill="${c}" stroke="${s}" stroke-width="1.6"><rect x="156" y="104" width="20" height="16" rx="8"/><rect x="179" y="104" width="20" height="18" rx="8"/><rect x="202" y="104" width="20" height="18" rx="8"/><rect x="225" y="104" width="20" height="16" rx="8"/></g>`;
  }
}
/** One stat bar (renderer palette). @param {string} label @param {number} v @param {string} color @param {number} x @param {number} y @returns {string} */
function bar(label, v, color, x, y) {
  const fillW = Math.round((clamp(v) / 100) * 84);
  return `<text x="${x}" y="${y - 4}" font-size="6.5" font-weight="700" letter-spacing="0.6" fill="#656D76" font-family="${FONT}">${label}</text><rect x="${x}" y="${y}" width="86" height="8" rx="4" fill="#EAEFF2" stroke="#D0D7DE" stroke-width="1"/><rect x="${x + 1}" y="${y + 1}" width="${fillW}" height="6" rx="3" fill="${color}"/>`;
}
/**
 * Render the full 400×200 pet artifact — same layout as src/renderer.js so a
 * screenshot is indistinguishable from a real README embed.
 * @param {PetState} st @returns {string} SVG markup
 */
function renderPet(st) {
  const stage = STAGES[st.stage] ? st.stage : 'egg';
  const mood = getMood(st);
  const bobDur = mood === 'excited' ? '0.85s' : mood === 'sleepy' ? '3.2s' : mood === 'sick' ? '3.8s' : mood === 'sad' ? '2.8s' : '2.2s';
  const cheeks = `<circle cx="176" cy="92" r="6.5" fill="#FF8FA3" opacity="0.42"/><circle cx="224" cy="92" r="6.5" fill="#FF8FA3" opacity="0.42"/>`;
  const streak = st.streak > 0
    ? `<g transform="translate(292,14)"><rect width="92" height="22" rx="11" fill="#FFF8C5" stroke="#D4A017" stroke-width="1.2"/><text x="46" y="14.5" text-anchor="middle" font-size="10" font-weight="800" fill="#7D4E00" font-family="${FONT}">[streak ${st.streak}]</text></g>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200" role="img" aria-label="${esc(st.name)} level ${st.level} ${stage} ${mood}">
<style>
.bob{animation:bob ${bobDur} ease-in-out infinite;transform-origin:200px 90px}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.blink{animation:blink 4.2s infinite;transform-origin:200px 78px}
@keyframes blink{0%,90%,100%{transform:scaleY(1)}92%,94%{transform:scaleY(0.08)}}
@media (prefers-reduced-motion:reduce){.bob,.blink{animation:none}}
</style>
<rect width="400" height="200" rx="12" fill="#FFFFFF" stroke="#D0D7DE" stroke-width="1.2"/>
${streak}
<ellipse cx="200" cy="130" rx="44" ry="6.5" fill="#000" opacity="0.08"/>
<g class="bob">${body(stage)}${cheeks}<g class="blink">${eyes(mood)}</g>${mouth(mood)}</g>
<text x="200" y="148" text-anchor="middle" font-size="13" font-weight="800" fill="#1F2328" font-family="${FONT}">${esc(st.name)} — Lv.${st.level}</text>
<text x="200" y="161" text-anchor="middle" font-size="7.5" font-weight="600" letter-spacing="0.7" fill="#656D76" font-family="${FONT}">${stage.toUpperCase()} • ${mood.toUpperCase()}</text>
${bar('HUNGER', st.hunger, '#FF7B72', 55, 172)}
${bar('HAPPY', st.happiness, '#7EE787', 157, 172)}
${bar('HEALTH', st.health, '#58A6FF', 259, 172)}
</svg>`;
}

// — Playground state + actions: same deltas as src/engine.js —
/** @type {PetState} Live pet state. */
const pet = { name: 'Mochi', stage: 'adult', level: 7, xp: 600, hunger: 60, happiness: 60, health: 60, streak: 12, totalCommits: 128 };
/** Update the tick log line. @param {string} msg @returns {void} */
function note(msg) {
  document.getElementById('tick-log').textContent = msg;
}
/** Feed: -30 hunger, +5 happiness. @returns {void} */
function feed() {
  pet.hunger = clamp(pet.hunger - 30);
  pet.happiness = clamp(pet.happiness + 5);
  note('[feed] fed — hunger -30, happiness +5');
}
/** Play: +20 happiness, +10 hunger. @returns {void} */
function play() {
  pet.happiness = clamp(pet.happiness + 20);
  pet.hunger = clamp(pet.hunger + 10);
  note('[play] played — happiness +20, hunger +10');
}
/** Heal: fully restore health. @returns {void} */
function heal() {
  pet.health = 100;
  note('[heal] healed — health restored to 100');
}
/** Simulate a day of GitHub activity (commits present 60% of the time). @returns {void} */
function tick() {
  if (Math.random() < 0.6) {
    pet.hunger = clamp(pet.hunger - 20);
    pet.happiness = clamp(pet.happiness + 15);
    pet.xp += 10;
    pet.streak += 1;
    pet.totalCommits += 1;
    note('[tick] day passed — commits! hunger -20, happiness +15, +10 XP');
  } else {
    pet.hunger = clamp(pet.hunger + 15);
    pet.happiness = clamp(pet.happiness - 10);
    pet.streak = 0;
    if (pet.hunger > 80) pet.health = clamp(pet.health - 5);
    note(`[tick] day passed — no commits${pet.hunger > 80 ? ', health -5' : ''}`);
  }
  pet.level = Math.floor(pet.xp / 100) + 1; // same rule as PetEngine#addXP
}
/** Breed a random pet for demo flair. @returns {void} */
function breed() {
  const stage = /** @type {keyof typeof STAGES} */ (pick(Object.keys(STAGES)));
  const [lo, hi] = LEVEL_RANGES[stage];
  pet.name = /** @type {string} */ (pick(NAMES));
  pet.stage = stage;
  pet.level = rnd(lo, hi);
  pet.xp = (pet.level - 1) * 100 + rnd(0, 99);
  pet.hunger = rnd(20, 90);
  pet.happiness = rnd(20, 90);
  pet.health = rnd(40, 100);
  pet.streak = rnd(0, 30);
  pet.totalCommits += rnd(0, 20);
  note(`[bred] bred ${pet.name} — a ${stage}!`);
}

// — Stats panel + wiring —
/** One HTML progress bar row. @param {string} label @param {number} v @param {string} color @returns {string} */
function statBar(label, v, color) {
  return `<div class="bar"><span class="lbl">${label}</span><span class="track"><i style="width:${clamp(v)}%;background:${color}"></i></span><span class="val">${Math.round(clamp(v))}%</span></div>`;
}
/** Re-render the pet SVG and the stats panel. @returns {void} */
function renderAll() {
  const mood = getMood(pet);
  document.getElementById('pet-slot').innerHTML = renderPet(pet);
  document.getElementById('chip').innerHTML =
    `<span>${esc(pet.name)}</span>` +
    `<span>Lv. <b>${pet.level}</b></span>` +
    `<span>${pet.stage} ${MOODS[mood]}</span>` +
    `<span>streak <b>${pet.streak}</b></span>` +
    `<span>${pet.totalCommits} commits</span>`;
  document.getElementById('bars').innerHTML =
    statBar('hunger', pet.hunger, '#FF7B72') +
    statBar('happiness', pet.happiness, '#7EE787') +
    statBar('health', pet.health, '#58A6FF');
}
/** Attach a click handler to an action button. @param {string} id @param {() => void} fn @returns {void} */
function wire(id, fn) {
  document.getElementById(id).addEventListener('click', () => {
    fn();
    renderAll();
  });
}
note('[demo] breed a new pet, or feed / play / heal — every action re-renders the SVG');
wire('feed', feed);
wire('play', play);
wire('heal', heal);
wire('tick', tick);
wire('breed', breed);
renderAll();

window.pet = pet; // exposed for tinkering from the browser console