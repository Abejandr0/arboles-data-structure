"""Árbol de decisión binario para diagnóstico de fallas."""
import secrets


class Nodo:
    """Nodo interno = pregunta (si/no). Hoja = causa probable."""

    def __init__(self, texto, si=None, no=None, id=None):
        self.id = id or secrets.token_hex(3)
        self.texto = texto
        self.si = si
        self.no = no

    @property
    def es_hoja(self):
        return self.si is None and self.no is None

    def to_dict(self):
        d = {"id": self.id, "texto": self.texto}
        if not self.es_hoja:
            d["si"], d["no"] = self.si.to_dict(), self.no.to_dict()
        return d

    @classmethod
    def from_dict(cls, d):
        si = cls.from_dict(d["si"]) if "si" in d else None
        no = cls.from_dict(d["no"]) if "no" in d else None
        return cls(d["texto"], si, no, d.get("id"))

    def buscar(self, id):
        if self.id == id:
            return self
        if self.es_hoja:
            return None
        return self.si.buscar(id) or self.no.buscar(id)

    def recorrer(self, respuestas):
        """Sigue las respuestas (True=Sí, False=No). Devuelve (nodo_actual, ruta_de_ids)."""
        actual, ruta = self, [self.id]
        for r in respuestas:
            if actual.es_hoja:
                break
            actual = actual.si if r else actual.no
            ruta.append(actual.id)
        return actual, ruta

    def dividir(self):
        """Convierte una hoja en pregunta con dos nuevas causas."""
        if self.es_hoja:
            self.si, self.no = Nodo("Nueva causa"), Nodo("Nueva causa")

    def podar(self):
        """Convierte una pregunta en hoja, eliminando su subárbol."""
        self.si = self.no = None

    def altura(self):
        return 1 if self.es_hoja else 1 + max(self.si.altura(), self.no.altura())

    def total(self):
        return 1 if self.es_hoja else 1 + self.si.total() + self.no.total()

    def hojas(self):
        return 1 if self.es_hoja else self.si.hojas() + self.no.hojas()


def H(t):
    return Nodo(t)


def P(t, si, no):
    return Nodo(t, si, no)


def arbol_por_defecto():
    return P("¿La moto enciende?",
        P("¿Pierde potencia al acelerar?",
            P("¿Sale humo por el escape?",
                P("¿El humo es negro?",
                    H("Mezcla rica: filtro de aire sucio o inyector/carburador desajustado."),
                    H("Consumo de aceite: anillos o retenes de válvula desgastados.")),
                P("¿Hay tirones o fallos a altas RPM?",
                    H("Bujía desgastada o bobina de encendido fallando."),
                    H("Kit de arrastre estirado o embrague patinando."))),
            P("¿Hay ruido metálico al arrancar?",
                H("Cadena de repartición floja o tensor defectuoso."),
                H("Funcionamiento normal: revisa el mantenimiento programado."))),
        P("¿Se encienden las luces del tablero?",
            P("¿El motor de arranque gira?",
                P("¿Hay gasolina en el tanque?",
                    H("Revisar bujía y bomba de gasolina."),
                    H("Falta de combustible: tanquear.")),
                P("¿Se escucha un 'clic' al presionar el botón?",
                    H("Relé de arranque o batería con poca carga."),
                    H("Fusible, interruptor de caballete/embrague o motor de arranque."))),
            P("¿Los bornes de la batería están flojos o sulfatados?",
                H("Limpiar y apretar los bornes."),
                H("Batería descargada o regulador/rectificador dañado."))))
