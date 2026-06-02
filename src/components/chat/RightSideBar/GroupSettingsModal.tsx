import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import {
  FiCamera,
  FiCheck,
  FiCopy,
  FiDownload,
  FiLink,
  FiLock,
  FiRefreshCw,
  FiSearch,
  FiSettings,
  FiShare2,
  FiShield,
  FiTrash2,
  FiUserCheck,
  FiUserX,
  FiX,
} from "react-icons/fi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { inviteService } from "../../../services/inviteService";
import {
  groupSettingsService,
  GroupSettingsPayload,
  PermissionScope,
  UpdateGroupSettingsPayload,
  WhoCanSendMessages,
} from "../../../services/groupSettingsService";
import { socketService } from "../../../services/socketService";
import { userService } from "../../../services/userService";

type TabId = "general" | "invite" | "permissions" | "blocked" | "pending";

interface GroupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  groupAvatar?: string;
  groupDescription?: string;
  groupType?: "private" | "public";
  settings?: GroupSettingsPayload;
  isAdmin: boolean;
  editName: string;
  setEditName: (value: string) => void;
  editAvatarUrl?: string | null;
  isUploadingAvatar: boolean;
  onAvatarChange: (file: File) => void;
  onSaveGeneral: (extraPayload?: GroupSettingsPayload) => Promise<void> | void;
  onSettingsUpdated?: (settings: GroupSettingsPayload) => void;
  onMembersChanged?: () => void;
}

const tabs: { id: TabId; label: string; icon: React.ComponentType<any>; adminOnly?: boolean }[] = [
  { id: "general", label: "Thông tin chung", icon: FiSettings },
  { id: "invite", label: "Liên kết mời", icon: FiLink },
  { id: "permissions", label: "Phân quyền", icon: FiShield, adminOnly: true },
  { id: "blocked", label: "Danh sách chặn", icon: FiUserX, adminOnly: true },
  { id: "pending", label: "Duyệt thành viên", icon: FiUserCheck, adminOnly: true },
];

const defaultUtilityPermissions: NonNullable<GroupSettingsPayload["utilityPermissions"]> = {
  poll: "all",
  reminder: "all",
  note: "all",
};

const defaultSettings: GroupSettingsPayload = {
  whoCanSendMessages: "all",
  requireApproval: false,
  allowMemberInvite: true,
  allowSendLink: true,
  utilityPermissions: defaultUtilityPermissions,
};

const mergeGroupSettings = (
  ...sources: Array<GroupSettingsPayload | UpdateGroupSettingsPayload | undefined | null>
): GroupSettingsPayload => {
  return sources.reduce<GroupSettingsPayload>(
    (merged, source) => {
      if (!source) return merged;
      return {
        ...merged,
        ...source,
        utilityPermissions: {
          ...(merged.utilityPermissions || {}),
          ...(source.utilityPermissions || {}),
        },
      };
    },
    {
      ...defaultSettings,
      utilityPermissions: { ...defaultUtilityPermissions },
    },
  );
};

const unwrapApiData = (payload: any) => {
  if (!payload || typeof payload !== "object") return payload;
  if ("status" in payload && "data" in payload) return payload.data;
  return payload.data || payload;
};

const unwrapUserProfile = (payload: any) => {
  const data = unwrapApiData(payload);
  if (!data || typeof data !== "object") return null;
  return data?.user || data?.profile || data?.data?.user || data?.data?.profile || data;
};

const getRefId = (value: any) => {
  if (!value) return null;
  if (typeof value === "string" || typeof value === "number") return String(value);
  return value?.id || value?._id || value?.userId || null;
};

const isLikelyBlockRecord = (item: any) =>
  Boolean(
    item?.groupId ||
      item?.conversationId ||
      item?.blockedBy ||
      item?.blockedById ||
      item?.blockedByUserId ||
      item?.blockedAt ||
      item?.targetUserId ||
      item?.blockedUserId ||
      item?.blockedId,
  );

