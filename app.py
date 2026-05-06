from flask import Flask, jsonify, Response
from flask_cors import CORS
import cv2
import numpy as np
import threading
import os
import time

# -----------------------
# FLASK
# -----------------------
app = Flask(__name__)
CORS(app)

# -----------------------
# DADOS
# -----------------------
dados = {
    "ear": 0.0,
    "sonolencia": False,
    "nivel": "normal"
}

contador_frames = 0
LIMITE = 20
EAR_LIMIAR = 0.20

# -----------------------
# MEDIA PIPE (CORRIGIDO)
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

    print("MediaPipe carregado com sucesso")

except Exception as e:
    print("MediaPipe indisponível:", e)
    face_mesh = None

# -----------------------
# OLHOS
# -----------------------
olho_esquerdo = [33, 160, 158, 133, 153, 144]
olho_direito = [362, 385, 387, 263, 373, 380]

# -----------------------
# CÂMERA
# -----------------------
camera = cv2.VideoCapture(0)
camera_disponivel = camera.isOpened()

# -----------------------
# EAR
# -----------------------
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

# -----------------------
# PROCESSAMENTO
# -----------------------
def processar_camera():
    global dados, contador_frames

    if not camera_disponivel or face_mesh is None:
        print("Modo servidor: sem câmera ou MediaPipe")
        return

    while True:
        success, frame = camera.read()
        if not success:
            time.sleep(0.1)
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

        time.sleep(0.03)

# -----------------------
# STREAM (OPCIONAL)
# -----------------------
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

# -----------------------
# ROTAS
# -----------------------
@app.route("/")
def home():
    return "API de monitoramento de sono rodando"


@app.route("/dados")
def get_dados():
    return jsonify(dados)


@app.route("/video")
def video():
    if not camera_disponivel:
        return "Camera nao disponivel no servidor", 503

    return Response(
        gerar_frames(),
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )

# -----------------------
# THREAD SEGURA
# -----------------------
if camera_disponivel and face_mesh is not None:
    thread = threading.Thread(target=processar_camera)
    thread.daemon = True
    thread.start()

# -----------------------
# RENDER FIX (PORTA CORRETA)
# -----------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
