"use client";

import { useEffect, useRef, useState } from "react";

export default function App() {

  // =====================================
  // STATES
  // =====================================

  const [mounted, setMounted] =
    useState(false);

  const [cameraAtiva, setCameraAtiva] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [erroApi, setErroApi] =
    useState(false);

  const [dados, setDados] =
    useState({
      ear: 0,
      sonolencia: false,
      nivel: "normal"
    });

  // =====================================
  // REFS
  // =====================================

  const videoRef = useRef(null);

  // =====================================
  // EVITA HYDRATION ERROR
  // =====================================

  useEffect(() => {

    setMounted(true);

  }, []);

  // =====================================
  // INICIAR CAMERA
  // =====================================

  const iniciarCamera = async () => {

    try {

      setLoading(true);

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

      setLoading(false);

    } catch (err) {

      console.log(err);

      setLoading(false);

      alert(
        "Erro ao acessar câmera"
      );
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

    const processar = async () => {

      if (!ativo) return;

      try {

        const video = videoRef.current;

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

          // ==========================
          // COMPRESSÃO
          // ==========================

          const image =
            canvas.toDataURL(
              "image/jpeg",
              0.5
            );

          // ==========================
          // API
          // ==========================

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

          // ==========================
          // VERIFICA API
          // ==========================

          if (!response.ok) {

            throw new Error(
              "Erro API"
            );
          }

          const data =
            await response.json();

          console.log("API:", data);

          // ==========================
          // ATUALIZA
          // ==========================

          setErroApi(false);

          setDados({
            ear:
              Number(data.ear || 0),

            sonolencia:
              data.sonolencia || false,

            nivel:
              data.nivel || "normal"
          });

        }

      } catch (err) {

        console.log(
          "ERRO:",
          err
        );

        setErroApi(true);
      }

      // ==========================
      // LOOP CONTROLADO
      // ==========================

      if (ativo) {

        setTimeout(
          processar,
          1200
        );
      }
    };

    processar();

    return () => {

      ativo = false;
    };

  }, [cameraAtiva]);

  // =====================================
  // STATUS COLOR
  // =====================================

  const statusColor =

    dados.nivel === "critico"
      ? "#ef4444"
      : dados.nivel === "atencao"
      ? "#facc15"
      : "#22c55e";

  // =====================================
  // EVITA ERRO REACT 418
  // =====================================

  if (!mounted) {

    return null;
  }

  // =====================================
  // UI
  // =====================================

  return (

    <main style={styles.page}>

      {/* HEADER */}

      <div style={styles.header}>

        <h1 style={styles.title}>
          HYPNOS AI
        </h1>

        <p style={styles.subtitle}>
          Sistema Inteligente de
          Monitoramento de Sonolência
        </p>

      </div>

      {/* LAYOUT */}

      <div style={styles.layout}>

        {/* CAMERA */}

        <div style={styles.cameraCard}>

          <div style={styles.cameraBox}>

            {!cameraAtiva && (

              <div style={styles.placeholder}>

                <h2>
                  Câmera Desativada
                </h2>

                <p>
                  Clique abaixo para iniciar
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

          {/* BOTÃO */}

          <button
            onClick={iniciarCamera}
            disabled={loading}
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

          {/* ALERTA */}

          {dados.sonolencia && (

            <div style={styles.alerta}>

              ⚠ SONOLÊNCIA DETECTADA

            </div>

          )}

          {/* API */}

          {erroApi && (

            <div style={styles.erroApi}>

              API desconectada

            </div>

          )}

          {/* CARDS */}

          <div style={styles.cards}>

            {/* EAR */}

            <div style={styles.card}>

              <p style={styles.cardLabel}>
                EAR
              </p>

              <h2 style={styles.cardValue}>

                {dados.ear.toFixed(3)}

              </h2>

            </div>

            {/* STATUS */}

            <div style={styles.card}>

              <p style={styles.cardLabel}>
                STATUS
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

            {/* SONOLENCIA */}

            <div style={styles.card}>

              <p style={styles.cardLabel}>
                SONOLÊNCIA
              </p>

              <h2 style={styles.cardValue}>

                {dados.sonolencia
                  ? "SIM"
                  : "NÃO"}

              </h2>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}

// =====================================
// STYLES
// =====================================

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
    fontSize: 42,
    marginBottom: 10
  },

  subtitle: {
    color: "#94a3b8",
    fontSize: 18
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
    width: "100%",
    height: 450,
    background: "#111827",
    borderRadius: 20,
    overflow: "hidden",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  placeholder: {
    textAlign: "center",
    color: "white"
  },

  button: {
    width: "100%",
    marginTop: 15,
    padding: 14,
    borderRadius: 12,
    border: "none",
    background: "#38bdf8",
    color: "#000",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: 16
  },

  dashboard: {
    display: "flex",
    flexDirection: "column",
    gap: 20
  },

  alerta: {
    background: "#ef4444",
    padding: 16,
    borderRadius: 12,
    color: "white",
    fontWeight: "bold",
    fontSize: 18
  },

  erroApi: {
    background: "#f59e0b",
    padding: 16,
    borderRadius: 12,
    color: "white",
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
    padding: 25,
    borderRadius: 16,
    textAlign: "center"
  },

  cardLabel: {
    color: "#94a3b8",
    marginBottom: 10,
    fontSize: 14
  },

  cardValue: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold"
  }

};