const getUserId = (item: any) =>
  getRefId(item?.block?.userId) ||
  getRefId(item?.blockedUserId) ||
  getRefId(item?.blockedUserID) ||
  getRefId(item?.blocked_user_id) ||
  getRefId(item?.targetUserId) ||
  getRefId(item?.target_user_id) ||
  getRefId(item?.blockedId) ||
  getRefId(item?.blockedMemberId) ||
  getRefId(item?.targetId) ||
  getRefId(item?.memberId) ||
  getRefId(item?.userId) ||
  getRefId(item?.blockedUser) ||
  getRefId(item?.blocked_user) ||
  getRefId(item?.targetUser) ||
  getRefId(item?.target_user) ||
  getRefId(item?.member) ||
  getRefId(item?.user) ||
  getRefId(item?.profile) ||
  getRefId(item?.member?.user) ||
  (!isLikelyBlockRecord(item) ? getRefId(item) : null);

const getUserInfo = (item: any) =>
  unwrapUserProfile(item?.profile) ||
  unwrapUserProfile(item?.blockedUser) ||
  unwrapUserProfile(item?.targetUser) ||
  unwrapUserProfile(item?.user) ||
  unwrapUserProfile(item?.member?.user) ||
  (item?.userDisplayName
    ? {
        id: getRefId(item?.block?.userId),
        displayName: item.userDisplayName,
        avatarUrl: item?.userAvatarUrl || item?.avatarUrl || "",
      }
    : null) ||
  (!isLikelyBlockRecord(item) ? item : {});

const getDisplayName = (item: any) => {
  if (item?.userDisplayName) return item.userDisplayName;
  const user = getUserInfo(item);
  return user?.displayName || user?.name || user?.username || user?.email || "Người dùng";
};

const getAvatarUrl = (item: any) => {
  const user = getUserInfo(item);
  return user?.avatarUrl || user?.avatar || user?.photoUrl || "";
};

const hasDisplayableUserInfo = (item: any) => {
  const user = getUserInfo(item);
  return Boolean(
    user?.displayName ||
      user?.name ||
      user?.username ||
      user?.email ||
      user?.avatarUrl ||
      user?.avatar,
  );
};

const enrichBlockedUsers = async (items: any[]) => {
  return Promise.all(
    items.map(async (item) => {
      const userId = getUserId(item);
      const blockedById = getRefId(item?.block?.blockedBy) || getRefId(item?.blockedBy);

      const [profile, blockedByProfile] = await Promise.all([
        hasDisplayableUserInfo(item) || !userId
          ? Promise.resolve(null)
          : (async () => {
              try {
                const profileResponse =
                  typeof userService.getPublicProfileById === "function"
                    ? await userService.getPublicProfileById(userId)
                    : await userService.getUserById(userId);
                return unwrapUserProfile(profileResponse);
              } catch (error) {
                console.warn("[GroupSettingsModal] Failed to hydrate blocked user", userId, error);
                return null;
              }
            })(),
        !blockedById || unwrapUserProfile(item?.blockedByProfile) || unwrapUserProfile(item?.blockedByUser)
          ? Promise.resolve(null)
          : (async () => {
              try {
                const profileResponse =
                  typeof userService.getPublicProfileById === "function"
                    ? await userService.getPublicProfileById(blockedById)
                    : await userService.getUserById(blockedById);
                return unwrapUserProfile(profileResponse);
              } catch (error) {
                console.warn("[GroupSettingsModal] Failed to hydrate blocker user", blockedById, error);
                return null;
              }
            })(),
      ]);

      return {
        ...item,
        ...(profile && { profile }),
        ...(blockedByProfile && { blockedByProfile }),
      };
    }),
  );
};

const getBlockedByName = (item: any) => {
  const admin = item?.blockedByProfile || item?.blockedByUser || item?.block?.blockedBy || item?.blockedBy || item?.admin || item?.actor;
  if (!admin || typeof admin === "string") return admin || "quản trị viên";
  return admin?.displayName || admin?.name || admin?.username || "quản trị viên";
};

const getBlockedAt = (item: any) => item?.block?.createdAt || item?.blockedAt || item?.createdAt || item?.updatedAt;

