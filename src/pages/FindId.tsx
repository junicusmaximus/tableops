import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ChefHat, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Step = 'input' | 'verify' | 'result';

const FindId = () => {
  const [step, setStep] = useState<Step>('input');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [foundEmail, setFoundEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const startCooldown = () => {
    setCooldown(60);
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = () => {
    if (!name.trim()) { toast({ title: '이름을 입력해주세요.', variant: 'destructive' }); return; }
    if (!phone.trim()) { toast({ title: '휴대폰 번호를 입력해주세요.', variant: 'destructive' }); return; }
    // In production, this would call an SMS API edge function
    setCodeSent(true);
    startCooldown();
    toast({ title: '인증번호가 발송되었습니다.', description: '테스트 인증번호: 123456' });
    setStep('verify');
  };

  const handleVerify = () => {
    if (!code.trim()) { toast({ title: '인증번호를 입력해주세요.', variant: 'destructive' }); return; }
    setIsLoading(true);
    // Demo: accept 123456 as valid code
    setTimeout(() => {
      if (code === '123456') {
        // In production, backend would look up by name + phone
        setFoundEmail('demo@tableops.kr');
        setStep('result');
      } else {
        toast({ title: '인증번호가 올바르지 않습니다.', variant: 'destructive' });
      }
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <ChefHat className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">아이디 찾기</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            {step === 'result' ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-foreground">회원님의 아이디를 확인했습니다.</p>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium text-foreground">{foundEmail}</p>
                </div>
                <Link to="/login"><Button className="w-full">로그인으로 돌아가기</Button></Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>이름</Label>
                  <Input placeholder="이름을 입력해주세요." value={name} onChange={(e) => setName(e.target.value)} disabled={step === 'verify'} />
                </div>
                <div className="space-y-2">
                  <Label>휴대폰 번호</Label>
                  <div className="flex gap-2">
                    <Input placeholder="휴대폰 번호를 입력해주세요." value={phone} onChange={(e) => setPhone(e.target.value)} disabled={step === 'verify'} className="flex-1" />
                    <Button type="button" variant="outline" size="sm" onClick={handleSendCode} disabled={cooldown > 0} className="shrink-0 whitespace-nowrap">
                      {cooldown > 0 ? `${cooldown}초` : codeSent ? '재전송' : '인증번호 받기'}
                    </Button>
                  </div>
                </div>
                {step === 'verify' && (
                  <div className="space-y-2">
                    <Label>인증번호 입력</Label>
                    <Input placeholder="인증번호를 입력해주세요." value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} />
                  </div>
                )}
                {step === 'verify' && (
                  <Button className="w-full" onClick={handleVerify} disabled={isLoading}>
                    {isLoading ? '확인 중...' : '인증 확인'}
                  </Button>
                )}
                <Link to="/login" className="text-sm text-primary hover:underline block text-center">
                  <ArrowLeft className="w-3 h-3 inline mr-1" />로그인으로 돌아가기
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FindId;
