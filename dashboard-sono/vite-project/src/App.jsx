"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

function Main() {

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
      nivel: "normal",
    });

  const videoRef = useRef(null);

  // =========================
  // CAMERA
  // =========================

  const iniciarCamera = async () => {

    try {

      setLoading(true);

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
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

      alert("Erro ao acessar câmera");
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
              0.5
            );

          const response =
            await fetch(
              "https://monitoramento-sono.onrender.com/processar",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify({
                  image,
                }),
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
                data.nivel || "normal",
            });

          } else {

            setErroApi(true);
          }

        }

      } catch (err) {

        console.log(err);

        setErroApi(true);
      }

      setTimeout(processar, 1000);
    };

    processar();

    return () => {

      ativo = false;
    };

  }, [cameraAtiva]);

  const statusColor =

    dados.nivel === "critico"
      ? "#ef4444"
      : dados.nivel === "atencao"
      ? "#facc15"
      : "#22c55e";

  return (

    <div style={styles.page}>

      <h1 style={styles.title}>
        HYPNOS AI
      </h1>

      <div style={styles.cameraBox}>

        {!cameraAtiva && (
          <div style={styles.placeholder}>
            Câmera desligada
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
                : "none",
          }}
        />

      </div>

      <button
        onClick={iniciarCamera}
        style={styles.button}
        disabled={loading || cameraAtiva}
      >

        {loading
          ? "Carregando..."
          : cameraAtiva
          ? "Câmera ativa"
          : "Ativar câmera"}

      </button>

      {erroApi && (
        <div style={styles.erro}>
          API desconectada
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
              color: statusColor,
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
  );
}

const styles = {

  page: {
    minHeight: "100vh",
    background: "#020617",
    padding: 30,
    color: "white",
    fontFamily: "Arial",
  },

  title: {
    textAlign: "center",
    marginBottom: 30,
  },

  cameraBox: {
    width: "100%",
    maxWidth: 700,
    height: 450,
    margin: "0 auto",
    background: "#111827",
    borderRadius: 20,
    overflow: "hidden",
  },

  placeholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  button: {
    marginTop: 20,
    width: "100%",
    maxWidth: 700,
    display: "block",
    marginInline: "auto",
    padding: 16,
    border: "none",
    borderRadius: 12,
    background: "#38bdf8",
    fontWeight: "bold",
    cursor: "pointer",
  },

  erro: {
    marginTop: 20,
    background: "#ef4444",
    padding: 12,
    borderRadius: 12,
    textAlign: "center",
  },

  cards: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: 20,
    marginTop: 30,
  },

  card: {
    background: "#111827",
    padding: 20,
    borderRadius: 16,
    textAlign: "center",
  },
};

export default Main;