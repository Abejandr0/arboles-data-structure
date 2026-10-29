const $ = (id) => document.getElementById(id);
const W = 200, Hn = 34, GX = 70, GY = 16;
let arbol, stats, modo = "diag", respuestas = [], ruta = [], actualId = null, selId = null;

async function api(url, method = "GET", body) {
  const r = await fetch(url, { method, headers: { "Content-Type": "application/json" },
                               body: body ? JSON.stringify(body) : undefined });
  return r.json();
}

function cargarEstado(d) {
  arbol = d.arbol; stats = d.stats;
  $("stats").textContent = `${stats.nodos} nodos · ${stats.hojas} causas · altura ${stats.altura}`;
}

async function diagnosticar() {
  const d = await api("/api/diagnosticar", "POST", { respuestas });
  ruta = d.ruta; actualId = ruta[ruta.length - 1];
  $("paso").textContent = d.es_hoja ? "Causa probable" : `Pregunta ${respuestas.length + 1}`;
  $("texto").textContent = d.texto;
  $("texto").classList.toggle("resultado", d.es_hoja);
  $("acciones").hidden = d.es_hoja;
  $("btn-atras").disabled = respuestas.length === 0;
  dibujar();
}

function layout(n, d = 0, c = { i: 0 }) {
  n._d = d;
  if (!n.si) { n._y = c.i++; return n; }
  layout(n.si, d + 1, c); layout(n.no, d + 1, c);
  n._y = (n.si._y + n.no._y) / 2; return n;
}

function dibujar() {
  const raiz = layout(JSON.parse(JSON.stringify(arbol)));
  const ns = "http://www.w3.org/2000/svg", svg = $("svg");
  svg.innerHTML = "";
  const px = (n) => n._d * (W + GX) + 10, py = (n) => n._y * (Hn + GY) + 10;
  let maxD = 0, maxY = 0;
  const el = (tag, attrs, parent) => {
    const e = document.createElementNS(ns, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    parent.appendChild(e); return e;
  };
  const edges = el("g", {}, svg), nodes = el("g", {}, svg);

  (function pintar(n) {
    maxD = Math.max(maxD, n._d); maxY = Math.max(maxY, n._y);
    if (n.si) for (const [h, etq] of [[n.si, "Sí"], [n.no, "No"]]) {
      const x1 = px(n) + W, y1 = py(n) + Hn / 2, x2 = px(h), y2 = py(h) + Hn / 2, mx = (x1 + x2) / 2;
      const on = modo === "diag" && ruta.includes(n.id) && ruta.includes(h.id);
      el("path", { d: `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`, class: "edge" + (on ? " on" : "") }, edges);
      el("text", { x: x2 - 22, y: y2 - 5, class: "etq" }, edges).textContent = etq;
      pintar(h);
    }
    const g = el("g", { class: "nodo" + (!n.si ? " hoja" : "") +
      (modo === "diag" && ruta.includes(n.id) ? " on" : "") +
      (modo === "diag" && n.id === actualId ? " actual" : "") +
      (modo === "edit" && n.id === selId ? " sel" : "") }, nodes);
    el("rect", { x: px(n), y: py(n), width: W, height: Hn }, g);
    const t = el("text", { x: px(n) + 10, y: py(n) + Hn / 2 + 4 }, g);
    t.textContent = n.texto.length > 29 ? n.texto.slice(0, 28) + "…" : n.texto;
    el("title", {}, g).textContent = n.texto;
    g.addEventListener("click", () => { if (modo === "edit") seleccionar(n.id); });
  })(raiz);

  svg.setAttribute("width", (maxD + 1) * (W + GX) + 20);
  svg.setAttribute("height", (maxY + 1) * (Hn + GY) + 20);
}

function buscar(n, id) { return n.id === id ? n : n.si ? buscar(n.si, id) || buscar(n.no, id) : null; }

function seleccionar(id) {
  selId = id; const n = buscar(arbol, id);
  $("sel-tipo").textContent = n.si ? "Pregunta (tiene dos ramas)" : "Causa probable (hoja)";
  $("sel-texto").value = n.texto;
  $("sel-texto").disabled = $("btn-guardar").disabled = false;
  $("btn-dividir").disabled = !!n.si;
  $("btn-podar").disabled = !n.si || n.id === arbol.id;
  dibujar();
}

async function mutar(url, method, body) {
  const d = await api(url, method, body);
  if (d.error) return alert(d.error);
  cargarEstado(d); respuestas = []; ruta = [];
  selId && buscar(arbol, selId) ? seleccionar(selId) : dibujar();
}

function cambiarModo(m) {
  modo = m; $("diag").hidden = m !== "diag"; $("edit").hidden = m !== "edit";
  $("tab-diag").classList.toggle("active", m === "diag");
  $("tab-edit").classList.toggle("active", m === "edit");
  $("lienzo").classList.toggle("editando", m === "edit");
  m === "diag" ? diagnosticar() : dibujar();
}

$("btn-si").onclick = () => { respuestas.push(true); diagnosticar(); };
$("btn-no").onclick = () => { respuestas.push(false); diagnosticar(); };
$("btn-atras").onclick = () => { respuestas.pop(); diagnosticar(); };
$("btn-reiniciar").onclick = () => { respuestas = []; diagnosticar(); };
$("tab-diag").onclick = () => cambiarModo("diag");
$("tab-edit").onclick = () => cambiarModo("edit");
$("btn-guardar").onclick = () => mutar(`/api/nodo/${selId}`, "PUT", { texto: $("sel-texto").value });
$("btn-dividir").onclick = () => mutar(`/api/nodo/${selId}/dividir`, "POST");
$("btn-podar").onclick = () => confirm("¿Eliminar todo el subárbol?") && mutar(`/api/nodo/${selId}/podar`, "POST");
$("btn-reset").onclick = () => confirm("¿Restaurar el árbol original?") && (selId = null, mutar("/api/reset", "POST"));

(async () => { cargarEstado(await api("/api/arbol")); diagnosticar(); })();
