import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useCurrentRole } from '@/hooks/useUserRole';
import RoleBadge from '@/components/common/RoleBadge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import StatusIndicator, { type UserStatus } from '@/components/profile/StatusIndicator';

const db = supabase as any;

const ProfileSettings = () => {
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const role = useCurrentRole();
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [status, setStatus] = useState<UserStatus>('offline');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize form from profile
  if (profile && !initialized) {
    setPhone((profile as any).phone ?? '');
    setBio((profile as any).bio ?? '');
    setStatus(((profile as any).status as UserStatus) ?? 'offline');
    setImageUrl((profile as any).profile_image_url ?? null);
    setInitialized(true);
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: '오류', description: 'JPG/PNG 이미지만 업로드 가능합니다.', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: '오류', description: '파일 크기는 5MB 이하여야 합니다.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      await db
        .from('employee_profiles')
        .update({ profile_image_url: publicUrl })
        .eq('user_id', user.id);

      setImageUrl(publicUrl);
      qc.invalidateQueries({ queryKey: ['employee-profile'] });
      toast({ title: '완료', description: '프로필 사진이 업데이트되었습니다.' });
    } catch (err: any) {
      toast({ title: '업로드 실패', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await db
        .from('employee_profiles')
        .update({
          phone,
          bio,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['employee-profile'] });
      toast({ title: '저장 완료', description: '프로필 정보가 업데이트되었습니다.' });
    } catch (err: any) {
      toast({ title: '오류', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const initials = profile?.full_name?.slice(0, 1) ?? '?';

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">내 프로필</CardTitle>
          <CardDescription>프로필 사진과 개인 정보를 관리합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar section */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="w-20 h-20 border-2 border-border">
                <AvatarImage src={imageUrl ?? undefined} alt={profile?.full_name ?? ''} className="object-cover" />
                <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-lg">{profile?.full_name ?? '—'}</p>
                <RoleBadge role={role} />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <StatusIndicator status={status} size="sm" />
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <Label>상태</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as UserStatus)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="working">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    근무중
                  </div>
                </SelectItem>
                <SelectItem value="vacation">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    휴가
                  </div>
                </SelectItem>
                <SelectItem value="away">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    자리비움
                  </div>
                </SelectItem>
                <SelectItem value="offline">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    오프라인
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Phone */}
          <div>
            <Label>전화번호</Label>
            <Input
              className="mt-1"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-0000-0000"
            />
          </div>

          {/* Bio */}
          <div>
            <Label>자기소개</Label>
            <Textarea
              className="mt-1 resize-none"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="간단한 자기소개를 입력하세요"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{bio.length}/200</p>
          </div>

          {/* Read-only fields */}
          <div>
            <Label>이름</Label>
            <Input className="mt-1" value={profile?.full_name ?? ''} disabled />
            <p className="text-xs text-muted-foreground mt-1">이름 변경은 관리자에게 문의하세요.</p>
          </div>

          <div>
            <Label>이메일</Label>
            <Input className="mt-1" value={user?.email ?? ''} disabled />
          </div>

          <div>
            <Label>직급</Label>
            <div className="mt-1">
              <RoleBadge role={role} />
              <p className="text-xs text-muted-foreground mt-1">직급 변경은 관리자에게 문의하세요.</p>
            </div>
          </div>

          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? '저장 중...' : '프로필 저장'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSettings;
