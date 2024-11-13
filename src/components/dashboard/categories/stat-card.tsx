// src/components/dashboard/categories/stat-card.tsx
interface StatCardProps {
    title: string;
    value: React.ReactNode;
  }
  
  export function StatCard({ title, value }: StatCardProps) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-500">{title}</div>
        <div className="mt-1 text-2xl font-semibold">{value}</div>
      </div>
    );
  }