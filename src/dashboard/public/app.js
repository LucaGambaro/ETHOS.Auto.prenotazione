const OUTCOMES = {
  booked: { label: "Prenotata", tone: "ok", title: "Sessione prenotata" },
  already_booked: { label: "Già presa", tone: "warn", title: "Sessione già prenotata" },
  full: { label: "Completa", tone: "warn", title: "Sessioni al completo" },
  no_sessions: { label: "Nessuna", tone: "warn", title: "Nessuna sessione disponibile" },
  error: { label: "Errore", tone: "error", title: "Errore durante la prenotazione" },
};

const dateFormat = new Intl.DateTimeFormat("it-IT", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Europe/Rome",
});
const dateTimeFormat = new Intl.DateTimeFormat("it-IT", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Rome",
});

let state = null;
let saving = false;
let toastTimer = null;

const $ = (id) => document.getElementById(id);

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function showToast(message, isError = false) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function formatIsoDate(iso) {
  return dateFormat.format(new Date(`${iso}T12:00:00`));
}

function renderNext(next) {
  const target = $("next-target");
  if (next === null) {
    $("next-day").textContent = "Nessuna";
    $("next-meta").textContent = "Attiva almeno un giorno per iniziare.";
    target.hidden = true;
    return;
  }
  $("next-day").textContent = next.label;
  $("next-meta").textContent = `Alle ${next.openTime} · ${formatIsoDate(next.runDate)}`;
  target.hidden = false;
  target.replaceChildren(
    document.createTextNode("Prenoterà la sessione di "),
    el("strong", "", formatIsoDate(next.targetDate)),
  );
}

function renderDays(days) {
  const list = $("days");
  list.replaceChildren(
    ...days.map((day) => {
      const item = el("li");
      const button = el("button", "day");
      button.type = "button";
      button.setAttribute("role", "switch");
      button.setAttribute("aria-checked", String(day.enabled));
      button.dataset.day = day.key;

      const name = el("span", "day-name", day.label);
      const time = el("span", "day-time", `Apre alle ${day.openTime}`);
      const title = el("span");
      title.append(name, time);
      const head = el("span", "day-head");
      head.append(title, el("span", "switch"));

      button.append(head, el("span", "day-state", day.enabled ? "Prenotazione attiva" : "Non prenotare"));
      button.addEventListener("click", () => toggleDay(day.key));
      item.append(button);
      return item;
    }),
  );

  const sunday = el("li");
  const sundayButton = el("button", "day");
  sundayButton.type = "button";
  sundayButton.disabled = true;
  const sundayHead = el("span", "day-head");
  sundayHead.append(el("span", "day-name", "Domenica"));
  sundayButton.append(sundayHead, el("span", "day-state", "Nessuna sessione"));
  sunday.append(sundayButton);
  list.append(sunday);
}

function renderHistory(history) {
  $("stat-booked").textContent = String(history.filter((h) => h.outcome === "booked").length);
  $("stat-issues").textContent = String(
    history.filter((h) => h.outcome === "error" || h.outcome === "full").length,
  );

  const list = $("history");
  if (history.length === 0) {
    list.replaceChildren(el("li", "empty", "Ancora nessuna prenotazione registrata."));
    return;
  }

  list.replaceChildren(
    ...history.map((entry) => {
      const outcome = OUTCOMES[entry.outcome];
      const item = el("li", "entry");
      item.append(
        el("span", `badge badge-${outcome.tone}`, outcome.label),
        el(
          "span",
          "entry-title",
          entry.sessionTime
            ? `${formatIsoDate(entry.targetDate)} · ${entry.sessionTime}`
            : formatIsoDate(entry.targetDate),
        ),
        el("span", "entry-meta", `${outcome.title} · ${dateTimeFormat.format(new Date(entry.at))}`),
      );
      return item;
    }),
  );
}

function render(overview) {
  state = overview;
  renderNext(overview.next);
  renderDays(overview.days);
  renderHistory(overview.history);
}

async function request(url, options) {
  const res = await fetch(url, options);
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? `Errore ${res.status}`);
  return body;
}

async function toggleDay(key) {
  if (saving || state === null) return;
  saving = true;

  const days = Object.fromEntries(
    state.days.map((d) => [d.key, d.key === key ? !d.enabled : d.enabled]),
  );
  try {
    render(
      await request("/api/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ days }),
      }),
    );
    showToast("Salvato");
  } catch (err) {
    showToast(err.message, true);
  } finally {
    saving = false;
    document.querySelector(`[data-day="${key}"]`)?.focus();
  }
}

request("/api/overview")
  .then(render)
  .catch((err) => {
    $("next-meta").textContent = "Impossibile caricare i dati.";
    showToast(err.message, true);
  });
