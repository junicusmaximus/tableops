import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import RoleBadge from '@/components/common/RoleBadge';

export interface MentionMember {
  user_id: string;
  full_name: string;
  profile_image_url?: string | null;
  position?: string | null;
}

interface MentionDropdownProps {
  members: MentionMember[];
  query: string;
  onSelect: (member: MentionMember) => void;
  visible: boolean;
}

const MentionDropdown = ({ members, query, onSelect, visible }: MentionDropdownProps) => {
  if (!visible || !query) return null;

  const filtered = members.filter((m) =>
    m.full_name.toLowerCase().includes(query.toLowerCase())
  );

  if (filtered.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
      {filtered.map((member) => (
        <button
          key={member.user_id}
          onClick={() => onSelect(member)}
          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 transition-colors text-left"
        >
          <Avatar className="w-7 h-7">
            <AvatarImage src={member.profile_image_url ?? undefined} className="object-cover" />
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
              {member.full_name.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-foreground">{member.full_name}</span>
          <RoleBadge role={member.position} className="text-[9px] px-1.5 py-0 ml-auto" />
        </button>
      ))}
    </div>
  );
};

export default MentionDropdown;
