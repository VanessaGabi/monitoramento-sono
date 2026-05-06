from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import numpy as np
import threading
import os
import time

app = Flask(__name__)
CORS(app)

dados = {
    "ear": 0.0,
    "sonolencia": False,
    "nivel": "normal"
}

contador_frames = 0
LIMITE = 20
EAR_LIMIAR = 0.20

# -----------------------
# MEDIA PIPE (seguro)
# -----------------------
face_mesh = None

try:
    import mediapipe as mp
    mp_face_mesh = mp.solutions.face_mesh

    face_mesh = mp_face_mesh.FaceMesh(
        static_image_mode=False,
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )

    print("MediaPipe carregado")

except Exception as e:
    print("MediaPipe desativado:", e)
    face_mesh = None


# -----------------------
# API
# -----------------------
@app.route("/")
def home():
    return "API de monitoramento de sono rodando"

@app.route("/dados")
def get_dados():
    return jsonify(dados)

@app.route("/app")
def app_front():
    return send_from_directory("frontend", "index.html")


# -----------------------
# SIMULAÇÃO (render-safe)
# -----------------------
def processar_camera():
    global dados, contador_frames

    while True:
        fake_ear = float(np.random.uniform(0.15, 0.35))
        dados["ear"] = fake_ear

        if fake_ear < EAR_LIMIAR:
            contador_frames += 1
        else:
            contador_frames = 0

        dados["sonolencia"] = contador_frames >= LIMITE

        if dados["sonolencia"]:
            dados["nivel"] = "critico"
        elif fake_ear < EAR_LIMIAR:
            dados["nivel"] = "atencao"
        else:
            dados["nivel"] = "normal"

        time.sleep(1)


thread = threading.Thread(target=processar_camera)
thread.daemon = True
thread.start()


# -----------------------
# START
# -----------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)