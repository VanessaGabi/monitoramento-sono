import { useEffect, useState, useRef } from "react";

import {
  Activity,
  Eye,
  AlertTriangle,
  Camera
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

export default function App() {

  const [dados, setDados] = useState({
    ear: 0,
    sonolencia: false,
    nivel: "normal"
  });

  const [historico, setHistorico] = useState([
    { time: 0, ear: 0 }
  ]);

  const [cameraAtiva, setCameraAtiva] =
    useState(false);

  const videoRef = useRef(null);

  // =========================
  // CAMERA
  // =========================

  const iniciarCamera = async () => {

    try {

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
            facingMode: "user"
          },
          audio: false
        });

      if (videoRef.current) {

        videoRef.current.srcObject =
          stream;

        await videoRef.current.play();

        setCameraAtiva(true);
      }

    } catch (err) {

      console.log(
        "Erro camera:",
        err
      );

      alert(
        "Não foi possível acessar a câmera."
      );
    }
  };

  // =========================
  // LOOP PROCESSAMENTO
  // =========================

  useEffect(() => {

    if (!cameraAtiva) return;

    const canvas =
      document.createElement("canvas");

    const ctx =
      canvas.getContext("2d");

    let ativo = true;

    let contadorErro = 0;

    const processar = async () => {

      if (!ativo) return;

      try {

        const video = videoRef.current;

        // =========================
        // VIDEO PRONTO
        // =========================

        if (
          video &&
          video.readyState === 4 &&
          video.videoWidth > 0
        ) {

          canvas.width = 640;
          canvas.height = 480;

          ctx.drawImage(
            video,
            0,
            0,
            640,
            480
          );

          // =========================
          // IMAGEM
          // =========================

          const image =
            canvas.toDataURL(
              "image/jpeg",
              0.9
            );

          // =========================
          // ENVIA BACKEND
          // =========================

          const response = await fetch(
            "https://monitoramento-sono-1.onrender.com/processar",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                image
              })
            }
          );

          console.log(
            "STATUS:",
            response.status
          );

          const data =
            await response.json();

          console.log(
            "DATA:",
            data
          );

          // =========================
          // ERRO API
          // =========================

          if (data.erro) {

            console.log(
              "Erro backend:",
              data.erro
            );

          } else {

            // =========================
            // ATUALIZA DASHBOARD
            // =========================

            const ear =
              Number(data.ear ?? 0);

            setDados({
              ear,
              sonolencia:
                data.sonolencia ?? false,
              nivel:
                data.nivel ?? "normal"
            });

            // =========================
            // HISTÓRICO
            // =========================

            setHistorico(prev => {

              const novo = [
                ...prev,
                {
                  time: prev.length,
                  ear
                }
              ];

              return novo.slice(-40);

            });

          }

          contadorErro = 0;

        }

      } catch (err) {

        contadorErro++;

        console.log(
          "Erro API:",
          err
        );

        // =========================
        // MUITOS ERROS
        // =========================

        if (contadorErro >= 5) {

          setDados({
            ear: 0,
            sonolencia: false,
            nivel: "normal"
          });

        }

      }

      // =========================
      // LOOP CONTÍNUO
      // =========================

      setTimeout(
        processar,
        400
      );
    };

    processar();

    return () => {
      ativo = false;
    };

  }, [cameraAtiva]);

  // =========================
  // STATUS
  // =========================

  const statusColor =

    dados.nivel === "critico"
      ? "#ef4444"
      : dados.nivel === "atencao"
      ? "#facc15"
      : "#22c55e";

  const risco =

    dados.nivel === "critico"
      ? 90
      : dados.nivel === "atencao"
      ? 55
      : 10;

  return (

    <div style={styles.page}>

      {/* HEADER */}

      <div style={styles.header}>

        <h1 style={styles.title}>
          🧠 HYPNOS AI
        </h1>

        <p style={styles.subtitle}>
          Sistema Inteligente de
          Monitoramento de Condutor
        </p>

      </div>

      {/* LAYOUT */}

      <div style={styles.layout}>

        {/* CAMERA */}

        <div style={styles.cameraCard}>

          <div style={styles.cameraHeader}>
            <Camera />
            <span>
              Transmissão OpenCV
            </span>
          </div>

          <div style={styles.cameraBox}>

            {!cameraAtiva && (

              <div
                style={
                  styles.cameraPlaceholder
                }
              >

                <Camera
                  size={70}
                  color="#38bdf8"
                />

                <p style={styles.cameraText}>
                  Clique em
                  "Ativar Câmera"
                </p>

              </div>

            )}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display:
                  cameraAtiva
                    ? "block"
                    : "none"
              }}
            />

          </div>

          {/* BOTÃO */}

          <button
            onClick={iniciarCamera}
            style={styles.startButton}
          >

            {cameraAtiva
              ? "Câmera Ativa"
              : "Ativar Câmera"}

          </button>

          {/* RISCO */}

          <div style={{ marginTop: 20 }}>

            <p style={styles.riskText}>
              Nível de risco: {risco}%
            </p>

            <div style={styles.progressBg}>

              <div
                style={{
                  ...styles.progressFill,
                  width: `${risco}%`,
                  background: statusColor
                }}
              />

            </div>

          </div>

        </div>

        {/* DASHBOARD */}

        <div style={styles.rightPanel}>

          {/* ALERTA */}

          {dados.sonolencia && (

            <div style={styles.alert}>

              <AlertTriangle />

              ALERTA:
              Recomenda-se parar
              o veículo

            </div>

          )}

          {/* CARDS */}

          <div style={styles.cards}>

            {/* EAR */}

            <div style={styles.card}>

              <Eye
                color="#38bdf8"
                size={32}
              />

              <p style={styles.cardLabel}>
                EAR (Olhos)
              </p>

              <h2 style={styles.cardValue}>

                {Number(
                  dados.ear ?? 0
                ).toFixed(3)}

              </h2>

            </div>

            {/* STATUS */}

            <div style={styles.card}>

              <Activity
                color={statusColor}
                size={32}
              />

              <p style={styles.cardLabel}>
                Status
              </p>

              <h2
                style={{
                  ...styles.cardValue,
                  color: statusColor
                }}
              >

                {dados.nivel.toUpperCase()}

              </h2>

            </div>

            {/* SONO */}

            <div style={styles.card}>

              <AlertTriangle
                color={
                  dados.sonolencia
                    ? "#ef4444"
                    : "#22c55e"
                }
                size={32}
              />

              <p style={styles.cardLabel}>
                Sonolência
              </p>

              <h2 style={styles.cardValue}>

                {dados.sonolencia
                  ? "SIM"
                  : "NÃO"}

              </h2>

            </div>

          </div>

          {/* GRÁFICO */}

          <div style={styles.chartCard}>

            <h3 style={styles.chartTitle}>
              Monitoramento EAR
              em Tempo Real
            </h3>

            <div
              style={{
                width: "100%",
                height: 320
              }}
            >

              <LineChart
                width={700}
                height={300}
                data={historico}
              >

                <XAxis
                  dataKey="time"
                  stroke="#64748b"
                />

                <YAxis
                  domain={[0, 0.5]}
                  stroke="#64748b"
                />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="ear"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  dot={false}
                />

              </LineChart>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

