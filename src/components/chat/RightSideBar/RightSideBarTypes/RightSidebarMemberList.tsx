import React from "react";
import { MemberItem } from "./MemberItem";

interface RightSidebarMemberListProps {
  members: any[];
  isLoading: boolean;
  contextMenu: { x: number; y: number; member: any } | null;
  onContextMenu: (e: React.MouseEvent, member: any) => void;
}

export const RightSidebarMemberList: React.FC<RightSidebarMemberListProps> = ({
  members,
  isLoading,
  contextMenu,
  onContextMenu,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="pb-24">
      {members.map((member: any) => (
        <MemberItem
          key={member._id || member.id || member.user?._id || member.user?.id}
          member={member}
          isSelected={contextMenu?.member === member}
          onContextMenu={onContextMenu}
        />
      ))}
    </div>
  );
};
