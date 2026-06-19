import React, { useMemo, useState } from 'react';
import { GitMerge } from 'lucide-react';

function buildDistanceMatrix(responses, cards) {
  const cardIds = cards.map(c => c.id);
  const n = cardIds.length;
  const co = Array.from({ length: n }, () => Array(n).fill(0));
  responses.forEach(r => {
    (r.groups || []).forEach(g => {
      const ids = g.card_ids || [];
      for (let i = 0; i < ids.length; i++)
        for (let j = i + 1; j < ids.length; j++) {
          const a = cardIds.indexOf(ids[i]);
          const b = cardIds.indexOf(ids[j]);
          if (a >= 0 && b >= 0) { co[a][b]++; co[b][a]++; }
        }
    });
  });
  const total = responses.length || 1;
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) =>
      i === j ? 0 : 1 - co[i][j] / total
    )
  );
}

function clusterTree(distMatrix, labels) {
  const n = distMatrix.length;
  if (n === 0) return null;
  if (n === 1) return { label: labels[0], isLeaf: true, height: 0, similarity: 100, leaves: [labels[0]] };

  const dist = distMatrix.map(r => [...r]);
  let clusters = labels.map((l, i) => ({
    node: { label: l, isLeaf: true, height: 0, similarity: 100, leaves: [l] },
    indices: [i],
  }));

  while (clusters.length > 1) {
    let best = Infinity, bi = 0, bj = 1;
    for (let i = 0; i < clusters.length; i++)
      for (let j = i + 1; j < clusters.length; j++) {
        let sum = 0, cnt = 0;
        for (const a of clusters[i].indices)
          for (const b of clusters[j].indices) { sum += dist[a][b]; cnt++; }
        const avg = sum / cnt;
        if (avg < best) { best = avg; bi = i; bj = j; }
      }
    const sim = Math.round((1 - best) * 100);
    const merged = {
      node: {
        isLeaf: false,
        height: best,
        similarity: sim,
        leaves: [...clusters[bi].node.leaves, ...clusters[bj].node.leaves],
        children: [clusters[bi].node, clusters[bj].node],
      },
      indices: [...clusters[bi].indices, ...clusters[bj].indices],
    };
    clusters = clusters.filter((_, i) => i !== bi && i !== bj);
    clusters.push(merged);
  }
  return clusters[0].node;
}

function assignPositions(node, counter = { val: 0 }) {
  if (node.isLeaf) { node.leafIndex = counter.val++; return; }
  for (const c of node.children) assignPositions(c, counter);
}

function resolveY(node, rowH) {
  if (node.isLeaf) { node.y = node.leafIndex * rowH + rowH / 2; return; }
  for (const c of node.children) resolveY(c, rowH);
  node.y = (node.children[0].y + node.children[1].y) / 2;
}

function collectLeaves(node, out = []) {
  if (node.isLeaf) { out.push(node); return out; }
  for (const c of node.children) collectLeaves(c, out);
  return out;
}

// Hojas a la izquierda (100% similitud), raíz a la derecha (0% similitud)
function buildPaths(node, treeWidth, maxH, labelWidth) {
  const paths = [];
  const clusterNodes = [];

  function xOf(n) {
    // height=0 (hoja) → x=labelWidth; height=maxH (raíz) → x=labelWidth+treeWidth
    return labelWidth + ((n.height || 0) / (maxH || 1)) * treeWidth;
  }

  function traverse(n) {
    if (n.isLeaf) return;
    const sx = xOf(n);
    const c0 = n.children[0], c1 = n.children[1];
    const c0x = xOf(c0), c1x = xOf(c1);

    paths.push(`M ${sx} ${c0.y} L ${sx} ${c1.y}`);
    paths.push(`M ${c0x} ${c0.y} L ${sx} ${c0.y}`);
    paths.push(`M ${c1x} ${c1.y} L ${sx} ${c1.y}`);

    clusterNodes.push({ x: sx, y: n.y, sim: n.similarity, leaves: n.leaves, leafCount: n.leaves.length });
    traverse(c0);
    traverse(c1);
  }

  traverse(node);
  return { paths, clusterNodes };
}

