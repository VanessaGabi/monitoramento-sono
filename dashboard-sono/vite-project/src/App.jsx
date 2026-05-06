import { useEffect, useState } from "react";
import { Activity, Eye, AlertTriangle } from "lucide-react";
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
        })
        .catch(err => console.log(err));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const statusColor =
    dados.nivel === "critico"
      ? "#ef4444"
      : dados.nivel === "atencao"
      ? "#f59e0b"
      : "#22c55e";

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}
        <h1 style={styles.title}>🧠 Hypnos AI Monitor</h1>
        <p style={styles.subtitle}>
          Sistema inteligente de detecção de sonolência em tempo real
        </p>

        {/* ALERTA */}
        {dados.sonolencia && (
          <div style={styles.alert}>
            <AlertTriangle />
            <span>ALERTA: Sonolência detectada — recomenda-se pausa</span>
          </div>
        )}

        {/* CARDS */}
        <div style={styles.cards}>

          <div style={styles.card}>
            <Eye color="#60a5fa" />
            <p>EAR (Eye Ratio)</p>
            <h2>{dados.ear.toFixed(3)}</h2>
          </div>

          <div style={styles.card}>
            <Activity color={statusColor} />
            <p>Status do Sistema</p>
            <h2 style={{ color: statusColor }}>
              {dados.nivel.toUpperCase()}
            </h2>
          </div>

          <div style={styles.card}>
            <AlertTriangle color={dados.sonolencia ? "#ef4444" : "#22c55e"} />
            <p>Sonolência</p>
            <h2>
              {dados.sonolencia ? "DETECTADA" : "NORMAL"}
            </h2>
          </div>

        </div>

        {/* CHART */}
        <div style={styles.chartBox}>
          <h3 style={styles.chartTitle}>Monitoramento em tempo real (EAR)</h3>

          <ResponsiveContainer width="100%" height={300}>
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
  );
}

/* ===================== STYLE ===================== */

const styles = {
  page: {
    minHeight: "100vh",
    padding: 30,
    fontFamily: "Inter, Arial",
    background: "linear-gradient(135deg, #0b1220, #0f172a)"
  },

  container: {
    maxWidth: 1100,
    margin: "0 auto"
  },

  title: {
    textAlign: "center",
    color: "white",
    fontSize: 34,
    marginBottom: 5
  },

  subtitle: {
    textAlign: "center",
    color: "#94a3b8",
    marginBottom: 25
  },

  alert: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    background: "#ef4444",
    color: "white",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    fontWeight: "bold"
  },

  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 20,
    marginBottom: 30
  },

  card: {
    background: "rgba(17, 24, 39, 0.7)",
    backdropFilter: "blur(10px)",
    padding: 20,
    borderRadius: 16,
    color: "white",
    textAlign: "center",
    boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
    transition: "0.3s"
  },

  chartBox: {
    background: "rgba(17, 24, 39, 0.7)",
    backdropFilter: "blur(10px)",
    padding: 20,
    borderRadius: 16,
    color: "white"
  },

  chartTitle: {
    marginBottom: 15
  }
};