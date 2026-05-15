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
    ear: 0,
    sonolencia: false,
    nivel: "normal"
  });

  const [historico, setHistorico] = useState([]);
  const [cameraAtiva, setCameraAtiva] = useState(false);

  const videoRef = useRef(null);

  const iniciarCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraAtiva(true);
      }

    } catch (err) {
      console.log("Erro camera:", err);
      alert("Não foi possível acessar a câmera.");
    }
  };

  useEffect(() => {

    if (!cameraAtiva) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const interval = setInterval(async () => {

      const video = videoRef.current;

      if (!video) return;
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const image = canvas.toDataURL("image/jpeg", 0.95);

      try {

        const res = await fetch(
          "https://monitoramento-sono-1.onrender.com/processar",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image })
          }
        );

        const data = await res.json();

        console.log("BACK:", data);

        if (!data || data.erro) return;

        setDados({
          ear: data.ear ?? 0,
          sonolencia: data.sonolencia ?? false,
          nivel: data.nivel ?? "normal"
        });

        setHistorico(prev => {
          const novo = [
            ...prev,
            { time: prev.length, ear: Number(data.ear ?? 0) }
          ];
          return novo.slice(-30);
        });

      } catch (err) {
        console.log("Erro API:", err);
      }

    }, 800);

    return () => clearInterval(interval);

  }, [cameraAtiva]);

  const statusColor =
    dados.nivel === "critico"
      ? "#ef4444"
      : dados.nivel === "atencao"
        ? "#facc15"
        : "#22c55e";

  return (
    <div style={styles.page}>

      <div style={styles.header}>
        <h1 style={styles.title}>🧠 HYPNOS AI</h1>
        <p style={styles.subtitle}>
          Sistema Inteligente de Monitoramento de Condutor
        </p>
      </div>

      <div style={styles.layout}>

        {/* CAMERA */}
        <div style={styles.cameraCard}>

          <div style={styles.cameraHeader}>
            <Camera />
            <span>Transmissão OpenCV</span>
          </div>

          <div style={styles.cameraBox}>

            {!cameraAtiva && (
              <div style={styles.cameraPlaceholder}>
                <Camera size={70} color="#38bdf8" />
                <p style={styles.cameraText}>
                  Clique em "Ativar Câmera"
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
                display: cameraAtiva ? "block" : "none"
              }}
            />

          </div>

          <button onClick={iniciarCamera} style={styles.startButton}>
            {cameraAtiva ? "Câmera Ativa" : "Ativar Câmera"}
          </button>

        </div>

        {/* DASHBOARD */}
        <div style={styles.rightPanel}>

          {dados.sonolencia && (
            <div style={styles.alert}>
              <AlertTriangle />
              ALERTA: Recomenda-se parar o veículo
            </div>
          )}

          <div style={styles.cards}>

            <div style={styles.card}>
              <Eye color="#38bdf8" size={32} />
              <p style={styles.cardLabel}>EAR (Olhos)</p>
              <h2 style={styles.cardValue}>
                {Number(dados.ear ?? 0).toFixed(3)}
              </h2>
            </div>

            <div style={styles.card}>
              <Activity color={statusColor} size={32} />
              <p style={styles.cardLabel}>Status</p>
              <h2 style={{ ...styles.cardValue, color: statusColor }}>
                {dados.nivel.toUpperCase()}
              </h2>
            </div>

            <div style={styles.card}>
              <AlertTriangle
                color={dados.sonolencia ? "#ef4444" : "#22c55e"}
                size={32}
              />
              <p style={styles.cardLabel}>Sonolência</p>
              <h2 style={styles.cardValue}>
                {dados.sonolencia ? "SIM" : "NÃO"}
              </h2>
            </div>

          </div>

          {/* 🔥 GRÁFICO RESTAURADO */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>
              Monitoramento EAR em Tempo Real
            </h3>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico}>
                <XAxis dataKey="time" />
                <YAxis domain={[0, 0.5]} />
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