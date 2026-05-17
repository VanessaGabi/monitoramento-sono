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

  const [historico, setHistorico] = useState([]);

  const [cameraAtiva, setCameraAtiva] =
    useState(false);

  const [erroApi, setErroApi] =
    useState(false);

  const videoRef = useRef(null);

  // =========================
  // INICIAR CAMERA
  // =========================

  const iniciarCamera = async () => {

    try {

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });

      if (videoRef.current) {

        videoRef.current.srcObject = stream;

        await videoRef.current.play();

        setCameraAtiva(true);
      }

    } catch (err) {

      console.log(err);

      alert(
        "Erro ao acessar câmera"
      );
    }
  };

  // =========================
  // LOOP IA
  // =========================

  useEffect(() => {

    if (!cameraAtiva) return;

    let ativo = true;

    const canvas =
      document.createElement("canvas");

    const ctx =
      canvas.getContext("2d");

    const processar = async () => {

      if (!ativo) return;

      try {

        const video = videoRef.current;

        if (
          video &&
          video.readyState === 4
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

          const image =
            canvas.toDataURL(
              "image/jpeg",
              0.7
            );

          const response =
            await fetch(
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

          const data =
            await response.json();

          console.log(data);

          if (!data.erro) {

            setErroApi(false);

            const ear =
              Number(data.ear || 0);

            setDados({
              ear,
              sonolencia:
                data.sonolencia,
              nivel:
                data.nivel
            });

            setHistorico(prev => {

              const novo = [
                ...prev,
                {
                  time: prev.length,
                  ear
                }
              ];

              return novo.slice(-25);
            });

          } else {

            setErroApi(true);
          }

        }

      } catch (err) {

        console.log(err);

        setErroApi(true);
      }

      setTimeout(processar, 700);
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

  return (

    <div style={styles.page}>

      {/* HEADER */}

      <div style={styles.header}>

        <h1 style={styles.title}>
          HYPNOS AI
        </h1>

        <p style={styles.subtitle}>
          Monitoramento Inteligente
          de Sonolência
        </p>

      </div>

      {/* GRID */}

      <div style={styles.layout}>

        {/* CAMERA */}

        <div style={styles.cameraCard}>

          <div style={styles.cameraBox}>

            {!cameraAtiva && (

              <div style={styles.placeholder}>

                <Camera
                  size={60}
                  color="#38bdf8"
                />

                <p>
                  Clique para iniciar
                </p>

              </div>

            )}

            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
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

          <button
            onClick={iniciarCamera}
            style={styles.button}
          >

            {cameraAtiva
              ? "Câmera Ativa"
              : "Ativar Câmera"}

          </button>

        </div>

        {/* DASHBOARD */}

        <div style={styles.right}>

          {/* ALERTA */}

          {dados.sonolencia && (

            <div style={styles.alerta}>

              <AlertTriangle />

              SONOLÊNCIA DETECTADA

            </div>

          )}

          {/* API */}

          {erroApi && (

            <div style={styles.apiErro}>

              Backend desconectado

            </div>

          )}

          {/* CARDS */}

          <div style={styles.cards}>

            <div style={styles.card}>

              <Eye
                color="#38bdf8"
              />

              <p>EAR</p>

              <h2>
                {dados.ear.toFixed(3)}
              </h2>

            </div>

            <div style={styles.card}>

              <Activity
                color={statusColor}
              />

              <p>Status</p>

              <h2
                style={{
                  color: statusColor
                }}
              >

                {dados.nivel}

              </h2>

            </div>

          </div>

          {/* GRAFICO */}

          <div style={styles.chartCard}>

            <h3 style={{
              color: "white",
              marginBottom: 20
            }}>
              EAR em Tempo Real
            </h3>

            <LineChart
              width={700}
              height={300}
              data={historico}
            >

              <XAxis
                dataKey="time"
                stroke="#94a3b8"
              />

              <YAxis
                domain={[0, 0.5]}
                stroke="#94a3b8"
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
  );
}

// =========================
// STYLES
// =========================

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
    color: "#94a3b8"
  },

  layout: {
    display: "grid",
    gridTemplateColumns:
      "350px 1fr",
    gap: 20
  },

  cameraCard: {
    background:
      "rgba(15,23,42,0.8)",
    padding: 20,
    borderRadius: 20
  },

  cameraBox: {
    height: 420,
    background: "#0f172a",
    borderRadius: 20,
    overflow: "hidden",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  placeholder: {
    color: "white",
    textAlign: "center"
  },

  button: {
    width: "100%",
    marginTop: 15,
    padding: 12,
    border: "none",
    borderRadius: 10,
    background: "#38bdf8",
    fontWeight: "bold",
    cursor: "pointer"
  },

  right: {
    display: "flex",
    flexDirection: "column",
    gap: 20
  },

  alerta: {
    background: "#ef4444",
    padding: 14,
    borderRadius: 10,
    color: "white",
    fontWeight: "bold",
    display: "flex",
    gap: 10,
    alignItems: "center"
  },

  apiErro: {
    background: "#f59e0b",
    padding: 10,
    borderRadius: 10,
    color: "white",
    fontWeight: "bold"
  },

  cards: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2,1fr)",
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

  chartCard: {
    background:
      "rgba(15,23,42,0.8)",
    padding: 20,
    borderRadius: 20,
    overflowX: "auto"
  }

};