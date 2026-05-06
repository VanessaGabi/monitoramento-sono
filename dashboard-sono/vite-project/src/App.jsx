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

  const getStatusColor = () => {
    if (dados.nivel === "critico") return "#ef4444";
    if (dados.nivel === "atencao") return "#f59e0b";
    return "#22c55e";
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <h1 style={styles.title}>😴 Sleep Monitor Dashboard</h1>
        <p style={styles.subtitle}>Sistema de análise de sonolência em tempo real</p>

        {/* CARDS */}
        <div style={styles.cards}>

          <div style={styles.card}>
            <Eye color="#60a5fa" />
            <p>EAR (Olhos)</p>
            <h2>{dados.ear.toFixed(3)}</h2>
          </div>

          <div style={styles.card}>
            <Activity color={getStatusColor()} />
            <p>Status</p>
            <h2 style={{ color: getStatusColor() }}>{dados.nivel}</h2>
          </div>

          <div style={styles.card}>
            <AlertTriangle color={dados.sonolencia ? "#ef4444" : "#22c55e"} />
            <p>Sonolência</p>
            <h2>{dados.sonolencia ? "DETECTADA" : "NORMAL"}</h2>
          </div>

        </div>

        {/* GRAFICO */}
        <div style={styles.chartBox}>
          <h3 style={{ marginBottom: 10 }}>Variação do EAR</h3>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historico}>
              <XAxis dataKey="time" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="ear"
                stroke="#38bdf8"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}

const styles = {
  page: {
    background: "#0b1220",
    minHeight: "100vh",
    padding: 20,
    fontFamily: "Arial"
  },

  container: {
    maxWidth: 1000,
    margin: "0 auto"
  },

  title: {
    color: "white",
    textAlign: "center",
    fontSize: 28,
    marginBottom: 5
  },

  subtitle: {
    textAlign: "center",
    color: "#94a3b8",
    marginBottom: 30
  },

  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 20,
    marginBottom: 30
  },

  card: {
    background: "#111827",
    padding: 20,
    borderRadius: 12,
    color: "white",
    textAlign: "center",
    boxShadow: "0 0 10px rgba(0,0,0,0.3)"
  },

  chartBox: {
    background: "#111827",
    padding: 20,
    borderRadius: 12,
    color: "white"
  }
};