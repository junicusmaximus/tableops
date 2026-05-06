import StatusBadge from '@/components/common/StatusBadge';
import { DOCUMENT_STATUS_LABELS, DOCUMENT_STATUS_VARIANTS } from '@/lib/documentTypes';

export default function DocStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={DOCUMENT_STATUS_VARIANTS[status] ?? 'default'} label={DOCUMENT_STATUS_LABELS[status] ?? status} />;
}
