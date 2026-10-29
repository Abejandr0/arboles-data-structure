import json
from pathlib import Path

from flask import Flask, jsonify, render_template, request

from tree import Nodo, arbol_por_defecto

app = Flask(__name__)
DATA = Path(__file__).parent / "data" / "arbol.json"


def cargar():
    if DATA.exists():
        return Nodo.from_dict(json.loads(DATA.read_text(encoding="utf-8")))
    raiz = arbol_por_defecto()
    guardar(raiz)  # fija los ids desde la primera carga
    return raiz


def guardar(raiz):
    DATA.parent.mkdir(exist_ok=True)
    DATA.write_text(json.dumps(raiz.to_dict(), ensure_ascii=False, indent=2), encoding="utf-8")


def estado(raiz):
    return {"arbol": raiz.to_dict(),
            "stats": {"nodos": raiz.total(), "hojas": raiz.hojas(), "altura": raiz.altura()}}


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/api/arbol")
def get_arbol():
    return jsonify(estado(cargar()))


@app.post("/api/diagnosticar")
def diagnosticar():
    raiz = cargar()
    respuestas = request.get_json().get("respuestas", [])
    nodo, ruta = raiz.recorrer(respuestas)
    return jsonify({"texto": nodo.texto, "es_hoja": nodo.es_hoja, "ruta": ruta})


@app.put("/api/nodo/<id>")
def editar(id):
    raiz = cargar()
    nodo = raiz.buscar(id)
    texto = (request.get_json().get("texto") or "").strip()
    if not nodo or not texto:
        return jsonify(error="Nodo no encontrado o texto vacío"), 400
    nodo.texto = texto[:120]
    guardar(raiz)
    return jsonify(estado(raiz))


@app.post("/api/nodo/<id>/dividir")
def dividir(id):
    raiz = cargar()
    nodo = raiz.buscar(id)
    if not nodo:
        return jsonify(error="Nodo no encontrado"), 404
    nodo.dividir()
    guardar(raiz)
    return jsonify(estado(raiz))


@app.post("/api/nodo/<id>/podar")
def podar(id):
    raiz = cargar()
    nodo = raiz.buscar(id)
    if not nodo or nodo is raiz:
        return jsonify(error="No se puede podar este nodo"), 400
    nodo.podar()
    guardar(raiz)
    return jsonify(estado(raiz))


@app.post("/api/reset")
def reset():
    raiz = arbol_por_defecto()
    guardar(raiz)
    return jsonify(estado(raiz))


if __name__ == "__main__":
    app.run(debug=True)
