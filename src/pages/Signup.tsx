import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChefHat, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SIGNUP_ROLES } from '@/hooks/useUserRole';
import ConsentSection from '@/components/auth/ConsentSection';
import { getConsentsForRole, type ConsentType } from '@/lib/consents';

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
  const [consents, setConsents] = useState<Record<ConsentType, boolean>>({} as any);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const passwordValid = PASSWORD_REGEX.test(password);
  const passwordsMatch = password === confirmPassword;

  const requiredOk = useMemo(() => {
    if (!role) return false;
    return getConsentsForRole(role)
      .filter((c) => c.required)
      .every((c) => consents[c.type]);
  }, [role, consents]);

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
    if (!requiredOk) {
      toast({ title: '필수 약관에 동의해야 회원가입이 가능합니다.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    const ua = navigator.userAgent;
    const consentPayload = getConsentsForRole(role).map((c) => ({
      consent_type: c.type,
      consent_version: c.version,
      accepted: !!consents[c.type],
      user_agent: ua,
    }));

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          phone,
          consents: consentPayload,
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      toast({ title: '회원가입 실패', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '회원가입이 완료되었습니다.', description: '이메일을 확인해주세요.' });
      navigate('/login');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-8">
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

              {role && (
                <ConsentSection role={role} value={consents} onChange={setConsents} />
              )}

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
    </div>
  );
};

export default Signup;
