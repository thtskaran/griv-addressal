import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GraphNode {
  id: string;
  label: string;
  category: string;
}

interface GraphLink {
  source: string;
  target: string;
}

interface KnowledgeGraphProps {
  category: string;
  grievances: any[];
}

export default function KnowledgeGraph({ category, grievances }: KnowledgeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 400;

    // todo: remove mock functionality - Simple visualization
    const nodes = grievances.map((g, i) => ({
      x: 100 + (i % 3) * 200,
      y: 100 + Math.floor(i / 3) * 150,
      id: g.id,
      label: g.title.substring(0, 20) + '...',
    }));

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    ctx.strokeStyle = 'hsl(var(--primary))';
    ctx.lineWidth = 2;
    for (let i = 0; i < nodes.length - 1; i++) {
      ctx.beginPath();
      ctx.moveTo(nodes[i].x, nodes[i].y);
      ctx.lineTo(nodes[i + 1].x, nodes[i + 1].y);
      ctx.stroke();
    }

    // Draw nodes
    nodes.forEach((node) => {
      // Draw circle
      ctx.fillStyle = 'hsl(var(--primary))';
      ctx.beginPath();
      ctx.arc(node.x, node.y, 30, 0, Math.PI * 2);
      ctx.fill();

      // Draw label
      ctx.fillStyle = 'hsl(var(--primary-foreground))';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.id, node.x, node.y + 50);
    });
  }, [grievances]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Knowledge Graph: {category} Grievances</CardTitle>
        <p className="text-sm text-muted-foreground">Interactive visualization of related grievances</p>
      </CardHeader>
      <CardContent>
        <canvas
          ref={canvasRef}
          className="w-full h-[400px] border rounded-lg"
          style={{ maxWidth: '100%' }}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {grievances.map((g) => (
            <div
              key={g.id}
              className="px-3 py-1 rounded-full text-xs bg-primary/10 text-primary"
            >
              {g.id}: {g.title.substring(0, 30)}...
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
