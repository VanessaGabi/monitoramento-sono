import sys
print(sys.executable)


import cv2 # ferramenta que permite controlar a webcam
import mediapipe as mp # ferramenta que permite fazer o reconhecimento da imagem

#inicia o opencv e o midiapipe
webcam = cv2.VideoCapture(0)

solucao_reconhecimento_rosto = mp.solutions.face_detection
reconhecedor_rostos = solucao_reconhecimento_rosto.FaceDetection()
desenho = mp.solutions.drawing_utils

while True:
    # lê as informações da webcam
    verificador, frame = webcam.read()

    if not verificador:
        break

    #reconhece os rostos que estão dentro do quadro da câmera
    lista_rostos = reconhecedor_rostos.process(frame)

    if lista_rostos.detections:
        for rosto in lista_rostos.detections:
            desenho.draw_detection(frame, rosto)

    cv2.imshow('Rostos na webcam', frame)

    # quando clicar o ESC, para o loop
    if cv2.waitKey(5) == 27:
        break

webcam.release()
cv2.destroyAllWindows()
# 27 é valor referente ao botão ESC