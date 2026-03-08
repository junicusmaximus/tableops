import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChefHat, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SIGNUP_ROLES } from '@/hooks/useUserRole';

const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const passwordValid = PASSWORD_REGEX.test(password);
  const passwordsMatch = password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      toast({ title: '직급을 선택해주세요.', variant: 'destructive' });
      return;
    }
    if (!passwordValid) {
      toast({ title: '비밀번호는 영문, 숫자, 특수문자를 포함하여 8자 이상으로 입력해주세요.', variant: 'destructive' });
      return;
    }
    if (!passwordsMatch) {
      toast({ title: '비밀번호가 일치하지 않습니다.', variant: 'destructive' });
      return;
    }
    if (!fullName.trim()) {
      toast({ title: '이름을 입력해주세요.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    const { error } = await signUp(email, password, fullName);
    if (error) {
      toast({ title: '회원가입 실패', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '회원가입이 완료되었습니다.', description: '이메일을 확인해주세요.' });
      navigate('/login');
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
          <h1 className="text-2xl font-bold text-foreground">TableOps</h1>
          <p className="text-muted-foreground mt-1 text-sm">회원가입</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">아이디 (이메일)</Label>
                <Input id="email" type="email" placeholder="아이디를 입력해주세요." value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="비밀번호를 입력해주세요." value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password && !passwordValid && (
                  <p className="text-xs text-destructive">비밀번호는 영문, 숫자, 특수문자를 포함하여 8자 이상으로 입력해주세요.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                <div className="relative">
                  <Input id="confirmPassword" type={showConfirm ? 'text' : 'password'} placeholder="비밀번호를 다시 입력해주세요." value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-destructive">비밀번호가 일치하지 않습니다.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">이름</Label>
                <Input id="fullName" placeholder="이름을 입력해주세요." value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">휴대전화번호</Label>
                <Input id="phone" type="tel" placeholder="휴대전화번호를 입력해주세요." value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>직급</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue placeholder="직급 선택" /></SelectTrigger>
                  <SelectContent>
                    {SIGNUP_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <button type="button" onClick={() => setPrivacyOpen(true)} className="text-xs text-muted-foreground underline hover:text-foreground">
                개인정보 수집·이용 안내 보기
              </button>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? '가입 중...' : '회원가입'}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              이미 계정이 있으신가요?{' '}
              <Link to="/login" className="text-primary hover:underline">로그인</Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Privacy notice popup */}
      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent className="max-w-sm max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-sm">개인정보 수집·이용 안내</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="text-xs text-muted-foreground leading-relaxed space-y-3">
              <p>회원 가입 과정에서 개인정보 보호법 제15조제1항제4호(계약 체결/이행)에 따라, 다음과 같은 개인정보를 수집·이용합니다.</p>
              <p className="font-medium text-foreground">수집하는 개인정보 항목 :</p>
              <p>[필수] 아이디, 비밀번호, 이름, 생년월일, 성별, 휴대전화번호, 실명 인증된 아이디로 가입 시 연계정보(CI), 중복가입 확인정보(DI), 내외국인 정보, 만14세 미만 아동의 경우 법정대리인정보 (법정대리인의 이름, 생년월일, 성별, 중복가입확인정보(DI), 휴대전화번호)</p>
              <p>[선택] 이메일주소, 프로필 정보</p>
              <p>※ 선택 항목은 입력하지 않아도 회원 가입이 가능하며 회원 가입 이후 자유롭게 등록 가능합니다.</p>
              <p>자세한 내용은 개인정보 처리방침에서 확인하실 수 있습니다.</p>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Signup;