/* =========================
   STYLES
========================= */

const styles = {

  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg,#020617,#0f172a)",
    padding: 30,
    fontFamily: "Arial"
  },

  header: {
    textAlign: "center",
    marginBottom: 30
  },

  title: {
    color: "white",
    fontSize: 42
  },

  subtitle: {
    color: "#94a3b8",
    fontSize: 18
  },

  layout: {
    display: "grid",
    gridTemplateColumns: "350px 1fr",
    gap: 25
  },

  cameraCard: {
    background:
      "rgba(15,23,42,0.8)",
    borderRadius: 20,
    padding: 20
  },

  cameraHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "white",
    marginBottom: 15
  },

  cameraBox: {
    height: 420,
    borderRadius: 20,
    background: "#0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },

  cameraPlaceholder: {
    textAlign: "center",
    color: "#cbd5e1"
  },

  cameraText: {
    marginTop: 10
  },

  startButton: {
    width: "100%",
    marginTop: 15,
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "#38bdf8",
    cursor: "pointer",
    fontWeight: "bold"
  },

  rightPanel: {
    display: "flex",
    flexDirection: "column",
    gap: 20
  },

  alert: {
    background: "#ef4444",
    color: "white",
    padding: 12,
    borderRadius: 10,
    fontWeight: "bold"
  },

  cards: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3,1fr)",
    gap: 15
  },

  card: {
    background:
      "rgba(15,23,42,0.8)",
    padding: 20,
    borderRadius: 15,
    color: "white",
    textAlign: "center"
  },

  cardLabel: {
    color: "#94a3b8",
    marginTop: 10
  },

  cardValue: {
    fontSize: 26,
    fontWeight: "bold"
  },

  chartCard: {
    background:
      "rgba(15,23,42,0.8)",
    padding: 20,
    borderRadius: 20
  },

  chartTitle: {
    color: "white",
    marginBottom: 20
  },

  riskText: {
    color: "white",
    marginBottom: 10,
    fontWeight: "bold"
  },

  progressBg: {
    width: "100%",
    height: 14,
    background: "#1e293b",
    borderRadius: 999
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    transition: "0.3s"
  }

};