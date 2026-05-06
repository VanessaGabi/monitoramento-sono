import { useEffect, useState } from "react";
import { Activity, Eye, AlertTriangle, Monitor } from "lucide-react";
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
    ear: 0,
    sonolencia: false,
    nivel: "normal"
  });

  const [historico, setHistorico] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch("https://monitoramento-sono-1.onrender.com/dados")
        .then(res => res.json())
        .then(data => {
          setDados(data);

          setHistorico(prev => {
            const novo = [...prev, { time: prev.length, ear: data.ear }];
            return novo.slice(-30);
          });
        });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const statusColor =
    dados.nivel === "critico"
      ? "#ef4444"
      : dados.nivel === "atencao"
      ? "#f59e0b"
      : "#22c55e";

  const riskLevel = dados.sonolencia ? 100 : Math.min(dados.ear * 100, 100);

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>🧠 HYPNOS AI - DRIVER MONITOR</h1>

      {/* ALERTA GLOBAL */}
      {dados.sonolencia && (
        <div style={styles.alert}>
          <AlertTriangle />
          ALERTA CRÍTICO: SONOLÊNCIA DETECTADA
        </div>
      )}

      <div style={styles.grid}>

        {/* ESQUERDA - "CÂMERA" SIMULADA */}
        <div style={styles.cameraBox}>
          <Monitor size={40} color="#38bdf8" />
          <p>LIVE CAMERA FEED</p>
          <div style={styles.fakeCamera}>
            <div style={styles.scanLine}></div>
            <span>OpenCV Stream</span>
          </div>

          {/* RISK GAUGE */}
          <div style={styles.gauge}>
            <div
              style={{
                ...styles.gaugeFill,
                height: `${riskLevel}%`,
                background: statusColor
              }}
            />
          </div>
          <p>Risk Level: {Math.round(riskLevel)}%</p>
        </div>

        {/* DIREITA - DASHBOARD */}
        <div style={styles.dashboard}>

          <div style={styles.cards}>

            <div style={styles.card}>
              <Eye />
              <p>EAR</p>
              <h2>{dados.ear.toFixed(3)}</h2>
            </div>

            <div style={styles.card}>
              <Activity color={statusColor} />
              <p>Status</p>
              <h2 style={{ color: statusColor }}>
                {dados.nivel.toUpperCase()}
              </h2>
            </div>

            <div style={styles.card}>
              <AlertTriangle color={dados.sonolencia ? "#ef4444" : "#22c55e"} />
              <p>Sonolência</p>
              <h2>{dados.sonolencia ? "SIM" : "NÃO"}</h2>
            </div>

          </div>

          {/* CHART */}
          <div style={styles.chart}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={historico}>
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="ear"
                  stroke="#38bdf8"
                  strokeWidth={2}
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

/* ================= STYLE ================= */

const styles = {
  page: {
    minHeight: "100vh",
    padding: 20,
    background: "radial-gradient(circle at top, #0f172a, #050814)",
    color: "white",
    fontFamily: "Arial"
  },

  title: {
    textAlign: "center",
    marginBottom: 20,
    fontSize: 28
  },

  alert: {
    display: "flex",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
    background: "rgba(239, 68, 68, 0.2)",
    border: "1px solid #ef4444",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    animation: "pulse 1.5s infinite"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    gap: 20
  },

  cameraBox: {
    background: "rgba(17,24,39,0.6)",
    borderRadius: 16,
    padding: 20,
    textAlign: "center"
  },

  fakeCamera: {
    height: 200,
    background: "#0b1220",
    borderRadius: 12,
    marginTop: 10,
    position: "relative",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#38bdf8"
  },

  scanLine: {
    position: "absolute",
    width: "100%",
    height: 2,
    background: "#38bdf8",
    animation: "scan 2s linear infinite"
  },

  gauge: {
    width: 30,
    height: 120,
    background: "#111827",
    margin: "20px auto",
    borderRadius: 10,
    overflow: "hidden"
  },

  gaugeFill: {
    width: "100%",
    transition: "0.3s"
  },

  dashboard: {
    display: "flex",
    flexDirection: "column",
    gap: 20
  },

  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 15
  },

  card: {
    background: "rgba(17,24,39,0.6)",
    padding: 15,
    borderRadius: 14,
    textAlign: "center"
  },

  chart: {
    background: "rgba(17,24,39,0.6)",
    padding: 15,
    borderRadius: 14
  }
};