const formatBlockedAt = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const getErrorMessage = (error: any, fallback: string) =>
  error?.message || error?.payload?.message || error?.payload?.msg || fallback;

const Switch = ({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
      checked ? "bg-blue-500" : "bg-gray-300 dark:bg-slate-700"
    }`}
  >
    <span
      className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
        checked ? "translate-x-5" : "translate-x-0"
      }`}
    />
  </button>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-gray-200 text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">
    {text}
  </div>
);

export const GroupSettingsModal: React.FC<GroupSettingsModalProps> = ({
  isOpen,
  onClose,
  groupId,
  groupName,
  groupAvatar,
  groupDescription,
  groupType = "private",
  settings,
  isAdmin,
  editName,
  setEditName,
  editAvatarUrl,
  isUploadingAvatar,
  onAvatarChange,
  onSaveGeneral,
  onSettingsUpdated,
  onMembersChanged,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [localGroupType, setLocalGroupType] = useState<"private" | "public">(groupType);
  const [localSettings, setLocalSettings] = useState<GroupSettingsPayload>(defaultSettings);
  const [draftSettings, setDraftSettings] = useState<UpdateGroupSettingsPayload>(defaultSettings);
  const [settingsError, setSettingsError] = useState("");
  const [isSubmittingSettings, setIsSubmittingSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [blockUserId, setBlockUserId] = useState("");
  const qrRef = useRef<HTMLDivElement>(null);
  const onSettingsUpdatedRef = useRef(onSettingsUpdated);
  const queryClient = useQueryClient();

  useEffect(() => {
    onSettingsUpdatedRef.current = onSettingsUpdated;
  }, [onSettingsUpdated]);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab("general");
    setLocalGroupType(groupType);
    setSettingsError("");
    setIsSubmittingSettings(false);
    setCopied(false);
    setShowQR(false);
    setBlockUserId("");
  }, [groupId, groupType, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const nextSettings = mergeGroupSettings(settings);
    setLocalSettings(nextSettings);
    setDraftSettings(nextSettings);
  }, [
    groupId,
    isOpen,
    settings?.allowMemberInvite,
    settings?.allowSendLink,
    settings?.requireApproval,
    settings?.utilityPermissions,
    settings?.whoCanSendMessages,
  ]);

  useEffect(() => {
    if (!isOpen || !groupId) return;

    let isMounted = true;
    socketService
      .initMessagesSocket()
      .then(() => socketService.joinGroup(groupId))
      .catch((error) => {
        if (isMounted) {
          console.warn("Failed to join group settings room", error);
        }
      });

    const cleanupSettings = socketService.on("group:settings_updated", (event: any) => {
      const eventGroupId = event?.conversationId || event?.groupId || event?.id;
      if (String(eventGroupId) !== String(groupId)) return;

      const incomingSettings = event?.settings || event?.data?.settings || {};
      setLocalSettings((current) => {
        const nextSettings = mergeGroupSettings(current, incomingSettings);
        setDraftSettings(nextSettings);
        return nextSettings;
      });
      setSettingsError("");
      onSettingsUpdatedRef.current?.(incomingSettings);
    });

    return () => {
      isMounted = false;
      if (cleanupSettings) cleanupSettings();
      socketService.leaveGroup(groupId).catch(() => undefined);
    };
  }, [groupId, isOpen]);

  const visibleTabs = useMemo(
    () => tabs.filter((tab) => !tab.adminOnly || isAdmin),
    [isAdmin],
  );
  const canUseInviteLink = isAdmin || localSettings.allowMemberInvite !== false;

  const {
    data: inviteData,
    isLoading: isInviteLoading,
    error: inviteError,
  } = useQuery({
    queryKey: ["group-invite", groupId],
    queryFn: () => inviteService.getInviteLink(groupId),
    enabled: isOpen && activeTab === "invite" && canUseInviteLink,
    staleTime: 60000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const {
    data: blockedUsers = [],
    isLoading: isBlocksLoading,
    error: blocksError,
  } = useQuery({
    queryKey: ["group-blocked", groupId],
    queryFn: async () => {
      const items = await groupSettingsService.getBlockedUsers(groupId);
      return enrichBlockedUsers(items);
    },
    enabled: isOpen && activeTab === "blocked" && isAdmin,
    retry: false,
  });

  const { data: pendingMembers = [], isLoading: isPendingLoading } = useQuery({
    queryKey: ["group-pending-members", groupId],
    queryFn: () => groupSettingsService.getPendingMembers(groupId),
    enabled: isOpen && activeTab === "pending" && isAdmin,
  });

  const regenerateMutation = useMutation({
    mutationFn: () => inviteService.regenerateInviteLink(groupId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["group-invite", groupId] }),
  });

  const revokeMutation = useMutation({
    mutationFn: () => inviteService.revokeInviteLink(groupId),
    onSuccess: () => {
      setShowQR(false);
      queryClient.invalidateQueries({ queryKey: ["group-invite", groupId] });
    },
  });

  const blockMutation = useMutation({
    mutationFn: (userId: string) => groupSettingsService.blockUser(groupId, userId),
    onSuccess: () => {
      toast.success(`Đã chặn và xóa ${blockUserId.trim() || "thành viên"} khỏi nhóm`);
      setBlockUserId("");
      queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
      queryClient.invalidateQueries({ queryKey: ["group-blocked", groupId] });
      queryClient.invalidateQueries({ queryKey: ["group-blocks", groupId] });
      onMembersChanged?.();
      window.dispatchEvent(new Event("chatList:refresh"));
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Không thể chặn thành viên này."));
    },
  });

  const unblockMutation = useMutation({
    mutationFn: (userId: string) => groupSettingsService.unblockUser(groupId, userId),
    onSuccess: (_data, userId) => {
      const item = blockedUsers.find((blocked: any) => String(getUserId(blocked)) === String(userId));
      toast.success(`Đã gỡ chặn cho ${item ? getDisplayName(item) : "người dùng"}`);
      queryClient.invalidateQueries({ queryKey: ["group-blocked", groupId] });
      queryClient.invalidateQueries({ queryKey: ["group-blocks", groupId] });
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Không thể gỡ chặn người dùng này."));
    },
  });

  const approveMutation = useMutation({
    mutationFn: (userId: string) => groupSettingsService.approveMember(groupId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-pending-members", groupId] });
      onMembersChanged?.();
      window.dispatchEvent(new Event("chatList:refresh"));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (userId: string) => groupSettingsService.rejectMember(groupId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["group-pending-members", groupId] }),
  });

  const inviteUrl = inviteData?.token
    ? `${window.location.origin}/invite/${inviteData.token}`
    : inviteData?.joinUrl || "";

  const updateDraftSetting = (patch: UpdateGroupSettingsPayload) => {
    setSettingsError("");
    setDraftSettings((current) => mergeGroupSettings(current, patch));
  };

  const supportedSettingsPayload = (payload: UpdateGroupSettingsPayload) => ({
    ...(payload.whoCanSendMessages !== undefined && {
      whoCanSendMessages: payload.whoCanSendMessages,
    }),
    ...(payload.requireApproval !== undefined && {
      requireApproval: payload.requireApproval,
    }),
    ...(payload.allowMemberInvite !== undefined && {
      allowMemberInvite: payload.allowMemberInvite,
    }),
    ...(payload.allowSendLink !== undefined && {
      allowSendLink: payload.allowSendLink,
    }),
    ...(payload.whoCanAddMembers !== undefined && {
      whoCanAddMembers: payload.whoCanAddMembers,
    }),
    ...(payload.utilityPermissions !== undefined && {
      utilityPermissions: payload.utilityPermissions,
    }),
  });

  const isSettingsDirty =
    JSON.stringify(supportedSettingsPayload(draftSettings)) !==
    JSON.stringify(supportedSettingsPayload(localSettings));

  const handleSaveSettings = async () => {
    if (!isSettingsDirty || isSubmittingSettings) return;

    try {
      setIsSubmittingSettings(true);
      setSettingsError("");
      await socketService.initMessagesSocket();
      const payload = supportedSettingsPayload(draftSettings);
      const response: any = await socketService.updateGroupSettings(groupId, payload);
      const nextSettings = response?.conversation?.settings || payload;
      setLocalSettings((current) => mergeGroupSettings(current, nextSettings));
      setDraftSettings((current) => mergeGroupSettings(current, nextSettings));
      onSettingsUpdated?.(nextSettings);
    } catch (error: any) {
      setSettingsError(error?.message || "Không thể lưu cài đặt nhóm.");
    } finally {
      setIsSubmittingSettings(false);
    }
  };

  const handleSaveGeneral = async () => {
    const payload: GroupSettingsPayload = { groupType: localGroupType };
    await onSaveGeneral(payload);
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleShare = async () => {
    if (!inviteUrl || typeof navigator.share !== "function") return;
    await navigator.share({
      title: `Tham gia ${groupName}`,
      text: `Bạn được mời tham gia nhóm ${groupName}`,
      url: inviteUrl,
    });
  };

  const handleDownloadQR = async () => {
    if (!qrRef.current) return;
    const dataUrl = await toPng(qrRef.current, { cacheBust: true, quality: 1, pixelRatio: 3 });
    const link = document.createElement("a");
    link.download = `${groupName}-invite-qr.png`;
    link.href = dataUrl;
    link.click();
  };

  if (!isOpen || typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Cài đặt nhóm"
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          className="relative flex h-[580px] w-full max-w-[760px] overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
        >
          <aside className="flex w-[240px] shrink-0 flex-col border-r border-gray-100 bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Cài đặt nhóm</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-slate-800"
                title="Đóng"
              >
                <FiX />
              </button>
            </div>
            <nav className="space-y-1">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                        : "text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <section className="flex min-w-0 flex-1 flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.18 }}
                className="flex-1 overflow-y-auto p-6"
              >
                {activeTab === "general" && (
                  <div className="flex min-h-full flex-col">
                    <div className="flex flex-col items-center">
                      <label className={`group relative mb-5 h-28 w-28 overflow-hidden rounded-full bg-blue-500 text-white shadow-md ${isAdmin ? "cursor-pointer" : "cursor-default"}`}>
                        {editAvatarUrl || groupAvatar ? (
                          <img src={editAvatarUrl || groupAvatar} alt={groupName} className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-4xl font-semibold">
                            {groupName.charAt(0).toUpperCase()}
                          </span>
                        )}
                        {isAdmin && (
                          <>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) onAvatarChange(file);
                              }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                              {isUploadingAvatar ? (
                                <span className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
                              ) : (
                                <FiCamera className="h-8 w-8" />
                              )}
                            </span>
                          </>
                        )}
                      </label>

                      <input
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        readOnly={!isAdmin}
                        className="w-full max-w-[420px] rounded-lg border border-transparent bg-transparent px-3 py-2 text-center text-2xl font-bold text-gray-900 outline-none transition-colors focus:border-blue-500 dark:text-gray-100"
                      />
                      {groupDescription && (
                        <p className="mt-2 max-w-[420px] text-center text-sm text-gray-500 dark:text-slate-400">
                          {groupDescription}
                        </p>
                      )}
                    </div>

                    <div className="mt-8 rounded-xl border border-gray-200 dark:border-slate-700">
                      {(["private", "public"] as const).map((type) => (
                        <label
                          key={type}
                          className="flex cursor-pointer items-center justify-between border-b border-gray-100 px-4 py-4 last:border-b-0 dark:border-slate-800"
                        >
                          <span>
                            <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {type === "private" ? "Riêng tư" : "Công khai"}
                            </span>
                            <span className="mt-1 block text-xs text-gray-500 dark:text-slate-400">
                              {type === "private"
                                ? "Chỉ người có lời mời mới có thể tham gia."
                                : "Nhóm có thể được khám phá và tham gia công khai."}
                            </span>
                          </span>
                          <input
                            type="radio"
                            name="groupType"
                            checked={localGroupType === type}
                            disabled={!isAdmin}
                            onChange={() => setLocalGroupType(type)}
                            className="h-4 w-4 accent-blue-500"
                          />
                        </label>
                      ))}
                    </div>

                    <div className="mt-auto flex justify-end pt-6">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={handleSaveGeneral}
                          disabled={isUploadingAvatar}
                          className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                        >
                          {isUploadingAvatar ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "invite" && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Liên kết mời</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Chia sẻ link để mời thành viên mới vào nhóm.</p>
                    <div className="mt-6 rounded-xl border border-gray-200 p-4 dark:border-slate-700">
                      {!canUseInviteLink ? (
                        <EmptyState text="Chỉ trưởng nhóm, phó nhóm hoặc thành viên được cấp quyền mới có thể xem liên kết mời." />
                      ) : inviteError ? (
                        <EmptyState text="Không thể tải liên kết mời. Vui lòng kiểm tra quyền quản trị nhóm." />
                      ) : isInviteLoading ? (
                        <div className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-800" />
                      ) : inviteUrl ? (
                        <div className="flex items-center gap-2">
                          <div className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-950">
                            <p className="truncate text-sm text-gray-800 dark:text-gray-200">{inviteUrl}</p>
                          </div>
                          <button type="button" onClick={handleCopy} className="rounded-lg bg-blue-50 p-3 text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400" title="Copy">
                            <AnimatePresence mode="wait">
                              {copied ? <motion.span key="check" initial={{ scale: 0.7 }} animate={{ scale: 1 }}><FiCheck className="text-green-500" /></motion.span> : <motion.span key="copy" initial={{ scale: 0.7 }} animate={{ scale: 1 }}><FiCopy /></motion.span>}
                            </AnimatePresence>
                          </button>
                          {typeof navigator.share === "function" && (
                            <button type="button" onClick={handleShare} className="rounded-lg bg-gray-50 p-3 text-gray-600 transition-colors hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-300" title="Chia sẻ">
                              <FiShare2 />
                            </button>
                          )}
                        </div>
                      ) : (
                        <EmptyState text="Chưa có liên kết mời đang hoạt động." />
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" disabled={!inviteUrl} onClick={() => setShowQR((value) => !value)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200">
                          {showQR ? "Ẩn QR" : "Hiện QR"}
                        </button>
                        {isAdmin && (
                          <>
                            <button type="button" onClick={() => regenerateMutation.mutate()} disabled={regenerateMutation.isPending} className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                              <FiRefreshCw className={regenerateMutation.isPending ? "animate-spin" : ""} /> Tạo mới
                            </button>
                            <button type="button" onClick={() => revokeMutation.mutate()} disabled={!inviteUrl || revokeMutation.isPending} className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-500 disabled:opacity-50">
                              <FiTrash2 /> Thu hồi
                            </button>
                          </>
                        )}
                      </div>

                      <AnimatePresence>
                        {showQR && inviteUrl && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="mt-5 flex flex-col items-center gap-4 rounded-xl bg-gray-50 p-5 dark:bg-slate-950/70">
                              <div ref={qrRef} className="flex flex-col items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
                                <span className="max-w-[220px] truncate text-sm font-semibold text-gray-900">{groupName}</span>
                                <QRCodeSVG value={inviteUrl} size={190} level="H" includeMargin={false} />
                              </div>
                              <button type="button" onClick={handleDownloadQR} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                <FiDownload /> Tải QR
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {activeTab === "permissions" && (
                  <div className="flex min-h-full flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Phân quyền & cài đặt</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                          Chỉnh các quyền rồi bấm Lưu để cập nhật realtime cho nhóm.
                        </p>
                      </div>
                      {isSubmittingSettings && (
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-900/20 dark:text-blue-300">
                          Đang lưu...
                        </span>
                      )}
                    </div>
                    <div className="mt-6 rounded-xl border border-gray-200 dark:border-slate-700">
                      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 dark:border-slate-800">
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Ai có thể nhắn tin</div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">Giới hạn tin nhắn trong nhóm khi cần thông báo một chiều.</div>
                        </div>
                        <select
                          value={draftSettings.whoCanSendMessages || "all"}
                          disabled={isSubmittingSettings}
                          onChange={(event) => updateDraftSetting({ whoCanSendMessages: event.target.value as WhoCanSendMessages })}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        >
                          <option value="all">Tất cả mọi người</option>
                          <option value="admins">Chỉ quản trị viên</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 dark:border-slate-800">
                        <div className="pr-4">
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Ai có thể tạo bình chọn</div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                            Cho phép thành viên thường tạo poll trong nhóm, hoặc chỉ cho quản trị viên.
                          </div>
                        </div>
                        <select
                          value={draftSettings.utilityPermissions?.poll || "all"}
                          disabled={isSubmittingSettings}
                          onChange={(event) =>
                            updateDraftSetting({
                              utilityPermissions: {
                                ...(draftSettings.utilityPermissions || {}),
                                poll: event.target.value as PermissionScope,
                              },
                            })
                          }
                          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        >
                          <option value="all">Tất cả thành viên</option>
                          <option value="admins">Chỉ quản trị viên</option>
                        </select>
                      </div>
                      {[
                        ["requireApproval", "Phê duyệt thành viên mới", "Kiểm duyệt người dùng trước khi họ vào nhóm."],
                        ["allowMemberInvite", "Thành viên có thể thêm người mới", "Cho phép thành viên thường gửi lời mời."],
                        ["allowSendLink", "Cho phép gửi Link", "Bật/tắt quyền gửi URL trong tin nhắn để hạn chế spam."],
                      ].map(([key, title, description]) => (
                        <div key={key} className="flex items-center justify-between border-b border-gray-100 px-4 py-4 last:border-b-0 dark:border-slate-800">
                          <div className="pr-4">
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</div>
                            <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">{description}</div>
                          </div>
                          <Switch
                            checked={Boolean(draftSettings[key as keyof UpdateGroupSettingsPayload])}
                            disabled={isSubmittingSettings}
                            onChange={(checked) => updateDraftSetting({ [key]: checked } as UpdateGroupSettingsPayload)}
                          />
                        </div>
                      ))}
                    </div>
                    {settingsError && (
                      <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 dark:bg-red-950/40 dark:text-red-200">
                        {settingsError}
                      </p>
                    )}
                    <div className="mt-auto flex justify-end gap-2 pt-6">
                      <button
                        type="button"
                        disabled={!isSettingsDirty || isSubmittingSettings}
                        onClick={() => {
                          setDraftSettings(localSettings);
                          setSettingsError("");
                        }}
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Hoàn tác
                      </button>
                      <button
                        type="button"
                        disabled={!isSettingsDirty || isSubmittingSettings}
                        onClick={handleSaveSettings}
                        className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSubmittingSettings ? "Đang lưu..." : "Lưu cài đặt"}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "blocked" && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Danh sách chặn</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                      Người bị chặn sẽ bị xóa khỏi nhóm và không thể tham gia lại cho đến khi được gỡ chặn.
                    </p>
                    <form
                      className="mt-5 flex gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (blockUserId.trim()) blockMutation.mutate(blockUserId.trim());
                      }}
                    >
                      <div className="relative flex-1">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          value={blockUserId}
                          onChange={(event) => setBlockUserId(event.target.value)}
                          placeholder="Nhập userId để chặn"
                          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <button type="submit" disabled={blockMutation.isPending} className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                        Chặn
                      </button>
                    </form>
                    <div className="mt-5 overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700">
                      {isBlocksLoading ? (
                        <div className="space-y-3 p-4">
                          {[0, 1, 2].map((item) => (
                            <div key={item} className="flex items-center gap-3">
                              <div className="h-11 w-11 animate-pulse rounded-full bg-gray-200 dark:bg-slate-800" />
                              <div className="min-w-0 flex-1 space-y-2">
                                <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-slate-800" />
                                <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100 dark:bg-slate-800/70" />
                              </div>
                              <div className="h-9 w-20 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-800/70" />
                            </div>
                          ))}
                        </div>
                      ) : blocksError ? (
                        <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
                          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-950/40">
                            <FiLock className="h-6 w-6" />
                          </div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            Không thể xem danh sách chặn
                          </p>
                          <p className="mt-1 max-w-[320px] text-sm text-gray-500 dark:text-slate-400">
                            {getErrorMessage(blocksError, "Bạn không có quyền xem nội dung này.")}
                          </p>
                        </div>
                      ) : blockedUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
                          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 dark:bg-emerald-950/40">
                            <FiShield className="h-7 w-7" />
                          </div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            Nhóm của bạn đang rất an toàn.
                          </p>
                          <p className="mt-1 max-w-[340px] text-sm text-gray-500 dark:text-slate-400">
                            Chưa có thành viên nào bị chặn.
                          </p>
                        </div>
                      ) : (
                        <ul>
                          <AnimatePresence initial={false}>
                            {blockedUsers.map((item, index) => {
                              const userId = getUserId(item);
                              const avatar = getAvatarUrl(item);
                              const name = getDisplayName(item);
                              const blockedAt = formatBlockedAt(getBlockedAt(item));
                              const blockedBy = getBlockedByName(item);
                              return (
                                <motion.li
                                  key={userId}
                                  layout
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.8, height: 0 }}
                                  transition={{ type: "spring", stiffness: 420, damping: 34, delay: index * 0.035 }}
                                  className="flex items-center gap-3 overflow-hidden border-b border-gray-100 px-4 py-3 last:border-b-0 dark:border-slate-800"
                                >
                                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-red-400 text-sm font-semibold text-white grayscale opacity-70">
                                    {avatar ? <img src={avatar} alt={name} className="h-full w-full object-cover" /> : name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex min-w-0 items-center gap-2">
                                      <span className="truncate text-sm font-semibold text-slate-500 line-through dark:text-slate-400">
                                        {name}
                                      </span>
                                      <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold uppercase text-red-500 dark:bg-red-950/40 dark:text-red-300">
                                        Banned
                                      </span>
                                    </div>
                                    <div className="truncate text-xs text-gray-500 dark:text-slate-400">
                                      Bị chặn bởi {blockedBy}{blockedAt ? ` vào lúc ${blockedAt}` : ""}
                                    </div>
                                  </div>
                                  <motion.button
                                    type="button"
                                    whileTap={{ scale: 0.96 }}
                                    disabled={unblockMutation.isPending}
                                    onClick={() => unblockMutation.mutate(userId)}
                                    className="min-h-[36px] rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
                                  >
                                    Gỡ chặn
                                  </motion.button>
                                </motion.li>
                              );
                            })}
                          </AnimatePresence>
                        </ul>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "pending" && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Duyệt thành viên</h3>
                    <div className="mt-6 rounded-xl border border-gray-200 dark:border-slate-700">
                      {isPendingLoading ? (
                        <div className="p-4 text-sm text-gray-500">Đang tải...</div>
                      ) : pendingMembers.length === 0 ? (
                        <EmptyState text="Không có yêu cầu nào đang chờ duyệt." />
                      ) : (
                        pendingMembers.map((item) => {
                          const userId = getUserId(item);
                          const avatar = getAvatarUrl(item);
                          return (
                            <div key={userId} className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0 dark:border-slate-800">
                              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-blue-500 text-sm font-semibold text-white">
                                {avatar ? <img src={avatar} alt={getDisplayName(item)} className="h-full w-full object-cover" /> : getDisplayName(item).charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{getDisplayName(item)}</div>
                                <div className="truncate text-xs text-gray-500">{userId}</div>
                              </div>
                              <button type="button" onClick={() => approveMutation.mutate(userId)} className="rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-semibold text-white">
                                Phê duyệt
                              </button>
                              <button type="button" onClick={() => rejectMutation.mutate(userId)} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-500">
                                Từ chối
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </section>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body,
  );
};
