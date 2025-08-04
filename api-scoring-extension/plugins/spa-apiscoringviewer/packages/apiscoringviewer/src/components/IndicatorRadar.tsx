// SPDX-FileCopyrightText: 2023 Industria de Diseño Textil S.A. INDITEX
//
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartOptions,
  ScriptableScaleContext,
} from "chart.js";
import { Radar } from "react-chartjs-2";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export interface IndicatorRadarProps {
  design: number;
  security: number;
  documentation: number;
}

export default function IndicatorRadar({
  design,
  security,
  documentation,
}: IndicatorRadarProps) {
  // Convertir y validar los valores
  const designValue = Number(design);
  const securityValue = Number(security);
  const documentationValue = Number(documentation);

  // Usar los valores recibidos en lugar de valores forzados
  const data = {
    // Ajustar el orden de las etiquetas para corresponder con los puntos estándar del pentágono
    // En un radar de 3 puntos, la primera posición es arriba, luego abajo derecha, abajo izquierda
    labels: ["Documentación", "Diseño", "Seguridad"],
    datasets: [
      {
        label: "Puntuación",
        // Mantener el orden de los datos consistente con las etiquetas
        data: [documentationValue, designValue, securityValue],
        backgroundColor: "rgba(255, 171, 0, 0.3)",
        borderColor: "#ffab00",
        borderWidth: 1.5,
        pointBackgroundColor: "#ffab00",
        pointBorderColor: "#333333",
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
      },
    ],
  };

  const options: ChartOptions<"radar"> = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        angleLines: {
          color: "#444444",
          lineWidth: 1,
          display: true,
        },
        grid: {
          color: (ctx: ScriptableScaleContext) =>
            ctx.index % 2 === 0 ? "#333333" : "#222222",
          circular: true,
          display: true,
        },
        beginAtZero: true,
        ticks: {
          // Ocultar completamente los ticks
          display: false,
          stepSize: 20
        },
        pointLabels: {
          color: "#eeeeee",
          font: {
            size: 14,
            weight: 500,
          },
          // Quitar el centrado para permitir alineación natural con ejes
          centerPointLabels: false,
          padding: 12
        },
        min: 0,
        max: 100,
        // Bloquear la rotación del gráfico para que las etiquetas permanezcan en posiciones fijas
        startAngle: 0,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false
      },
    },
  };

  // Estilos del contenedor para forzar que aparezca debajo
  const containerStyles = {
    width: '100%',
    maxWidth: '400px',
    height: '300px',
    margin: '0',
    padding: '5px',
    display: 'block',
    position: 'relative' as const,
    overflow: 'visible'
  };

  return (
    <div style={containerStyles} className="radar-container">
      <Radar data={data} options={options} />
    </div>
  );
}
