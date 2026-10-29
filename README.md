# Diagnóstico de fallas en moto — Árbol de decisión

Taller de **Árboles** · Caso de estudio: diagnóstico de fallas mecánicas en motocicleta.

Un **árbol binario de decisión** donde cada nodo interno es una pregunta (Sí / No) y cada hoja es una causa probable.
Backend en **Python (Flask)**, frontend minimalista en HTML/CSS/JS con el árbol dibujado en SVG.

## Funciones
- **Diagnosticar:** responde Sí/No, el recorrido se resalta en el árbol hasta llegar a la causa probable.
- **Editar árbol:** cambia el texto de cualquier nodo, convierte una causa en pregunta (se crean 2 hojas) o poda un subárbol.
- Persistencia en `data/arbol.json`; el árbol original se puede restaurar.

## Conceptos de árboles aplicados (`tree.py`)
| Concepto | Dónde |
|---|---|
| Nodo y estructura recursiva | clase `Nodo` |
| Recorrido desde la raíz según decisiones | `recorrer()` |
| Búsqueda de un nodo por id (DFS) | `buscar()` |
| Inserción (hoja → pregunta) | `dividir()` |
| Eliminación de subárbol | `podar()` |
| Altura, total de nodos, hojas | `altura()`, `total()`, `hojas()` |
| Serialización recursiva | `to_dict()` / `from_dict()` |

## Ejecutar
```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
Abre http://127.0.0.1:5000

## Estructura
```
app.py            # API Flask
tree.py           # Estructura del árbol (Nodo)
templates/        # index.html
static/           # style.css, app.js
data/             # arbol.json (se genera al editar)
```
