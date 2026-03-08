import { Store, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import StatusIndicator from '@/components/profile/StatusIndicator';
import type { EmployeeProfile } from '@/hooks/useEmployeeProfile';

interface ChatWorkspaceProps {
  profile: EmployeeProfile | null | undefined;
  storeName?: string;
}

const ChatWorkspace = ({ profile, storeName }: ChatWorkspaceProps) => {
  return (
    <div className="flex flex-col h-full border-r border-border bg-muted/30 w-[68px]">
      {/* Workspace icon */}
      <div className="p-3 flex flex-col items-center gap-3 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm">
          {storeName?.slice(0, 1) ?? 'T'}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User avatar */}
      <div className="p-3 flex flex-col items-center border-t border-border">
        <div className="relative">
          <Avatar className="w-9 h-9 border border-border">
            <AvatarImage src={profile?.profile_image_url ?? undefined} className="object-cover" />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {profile?.full_name?.slice(0, 1) ?? '?'}
            </AvatarFallback>
          </Avatar>
          {profile?.status && profile.status !== 'offline' && (
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background"
              style={{
                backgroundColor:
                  profile.status === 'working'
                    ? '#22c55e'
                    : profile.status === 'vacation'
                    ? '#eab308'
                    : '#f97316',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatWorkspace;
