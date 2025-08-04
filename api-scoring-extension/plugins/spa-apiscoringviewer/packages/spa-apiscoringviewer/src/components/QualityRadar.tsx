import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

/**
 * Displays a quality radar chart for Design, Security and Documentation.
 * @param {{design: number, security: number, documentation: number}} props
 */
export default function QualityRadar({ design, security, documentation }) {
  const data = [
    { categoria: 'Design',        quality: design },
    { categoria: 'Security',     quality: security },
    { categoria: 'Documentation', quality: documentation }
  ];



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
        name="Quality"
        dataKey="quality"
        stroke="#FFAB00"
        strokeWidth={2}
        fill="#FFAB00"
        fillOpacity={0.3}
      />
    </RadarChart>
  );
}

