// src/components/dashboard/categories/communication-card.tsx
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export function CommunicationCard({ communication }: { communication: any }) {
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium">{communication.subject || 'No Subject'}</div>
          <div className="text-sm text-gray-500">{communication.from}</div>
        </div>
        <div className="flex gap-2">
          <Badge>{communication.type}</Badge>
          {communication.analysis?.sentiment?.label && (
            <Badge variant={getSentimentVariant(communication.analysis.sentiment.label)}>
              {communication.analysis.sentiment.label}
            </Badge>
          )}
        </div>
      </div>
      <div className="mt-2 text-sm line-clamp-2">{communication.content}</div>
      <div className="mt-2 text-xs text-gray-500">
        {formatDistanceToNow(new Date(communication.createdAt), { addSuffix: true })}
      </div>
    </div>
  );
}