function Tooltip({ data, x, y, svgWidth }) {
  if (!data) return null;
  const w = 220;
  const adjustedX = x + w + 12 > svgWidth ? x - w - 12 : x + 12;
  return (
    <foreignObject x={adjustedX} y={y - 20} width={w} height={140}>
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        style={{
          background: '#1e293b', color: '#f8fafc', borderRadius: 8,
          padding: '10px 12px', fontSize: 11, lineHeight: 1.5,
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.35)',
          pointerEvents: 'none', border: '1px solid #334155',
        }}
      >
        <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: 4 }}>{data.sim}% Similitud</div>
        <div style={{ color: '#94a3b8', fontWeight: 500, marginBottom: 6 }}>{data.leafCount} tarjetas agrupadas</div>
        <div style={{ maxHeight: 70, overflowY: 'auto', fontSize: 10 }}>
          {data.leaves.map((l, i) => (
            <div key={i} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>• {l}</div>
          ))}
        </div>
      </div>
    </foreignObject>
  );
}

export default function Dendrogram({ responses, study }) {
  const cards = study?.cards || [];
  const [tooltip, setTooltip] = useState(null);
  const [hoveredLeaf, setHoveredLeaf] = useState(null);
  const [hoveredCluster, setHoveredCluster] = useState(null);

  const layout = useMemo(() => {
    if (responses.length === 0 || cards.length < 2) return null;

    const dist = buildDistanceMatrix(responses, cards);
    const tree = clusterTree(dist, cards.map(c => c.label));
    if (!tree) return null;

    const rowH = 40;
    const n = cards.length;
    const svgHeight = n * rowH;

    const maxLabelLen = Math.max(...cards.map(c => c.label.length));
    const labelWidth = Math.min(Math.max(maxLabelLen * 7.5 + 20, 140), 280);
    const treeWidth = Math.max(400, n * 20);

    assignPositions(tree);
    resolveY(tree, rowH);

    const leaves = collectLeaves(tree);
    const maxH = tree.height || 1;
    const { paths, clusterNodes } = buildPaths(tree, treeWidth, maxH, labelWidth);

    // 100% a la izquierda, 0% a la derecha
    const axisTicks = [100, 75, 50, 25, 0].map(pct => ({
      pct,
      x: labelWidth + (1 - pct / 100) * treeWidth,
    }));

    return {
      tree, leaves, paths, clusterNodes,
      rowH, svgHeight, labelWidth, treeWidth,
      totalSvgWidth: labelWidth + treeWidth + 40,
      axisTicks,
    };
  }, [responses, cards]);

  if (!layout) {
    return (
      <div className="bg-card rounded-2xl border p-8 text-center">
        <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
          <GitMerge className="w-7 h-7 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-1">Sin datos suficientes</h3>
        <p className="text-sm text-muted-foreground">
          Se necesitan al menos 2 tarjetas y respuestas de participantes para generar el dendrograma.
        </p>
      </div>
    );
  }

  const { leaves, paths, clusterNodes, rowH, svgHeight, labelWidth, treeWidth, totalSvgWidth, axisTicks } = layout;
  const axisHeight = 38;
  const totalHeight = svgHeight + axisHeight;

  const highlightedLeaves = new Set();
  if (hoveredCluster) hoveredCluster.leaves.forEach(l => highlightedLeaves.add(l));
  if (hoveredLeaf) highlightedLeaves.add(hoveredLeaf);

  return (
    <div className="bg-card rounded-2xl border p-5">
      <h3 className="font-semibold mb-1">Dendrograma</h3>
      <p className="text-sm text-muted-foreground mb-5">
        Agrupaciones jerárquicas basadas en cómo los participantes clasificaron las tarjetas.
      </p>
      <div className="overflow-x-auto">
        <svg
          width={totalSvgWidth}
          height={totalHeight}
          style={{ display: 'block', minWidth: totalSvgWidth }}
          onMouseLeave={() => { setTooltip(null); setHoveredLeaf(null); setHoveredCluster(null); }}
        >
          {/* Grid lines */}
          {axisTicks.map(t => (
            <line key={t.pct} x1={t.x} y1={0} x2={t.x} y2={svgHeight + 4}
              stroke="#f1f5f9" strokeWidth={1} strokeDasharray="3 3" />
          ))}

          {/* Axis */}
          <line x1={labelWidth} y1={svgHeight + 4} x2={labelWidth + treeWidth} y2={svgHeight + 4}
            stroke="#cbd5e1" strokeWidth={1.5} />
          {axisTicks.map(t => (
            <g key={t.pct}>
              <line x1={t.x} y1={svgHeight + 4} x2={t.x} y2={svgHeight + 11} stroke="#94a3b8" strokeWidth={1.5} />
              <text x={t.x} y={svgHeight + 24} textAnchor="middle" fontSize={10} fill="#64748b" fontWeight="500">
                {t.pct}%
              </text>
            </g>
          ))}
          <text x={labelWidth + treeWidth / 2} y={totalHeight - 2} textAnchor="middle" fontSize={11} fill="#475569" fontWeight="600">
            Similitud
          </text>

          {/* Leaf labels */}
          {leaves.map((leaf, i) => {
            const isHighlighted = highlightedLeaves.size === 0 || highlightedLeaves.has(leaf.label);
            return (
              <g key={i}
                onMouseEnter={() => setHoveredLeaf(leaf.label)}
                onMouseLeave={() => setHoveredLeaf(null)}
                style={{ cursor: 'default' }}
              >
                <rect x={0} y={leaf.y - rowH / 2} width={labelWidth} height={rowH} fill="transparent" />
                <text
                  x={labelWidth - 12} y={leaf.y + 4}
                  textAnchor="end" fontSize={12}
                  fill={isHighlighted ? '#1e293b' : '#cbd5e1'}
                  fontWeight={highlightedLeaves.has(leaf.label) ? '600' : '400'}
                >
                  {leaf.label}
                </text>
                {/* Leader line connecting label to tree */}
                <line
                  x1={labelWidth - 8} y1={leaf.y}
                  x2={labelWidth} y2={leaf.y}
                  stroke={isHighlighted ? '#94a3b8' : '#e2e8f0'}
                  strokeWidth={1}
                />
              </g>
            );
          })}

          {/* Tree branches */}
          {paths.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="#3b82f6" strokeWidth={1.8}
              strokeLinecap="round" strokeLinejoin="round"
              opacity={hoveredCluster ? 0.2 : 0.85}
            />
          ))}

          {/* Highlighted paths on hover */}
          {hoveredCluster && paths.map((d, i) => (
            <path key={`hl-${i}`} d={d} fill="none" stroke="#1d4ed8"
              strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
          ))}

          {/* Cluster nodes */}
          {clusterNodes.map((cn, i) => {
            const isHovered = hoveredCluster === cn;
            return (
              <g key={i}
                onMouseEnter={() => { setHoveredCluster(cn); setTooltip({ data: cn, x: cn.x, y: cn.y }); }}
                onMouseLeave={() => { setHoveredCluster(null); setTooltip(null); }}
                style={{ cursor: 'pointer' }}
              >
                <circle cx={cn.x} cy={cn.y} r={14} fill="transparent" />
                <circle cx={cn.x} cy={cn.y} r={isHovered ? 5.5 : 3.5}
                  fill={isHovered ? '#1d4ed8' : '#3b82f6'} />
                <text x={cn.x} y={cn.y - 8} textAnchor="middle" fontSize={9}
                  fontWeight={isHovered ? '700' : '500'}
                  fill={isHovered ? '#1d4ed8' : '#475569'}
                >
                  {cn.sim}%
                </text>
              </g>
            );
          })}

          {/* Tooltip */}
          {tooltip && (
            <Tooltip data={tooltip.data} x={tooltip.x} y={tooltip.y} svgWidth={totalSvgWidth} />
          )}
        </svg>
      </div>
    </div>
  );
}