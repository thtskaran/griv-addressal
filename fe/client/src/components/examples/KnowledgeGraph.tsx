import KnowledgeGraph from '../KnowledgeGraph';

const mockGrievances = [
  { id: 'G001', title: 'Wi-Fi Issue in Library', category: 'Facilities' },
  { id: 'G002', title: 'AC Not Working in Hostel', category: 'Hostel' },
  { id: 'G003', title: 'Delayed Results Publication', category: 'Academic' },
];

export default function KnowledgeGraphExample() {
  return (
    <div className="p-8">
      <KnowledgeGraph category="Facilities" grievances={mockGrievances} />
    </div>
  );
}
