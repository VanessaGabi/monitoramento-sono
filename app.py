from flask import Flask, jsonify, Response
from flask_cors import CORS
import cv2
import mediapipe as mp
import numpy as np
import threading

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

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(refine_landmarks=True)

olho_esquerdo = [33, 160, 158, 133, 153, 144]
olho_direito = [362, 385, 387, 263, 373, 380]

camera = cv2.VideoCapture(0)


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


# 🔥 IA rodando em background (SEM janela OpenCV)
def processar_camera():
    global dados, contador_frames

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


# 🔥 STREAM PARA O FRONT (IMPORTANTE)
def gerar_frames():
    global camera

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
    return Response(gerar_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route("/dados")
def get_dados():
    return jsonify(dados)


if __name__ == "__main__":
    thread = threading.Thread(target=processar_camera)
    thread.daemon = True
    thread.start()

    app.run(host="127.0.0.1", port=5000, debug=False, threaded=True)