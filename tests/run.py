#!/usr/bin/env python3
"""Pruebas automaticas de Mi Rutina.

Uso, desde la raiz del repo:
    python tests/run.py                 corre todo; sale con 0 si pasa, 1 si algo falla
    python tests/run.py --filtro texto  solo las pruebas cuyo nombre contiene "texto"
    python tests/run.py --servir        deja el servidor arriba para abrir el arnes a mano
    python tests/run.py --navegador X   usa ese ejecutable en vez de Edge/Chrome

Sin dependencias: levanta http.server en un hilo, abre tests/harness.html en
Edge (o Chrome) sin interfaz con un perfil temporal NUEVO en cada corrida, y lee
el resultado del DOM volcado (<script type="application/json" id="results">).
"""
import argparse

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
NAVEGADORES = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
]
# en Linux (la integracion continua de GitHub) los navegadores estan en el PATH
NAVEGADORES_PATH = ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "microsoft-edge"]


def navegadores():
    rutas = [x for x in NAVEGADORES if os.path.exists(x)]
    rutas += [r for r in (shutil.which(n) for n in NAVEGADORES_PATH) if r and r not in rutas]
    return rutas
# Con ?__pruebas en la URL, el servidor mete tests/prelude.js como PRIMER
# script de index.html: asi los errores de arranque, los dialogos, las
# descargas y el service worker quedan bajo control antes de que corra la app.
# El archivo en disco no se toca.
MARCA = "__pruebas"
PRELUDIO = b'<script src="tests/prelude.js"></script>'
PRESUPUESTO_VIRTUAL_MS = 240000   # tiempo virtual del navegador para todo el arnes
TIEMPO_REAL_S = 240               # tope real por navegador antes de rendirse

faltantes = []   # rutas que el servidor no encontro (404): una app rota por un archivo


class Manejador(SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def send_error(self, code, message=None, explain=None):
        if code == 404:
            faltantes.append(self.path)
        super().send_error(code, message, explain)

    def do_GET(self):
        ruta, _, consulta = self.path.partition("?")
        if ruta == "/index.html" and MARCA in consulta:
            cuerpo = (RAIZ / "index.html").read_bytes()
            m = re.search(rb"<head[^>]*>", cuerpo)
            if not m:
                self.send_error(500, "index.html sin <head>")
                return
            cuerpo = cuerpo[:m.end()] + PRELUDIO + cuerpo[m.end():]
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(cuerpo)))
            self.end_headers()
            self.wfile.write(cuerpo)
            return
        super().do_GET()


