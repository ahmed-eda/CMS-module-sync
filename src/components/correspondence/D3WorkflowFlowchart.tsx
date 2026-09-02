import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { WorkflowStep } from './WorkflowVisualizer';

interface D3WorkflowFlowchartProps {
  steps: WorkflowStep[];
  selectedStepId: string | null;
  onSelectStep: (stepId: string) => void;
  layoutMode: 'horizontal' | 'vertical';
  zoomLevel: number;
  locale: 'ar' | 'en';
}

export const D3WorkflowFlowchart: React.FC<D3WorkflowFlowchartProps> = ({
  steps,
  selectedStepId,
  onSelectStep,
  layoutMode,
  zoomLevel,
  locale
}) => {
  const isAr = locale === 'ar';
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Status color mapping for D3 interpolation
  const getStatusColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'COMPLETED':
        return '#10b981'; // emerald-500
      case 'ACTIVE':
        return '#3b82f6'; // blue-500
      case 'REJECTED':
        return '#f43f5e'; // rose-500
      case 'PENDING':
      default:
        return '#94a3b8'; // slate-400
    }
  };

  const getStatusBgColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'COMPLETED':
        return '#ecfdf5'; // emerald-50
      case 'ACTIVE':
        return '#eff6ff'; // blue-50
      case 'REJECTED':
        return '#fff1f2'; // rose-50
      case 'PENDING':
      default:
        return '#f8fafc'; // slate-50
    }
  };

  useEffect(() => {
    if (!svgRef.current || steps.length === 0) return;

    const svg = d3.select(svgRef.current);
    const width = layoutMode === 'horizontal' ? Math.max(900, steps.length * 220 + 80) : 680;
    const height = layoutMode === 'horizontal' ? 320 : steps.length * 150 + 80;

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    // Ensure filter defs for glow and shadows
    let defs = svg.select<SVGDefsElement>('defs');
    if (defs.empty()) {
      defs = svg.append('defs');

      // Drop shadow filter
      const filter = defs.append('filter')
        .attr('id', 'd3-node-shadow')
        .attr('x', '-20%')
        .attr('y', '-20%')
        .attr('width', '140%')
        .attr('height', '140%');
      filter.append('feDropShadow')
        .attr('dx', '0')
        .attr('dy', '4')
        .attr('stdDeviation', '6')
        .attr('flood-color', '#0f172a')
        .attr('flood-opacity', '0.08');

      // Glow filter for active step
      const glow = defs.append('filter')
        .attr('id', 'd3-active-glow')
        .attr('x', '-30%')
        .attr('y', '-30%')
        .attr('width', '160%')
        .attr('height', '160%');
      glow.append('feGaussianBlur')
        .attr('stdDeviation', '5')
        .attr('result', 'coloredBlur');
      const feMerge = glow.append('feMerge');
      feMerge.append('feMergeNode').attr('in', 'coloredBlur');
      feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

      // Arrow markers
      const marker = defs.append('marker')
        .attr('id', 'd3-arrow-head')
        .attr('viewBox', '0 0 10 10')
        .attr('refX', 6)
        .attr('refY', 5)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto-start-reverse');
      marker.append('path')
        .attr('d', 'M 0 1.5 L 8 5 L 0 8.5 z')
        .attr('fill', '#10b981');
    }

    // Main Canvas Group
    let mainGroup = svg.select<SVGGElement>('.d3-main-group');
    if (mainGroup.empty()) {
      mainGroup = svg.append('g').attr('class', 'd3-main-group');
    }

    // Node layout coordinate calculations
    const nodeWidth = 190;
    const nodeHeight = 110;

    interface NodeData extends WorkflowStep {
      x: number;
      y: number;
    }

    const nodeData: NodeData[] = steps.map((step, index) => {
      let x = 0;
      let y = 0;
      if (layoutMode === 'horizontal') {
        x = 50 + index * 210;
        y = 90;
      } else {
        x = width / 2 - nodeWidth / 2;
        y = 40 + index * 140;
      }
      return {
        ...step,
        x,
        y
      };
    });

    // Links between consecutive steps
    interface LinkData {
      id: string;
      source: NodeData;
      target: NodeData;
      status: WorkflowStep['status'];
    }

    const linksData: LinkData[] = [];
    for (let i = 0; i < nodeData.length - 1; i++) {
      linksData.push({
        id: `link-${nodeData[i].id}-${nodeData[i + 1].id}`,
        source: nodeData[i],
        target: nodeData[i + 1],
        status: nodeData[i + 1].status === 'PENDING' ? 'PENDING' : nodeData[i].status
      });
    }

    // ----------------------------------------------------
    // 1. D3 LINKS RENDER & TRANSITIONS
    // ----------------------------------------------------
    let linksLayer = mainGroup.select<SVGGElement>('.d3-links-layer');
    if (linksLayer.empty()) {
      linksLayer = mainGroup.append('g').attr('class', 'd3-links-layer');
    }

    const linkGenerator = (d: LinkData) => {
      if (layoutMode === 'horizontal') {
        const startX = d.source.x + nodeWidth;
        const startY = d.source.y + nodeHeight / 2;
        const endX = d.target.x;
        const endY = d.target.y + nodeHeight / 2;
        return `M ${startX} ${startY} C ${startX + 15} ${startY}, ${endX - 15} ${endY}, ${endX} ${endY}`;
      } else {
        const startX = d.source.x + nodeWidth / 2;
        const startY = d.source.y + nodeHeight;
        const endX = d.target.x + nodeWidth / 2;
        const endY = d.target.y;
        return `M ${startX} ${startY} C ${startX} ${startY + 15}, ${endX} ${endY - 15}, ${endX} ${endY}`;
      }
    };

    const linkSelection = linksLayer
      .selectAll<SVGPathElement, LinkData>('.workflow-link')
      .data(linksData, d => d.id);

    // Enter & Update with smooth D3 Transitions
    linkSelection
      .join(
        enter =>
          enter
            .append('path')
            .attr('class', 'workflow-link')
            .attr('fill', 'none')
            .attr('stroke-linecap', 'round')
            .attr('d', linkGenerator)
            .attr('stroke', d => (d.status === 'COMPLETED' ? '#10b981' : d.status === 'ACTIVE' ? '#3b82f6' : '#cbd5e1'))
            .attr('stroke-width', d => (d.status === 'ACTIVE' ? 3.5 : 2.5))
            .attr('stroke-dasharray', d => (d.status === 'PENDING' ? '5 5' : 'none'))
            .attr('opacity', 0)
            .call(enter =>
              enter
                .transition()
                .duration(650)
                .ease(d3.easeCubicOut)
                .attr('opacity', 0.9)
            ),
        update =>
          update.call(update =>
            update
              .transition()
              .duration(650)
              .ease(d3.easeCubicOut)
              .attr('d', linkGenerator)
              .attr('stroke', d => (d.status === 'COMPLETED' ? '#10b981' : d.status === 'ACTIVE' ? '#3b82f6' : '#cbd5e1'))
              .attr('stroke-width', d => (d.status === 'ACTIVE' ? 3.5 : 2.5))
              .attr('stroke-dasharray', d => (d.status === 'PENDING' ? '5 5' : 'none'))
          ),
        exit =>
          exit.call(exit =>
            exit
              .transition()
              .duration(400)
              .attr('opacity', 0)
              .remove()
          )
      );

    // ----------------------------------------------------
    // 2. D3 NODES RENDER & TRANSITIONS
    // ----------------------------------------------------
    let nodesLayer = mainGroup.select<SVGGElement>('.d3-nodes-layer');
    if (nodesLayer.empty()) {
      nodesLayer = mainGroup.append('g').attr('class', 'd3-nodes-layer');
    }

    const nodeSelection = nodesLayer
      .selectAll<SVGGElement, NodeData>('.workflow-node')
      .data(nodeData, d => d.id);

    const nodeEnter = nodeSelection
      .enter()
      .append('g')
      .attr('class', 'workflow-node cursor-pointer')
      .attr('transform', d => `translate(${d.x}, ${d.y}) scale(0.85)`)
      .attr('opacity', 0)
      .on('click', (_, d) => {
        onSelectStep(d.id);
      });

    // Node outer container card
    nodeEnter
      .append('rect')
      .attr('class', 'node-card-bg')
      .attr('width', nodeWidth)
      .attr('height', nodeHeight)
      .attr('rx', 16)
      .attr('ry', 16)
      .attr('fill', '#ffffff')
      .attr('stroke-width', 2)
      .attr('filter', 'url(#d3-node-shadow)');

    // Node accent header line
    nodeEnter
      .append('rect')
      .attr('class', 'node-accent-bar')
      .attr('x', 14)
      .attr('y', 8)
      .attr('width', nodeWidth - 28)
      .attr('height', 3)
      .attr('rx', 1.5)
      .attr('fill', d => getStatusColor(d.status));

    // Stage number badge circle
    const badgeG = nodeEnter
      .append('g')
      .attr('class', 'node-badge-g')
      .attr('transform', 'translate(26, 32)');

    badgeG
      .append('circle')
      .attr('class', 'node-badge-circle')
      .attr('r', 13)
      .attr('fill', d => getStatusColor(d.status));

    badgeG
      .append('text')
      .attr('class', 'node-badge-text')
      .attr('text-anchor', 'middle')
      .attr('dy', '4')
      .attr('fill', '#ffffff')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .text(d => d.stageNumber);

    // Stage Code (e.g. REG-01)
    nodeEnter
      .append('text')
      .attr('class', 'node-code-text')
      .attr('x', nodeWidth - 16)
      .attr('y', 34)
      .attr('text-anchor', 'end')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('font-family', 'monospace')
      .attr('fill', '#94a3b8')
      .text(d => d.stageCode);

    // Title text
    nodeEnter
      .append('text')
      .attr('class', 'node-title-text')
      .attr('x', isAr ? nodeWidth - 16 : 16)
      .attr('y', 58)
      .attr('text-anchor', isAr ? 'end' : 'start')
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .attr('fill', '#1e293b')
      .text(d => (isAr ? d.titleAr : d.titleEn));

    // Department text
    nodeEnter
      .append('text')
      .attr('class', 'node-dept-text')
      .attr('x', isAr ? nodeWidth - 16 : 16)
      .attr('y', 74)
      .attr('text-anchor', isAr ? 'end' : 'start')
      .attr('font-size', '9.5px')
      .attr('fill', '#64748b')
      .text(d => (isAr ? d.departmentAr : d.departmentEn));

    // Status pill
    const statusPill = nodeEnter
      .append('g')
      .attr('class', 'node-status-pill')
      .attr('transform', `translate(14, ${nodeHeight - 24})`);

    statusPill
      .append('rect')
      .attr('class', 'status-pill-bg')
      .attr('width', nodeWidth - 28)
      .attr('height', 16)
      .attr('rx', 8)
      .attr('fill', d => getStatusBgColor(d.status));

    statusPill
      .append('text')
      .attr('class', 'status-pill-text')
      .attr('x', (nodeWidth - 28) / 2)
      .attr('y', 11.5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('font-weight', '700')
      .attr('fill', d => getStatusColor(d.status))
      .text(d =>
        d.status === 'COMPLETED'
          ? isAr
            ? '✓ مكتمل ومنجز'
            : '✓ Completed'
          : d.status === 'ACTIVE'
          ? isAr
            ? '● المرحلة النشطة'
            : '● Active Stage'
          : d.status === 'REJECTED'
          ? isAr
            ? '✕ معادة'
            : '✕ Returned'
          : isAr
          ? '○ معلق'
          : '○ Pending'
      );

    // Merge enter + update with D3 transitions
    const nodeMerged = nodeEnter.merge(nodeSelection);

    nodeMerged
      .transition()
      .duration(700)
      .ease(d3.easeCubicOut)
      .attr('transform', d => {
        const isSelected = selectedStepId === d.id;
        const scaleVal = isSelected ? 1.05 : 1.0;
        return `translate(${d.x}, ${d.y}) scale(${scaleVal})`;
      })
      .attr('opacity', d => (d.status === 'PENDING' ? 0.75 : 1));

    // Animate Card Border & Glow on Status Changes
    nodeMerged
      .select<SVGRectElement>('.node-card-bg')
      .transition()
      .duration(700)
      .ease(d3.easeCubicOut)
      .attr('stroke', d => {
        if (selectedStepId === d.id) return '#10b981';
        return getStatusColor(d.status);
      })
      .attr('stroke-width', d => (selectedStepId === d.id || d.status === 'ACTIVE' ? 2.5 : 1.5))
      .attr('filter', d => (d.status === 'ACTIVE' ? 'url(#d3-active-glow)' : 'url(#d3-node-shadow)'));

    // Animate Accent Bar
    nodeMerged
      .select<SVGRectElement>('.node-accent-bar')
      .transition()
      .duration(700)
      .attr('fill', d => getStatusColor(d.status));

    // Animate Badge Circle
    nodeMerged
      .select<SVGCircleElement>('.node-badge-circle')
      .transition()
      .duration(700)
      .attr('fill', d => getStatusColor(d.status));

    // Animate Status Pill BG & Text
    nodeMerged
      .select<SVGRectElement>('.status-pill-bg')
      .transition()
      .duration(700)
      .attr('fill', d => getStatusBgColor(d.status));

    nodeMerged
      .select<SVGTextElement>('.status-pill-text')
      .transition()
      .duration(700)
      .attr('fill', d => getStatusColor(d.status))
      .text(d =>
        d.status === 'COMPLETED'
          ? isAr
            ? '✓ مكتمل ومنجز'
            : '✓ Completed'
          : d.status === 'ACTIVE'
          ? isAr
            ? '● المرحلة النشطة'
            : '● Active Stage'
          : d.status === 'REJECTED'
          ? isAr
            ? '✕ معادة'
            : '✕ Returned'
          : isAr
          ? '○ معلق'
          : '○ Pending'
      );

    // Exit transition for nodes
    nodeSelection
      .exit()
      .transition()
      .duration(400)
      .attr('opacity', 0)
      .attr('transform', 'scale(0.8)')
      .remove();
  }, [steps, selectedStepId, layoutMode, isAr, onSelectStep]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-auto flex items-center justify-center p-4 min-h-[360px]"
    >
      <div
        className="transition-transform duration-300 ease-out origin-center"
        style={{ transform: `scale(${zoomLevel})` }}
      >
        <svg
          ref={svgRef}
          className="select-none overflow-visible max-w-full drop-shadow-xs"
        />
      </div>
    </div>
  );
};
