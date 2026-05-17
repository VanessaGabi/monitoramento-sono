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

    } catch (err) {

      console.log(err);

      alert("Erro ao acessar câmera");

    } finally {

      setLoading(false);
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
              0.6
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

          // =========================
          // VALIDA RESPONSE
          // =========================

          if (!response.ok) {

            throw new Error(
              "Erro na API"
            );
          }

          const data =
            await response.json();

          console.log(data);

          if (!data.erro) {

            setErroApi(false);

            setDados({
              ear:
                Number(data.ear || 0),

              sonolencia:
                Boolean(
                  data.sonolencia
                ),

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

      // =========================
      // LOOP
      // =========================

      if (ativo) {

        setTimeout(
          processar,
          1000
        );
      }
    };

    processar();

    // =========================
    // CLEANUP
    // =========================

    return () => {

      ativo = false;

      if (
        videoRef.current &&
        videoRef.current.srcObject
      ) {

        const tracks =
          videoRef.current
            .srcObject
            .getTracks();

        tracks.forEach(
          (track) => track.stop()
        );
      }
    };

  }, [cameraAtiva]);

  // =========================
  // STATUS COLOR
  // =========================

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

      <p style={styles.subtitle}>
        Sistema Inteligente de
        Monitoramento de Sonolência
      </p>

      <div style={styles.cameraBox}>

        {!cameraAtiva && (

          <div style={styles.placeholder}>

            <div>

              <p
                style={{
                  fontSize: 22,
                  marginBottom: 10,
                }}
              >
                Câmera Desativada
              </p>

              <p
                style={{
                  opacity: 0.7,
                }}
              >
                Clique abaixo para iniciar
              </p>

            </div>

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
        style={{
          ...styles.button,

          opacity:
            loading ||
            cameraAtiva
              ? 0.7
              : 1,
        }}
        disabled={
          loading || cameraAtiva
        }
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

          <p style={styles.cardLabel}>
            EAR
          </p>

          <h2 style={styles.cardValue}>
            {dados.ear.toFixed(3)}
          </h2>

        </div>

        <div style={styles.card}>

          <p style={styles.cardLabel}>
            STATUS
          </p>

          <h2
            style={{
              ...styles.cardValue,
              color: statusColor,
            }}
          >
            {dados.nivel.toUpperCase()}
          </h2>

        </div>

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
  );
}

const styles = {

  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(to bottom,#020617,#0f172a)",
    padding: 30,
    color: "white",
    fontFamily: "Arial",
  },

  title: {
    textAlign: "center",
    marginBottom: 10,
    fontSize: 42,
    fontWeight: "bold",
  },

  subtitle: {
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 30,
  },

  cameraBox: {
    width: "100%",
    maxWidth: 900,
    height: 500,
    margin: "0 auto",
    background: "#111827",
    borderRadius: 24,
    overflow: "hidden",
    border:
      "1px solid rgba(255,255,255,0.08)",
  },

  placeholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
  },

  button: {
    marginTop: 20,
    width: "100%",
    maxWidth: 900,
    display: "block",
    marginInline: "auto",
    padding: 16,
    border: "none",
    borderRadius: 14,
    background: "#38bdf8",
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
    cursor: "pointer",
  },

  erro: {
    marginTop: 20,
    background: "#ef4444",
    padding: 14,
    borderRadius: 14,
    textAlign: "center",
    maxWidth: 900,
    marginInline: "auto",
  },

  cards: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: 20,
    marginTop: 30,
    maxWidth: 900,
    marginInline: "auto",
  },

  card: {
    background: "#111827",
    padding: 24,
    borderRadius: 18,
    textAlign: "center",
    border:
      "1px solid rgba(255,255,255,0.06)",
  },

  cardLabel: {
    opacity: 0.7,
    marginBottom: 10,
  },

  cardValue: {
    fontSize: 32,
    fontWeight: "bold",
    margin: 0,
  },
};

export default Main;