import React, { useState, useEffect, useMemo, useRef } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { RightSidebarMemberList } from "./RightSideBarTypes/RightSidebarMemberList";
import { MediaGallery } from "./MediaGallery";
import { GroupNotesPanel, GroupRemindersPanel } from "./GroupUtilities/GroupUtilitiesPanel";

export type ContentTabType = "members" | "images" | "files" | "links" | "voice" | "notes" | "reminders";

interface GroupContentOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab: ContentTabType;
  isGroup: boolean;
  conversationId?: string;
  members: any[];
  isLoadingMembers: boolean;
  contextMenu: any;
  onContextMenu: (e: React.MouseEvent, member: any) => void;
  currentUserId?: string;
  onShowInChat?: (mediaUrl: string) => void;
  messages?: any[];
}

export const GroupContentOverlay = ({
  isOpen,
  onClose,
  initialTab,
  isGroup,
  conversationId,
  members,
  isLoadingMembers,
  contextMenu,
  onContextMenu,
  currentUserId,
  onShowInChat,
  messages,
}: GroupContentOverlayProps) => {
  const [activeTab, setActiveTab] = useState<ContentTabType>(initialTab);
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setActiveTab(initialTab);
      // Small delay to allow initial render before starting transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsRendered(false), 400); // Matches transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialTab]);


  const tabList = useMemo(() => {
    const list = [];
    if (isGroup) {
      list.push({ id: "members", label: "Members" });
    }
    if (conversationId) {
      list.push(
        { id: "images", label: "Media" },
        { id: "files", label: "Files" },
        { id: "links", label: "Links" },
        { id: "voice", label: "Voice" }
      );
    }
    if (isGroup && conversationId) {
      list.push(
        { id: "notes", label: "Notes" },
        { id: "reminders", label: "Reminders" }
      );
    }
    return list;
  }, [isGroup, conversationId]);

  const MULTIPLIER = 30; // Creates an effectively infinite list
  const multipliedTabs = useMemo(() => {
    const result = [];
    for (let i = 0; i < MULTIPLIER; i++) {
      result.push(...tabList);
    }
    return result;
  }, [tabList]);

  const [activeIndex, setActiveIndex] = useState(0);
  const tabContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && tabList.length > 0) {
      const middleSetStart = Math.floor(MULTIPLIER / 2) * tabList.length;
      const offset = tabList.findIndex(t => t.id === initialTab);
      const startIdx = middleSetStart + (offset >= 0 ? offset : 0);
      
      setActiveIndex(startIdx);
      setActiveTab((tabList[offset >= 0 ? offset : 0].id) as ContentTabType);
      
      // Instantly center the active tab without animation
      requestAnimationFrame(() => {
        const container = tabContainerRef.current;
        if (container && container.children[startIdx]) {
          const button = container.children[startIdx] as HTMLElement;
          const scrollLeft = button.offsetLeft - container.clientWidth / 2 + button.clientWidth / 2;
          container.scrollLeft = scrollLeft;
        }
      });
    }
  }, [isOpen, initialTab, tabList]);

  if (!isRendered) return null;

  const getOverlayTitle = () => {
    switch (activeTab) {
      case "members":
        return "Members";
      case "notes":
        return "Notes";
      case "reminders":
        return "Reminders";
      default:
        return "Shared Media";
    }
  };

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col bg-white dark:bg-slate-900 transition-transform duration-[400ms] ease-[cubic-bezier(0.33,1,0.68,1)] ${
        isAnimating ? "translate-y-0" : "translate-y-full"
      }`}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center h-[56px] px-2 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
        >
          <FiArrowLeft className="text-xl" />
        </button>
        <h2 className="ml-2 text-[17px] font-semibold text-gray-900 dark:text-white truncate">
          {getOverlayTitle()}
        </h2>
      </div>

      {/* Pill Tabs Navigation */}
      <div className="shrink-0 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
        <div ref={tabContainerRef} className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden px-3 py-2 space-x-2">
          {multipliedTabs.map((tab, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={`${tab.id}-${index}`}
                onClick={(e) => {
                  setActiveIndex(index);
                  setActiveTab(tab.id as ContentTabType);
                  // Custom scroll to center
                  const button = e.currentTarget;
                  const container = button.parentElement;
                  if (container) {
                    const scrollLeft = button.offsetLeft - container.clientWidth / 2 + button.clientWidth / 2;
                    container.scrollTo({ left: scrollLeft, behavior: "smooth" });
                  }
                }}
                className={`shrink-0 rounded-full px-4 py-1.5 text-[14px] font-medium transition-colors ${
                  isActive
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                    : "bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900">
        {activeTab === "members" && isGroup && (
          <div className="flex-1 overflow-y-auto">
            <RightSidebarMemberList
              members={members}
              isLoading={isLoadingMembers}
              contextMenu={contextMenu}
              onContextMenu={onContextMenu}
            />
          </div>
        )}

        {(activeTab === "images" ||
          activeTab === "files" ||
          activeTab === "links" ||
          activeTab === "voice") &&
          conversationId && (
            <div className="flex-1 overflow-hidden">
              <MediaGallery
                conversationId={conversationId}
                currentUserId={currentUserId}
                onShowInChat={onShowInChat}
                messages={messages}
                activeTab={activeTab}
                hideTabNavigation={true}
              />
            </div>
          )}

        {activeTab === "notes" && isGroup && conversationId && (
          <div className="flex-1 overflow-hidden">
            <GroupNotesPanel groupId={conversationId} />
          </div>
        )}

        {activeTab === "reminders" && isGroup && conversationId && (
          <div className="flex-1 overflow-hidden">
            <GroupRemindersPanel groupId={conversationId} />
          </div>
        )}
      </div>
    </div>
  );
};
