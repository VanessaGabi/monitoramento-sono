# Importa as bibliotecas necessárias
import cv2  # OpenCV -> controla câmera e imagem
import mediapipe as mp  # MediaPipe -> reconhecimento facial
import numpy as np  # NumPy -> cálculos matemáticos

# Inicia a captura da webcam (0 = câmera padrão do computador)
webcam = cv2.VideoCapture(0)

# Inicializa o Face Mesh (modelo com 468 pontos do rosto)
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh()

# Variável para contar piscadas
contador_piscadas = 0

# Variável de controle para evitar contar várias vezes o mesmo fechamento
olho_fechado = False

# Índices dos pontos do olho esquerdo no modelo Face Mesh
olho_esquerdo = [33, 160, 158, 133, 153, 144]

# Índices dos pontos do olho direito
olho_direito = [362, 385, 387, 263, 373, 380]


# Função que calcula o EAR (Eye Aspect Ratio)
def calcular_ear(pontos, frame):
    
    # Pega altura e largura da imagem
    h, w, _ = frame.shape
    
    coords = []

    # Percorre os pontos do olho
    for p in pontos:
        lm = face_landmarks.landmark[p]  # pega o ponto específico
        x = int(lm.x * w)  # converte coordenada normalizada para pixel real
        y = int(lm.y * h)
        coords.append((x, y))

    # Calcula distância vertical (altura do olho)
    vertical = np.linalg.norm(np.array(coords[1]) - np.array(coords[5]))

    # Calcula distância horizontal (largura do olho)
    horizontal = np.linalg.norm(np.array(coords[0]) - np.array(coords[3]))

    # Fórmula do Eye Aspect Ratio
    ear = vertical / horizontal

    return ear


# Loop infinito para manter a câmera rodando
while True:
    
    # Captura um frame da webcam
    verificador, frame = webcam.read()
    
    # Se não conseguir capturar, encerra
    if not verificador:
        break

    # Converte a imagem de BGR (OpenCV) para RGB (MediaPipe)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Processa o rosto na imagem
    result = face_mesh.process(rgb)

    # Se detectar rosto
    if result.multi_face_landmarks:
        for face_landmarks in result.multi_face_landmarks:
            
            # Calcula EAR de cada olho
            ear_esq = calcular_ear(olho_esquerdo, frame)
            ear_dir = calcular_ear(olho_direito, frame)

            # Média dos dois olhos
            ear = (ear_esq + ear_dir) / 2

            # Se EAR estiver abaixo do limite -> olho fechado
            if ear < 0.20:
                
                # Só conta se ainda não estava marcado como fechado
                if not olho_fechado:
                    contador_piscadas += 1
                    olho_fechado = True
            else:
                # Se o olho abrir novamente, reseta controle
                olho_fechado = False

            # Mostra o contador na tela
            cv2.putText(frame, f"Piscadas: {contador_piscadas}",
                        (30, 50),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        1,
                        (0, 0, 255),
                        2)

    # Mostra a imagem na tela
    cv2.imshow("Hypnos - Piscadas", frame)

    # Se apertar ESC (código 27), encerra o programa
    if cv2.waitKey(5) == 27:
        break

# Libera a câmera
webcam.release()

# Fecha todas as janelas
cv2.destroyAllWindows()