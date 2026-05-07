import { useEffect, useState } from "react";
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

  useEffect(() => {
    const interval = setInterval(() => {

      // ================= DEMO =================
      const earFake = Number((Math.random() * 0.25 + 0.15).toFixed(3));

      const nivel =
        earFake < 0.20
          ? "critico"
          : earFake < 0.26
          ? "atencao"
          : "normal";

      const sonolencia = earFake < 0.20;

      const novoDado = {
        ear: earFake,
        nivel,
        sonolencia
      };

      setDados(novoDado);

      setHistorico(prev => {
        const novo = [
          ...prev,
          {
            time: prev.length,
            ear: earFake
          }
        ];

        return novo.slice(-20);
      });

    }, 1000);

    return () => clearInterval(interval);
  }, []);

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

          <div style={styles.cameraBox}>
            <div style={styles.cameraOverlay} />

            <div style={styles.cameraContent}>
              <Camera size={70} color="#38bdf8" />

              <h2 style={{ marginTop: 20 }}>
                Camera Offline
              </h2>

              <p style={{ color: "#94a3b8" }}>
                Simulação em nuvem ativa
              </p>
            </div>
          </div>

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
                color={dados.sonolencia ? "#ef4444" : "#22c55e"}
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
      "linear-gradient(to bottom, transparent, rgba(56,189,248,0.08))"
  },

  cameraContent: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "white"
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