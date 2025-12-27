"use client";

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip } from 'recharts';

interface WritingSkillChartProps {
    scores: {
        grammar: number;
        vocabulary: number;
        coherence: number;
        expression: number;
        clarity: number;
    };
}

export function WritingSkillChart({ scores }: WritingSkillChartProps) {
    const data = [
        { subject: 'Grammar', A: scores.grammar, fullMark: 100 },
        { subject: 'Vocab', A: scores.vocabulary, fullMark: 100 },
        { subject: 'Logic', A: scores.coherence, fullMark: 100 },
        { subject: 'Flow', A: scores.expression, fullMark: 100 },
        { subject: 'Clarity', A: scores.clarity, fullMark: 100 },
    ];

    return (
        <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 600 }}
                />
                <Radar
                    name="My Skills"
                    dataKey="A"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fill="#3b82f6"
                    fillOpacity={0.2}
                />
                <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#1f2937', fontWeight: 600 }}
                    formatter={(value: any) => [`${value}점`, 'Total Score']}
                />
            </RadarChart>
        </ResponsiveContainer>
    );
}
