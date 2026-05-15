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
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function App() {

  const [dados, setDados] = useState({
    ear: 0.32,
    sonolencia: false,
    nivel: "normal"
  });

  const [historico, setHistorico] = useState([]);

  const videoRef = useRef(null);

  // =========================
  // PROCESSAMENTO REAL
  // =========================

  useEffect(() => {

    const canvas = document.createElement("canvas");

    const ctx = canvas.getContext("2d");

    const interval = setInterval(async () => {

      if (!videoRef.current) return;

      if (!videoRef.current.videoWidth) return;

      canvas.width = videoRef.current.videoWidth;

      canvas.height = videoRef.current.videoHeight;

      ctx.drawImage(
        videoRef.current,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const image = canvas.toDataURL("image/jpeg");

      try {

        const res = await fetch(
          "https://monitoramento-sono-1.onrender.com/processar",
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json"
            },

            body: JSON.stringify({ image })
          }
        );

        const data = await res.json();

        setDados(data);

        setHistorico(prev => {

          const novo = [
            ...prev,
            {
              time: prev.length,
              ear: data.ear
            }
          ];

          return novo.slice(-20);

        });

      } catch (err) {

        console.log(err);

      }

    }, 1000);

    return () => clearInterval(interval);

  }, []);

  // =========================
  // STATUS
  // =========================

  const statusColor =
    dados.nivel === "critico"
      ? "#ef4444"
      : dados.nivel === "atencao"
      ? "#facc15"
      : "#22c55e";

  const risk =
    dados.nivel === "critico"
      ? 90
      : dados.nivel === "atencao"
      ? 55
      : 15;

  return (
    <div style={styles.page}>

      {/* HEADER */}

      <div style={styles.header}>

        <h1 style={styles.title}>
          🧠 HYPNOS AI
        </h1>

        <p style={styles.subtitle}>
          Sistema Inteligente de Monitoramento de Condutor
        </p>

      </div>

      {/* LAYOUT */}

      <div style={styles.layout}>

        {/* LEFT */}

        <div style={styles.cameraCard}>

          <div style={styles.cameraHeader}>
            <Camera />
            <span>Transmissão OpenCV</span>
          </div>

          {/* CAMERA */}

          <div style={styles.cameraBox}>

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover"
              }}
            />

            <div style={styles.cameraOverlay} />

          </div>

          {/* START CAMERA */}

          <button
            onClick={async () => {

              try {

                const stream =
                  await navigator.mediaDevices.getUserMedia({
                    video: true
                  });

                if (videoRef.current) {
                  videoRef.current.srcObject = stream;
                }

              } catch (err) {

                console.log(err);

              }

            }}
            style={styles.startButton}
          >
            Ativar Câmera
          </button>

          {/* RISCO */}

          <div style={{ marginTop: 25 }}>

            <p style={styles.riskText}>
              Nível de risco: {risk}%
            </p>

            <div style={styles.progressBg}>

              <div
                style={{
                  ...styles.progressFill,
                  width: `${risk}%`,
                  background: statusColor
                }}
              />

            </div>

          </div>

        </div>

        {/* RIGHT */}

        <div style={styles.rightPanel}>

          {/* ALERTA */}

          {dados.sonolencia && (

            <div style={styles.alert}>
              <AlertTriangle />
              ALERTA: Recomenda-se parar o veículo
            </div>

          )}

          {/* CARDS */}

          <div style={styles.cards}>

            <div style={styles.card}>

              <Eye color="#38bdf8" size={32} />

              <p style={styles.cardLabel}>
                EAR (Olhos)
              </p>

              <h2 style={styles.cardValue}>
                {dados.ear.toFixed(3)}
              </h2>

            </div>

            <div style={styles.card}>

              <Activity color={statusColor} size={32} />

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
                {dados.sonolencia ? "SIM" : "NÃO"}
              </h2>

            </div>

          </div>

          {/* CHART */}

          <div style={styles.chartCard}>

            <h3 style={styles.chartTitle}>
              Monitoramento EAR em Tempo Real
            </h3>

            <ResponsiveContainer width="100%" height={320}>

              <LineChart data={historico}>

                <XAxis
                  dataKey="time"
                  stroke="#64748b"
                />

                <YAxis
                  stroke="#64748b"
                  domain={[0, 0.5]}
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

            </ResponsiveContainer>

          </div>

        </div>

      </div>

    </div>
  );
}

/* ================= STYLES ================= */

const styles = {

  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg,#020617,#0f172a)",
    padding: 30,
    fontFamily: "Inter, Arial"
  },

  header: {
    textAlign: "center",
    marginBottom: 30
  },

  title: {
    color: "white",
    fontSize: 42,
    marginBottom: 8
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
    background: "rgba(15,23,42,0.8)",
    borderRadius: 24,
    padding: 20,
    backdropFilter: "blur(10px)",
    boxShadow: "0 10px 40px rgba(0,0,0,0.4)"
  },

  cameraHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "white",
    marginBottom: 20,
    fontSize: 18
  },

  cameraBox: {
    height: 420,
    borderRadius: 20,
    background:
      "linear-gradient(180deg,#020617,#0f172a)",
    position: "relative",
    overflow: "hidden",
    border: "1px solid rgba(56,189,248,0.2)"
  },

  cameraOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(to bottom, transparent, rgba(56,189,248,0.08))",
    pointerEvents: "none"
  },

  startButton: {
    width: "100%",
    marginTop: 20,
    padding: 14,
    borderRadius: 14,
    border: "none",
    background: "#38bdf8",
    color: "#020617",
    fontWeight: "bold",
    fontSize: 16,
    cursor: "pointer"
  },

  rightPanel: {
    display: "flex",
    flexDirection: "column",
    gap: 20
  },

  alert: {
    background: "#ef4444",
    color: "white",
    padding: 15,
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontWeight: "bold",
    boxShadow: "0 0 20px rgba(239,68,68,0.5)"
  },

  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 20
  },

  card: {
    background: "rgba(15,23,42,0.8)",
    borderRadius: 20,
    padding: 25,
    textAlign: "center",
    color: "white",
    backdropFilter: "blur(10px)",
    boxShadow: "0 10px 40px rgba(0,0,0,0.3)"
  },

  cardLabel: {
    color: "#94a3b8",
    marginTop: 12,
    marginBottom: 8
  },

  cardValue: {
    fontSize: 30,
    fontWeight: "bold"
  },

  chartCard: {
    background: "rgba(15,23,42,0.8)",
    borderRadius: 24,
    padding: 25,
    backdropFilter: "blur(10px)",
    boxShadow: "0 10px 40px rgba(0,0,0,0.3)"
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
    height: 16,
    background: "#1e293b",
    borderRadius: 999
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    transition: "0.5s"
  }
};