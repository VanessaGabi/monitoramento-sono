from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS

import numpy as np
import os
import cv2
import base64

app = Flask(__name__)
CORS(app)

dados = {
    "ear": 0.0,
    "sonolencia": False,
    "nivel": "normal"
}

contador_frames = 0

# =========================
# AJUSTES DETECÇÃO
# =========================

LIMITE = 5
EAR_LIMIAR = 0.26

# -----------------------
# MEDIAPIPE
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

    print("Erro MediaPipe:", e)

    face_mesh = None


# -----------------------
# LANDMARKS OLHOS
# -----------------------

OLHO_ESQ = [33, 160, 158, 133, 153, 144]
OLHO_DIR = [362, 385, 387, 263, 373, 380]


# -----------------------
# FUNÇÕES EAR
# -----------------------

def calcular_distancia(p1, p2):

    return np.linalg.norm(
        np.array(p1) - np.array(p2)
    )


def calcular_ear(face, olho):

    p1 = face[olho[0]]
    p2 = face[olho[1]]
    p3 = face[olho[2]]
    p4 = face[olho[3]]
    p5 = face[olho[4]]
    p6 = face[olho[5]]

    vertical1 = calcular_distancia(p2, p6)
    vertical2 = calcular_distancia(p3, p5)

    horizontal = calcular_distancia(p1, p4)

    if horizontal == 0:
        return 0.0

    ear = (
        (vertical1 + vertical2)
        / (2.0 * horizontal)
    )

    return ear


# -----------------------
# ROTAS
# -----------------------

@app.route("/")
def home():

    return "API HYPNOS rodando"


@app.route("/dados")
def get_dados():

    return jsonify(dados)


@app.route("/app")
def app_front():

    return send_from_directory(
        "frontend",
        "index.html"
    )


# -----------------------
# PROCESSAMENTO REAL
# -----------------------

@app.route("/processar", methods=["POST"])
def processar():

    global dados
    global contador_frames

    try:

        # =========================
        # MEDIAPIPE
        # =========================

        if face_mesh is None:

            return jsonify({
                "erro": "MediaPipe não carregado"
            })

        # =========================
        # RECEBE IMAGEM
        # =========================

        body = request.get_json()

        if not body:

            return jsonify({
                "erro": "body vazio"
            })

        image = body.get("image")

        if not image:

            return jsonify({
                "erro": "imagem ausente"
            })

        encoded = image.split(",")[1]

        img_bytes = base64.b64decode(encoded)

        np_arr = np.frombuffer(
            img_bytes,
            np.uint8
        )

        frame = cv2.imdecode(
            np_arr,
            cv2.IMREAD_COLOR
        )

        # =========================
        # VALIDA FRAME
        # =========================

        if frame is None:

            return jsonify({
                "erro": "frame inválido"
            })

        # =========================
        # MELHORIAS IMAGEM
        # =========================

        frame = cv2.flip(frame, 1)

        frame = cv2.resize(
            frame,
            (640, 480)
        )

        frame = cv2.convertScaleAbs(
            frame,
            alpha=1.2,
            beta=10
        )

        rgb = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2RGB
        )

        # =========================
        # PROCESSA FACE
        # =========================

        results = face_mesh.process(rgb)

        # =========================
        # SEM ROSTO
        # =========================

        if not results.multi_face_landmarks:

            contador_frames = 0

            dados["ear"] = 0.0
            dados["sonolencia"] = False
            dados["nivel"] = "normal"

            return jsonify(dados)

        # =========================
        # FACE DETECTADA
        # =========================

        face_landmarks = (
            results.multi_face_landmarks[0]
        )

        h, w, _ = frame.shape

        face = []

        for lm in face_landmarks.landmark:

            x = int(lm.x * w)
            y = int(lm.y * h)

            face.append((x, y))

        # =========================
        # CALCULA EAR
        # =========================

        ear_esq = calcular_ear(
            face,
            OLHO_ESQ
        )

        ear_dir = calcular_ear(
            face,
            OLHO_DIR
        )

        ear = (
            ear_esq + ear_dir
        ) / 2.0

        ear = round(float(ear), 3)

        dados["ear"] = ear

        # =========================
        # DETECÇÃO SONOLÊNCIA
        # =========================

        print("EAR:", ear)

        if ear <= EAR_LIMIAR:

            contador_frames += 1

            print("OLHO FECHADO")

        else:

            if contador_frames > 0:
                contador_frames -= 1

        print("CONTADOR:", contador_frames)

        # =========================
        # STATUS
        # =========================

        if contador_frames >= LIMITE:

            dados["sonolencia"] = True
            dados["nivel"] = "critico"

        elif ear <= EAR_LIMIAR:

            dados["sonolencia"] = False
            dados["nivel"] = "atencao"

        else:

            dados["sonolencia"] = False
            dados["nivel"] = "normal"

        return jsonify(dados)

    except Exception as e:

        print("ERRO:", e)

        return jsonify({
            "erro": str(e),
            "ear": 0.0,
            "sonolencia": False,
            "nivel": "normal"
        })


# -----------------------
# START
# -----------------------

if __name__ == "__main__":

    port = int(
        os.environ.get("PORT", 5000)
    )

    app.run(
        host="0.0.0.0",
        port=port
    )