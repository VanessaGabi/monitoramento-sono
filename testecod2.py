import cv2
import mediapipe as mp

webcam = cv2.VideoCapture(0)

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh()

mp_drawing = mp.solutions.drawing_utils

while True:
    verificador, frame = webcam.read()
    if not verificador:
        break

    # CONVERSÃO OBRIGATÓRIA (MediaPipe trabalha em RGB)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = face_mesh.process(rgb)

    if result.multi_face_landmarks:
        for face_landmarks in result.multi_face_landmarks:
            
            for lm in face_landmarks.landmark:
                h, w, c = frame.shape
                x = int(lm.x * w)
                y = int(lm.y * h)

                cv2.circle(frame, (x, y), 1, (0, 255, 0), -1)

    cv2.imshow("Face Mesh - Hypnos", frame)

    if cv2.waitKey(5) == 27:
        break

webcam.release()
cv2.destroyAllWindows()