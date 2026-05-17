"use client";

import dynamic from "next/dynamic";

const HypnosApp = dynamic(
  () => Promise.resolve(HypnosComponent),
  {
    ssr: false
  }
);

export default function Page() {
  return <HypnosApp />;
}

import { useEffect, useRef, useState } from "react";

function HypnosComponent() {

  const videoRef = useRef(null);

  const [cameraAtiva, setCameraAtiva] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [dados, setDados] =
    useState({
      ear: 0,
      sonolencia: false,
      nivel: "normal"
    });

  const [erroApi, setErroApi] =
    useState(false);

  // =====================================
  // CAMERA
  // =====================================

  const iniciarCamera = async () => {

    try {

      setLoading(true);

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });

      if (videoRef.current) {

        videoRef.current.srcObject =
          stream;

        await videoRef.current.play();

        setCameraAtiva(true);
      }

      setLoading(false);

    } catch (err) {

      console.log(err);

      setLoading(false);

      alert("Erro ao abrir câmera");
    }
  };

  // =====================================
  // LOOP IA
  // =====================================

  useEffect(() => {

    if (!cameraAtiva) return;

    let ativo = true;

    const canvas =
      document.createElement("canvas");

    const ctx =
      canvas.getContext("2d");

    const loop = async () => {

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
              0.5
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

            setDados({
              ear:
                Number(data.ear || 0),

              sonolencia:
                data.sonolencia || false,

              nivel:
                data.nivel || "normal"
            });

          } else {

            setErroApi(true);
          }

        }

      } catch (err) {

        console.log(err);

        setErroApi(true);
      }

      setTimeout(loop, 1000);
    };

    loop();

    return () => {

      ativo = false;
    };

  }, [cameraAtiva]);

  // =====================================
  // STATUS
  // =====================================

  const statusColor =

    dados.nivel === "critico"
      ? "#ef4444"
      : dados.nivel === "atencao"
      ? "#facc15"
      : "#22c55e";

  // =====================================
  // UI
  // =====================================

  return (

    <div style={styles.page}>

      <h1 style={styles.title}>
        HYPNOS AI
      </h1>

      <p style={styles.subtitle}>
        Sistema Inteligente de
        Monitoramento de Sonolência
      </p>

      <div style={styles.layout}>

        {/* CAMERA */}

        <div style={styles.cameraCard}>

          <div style={styles.cameraBox}>

            {!cameraAtiva && (

              <div
                style={styles.placeholder}
              >

                <h2>
                  Câmera desligada
                </h2>

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

            {loading
              ? "Carregando..."
              : cameraAtiva
              ? "Câmera Ativa"
              : "Ativar Câmera"}

          </button>

        </div>

        {/* DASHBOARD */}

        <div style={styles.dashboard}>

          {erroApi && (

            <div style={styles.erro}>

              API DESCONECTADA

            </div>

          )}

          {dados.sonolencia && (

            <div style={styles.alerta}>

              SONOLÊNCIA DETECTADA

            </div>

          )}

          <div style={styles.cards}>

            <div style={styles.card}>

              <p>EAR</p>

              <h2>
                {dados.ear.toFixed(3)}
              </h2>

            </div>

            <div style={styles.card}>

              <p>STATUS</p>

              <h2
                style={{
                  color: statusColor
                }}
              >

                {dados.nivel.toUpperCase()}

              </h2>

            </div>

            <div style={styles.card}>

              <p>SONOLÊNCIA</p>

              <h2>

                {dados.sonolencia
                  ? "SIM"
                  : "NÃO"}

              </h2>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

const styles = {

  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg,#020617,#0f172a)",
    padding: 30,
    fontFamily: "Arial",
    color: "white"
  },

  title: {
    textAlign: "center",
    fontSize: 42
  },

  subtitle: {
    textAlign: "center",
    color: "#94a3b8",
    marginBottom: 30
  },

  layout: {
    display: "grid",
    gridTemplateColumns:
      "400px 1fr",
    gap: 20
  },

  cameraCard: {
    background:
      "rgba(15,23,42,0.8)",
    padding: 20,
    borderRadius: 20
  },

  cameraBox: {
    height: 450,
    background: "#111827",
    borderRadius: 20,
    overflow: "hidden",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  placeholder: {
    textAlign: "center"
  },

  button: {
    width: "100%",
    marginTop: 15,
    padding: 14,
    border: "none",
    borderRadius: 12,
    background: "#38bdf8",
    fontWeight: "bold",
    cursor: "pointer"
  },

  dashboard: {
    display: "flex",
    flexDirection: "column",
    gap: 20
  },

  erro: {
    background: "#f59e0b",
    padding: 15,
    borderRadius: 12
  },

  alerta: {
    background: "#ef4444",
    padding: 15,
    borderRadius: 12,
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
    borderRadius: 16,
    textAlign: "center"
  }

};