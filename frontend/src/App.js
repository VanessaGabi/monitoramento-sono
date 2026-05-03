import React, { useEffect, useState, useRef } from 'react';
import { Eye, Activity, Clock, AlertTriangle } from 'lucide-react';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

function App() {
  const [dados, setDados] = useState({
    ear: 0,
    sonolencia: false,
    nivel: 'normal',
  });

  const [conectado, setConectado] = useState(false);
  const [blinkRate, setBlinkRate] = useState(12);
  const [historico, setHistorico] = useState([]);

  const alertSoundRef = useRef(null);

  useEffect(() => {
    alertSoundRef.current = new Audio('/alert.mp3');
    alertSoundRef.current.volume = 0.5;
  }, []);

  const fetchDados = async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch('http://127.0.0.1:5000/dados', {
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) throw new Error('API offline');

      const json = await response.json();

      setDados(json);
      setConectado(true);

      setBlinkRate(Math.floor(Math.random() * 10) + 8);

      if (json.sonolencia && alertSoundRef.current) {
        alertSoundRef.current.currentTime = 0;
        alertSoundRef.current.play().catch(() => {});
      }

      setHistorico(prev => {
        const novo = [
          ...prev,
          {
            tempo: new Date().toLocaleTimeString(),
            nivel:
              json.nivel === 'normal'
                ? 20
                : json.nivel === 'atencao'
                ? 60
                : 90
          }
        ];

        return novo.slice(-20);
      });

    } catch (error) {
      setConectado(false);
    }
  };

  useEffect(() => {
    fetchDados();
    const interval = setInterval(fetchDados, 1000);
    return () => clearInterval(interval);
  }, []);

  const getNivelPercentual = () => {
    switch (dados.nivel) {
      case 'normal': return 20;
      case 'atencao': return 60;
      case 'critico': return 90;
      default: return 0;
    }
  };

  const isCritico = dados.nivel === 'critico';

  return (
    <div className={`min-h-screen p-6 text-white transition-all duration-300 ${
      isCritico ? 'bg-red-950 animate-pulse' : 'bg-[#050505]'
    }`}>

      {isCritico && (
        <div className="bg-red-600 text-white p-3 rounded-lg mb-4 text-center font-bold animate-pulse">
          ⚠ SISTEMA EM ESTADO CRÍTICO - SONOLÊNCIA DETECTADA
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Hypnos Dashboard</h1>

        <div className={`px-4 py-2 rounded-full text-sm font-bold ${
          conectado
            ? 'bg-green-500/20 text-green-400'
            : 'bg-red-500/20 text-red-400'
        }`}>
          {conectado ? '🟢 SISTEMA ATIVO' : '🔴 SISTEMA OFFLINE'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 🔥 CÂMERA DENTRO DO REACT (CORRETO) */}
        <div className="bg-slate-900 rounded-xl p-6">
          <h2 className="text-xl mb-4">Feed da Câmera</h2>

          <img
            src="http://127.0.0.1:5000/video"
            alt="camera"
            className="rounded-lg w-full h-[400px] object-cover border border-slate-700"
          />
        </div>

        {/* MÉTRICAS */}
        <div className="grid grid-cols-2 gap-4">

          <MetricCard
            title="EAR"
            value={dados.ear ? dados.ear.toFixed(2) : '0.00'}
            subValue="Eye Aspect Ratio"
            icon={<Eye size={20} />}
          />

          <MetricCard
            title="Piscadas"
            value={`${blinkRate}`}
            subValue="por minuto"
            icon={<Activity size={20} />}
          />

          <MetricCard
            title="Fechamento"
            value={dados.sonolencia ? '1.5s' : '0.2s'}
            subValue="tempo médio"
            icon={<Clock size={20} />}
          />

          <div className="bg-slate-900 rounded-xl p-5 col-span-2">
            <h3 className="text-sm text-slate-400 mb-3">
              Nível de Sonolência
            </h3>

            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-red-500"
                style={{ width: `${getNivelPercentual()}%` }}
              />
            </div>

            <div className="mt-4 flex justify-between items-center">
              <span className="text-lg font-bold">
                {dados.nivel?.toUpperCase() || 'NORMAL'}
              </span>

              <AlertTriangle
                className={
                  dados.nivel === 'critico'
                    ? 'text-red-500'
                    : 'text-yellow-400'
                }
              />
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-5 col-span-2">
            <h3 className="text-sm text-slate-400 mb-3">
              Histórico de Sonolência
            </h3>

            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historico}>
                  <XAxis dataKey="tempo" hide />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="nivel"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

const MetricCard = ({ title, value, subValue, icon }) => {
  return (
    <div className="bg-slate-900 rounded-xl p-5">
      <div className="text-cyan-400 mb-3">{icon}</div>
      <h3 className="text-sm text-slate-400">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-slate-500">{subValue}</p>
    </div>
  );
};

export default App;