import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';

function buildSimilarityMatrix(responses, cards) {
  const cardIds = cards.map(c => c.id);
  const n = cardIds.length;
  const cooccurrence = Array.from({ length: n }, () => Array(n).fill(0));

  responses.forEach(response => {
    if (!response.groups) return;
    response.groups.forEach(group => {
      const ids = group.card_ids || [];
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = cardIds.indexOf(ids[i]);
          const b = cardIds.indexOf(ids[j]);
          if (a >= 0 && b >= 0) {
            cooccurrence[a][b]++;
            cooccurrence[b][a]++;
          }
        }
      }
    });
  });

  const total = responses.length || 1;
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) =>
      i === j ? 100 : Math.round((cooccurrence[i][j] / total) * 100)
    )
  );
}

function getCellStyle(value) {
  if (value >= 80) return { background: '#1d4ed8', color: '#fff' };
  if (value >= 60) return { background: '#3b82f6', color: '#fff' };
  if (value >= 40) return { background: '#93c5fd', color: '#1e3a5f' };
  if (value >= 20) return { background: '#bfdbfe', color: '#1e3a5f' };
  if (value > 0)   return { background: '#dbeafe', color: '#1e3a5f' };
  return { background: '#f1f5f9', color: '#94a3b8' };
}

export default function SimilarityMatrix({ responses, study }) {
  const cards = study?.cards || [];
  const matrix = useMemo(() => buildSimilarityMatrix(responses, cards), [responses, cards]);

  if (responses.length === 0 || cards.length === 0) {
    return (
      <div className="bg-card rounded-2xl border p-8 text-center">
        <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-7 h-7 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-1">Sin datos suficientes</h3>
        <p className="text-sm text-muted-foreground">Se necesitan respuestas de participantes para generar la matriz.</p>
      </div>
    );
  }

  const n = cards.length;
  let cellSize = 32;
  let fontSize = '12px';
  let labelFontSize = '11px';

  if (n > 24) {
    cellSize = 14; fontSize = '8px'; labelFontSize = '9px';
  } else if (n > 16) {
    cellSize = 18; fontSize = '9px'; labelFontSize = '10px';
  } else if (n > 10) {
    cellSize = 24; fontSize = '11px'; labelFontSize = '11px';
  } else if (n > 6) {
    cellSize = 28; fontSize = '12px'; labelFontSize = '12px';
  }

  return (
    <div className="bg-card rounded-2xl border p-5">
      <h3 className="font-semibold mb-2">Matriz de Similitud</h3>
      <p className="text-sm text-muted-foreground mb-5">
        Porcentaje de veces que cada par de tarjetas fue agrupado junto por los participantes.
      </p>

      {/* Legend */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <span className="text-xs text-muted-foreground">Similitud:</span>
        {[0, 20, 40, 60, 80].map(val => (
          <div key={val} className="flex items-center gap-1">
            <div
              className="w-7 h-5 rounded text-xs flex items-center justify-center font-medium"
              style={getCellStyle(val)}
            >
              {val}
            </div>
            <span className="text-xs text-muted-foreground">{val}%</span>
          </div>
        ))}
      </div>

      {/* Matrix */}
      <div className="w-full overflow-hidden">
        <div className="flex flex-col">
          {cards.map((card, rowIdx) => (
            <div
              key={card.id}
              className="flex items-center"
              style={{ height: `${cellSize}px` }}
            >
              {Array.from({ length: rowIdx }, (_, colIdx) => {
                const val = matrix[rowIdx]?.[colIdx] ?? 0;
                return (
                  <div
                    key={colIdx}
                    className="flex items-center justify-center font-bold flex-shrink-0"
                    style={{
                      ...getCellStyle(val),
                      width: `${cellSize}px`,
                      height: `${cellSize}px`,
                      fontSize,
                      borderRight: '1px solid #fff',
                      borderBottom: '1px solid #fff',
                    }}
                    title={`${cards[rowIdx].label} ↔ ${cards[colIdx].label}: ${val}%`}
                  >
                    {val}
                  </div>
                );
              })}
              <div
                className="pl-2 font-medium text-foreground truncate"
                style={{ fontSize: labelFontSize, lineHeight: `${cellSize}px`, maxWidth: '220px' }}
                title={card.label}
              >
                {card.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}