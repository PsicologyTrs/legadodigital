import os, json, time, threading
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_socketio import SocketIO
import serial, serial.tools.list_ports

SERIAL_BAUD = 115200
SERIAL_PORT = os.environ.get("EFENERGY_PORT", "")

TARIFF_COP_KWH = float(os.environ.get("EFENERGY_TARIFF", "800.0"))
SCALE_ENERGY   = float(os.environ.get("EFENERGY_SCALE",  "1.0"))

app = Flask(__name__, static_folder="static", template_folder="templates")
# ✅ sin eventlet
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

state_lock = threading.Lock()
state = {
    "occ": 0, "sleep": 0, "lock": 0, "idle_s": 0,
    "v": 0.0, "i": 0.0, "L": 0, "V": 0, "TV": 0,
    "p_w": 0.0, "e_Wh": 0.0, "e_kWh_scaled": 0.0, "cost_cop": 0.0,
    "tariff": TARIFF_COP_KWH, "scale": SCALE_ENERGY, "last_update": None,
}

serial_conn = None
running = True

def find_serial_port():
    if SERIAL_PORT:
        return SERIAL_PORT
    for p in serial.tools.list_ports.comports():
        if ("ACM" in p.device) or ("USB" in p.device):
            return p.device
    return None

def serial_reader():
    global serial_conn
    last_t = time.time()
    while running:
        try:
            if serial_conn is None:
                port = find_serial_port()
                if port:
                    serial_conn = serial.Serial(port, SERIAL_BAUD, timeout=1)
                else:
                    time.sleep(1)
                    continue

            line = serial_conn.readline().decode(errors="ignore").strip()
            now = time.time()
            dt = max(1e-3, now - last_t)
            last_t = now

            if not line:
                time.sleep(0.02)
                continue

            if line.startswith("{") and line.endswith("}"):
                data = json.loads(line)
                with state_lock:
                    for k in ("occ","sleep","lock","idle_s","v","i","L","V","TV"):
                        if k in data:
                            state[k] = data[k]

                    v = float(state.get("v", 0.0) or 0.0)
                    i = float(state.get("i", 0.0) or 0.0)
                    p_w = max(0.0, v * i)
                    state["p_w"] = p_w

                    state["e_Wh"] += p_w * dt / 3600.0
                    e_kWh = state["e_Wh"] / 1000.0

                    scale = float(state.get("scale", 1.0))
                    e_kWh_scaled = e_kWh * scale
                    state["e_kWh_scaled"] = e_kWh_scaled

                    tariff = float(state.get("tariff", TARIFF_COP_KWH))
                    state["cost_cop"] = e_kWh_scaled * tariff
                    state["last_update"] = datetime.utcnow().isoformat() + "Z"

            # ignora líneas no-JSON
        except Exception:
            try:
                if serial_conn:
                    serial_conn.close()
            except:
                pass
            serial_conn = None
            time.sleep(1)

def telemetry_broadcast():
    # En modo threading usa time.sleep()
    while running:
        with state_lock:
            socketio.emit("telemetry", state)
        time.sleep(0.2)

@app.route("/")
def index():
    return send_from_directory("static", "index.html")

@app.route("/api/state")
def api_state():
    with state_lock:
        return jsonify(state)

@app.route("/api/config", methods=["GET","POST"])
def api_config():
    if request.method == "POST":
        data = request.json or {}
        with state_lock:
            if "tariff" in data:
                state["tariff"] = float(data["tariff"])
            if "scale" in data:
                state["scale"] = float(data["scale"])
        return jsonify({"ok": True})
    else:
        with state_lock:
            return jsonify({"tariff": state["tariff"], "scale": state["scale"]})

@app.route("/api/cmd", methods=["POST"])
def api_cmd():
    cmd = (request.json or {}).get("cmd","").strip()
    if not cmd:
        return jsonify({"ok": False, "err": "missing cmd"}), 400
    try:
        if serial_conn:
            serial_conn.write((cmd+"\n").encode())
            return jsonify({"ok": True})
        else:
            return jsonify({"ok": False, "err": "serial not connected"}), 503
    except Exception as e:
        return jsonify({"ok": False, "err": str(e)}), 500

def main():
    socketio.run(
        app,
        host="0.0.0.0",
        port=8000,
        allow_unsafe_werkzeug=True,  # ← clave para systemd/Werkzeug
        debug=False
    )

if __name__ == "__main__":
    main()
