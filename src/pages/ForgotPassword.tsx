import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ChefHat, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await resetPassword(email);
    if (error) {
      toast({ title: '오류', description: error.message, variant: 'destructive' });
    } else {
      setSent(true);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <ChefHat className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">비밀번호 재설정</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            {sent ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">비밀번호 재설정 링크가 이메일로 발송되었습니다.</p>
                <p className="text-xs text-muted-foreground">이메일을 확인하고 링크를 클릭하여 비밀번호를 재설정해주세요.</p>
                <Link to="/login">
                  <Button variant="outline" className="w-full"><ArrowLeft className="w-4 h-4 mr-2" />로그인으로 돌아가기</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">아이디 (이메일)</Label>
                  <Input id="email" type="email" placeholder="가입한 이메일을 입력해주세요." value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? '발송 중...' : '재설정 이메일 발송'}
                </Button>
                <Link to="/login" className="text-sm text-primary hover:underline block text-center">
                  <ArrowLeft className="w-3 h-3 inline mr-1" />로그인으로 돌아가기
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
