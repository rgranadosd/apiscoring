// src/components/IndicatorRadar.tsx
import React from 'react'
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'

export interface IndicatorRadarProps {
  design: number
  security: number
  documentation: number
}

const IndicatorRadar: React.FC<IndicatorRadarProps> = ({
  design,
  security,
  documentation,
}) => {
  const data = [
    { subject: 'Design', A: design, fullMark: 100 },
    { subject: 'Security', A: security, fullMark: 100 },
    { subject: 'Documentation', A: documentation, fullMark: 100 },
  ]

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis angle={30} domain={[0, 100]} />
          <Radar
            name="Score"
            dataKey="A"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default IndicatorRadar

