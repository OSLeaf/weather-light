// schema.js

const CATEGORIES = [
  { id: "rain", label: "What the lamp reports" },
  { id: "input", label: "Pick-up, buttons & gestures" },
  { id: "channels", label: "How the lamp tells you" },
];

// Option constructors
const toggle = (id, cat, label, def) => ({
  id,
  cat,
  label,
  type: "toggle",
  def,
});
const select = (id, cat, label, values, def) => ({
  id,
  cat,
  label,
  type: "select",
  values,
  def,
});
const multi = (id, cat, label, values, def) => ({
  id,
  cat,
  label,
  type: "multi",
  values,
  def,
});
const range = (id, cat, label, min, max, step, unit, def) => ({
  id,
  cat,
  label,
  type: "range",
  min,
  max,
  step,
  unit,
  def,
});
const color = (id, cat, label, def) => ({ id, cat, label, type: "color", def });
const time = (id, cat, label, def) => ({ id, cat, label, type: "time", def });
// A gate is a yes/no question about adding hardware; default is "no"
const gate = (id, cat, label) => ({
  id,
  cat,
  label,
  type: "toggle",
  def: false,
  gate: true,
});

// Shared value lists (values must not contain the characters | & used in NEEDS)
const ACTIONS = [
  "none",
  "show forecast",
  "show tomorrow",
  "torch",
  "mute alerts",
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CH = {
  light: "light",
  vib: "vibration",
  snd: "beep / melody",
  voice: "spoken message",
};
const CH_ALL = Object.values(CH);
const T = {
  soon: "rain is about to start",
  stopped: "rain has stopped",
  dry: "a dry window opens",
};
const ENC = {
  two: "two states (rain / dry)",
  three: "three states (rain / maybe / dry)",
};

const OPTIONS = [
  // --- What the lamp reports ---
  select(
    "rainSensitivity",
    "rain",
    "How sensitive should the lamp be to rain?",
    ["cautious (warn on any chance)", "balanced", "only when likely", "custom"],
    "balanced",
  ),
  range(
    "rainThreshold",
    "rain",
    "Rain counts from this probability",
    5,
    95,
    5,
    "%",
    50,
  ),
  select(
    "minIntensity",
    "rain",
    "...and at least this much rain",
    ["any", "light", "moderate", "heavy"],
    "any",
  ),
  multi(
    "precipTypes",
    "rain",
    "Counts as rain",
    ["rain", "drizzle", "snow", "sleet", "hail", "thunderstorm"],
    ["rain", "drizzle", "thunderstorm"],
  ),
  select(
    "lookAhead",
    "rain",
    "Look-ahead window",
    ["1 h", "3 h", "6 h", "until evening", "until midnight", "24 h"],
    "6 h",
  ),
  toggle(
    "shortShowerFilter",
    "rain",
    "Ignore showers shorter than 15 min",
    false,
  ),
  multi(
    "extraSignals",
    "rain",
    "Besides rain, also warn about",
    [
      "storm / lightning",
      "strong wind",
      "UV",
      "freezing / ice",
      "heat",
      "air quality",
      "pollen",
      "temperature tint",
      "sunset",
    ],
    [],
  ),

  // --- Pick-up, buttons & gestures ---
  select(
    "pickupShows",
    "input",
    "Picking up the lamp shows the forecast",
    [
      "every pick-up",
      "first pick-up of the day",
      "only in the morning window",
      "only when it matters (rain or warning)",
    ],
    "every pick-up",
  ),
  time("morningStart", "input", "Morning window starts", "06:00"),
  time("morningEnd", "input", "Morning window ends", "10:00"),
  toggle(
    "eveningShowsTomorrow",
    "input",
    "In the evening (after 18:00), pick-up shows tomorrow's forecast",
    false,
  ),
  select("actionShake", "input", "Shake the lamp", ACTIONS, "none"),
  gate("hasButton", "input", "Add a physical button to the lamp?"),
  select("actionSingle", "input", "Single press", ACTIONS, "show forecast"),
  select("actionDouble", "input", "Double press", ACTIONS, "show tomorrow"),
  select("actionLong", "input", "Long press", ACTIONS, "torch"),
  toggle("pocketLock", "input", "Prevent accidental presses in pocket", true),

  // --- How the lamp tells you ---
  multi(
    "pickupChannels",
    "channels",
    "When you pick the lamp up, tell me by",
    CH_ALL,
    [CH.light],
  ),

  // alerts
  toggle(
    "alertsOn",
    "channels",
    "Alerts: the lamp signals by itself, without being picked up",
    false,
  ),
  multi("alertTriggers", "channels", "Alert me when", Object.values(T), [
    T.soon,
  ]),
  multi("alertChannels", "channels", "For alerts, tell me by", CH_ALL, [
    CH.light,
  ]),
  range(
    "nowcastMinutes",
    "channels",
    "Minutes of warning before rain starts",
    5,
    60,
    5,
    "min",
    15,
  ),
  select(
    "dryWindowMin",
    "channels",
    "A dry window means at least",
    ["30 min", "1 h", "2 h", "4 h"],
    "1 h",
  ),
  time("alertFrom", "channels", "Alerts allowed from", "06:00"),
  time("alertUntil", "channels", "Alerts allowed until", "22:00"),
  multi("activeDays", "channels", "Alert days", DAYS, DAYS.slice(0, 5)),
  toggle(
    "severeOverride",
    "channels",
    "Severe warnings ignore the allowed hours",
    true,
  ),
  select(
    "repeatAlerts",
    "channels",
    "Repeat alerts",
    ["once per day", "on every change", "hourly while raining"],
    "once per day",
  ),

  // light
  select(
    "lightEncoding",
    "channels",
    "Light shows the forecast as",
    [
      ENC.two,
      ENC.three,
      "probability by brightness",
      "probability by color gradient",
      "probability by blink count",
      "colors in sequence for the next hours",
      "time until rain starts or ends",
    ],
    ENC.two,
  ),
  color("colorRain", "channels", "Light color: rain", "#2f7bff"),
  color("colorDry", "channels", "Light color: dry", "#ffd23f"),
  color("colorMaybe", "channels", "Light color: maybe", "#ff9f1c"),
  range("brightness", "channels", "Light brightness", 5, 100, 5, "%", 70),
  gate(
    "hasLightSensor",
    "channels",
    "Add an ambient light sensor (auto-dim in the dark)?",
  ),
  select(
    "animation",
    "channels",
    "Light animation",
    ["solid", "pulse", "breathe", "blink", "rain drops", "gradient sweep"],
    "solid",
  ),
  select(
    "idleState",
    "channels",
    "Light when not in use",
    ["off", "faint glow", "slow breathing"],
    "off",
  ),
  range("lightDuration", "channels", "Light stays on for", 1, 30, 1, "s", 5),
  select(
    "colorblindMode",
    "channels",
    "Color-blind mode",
    ["off", "blue/orange", "blue/yellow", "blink patterns instead of colors"],
    "off",
  ),

  // vibration
  select(
    "vibrationPattern",
    "channels",
    "Vibration pattern",
    [
      "short buzz",
      "double buzz",
      "long buzz",
      "count = forecast (rain = 3 buzzes)",
    ],
    "short buzz",
  ),
  range("vibrationStrength", "channels", "Vibration strength", 1, 5, 1, "", 3),

  // sound and voice
  select(
    "soundType",
    "channels",
    "Sound",
    [
      "short beep",
      "two beeps",
      "melody",
      "rain sound",
      "different sound per forecast",
    ],
    "short beep",
  ),
  select(
    "spokenStyle",
    "channels",
    "Spoken message",
    [
      'short ("rain today")',
      "full forecast",
      "with temperature",
      "with time rain starts",
    ],
    'short ("rain today")',
  ),
  range("volume", "channels", "Volume", 0, 100, 10, "%", 40),
];

// ---------- Visibility rules ----------
// An option with a NEEDS entry is shown only while its condition holds. Syntax:
//   'gateId'      boolean option is on
//   'id:value'    select equals value, or multi contains value
//   'a|b'         any of (OR)        'a&b'   all of (AND, binds tighter than OR)
function parseCond(cond) {
  const i = cond.indexOf(":");
  return i < 0
    ? { id: cond }
    : { id: cond.slice(0, i), val: cond.slice(i + 1) };
}

// A channel counts when picked for pick-up, or picked for alerts while alerts are on
const anyCh = (...vals) =>
  vals
    .flatMap((v) => [`pickupChannels:${v}`, `alertsOn&alertChannels:${v}`])
    .join("|");
const anyTrigger = Object.values(T)
  .map((v) => `alertTriggers:${v}`)
  .join("|");
// cond AND (a OR b)  ->  (cond&a) OR (cond&b)
const both = (cond, orExpr) =>
  orExpr
    .split("|")
    .map((c) => `${cond}&${c}`)
    .join("|");

const LIGHT = anyCh(CH.light);

const NEEDS = {
  rainThreshold: "rainSensitivity:custom",
  minIntensity: "rainSensitivity:custom",

  morningStart: "pickupShows:only in the morning window",
  morningEnd: "pickupShows:only in the morning window",
  actionSingle: "hasButton",
  actionDouble: "hasButton",
  actionLong: "hasButton",
  pocketLock: "hasButton",

  alertTriggers: "alertsOn",
  alertChannels: "alertsOn",
  nowcastMinutes: `alertsOn&alertTriggers:${T.soon}`,
  dryWindowMin: `alertsOn&alertTriggers:${T.dry}`,
  alertFrom: both("alertsOn", anyTrigger),
  alertUntil: both("alertsOn", anyTrigger),
  activeDays: both("alertsOn", anyTrigger),
  severeOverride: both("alertsOn", anyTrigger),
  repeatAlerts: both("alertsOn", anyTrigger),

  lightEncoding: LIGHT,
  colorRain: LIGHT,
  colorDry: LIGHT,
  brightness: LIGHT,
  hasLightSensor: LIGHT,
  animation: LIGHT,
  idleState: LIGHT,
  lightDuration: LIGHT,
  colorblindMode: LIGHT,
  colorMaybe: both(`lightEncoding:${ENC.three}`, LIGHT),

  vibrationPattern: anyCh(CH.vib),
  vibrationStrength: anyCh(CH.vib),
  soundType: anyCh(CH.snd),
  spokenStyle: anyCh(CH.voice),
  volume: anyCh(CH.snd, CH.voice),
};

// ---------- Tooltips (plain text, shown when hovering an option's label) ----------
const HINTS = {
  // What the lamp reports
  rainSensitivity:
    "How readily the lamp calls it 'rain'. Cautious warns even on a small chance (about 20%), balanced at about 50%, only when likely at about 70%. Custom lets you choose the numbers yourself.",
  rainThreshold:
    "The forecast chance of rain, in percent, from which the lamp shows rain. Lower means more warnings, higher means fewer false alarms.",
  minIntensity:
    "Ignore rain lighter than this, for example a faint drizzle you would not bother about.",
  precipTypes: "Which kinds of precipitation count as rain for the lamp.",
  lookAhead:
    "How far ahead the lamp looks. A short window answers 'will I get wet soon', a long one 'will it rain at all today'.",
  shortShowerFilter:
    "Skips showers that are forecast to last less than 15 minutes.",
  extraSignals:
    "Other weather the lamp could warn about besides rain. Each extra warning is one more thing to learn to read on a tiny lamp.",

  // Pick-up, buttons & gestures
  pickupShows:
    "When the lamp shows the forecast after being picked up. Limiting it avoids the lamp reacting every time the keys are moved.",
  morningStart:
    "Start of the morning window in which picking up the lamp shows the forecast.",
  morningEnd:
    "End of the morning window in which picking up the lamp shows the forecast.",
  eveningShowsTomorrow:
    "After 18:00 a pick-up shows tomorrow's weather instead of today's.",
  actionShake:
    "What happens when the lamp is shaken. 'none' means shaking does nothing.",
  hasButton:
    "The basic lamp has no button and only reacts to being picked up. Answer yes if a physical button would be useful to you.",
  actionSingle: "What a single press of the button does.",
  actionDouble: "What a quick double press of the button does.",
  actionLong: "What pressing and holding the button does.",
  pocketLock:
    "Ignores presses made by accident, for example in a pocket or bag.",

  // How the lamp tells you
  pickupChannels:
    "How the lamp tells you the forecast when you pick it up. Several can be combined.",
  alertsOn:
    "Alerts mean the lamp signals by itself, without being picked up, for example when rain is about to start. When off, the lamp only answers when picked up.",
  alertTriggers: "Which situations make the lamp signal by itself.",
  alertChannels:
    "How the lamp tells you about an alert. Several can be combined.",
  nowcastMinutes: "How many minutes before rain starts the alert should come.",
  dryWindowMin:
    "How long a rain-free period must be forecast before the lamp tells you it is a good time to go out.",
  alertFrom:
    "Alerts are only given inside these hours, so nothing buzzes or lights up at night.",
  alertUntil:
    "Alerts are only given inside these hours, so nothing buzzes or lights up at night.",
  activeDays: "The days of the week on which alerts are given.",
  severeOverride:
    "Dangerous weather warnings are given even outside the allowed hours.",
  repeatAlerts:
    "How often the lamp repeats an alert while the situation lasts.",

  lightEncoding:
    "How the light shows the forecast. Two states: one color for rain, one for dry. Three states adds 'maybe'. The others show how likely rain is, or when it starts, with brightness, color, blinks or a sequence of colors.",
  colorRain: "The color the light shows when rain is expected.",
  colorDry: "The color the light shows when it stays dry.",
  colorMaybe: "The color the light shows when rain is possible but not likely.",
  brightness: "How bright the light is.",
  hasLightSensor:
    "A small sensor that dims the light in the dark and brightens it in daylight. Answer yes if you would want that.",
  animation:
    "How the light moves: steady, pulsing, breathing, blinking, falling drops or a sweeping gradient.",
  idleState:
    "What the light does when nothing is happening. A faint glow lets you see the state at a glance.",
  lightDuration:
    "How many seconds the light stays on after showing the forecast.",
  colorblindMode:
    "Colors adjusted so they stay easy to tell apart, or blink patterns instead of colors.",

  vibrationPattern:
    "The pattern of the buzz. The count option buzzes more often for worse weather.",
  vibrationStrength: "How strong the buzz feels.",
  soundType:
    "The sound used to tell you the forecast. 'Different sound per forecast' uses one sound for rain and another for dry.",
  spokenStyle:
    "What the lamp says aloud: a short phrase, the full forecast, and so on.",
  volume: "How loud sounds and spoken messages are.",
};

// ---------- Derived helpers ----------
const OPTION_BY_ID = Object.fromEntries(OPTIONS.map((o) => [o.id, o]));
OPTIONS.forEach((o) => {
  if (NEEDS[o.id]) o.needs = NEEDS[o.id];
  o.hint = HINTS[o.id];
});
const defaultState = () =>
  Object.fromEntries(OPTIONS.map((o) => [o.id, structuredClone(o.def)]));

// ---------- Guards against typos in the maps above ----------
console.assert(
  Object.keys(OPTION_BY_ID).length === OPTIONS.length,
  "schema.js: duplicate option id",
);
Object.keys(NEEDS).forEach((id) =>
  console.assert(OPTION_BY_ID[id], `schema.js: unknown id "${id}"`),
);
Object.entries(NEEDS).forEach(([owner, expr]) =>
  expr.split(/[|&]/).forEach((cond) => {
    const { id, val } = parseCond(cond);
    const o = OPTION_BY_ID[id];
    console.assert(o, `schema.js: ${owner} needs unknown id "${id}"`);
    if (o && val !== undefined && o.values) {
      console.assert(
        o.values.includes(val),
        `schema.js: ${owner} needs "${val}", not a value of "${id}"`,
      );
    }
  }),
);
OPTIONS.forEach((o) =>
  console.assert(o.hint, `schema.js: missing hint for "${o.id}"`),
);
Object.keys(HINTS).forEach((id) =>
  console.assert(OPTION_BY_ID[id], `schema.js: hint for unknown id "${id}"`),
);