def levantar_servidor():
    srv = ThreadingHTTPServer(("127.0.0.1", 0), partial(Manejador, directory=str(RAIZ)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, srv.server_address[1]


def correr_navegador(exe, url):
    """Devuelve (resultados | None, detalle). Perfil temporal nuevo: sin service
    worker ni localStorage de corridas anteriores."""
    perfil = tempfile.mkdtemp(prefix="mirutina-pruebas-")
    cmd = [exe, "--headless=new", "--disable-gpu", "--no-first-run",
           "--no-default-browser-check", "--disable-extensions", "--disable-sync",
           "--disable-background-networking", "--disable-component-update",
           "--mute-audio", "--window-size=420,900",
           "--user-data-dir=" + perfil,
           "--virtual-time-budget=%d" % PRESUPUESTO_VIRTUAL_MS,
           "--dump-dom", url]
    if sys.platform.startswith("linux") and os.environ.get("CI"):
        # los contenedores de CI no traen el sandbox de Chrome; en un equipo propio no se quita
        cmd.insert(1, "--no-sandbox")
    try:
        p = subprocess.run(cmd, capture_output=True, timeout=TIEMPO_REAL_S)
        salida = p.stdout.decode("utf-8", "replace")
    except subprocess.TimeoutExpired:
        return None, "no respondio en %d s" % TIEMPO_REAL_S
    except OSError as e:
        return None, "no arranco: %s" % e
    finally:
        for _ in range(5):   # el navegador suelta el perfil con un poco de retraso
            shutil.rmtree(perfil, ignore_errors=True)
            if not os.path.exists(perfil):
                break
            time.sleep(0.5)
    m = re.search(r'<script type="application/json" id="results">(.*?)</script>', salida, re.S)
    if not m:
        return None, "el DOM volcado no trae resultados (%d bytes de salida)" % len(salida)
    # el contenido de un <script> se vuelca crudo, sin entidades: el arnes ya
    # escapa "<" como < para que nada cierre la etiqueta antes de tiempo
    try:
        return json.loads(m.group(1)), ""
    except ValueError as e:
        return None, "resultados ilegibles: %s" % e


def imprimir(res, exe, segundos):
    pruebas = res.get("pruebas", [])
    ok = [p for p in pruebas if p["estado"] == "ok"]
    fallas = [p for p in pruebas if p["estado"] == "falla"]
    omit = [p for p in pruebas if p["estado"] == "omitida"]
    marca = {"ok": "  ok ", "falla": "FALLA", "omitida": "omit "}
    esc = None
    for p in pruebas:
        if p["escenario"] != esc:
            esc = p["escenario"]
            print("\n== %s" % esc)
        print("  [%s] %s  (%d ms)" % (marca[p["estado"]], p["nombre"], p.get("ms", 0)))
        if p["estado"] == "falla":
            for linea in str(p.get("error", "")).splitlines()[:12]:
                print("          " + linea)
        if p["estado"] == "omitida":
            print("          motivo: " + p.get("motivo", ""))
            for linea in str(p.get("evidencia", "")).splitlines()[:4]:
                print("          hoy:    " + linea)
    extra = []
    if not res.get("terminado"):
        extra.append("el arnes no termino (subir PRESUPUESTO_VIRTUAL_MS o buscar una prueba colgada)")
    for e in res.get("errores_arnes", []):
        extra.append("error del arnes: " + e)
    for e in res.get("errores_sueltos", []):
        extra.append("error de la app fuera de una prueba: " + e)
    if faltantes:
        extra.append("archivos no encontrados (404): " + ", ".join(sorted(set(faltantes))))
    for e in extra:
        print("\n!! " + e)
    print("\n%d pruebas · %d ok · %d fallan · %d omitidas · %.1f s · %s" % (
        len(pruebas), len(ok), len(fallas), len(omit), segundos, Path(exe).name))
    return not fallas and not extra and len(pruebas) > 0


def main():
    ap = argparse.ArgumentParser(description="Pruebas automaticas de Mi Rutina")
    ap.add_argument("--filtro", default="", help="solo pruebas cuyo 'escenario › nombre' contenga este texto")
    ap.add_argument("--navegador", default="", help="ruta a msedge.exe o chrome.exe")
    ap.add_argument("--servir", action="store_true", help="solo servir el arnes para abrirlo a mano")
    ap.add_argument("--json", default="", help="guardar los resultados crudos en este archivo")
    a = ap.parse_args()
    # los nombres de las pruebas llevan tildes y simbolos: la consola de
    # Windows usa cp1252 por defecto y se cae con un "≤"
    for flujo in (sys.stdout, sys.stderr):
        try:
            flujo.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass

    srv, puerto = levantar_servidor()
    url = "http://127.0.0.1:%d/tests/harness.html" % puerto
    if a.filtro:
        from urllib.parse import quote
        url += "?filtro=" + quote(a.filtro)
    if a.servir:
        print("Arnes en %s  (Ctrl+C para parar)" % url)
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            return 0

    candidatos = [a.navegador] if a.navegador else navegadores()
    if not candidatos:
        print("No encontre Edge ni Chrome. Pasa la ruta con --navegador.")
        return 1
    t0 = time.time()
    for exe in candidatos:
        faltantes.clear()
        res, detalle = correr_navegador(exe, url)
        if res is None:
            print("%s: %s; pruebo con el siguiente navegador." % (Path(exe).name, detalle))
            continue
        segundos = time.time() - t0
        if a.json:
            Path(a.json).write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
        verde = imprimir(res, exe, segundos)
        srv.shutdown()
        return 0 if verde else 1
    print("Ningun navegador devolvio resultados.")
    srv.shutdown()
    return 1


if __name__ == "__main__":
    sys.exit(main())
