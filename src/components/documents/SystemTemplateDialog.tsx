import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CONTRACT_TYPE_LABELS, type ContractType } from '@/lib/employmentContractTemplates';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const CONTRACT_DESCRIPTIONS: Record<ContractType, string> = {
  full_time: '기간의 정함 없는 정규직 근로계약',
  fixed_term: '기간의 정함 있는 계약직 근로계약',
  part_time: '단시간/파트타임 근로자용 (시급 기준)',
};

export default function SystemTemplateDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate();

  const handleSelect = (type: ContractType) => {
    onOpenChange(false);
    navigate(`/documents/system-contract/${type}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>시스템 문서 불러오기</DialogTitle>
          <DialogDescription>표준 양식 기반의 전자문서를 즉시 사용할 수 있습니다.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-muted-foreground">근로계약서</p>
          {(Object.keys(CONTRACT_TYPE_LABELS) as ContractType[]).map((t) => (
            <Card key={t} className="cursor-pointer hover:bg-muted/30 transition" onClick={() => handleSelect(t)}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{CONTRACT_TYPE_LABELS[t]}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{CONTRACT_DESCRIPTIONS[t]}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
          <p className="text-xs text-muted-foreground pt-2">
            기타 카테고리(개인정보 동의서, 취업규칙 확인서 등)는 곧 추가될 예정입니다.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
