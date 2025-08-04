import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

/**
 * Visualiza un radar de calidad para Diseño, Seguridad y Documentación.
 * @param {{design: number, security: number, documentation: number}} props
 */
export default function QualityRadar({ design, security, documentation }) {
  const data = [
    { categoria: 'Diseño',        quality: design },
    { categoria: 'Seguridad',     quality: security },
    { categoria: 'Documentación', quality: documentation }
  ];

  console.log('Datos completos recibidos:', {
    certification: JSON.stringify(certification, null, 2),
    modulesMetadata: JSON.stringify(modulesMetadata, null, 2),
    apisRevalidationMetadata: JSON.stringify(apisRevalidationMetadata, null, 2)
  });

  return (
    <RadarChart
      width={400}
      height={400}
      cx="50%"
      cy="50%"
      outerRadius={120}
      data={data}
    >
      <PolarGrid />
      <PolarAngleAxis dataKey="categoria" />
      <PolarRadiusAxis domain={[0, 100]} />

      <Radar
        name="Calidad"
        dataKey="quality"
        stroke="#FFAB00"
        strokeWidth={2}
        fill="#FFAB00"
        fillOpacity={0.3}
      />
    </RadarChart>
  );
}

