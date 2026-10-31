// app.js

const STORAGE_KEY = "raintester.v1";

/* ---------- Event bus: lets later scripts react without app.js knowing them ---------- */
const bus = (() => {
  const handlers = {};
  return {
    on(evt, fn) {
      (handlers[evt] ||= []).push(fn);
    },
    emit(evt, data) {
      (handlers[evt] || []).forEach((fn) => fn(data));
    },
  };
})();

/* ---------- Storage ---------- */
let db = { current: "anonymous", sessions: {} };
let session = null;

function loadDb() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (raw && raw.sessions) db = raw;
  } catch (e) {
    console.warn("Could not read saved data, starting fresh", e);
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.warn("Could not save data", e);
  }
}

const newSession = () => ({
  created: Date.now(),
  state: defaultState(),
  wants: {},
  events: [],
});

function setSession(rawId) {
  const id = (rawId || "").trim() || "anonymous";
  db.current = id;
  db.sessions[id] ||= newSession();
  session = db.sessions[id];
  // Options added to the schema after this session was created get their defaults
  session.state = { ...defaultState(), ...session.state };
  persist();
  renderOptions();
  document.getElementById("participant").value = id === "anonymous" ? "" : id;
  bus.emit("session", { id });
}

const getSession = () => session;
const getState = () => session.state;

/* ---------- Value updates ---------- */
function setValue(id, value) {
  session.state[id] = value;
  persist();
  applyGates(); // any value can change what is visible (gates, channels, pickupShows)
  bus.emit("input", { id, value });
}
function commit(id, value) {
  setValue(id, value);
  bus.emit("change", { id, value }); // committed: one per user decision
}
function announceChange(id) {
  bus.emit("change", { id, value: session.state[id] });
}

/* ---------- Rendering ---------- */
const fmt = (opt, v) => `${v}${opt.unit ? " " + opt.unit : ""}`;

function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

function buildControl(opt) {
  const wrap = el("div", { className: "control" });
  const val = session.state[opt.id];

  switch (opt.type) {
    case "toggle": {
      const input = el("input", { type: "checkbox", checked: !!val });
      input.onchange = () => commit(opt.id, input.checked);
      wrap.append(input);
      break;
    }
    case "select": {
      const select = el("select");
      opt.values.forEach((v) =>
        select.append(el("option", { value: v, textContent: v })),
      );
      select.value = val;
      select.onchange = () => commit(opt.id, select.value);
      wrap.append(select);
      break;
    }
    case "range": {
      const readout = el("span", {
        className: "value",
        textContent: fmt(opt, val),
      });
      const input = el("input", {
        type: "range",
        min: opt.min,
        max: opt.max,
        step: opt.step,
        value: val,
      });
      input.oninput = () => {
        readout.textContent = fmt(opt, input.value);
        setValue(opt.id, Number(input.value));
      };
      input.onchange = () => announceChange(opt.id);
      wrap.append(input, readout);
      break;
    }
    case "color": {
      const input = el("input", { type: "color", value: val });
      input.oninput = () => setValue(opt.id, input.value);
      input.onchange = () => announceChange(opt.id);
      wrap.append(input);
      break;
    }
    case "time": {
      const input = el("input", { type: "time", value: val });
      input.onchange = () => commit(opt.id, input.value);
      wrap.append(input);
      break;
    }
    case "text": {
      const input = el("input", { type: "text", value: val });
      input.oninput = () => setValue(opt.id, input.value);
      input.onchange = () => announceChange(opt.id);
      wrap.append(input);
      break;
    }
    case "multi": {
      const boxes = opt.values.map((v) => {
        const cb = el("input", {
          type: "checkbox",
          value: v,
          checked: val.includes(v),
        });
        cb.onchange = () => {
          // Rebuild in schema order so the stored array is stable
          commit(
            opt.id,
            boxes.filter((b) => b.checked).map((b) => b.value),
          );
        };
        wrap.append(
          el(
            "label",
            { style: "margin-right:8px;white-space:nowrap" },
            cb,
            " " + v,
          ),
        );
        return cb;
      });
      break;
    }
  }
  return wrap;
}

function buildWant(opt) {
  const wrap = el("div", { className: "want" });
  const up = el("button", { textContent: "👍", title: "I would want this" });
  const down = el("button", {
    textContent: "👎",
    title: "I would not want this",
  });

  const paint = () => {
    up.classList.toggle("on", session.wants[opt.id] === 1);
    down.classList.toggle("on", session.wants[opt.id] === -1);
  };
  const set = (v) => {
    if (session.wants[opt.id] === v)
      delete session.wants[opt.id]; // click again = clear
    else session.wants[opt.id] = v;
    persist();
    paint();
    bus.emit("want", { id: opt.id, value: session.wants[opt.id] ?? 0 });
  };
  up.onclick = () => set(1);
  down.onclick = () => set(-1);
  paint();
  wrap.append(up, down);
  return wrap;
}

function renderOption(opt) {
  const row = el("div", { className: opt.gate ? "option gate" : "option" });
  row.dataset.id = opt.id;

  const label = el("div", { className: "label", textContent: opt.label });
  if (opt.hint) {
    label.dataset.tip = opt.hint;
    label.tabIndex = 0; // keyboard focus shows the tooltip too
  }

  const control = buildControl(opt);
  if (opt.gate) {
    control.append(" Yes"); // gate = yes/no question, no 👍/👎
    row.append(label, control, el("div"));
  } else {
    row.append(label, control, buildWant(opt));
  }
  return row;
}
// True when the option's condition (see NEEDS in schema.js) is satisfied
function isVisible(opt) {
  if (!opt.needs) return true;
  const holds = (cond) => {
    const { id, val } = parseCond(cond);
    const v = session.state[id];
    if (val === undefined) return !!v;
    return Array.isArray(v) ? v.includes(val) : v === val;
  };
  // 'a|b' = any of, 'a&b' = all of; AND binds tighter than OR
  return opt.needs.split("|").some((group) => group.split("&").every(holds));
}

function applyGates() {
  document.querySelectorAll(".option").forEach((row) => {
    const opt = OPTION_BY_ID[row.dataset.id];
    row.classList.toggle("hidden", !isVisible(opt));
  });
}

function renderOptions() {
  const root = document.getElementById("options");
  root.replaceChildren();
  for (const cat of CATEGORIES) {
    const details = el(
      "details",
      { className: "category" },
      el("summary", { textContent: cat.label }),
    );
    details.addEventListener("toggle", () => {
      if (details.open) bus.emit("view", { cat: cat.id });
    });
    OPTIONS.filter((o) => o.cat === cat.id).forEach((o) =>
      details.append(renderOption(o)),
    );
    root.append(details);
  }
  applyGates();
}

/* ---------- Tabs ---------- */
function showTab(name) {
  document
    .getElementById("view-test")
    .classList.toggle("hidden", name !== "test");
  document
    .getElementById("view-results")
    .classList.toggle("hidden", name !== "results");
  document
    .getElementById("tab-test")
    .classList.toggle("active", name === "test");
  document
    .getElementById("tab-results")
    .classList.toggle("active", name === "results");
  bus.emit("tab", { name });
}
document.getElementById("tab-test").onclick = () => showTab("test");
document.getElementById("tab-results").onclick = () => showTab("results");

/* ---------- Participant switching ---------- */
document.getElementById("participant").onchange = (e) =>
  setSession(e.target.value);

/* ---------- Start ---------- */
loadDb();
setSession(db.current);
