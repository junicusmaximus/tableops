import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import RoleBadge from '@/components/common/RoleBadge';
import StatusIndicator from '@/components/profile/StatusIndicator';
import { Phone } from 'lucide-react';

interface ProfileCardProps {
  children: React.ReactNode;
  name: string;
  role?: string | null;
  imageUrl?: string | null;
  phone?: string | null;
  bio?: string | null;
  status?: string | null;
  storeName?: string | null;
}

const ProfileCard = ({ children, name, role, imageUrl, phone, bio, status, storeName }: ProfileCardProps) => {
  const initials = name?.slice(0, 1) ?? '?';

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-64 p-0" side="right" align="start">
        {/* Header */}
        <div className="bg-primary/5 p-4 flex flex-col items-center gap-2 rounded-t-md border-b border-border">
          <div className="relative">
            <Avatar className="w-16 h-16 border-2 border-background shadow">
              <AvatarImage src={imageUrl ?? undefined} className="object-cover" />
              <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            {status && status !== 'offline' && (
              <span className="absolute bottom-0 right-0">
                <StatusIndicator status={status} showLabel={false} size="md" />
              </span>
            )}
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm">{name}</p>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <RoleBadge role={role} />
              <StatusIndicator status={status} size="sm" />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-3 space-y-2 text-sm">
          {storeName && (
            <div className="text-xs text-muted-foreground">{storeName}</div>
          )}
          {bio && (
            <p className="text-xs text-muted-foreground leading-relaxed">{bio}</p>
          )}
          {phone && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="w-3 h-3" />
              {phone}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ProfileCard;
