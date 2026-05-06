from flask import Flask, jsonify, Response
from flask_cors import CORS
import cv2
import numpy as np
import threading
import os

# ✅ MediaPipe corrigido
from mediapipe.python.solutions.face_mesh import FaceMesh

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

face_mesh = FaceMesh(
    static_image_mode=False,
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

olho_esquerdo = [33, 160, 158, 133, 153, 144]
olho_direito = [362, 385, 387, 263, 373, 380]

# 🔴 Tenta abrir câmera (vai falhar no Render, e tá ok)
camera = cv2.VideoCapture(0)
camera_disponivel = camera.isOpened()

def calcular_ear(pontos, frame, face_landmarks):
    h, w, _ = frame.shape
    coords = []

    for p in pontos:
        lm = face_landmarks.landmark[p]
        coords.append((int(lm.x * w), int(lm.y * h)))

    vertical = np.linalg.norm(np.array(coords[1]) - np.array(coords[5]))
    horizontal = np.linalg.norm(np.array(coords[0]) - np.array(coords[3]))

    if horizontal == 0:
        return 0

    return vertical / horizontal


def processar_camera():
    global dados, contador_frames

    if not camera_disponivel:
        print("⚠️ Câmera não disponível (deploy)")
        return

    while True:
        success, frame = camera.read()
        if not success:
            continue

        frame = cv2.flip(frame, 1)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        result = face_mesh.process(rgb)

        if result.multi_face_landmarks:
            for face_landmarks in result.multi_face_landmarks:

                ear_esq = calcular_ear(olho_esquerdo, frame, face_landmarks)
                ear_dir = calcular_ear(olho_direito, frame, face_landmarks)
                ear = (ear_esq + ear_dir) / 2

                dados["ear"] = float(ear)

                if ear < EAR_LIMIAR:
                    contador_frames += 1
                else:
                    contador_frames = 0

                dados["sonolencia"] = contador_frames >= LIMITE

                if dados["sonolencia"]:
                    dados["nivel"] = "critico"
                elif ear < EAR_LIMIAR:
                    dados["nivel"] = "atencao"
                else:
                    dados["nivel"] = "normal"


def gerar_frames():
    if not camera_disponivel:
        return

    while True:
        success, frame = camera.read()
        if not success:
            continue

        frame = cv2.flip(frame, 1)

        _, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')


@app.route("/video")
def video():
    if not camera_disponivel:
        return "Câmera não disponível no servidor", 503

    return Response(gerar_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route("/dados")
def get_dados():
    return jsonify(dados)


@app.route("/")
def home():
    return "API de monitoramento de sono rodando 🚀"


# ✅ AGORA RODA COM GUNICORN
if camera_disponivel:
    thread = threading.Thread(target=processar_camera)
    thread.daemon = True
    thread.start()
else:
    print("⚠️ Rodando sem câmera (modo servidor)")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)