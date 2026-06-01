import { useEffect, useRef, useState } from "react";
import {
  conversationService,
  groupChatService,
  userService,
  mediaService,
  socketService,
} from "../../services";
import { RightSidebarInfo } from "./RightSideBar/RightSidebarInfo";
import { RightSidebarEdit } from "./RightSideBar/RightSidebarEdit";
import { RightSidebarMembers } from "./RightSideBar/RightSidebarMembers";
import { RightSidebarAddMember } from "./RightSideBar/RightSidebarAddMember";
import { GroupSettingsModal } from "./RightSideBar/GroupSettingsModal";
import { DeleteGroupModal } from "./ActiveChatPane/DeleteGroupModal";
import { SelectAdminModal } from "./ActiveChatPane/SelectAdminModal";
import { groupSettingsService, GroupSettingsPayload } from "../../services/groupSettingsService";
import { toast } from "sonner";
import { getWallpaperPresetByValue } from "../../constants/wallpaperPresets";

const getMemberUserId = (member: any) =>
  member?.userId || member?.user?.id || member?.user?._id || member?.id;

const getMemberDisplayName = (member: any) => {
  const participant = member?.user || member;
  return (
    participant?.displayName ||
    participant?.name ||
    participant?.username ||
    "this member"
  );
};

const isPrivilegedRole = (role?: string) =>
  role === "admin" || role === "ADMIN" || role === "owner" || role === "OWNER";

const isOwnerRole = (role?: string) =>
  role === "owner" || role === "OWNER";

const notifyCurrentUserLeftGroup = (conversationId: string) => {
  window.dispatchEvent(
    new CustomEvent("group:currentUserLeft", {
      detail: { conversationId },
    }),
  );
  window.dispatchEvent(new Event("chatList:refresh"));
};

const WALLPAPER_CROP_WIDTH = 1600;
const WALLPAPER_CROP_HEIGHT = 1000;

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

const createCroppedWallpaperFile = async (
  sourceFile: File,
  imageUrl: string,
  crop: { offsetX: number; offsetY: number; scale: number },
  previewSize: { width: number; height: number },
) => {
  const image = await loadImage(imageUrl);
  const canvas = document.createElement("canvas");
  canvas.width = WALLPAPER_CROP_WIDTH;
  canvas.height = WALLPAPER_CROP_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Không thể xử lý ảnh trên trình duyệt này");

  const fitScale = Math.min(
    previewSize.width / image.naturalWidth,
    previewSize.height / image.naturalHeight,
  );
  const displayScale = fitScale * crop.scale;
  const displayWidth = image.naturalWidth * displayScale;
  const displayHeight = image.naturalHeight * displayScale;
  const displayX = (previewSize.width - displayWidth) / 2 + crop.offsetX;
  const displayY = (previewSize.height - displayHeight) / 2 + crop.offsetY;
  const outputScaleX = WALLPAPER_CROP_WIDTH / previewSize.width;
  const outputScaleY = WALLPAPER_CROP_HEIGHT / previewSize.height;

  ctx.fillStyle = "#111827";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(
    image,
    displayX * outputScaleX,
    displayY * outputScaleY,
    displayWidth * outputScaleX,
    displayHeight * outputScaleY,
  );

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, sourceFile.type === "image/png" ? "image/png" : "image/jpeg", 0.9),
  );
  if (!blob) throw new Error("Không thể tạo ảnh hình nền");

  const extension = sourceFile.type === "image/png" ? "png" : "jpg";
  return new File([blob], `wallpaper-${Date.now()}.${extension}`, {
    type: blob.type,
  });
};

const mergeGroupSettings = (
  ...sources: Array<GroupSettingsPayload | undefined | null>
): GroupSettingsPayload => {
  return sources.reduce<GroupSettingsPayload>((merged, source) => {
    if (!source) return merged;
    return {
      ...merged,
      ...source,
      utilityPermissions: {
        ...(merged.utilityPermissions || {}),
        ...(source.utilityPermissions || {}),
      },
    };
  }, {});
};

export const RightSidebar = ({
  isOpen,
  selectedChat,
  onClose,
  currentUserId,
  onGroupUpdated,
  onShowInChat,
  messages,
  onSendMessage,
}: any) => {
  const [members, setMembers] = useState<any[]>([]);
  const [info, setInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeSubView, setActiveSubView] = useState<
    "none" | "members" | "admins" | "addMember"
  >("none");
  const [editName, setEditName] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUpdatingWallpaper, setIsUpdatingWallpaper] = useState(false);
  const [wallpaperCropFile, setWallpaperCropFile] = useState<File | null>(null);
  const [wallpaperCropUrl, setWallpaperCropUrl] = useState<string | null>(null);
  const [wallpaperCropScale, setWallpaperCropScale] = useState(1);
  const [wallpaperCropOffset, setWallpaperCropOffset] = useState({
    x: 0,
    y: 0,
  });
  const [wallpaperImageSize, setWallpaperImageSize] = useState({
    width: 0,
    height: 0,
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSelectAdminModalOpen, setIsSelectAdminModalOpen] = useState(false);
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);
  const [removeMemberState, setRemoveMemberState] = useState<{
    targetUserId?: string;
    targetName?: string;
    isConfirmOpen: boolean;
    isSubmitting: boolean;
    error?: string;
  }>({
    isConfirmOpen: false,
    isSubmitting: false,
  });

  const isGroup =
    selectedChat?.type === "group" || selectedChat?.type === "GROUP";
  const isSavedMessages =
    selectedChat?.type === "saved_messages" ||
    selectedChat?.isSavedMessages ||
    selectedChat?.isSelfChat;
  const wallpaperInputRef = useRef<HTMLInputElement | null>(null);
  const wallpaperCropFrameRef = useRef<HTMLDivElement | null>(null);
  const wallpaperDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const currentWallpaperUrl =
    selectedChat?.wallpaperUrl ||
    info?.conversation?.wallpaperUrl ||
    info?.wallpaperUrl ||
    null;

  useEffect(() => {
    return () => {
      if (wallpaperCropUrl) URL.revokeObjectURL(wallpaperCropUrl);
    };
  }, [wallpaperCropUrl]);

  useEffect(() => {
    setActiveSubView("none"); // Reset view when chat changes
    if (!selectedChat?.id) return;

    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (isGroup) {
          const membersData = await conversationService.getGroupMembers(
            selectedChat.id,
          );
          const infoData = await conversationService.getGroupInfo(
            selectedChat.id,
          );
          if (isMounted) {
            const rawMembersList = Array.isArray(membersData)
              ? membersData
              : membersData?.members || membersData?.data || [];
            setMembers(rawMembersList);
            const actualInfo = infoData?.data || infoData;
            setInfo(actualInfo || null);

            // Dynamically enhance members with user profiles if missing
            const enrichedMembers = await Promise.all(
              rawMembersList.map(async (m: any) => {
                const participant = m.user || m;
                if (
                  participant.displayName ||
                  participant.name ||
                  participant.username
                )
                  return m;
                if (!m.userId) return m;
                try {
                  const userRes = await userService.getUserById(m.userId);
                  const userData = userRes.data || userRes;
                  return { ...m, user: userData };
                } catch (err) {
                  return m;
                }
              }),
            );

            if (isMounted) {
              setMembers(enrichedMembers);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch sidebar info data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    const handleMemberRemoved = (data: any) => {
      if (data.conversationId === selectedChat?.id) {
        setMembers((prev) =>
          prev.filter(
            (m: any) =>
              (m.userId || m.user?.id || m.user?._id) !== data.removedUserId,
          ),
        );
      }
    };

    const handleMembersAdded = async (data: any) => {
      if (data.conversationId === selectedChat?.id) {
        try {
          const membersData = await conversationService.getGroupMembers(
            selectedChat.id,
          );
          const rawMembersList = Array.isArray(membersData)
            ? membersData
            : membersData?.members || membersData?.data || [];

          const enrichedMembers = await Promise.all(
            rawMembersList.map(async (m: any) => {
              const participant = m.user || m;
              if (
                participant.displayName ||
                participant.name ||
                participant.username
              )
                return m;
              if (!m.userId) return m;
              try {
                const userRes = await userService.getUserById(m.userId);
                return { ...m, user: userRes.data || userRes };
              } catch (err) {
                return m;
              }
            }),
          );
          setMembers(enrichedMembers);
        } catch (err) {
          console.error("Failed to refresh members:", err);
        }
      }
    };

    const cleanupRemoved = socketService.on(
      "conversation:member_removed",
      handleMemberRemoved,
    );
    const cleanupAdded = socketService.on(
      "conversation:members_added",
      handleMembersAdded,
    );

    const handleOwnerTransferred = async (data: any) => {
      if (data.conversationId === selectedChat?.id) {
        try {
          // Refresh members to get updated roles
          const membersData = await conversationService.getGroupMembers(
            selectedChat.id,
          );
          const rawMembersList = Array.isArray(membersData)
            ? membersData
            : membersData?.members || membersData?.data || [];

          const enrichedMembers = await Promise.all(
            rawMembersList.map(async (m: any) => {
              const participant = m.user || m;
              if (
                participant.displayName ||
                participant.name ||
                participant.username
              )
                return m;
              if (!m.userId) return m;
              try {
                const userRes = await userService.getUserById(m.userId);
                return { ...m, user: userRes.data || userRes };
              } catch (err) {
                return m;
              }
            }),
          );
          setMembers(enrichedMembers);
        } catch (err) {
          console.error("Failed to refresh members after owner transfer:", err);
        }
      }
    };

    const cleanupOwnerTransfer = socketService.on(
      "group:owner_transferred",
      handleOwnerTransferred,
    );

    const handleGroupRenamed = async (data: any) => {
      if (data.conversationId === selectedChat?.id) {
        try {
          const infoData = await conversationService.getGroupInfo(
            selectedChat.id,
          );
          const actualInfo = infoData?.data || infoData;
          if (isMounted) {
            setInfo(actualInfo || null);
          }
        } catch (err) {
          console.error("Failed to refresh group info after rename:", err);
        }
      }
    };

    const handleGroupAvatarChanged = async (data: any) => {
      if (data.conversationId === selectedChat?.id) {
        try {
          const infoData = await conversationService.getGroupInfo(
            selectedChat.id,
          );
          const actualInfo = infoData?.data || infoData;
          if (isMounted) {
            setInfo(actualInfo || null);
          }
        } catch (err) {
          console.error(
            "Failed to refresh group info after avatar change:",
            err,
          );
        }
      }
    };

    const cleanupGroupRenamed = socketService.on(
      "group:renamed",
      handleGroupRenamed,
    );
    const cleanupGroupAvatarChanged = socketService.on(
      "group:avatar_changed",
      handleGroupAvatarChanged,
    );

    return () => {
      isMounted = false;
      if (cleanupRemoved) cleanupRemoved();
      if (cleanupAdded) cleanupAdded();
      if (cleanupOwnerTransfer) cleanupOwnerTransfer();
      if (cleanupGroupRenamed) cleanupGroupRenamed();
      if (cleanupGroupAvatarChanged) cleanupGroupAvatarChanged();
    };
  }, [selectedChat?.id, isGroup]);

  const groupAvatar =
    selectedChat?.avatarUrl || info?.conversation?.avatarUrl || info?.avatarUrl;
  const groupName =
    selectedChat?.name || info?.conversation?.name || info?.name || "Group";
  const membersCount =
    info?.memberCount ||
    info?.membersCount ||
    info?.members?.length ||
    members.length ||
    selectedChat?.members?.length ||
    0;

  const adminCount =
    members.length > 0
      ? members.filter(
          (m: any) =>
            m.role === "admin" ||
            m.role === "owner" ||
            m.role === "ADMIN" ||
            m.role === "OWNER",
        ).length
      : info?.adminIds?.length
        ? info.adminIds.length + (info?.ownerId ? 1 : 0)
        : 1;

  const currentUserMember = members.find(
    (m: any) =>
      String(m.userId) === String(currentUserId) ||
      String(m.user?.id) === String(currentUserId) ||
      String(m.user?._id) === String(currentUserId) ||
      String(m.id) === String(currentUserId),
  );
  const ownerId = info?.ownerId || info?.conversation?.ownerId || selectedChat?.ownerId;
  const adminIds = info?.adminIds || selectedChat?.adminIds || [];
  const currentUserRole =
    String(ownerId) === String(currentUserId)
      ? "owner"
      : adminIds.some((id: any) => String(id?.id || id?._id || id) === String(currentUserId))
        ? "admin"
        : currentUserMember?.role || "member";
  const canEditGroup = isPrivilegedRole(currentUserRole);
  const groupSettings = mergeGroupSettings(
    selectedChat?.settings,
    info?.conversation?.settings || info?.settings,
  );
  const canDissolveGroup = isOwnerRole(currentUserRole);
  const canInviteMembers = canEditGroup || groupSettings.allowMemberInvite !== false;

  const handleEditClick = () => {
    setEditName(groupName);
    setEditAvatarUrl(groupAvatar || null);
    setAvatarFile(null);
    setIsEditing(true);
  };

  const handleAvatarChange = (file: File) => {
    setAvatarFile(file);
    setEditAvatarUrl(URL.createObjectURL(file));
  };

  const closeWallpaperCrop = () => {
    if (wallpaperCropUrl) URL.revokeObjectURL(wallpaperCropUrl);
    setWallpaperCropFile(null);
    setWallpaperCropUrl(null);
    setWallpaperCropScale(1);
    setWallpaperCropOffset({ x: 0, y: 0 });
    setWallpaperImageSize({ width: 0, height: 0 });
    wallpaperDragRef.current = null;
  };

  const getClampedWallpaperOffset = (
    nextOffset: { x: number; y: number },
    scale = wallpaperCropScale,
  ) => {
    const frame = wallpaperCropFrameRef.current;
    const rect = frame?.getBoundingClientRect();
    if (
      !rect?.width ||
      !rect?.height ||
      !wallpaperImageSize.width ||
      !wallpaperImageSize.height
    ) {
      return nextOffset;
    }

    const fitScale = Math.min(
      rect.width / wallpaperImageSize.width,
      rect.height / wallpaperImageSize.height,
    );
    const displayWidth = wallpaperImageSize.width * fitScale * scale;
    const displayHeight = wallpaperImageSize.height * fitScale * scale;
    const maxX = Math.max(0, (displayWidth - rect.width) / 2);
    const maxY = Math.max(0, (displayHeight - rect.height) / 2);

    return {
      x: Math.min(maxX, Math.max(-maxX, nextOffset.x)),
      y: Math.min(maxY, Math.max(-maxY, nextOffset.y)),
    };
  };

  const handleWallpaperFileChange = (event: any) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !selectedChat?.id) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Vui lòng chọn ảnh JPG, PNG hoặc WebP");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh quá lớn, vui lòng chọn ảnh dưới 5MB");
      return;
    }

    if (wallpaperCropUrl) URL.revokeObjectURL(wallpaperCropUrl);
    setWallpaperCropFile(file);
    setWallpaperCropUrl(URL.createObjectURL(file));
    setWallpaperCropScale(1);
    setWallpaperCropOffset({ x: 0, y: 0 });
    setWallpaperImageSize({ width: 0, height: 0 });
  };

  const handleWallpaperDragStart = (event: any) => {
    if (!wallpaperCropUrl || isUpdatingWallpaper) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    wallpaperDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: wallpaperCropOffset.x,
      offsetY: wallpaperCropOffset.y,
    };
  };

  const handleWallpaperDragMove = (event: any) => {
    const dragState = wallpaperDragRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    setWallpaperCropOffset(
      getClampedWallpaperOffset({
        x: dragState.offsetX + event.clientX - dragState.startX,
        y: dragState.offsetY + event.clientY - dragState.startY,
      }),
    );
  };

  const handleWallpaperDragEnd = (event: any) => {
    if (wallpaperDragRef.current?.pointerId === event.pointerId) {
      wallpaperDragRef.current = null;
    }
  };

  const handleConfirmWallpaperCrop = async () => {
    if (!wallpaperCropFile || !wallpaperCropUrl || !selectedChat?.id) return;

    const toastId = toast.loading("Đang tải ảnh lên...");
    setIsUpdatingWallpaper(true);
    try {
      const frame = wallpaperCropFrameRef.current;
      const rect = frame?.getBoundingClientRect();
      const croppedFile = await createCroppedWallpaperFile(
        wallpaperCropFile,
        wallpaperCropUrl,
        {
          offsetX: wallpaperCropOffset.x,
          offsetY: wallpaperCropOffset.y,
          scale: wallpaperCropScale,
        },
        {
          width: rect?.width || WALLPAPER_CROP_WIDTH,
          height: rect?.height || WALLPAPER_CROP_HEIGHT,
        },
      );
      const uploadResult = await mediaService.uploadMedia(croppedFile);
      const wallpaperUrl = uploadResult?.url;
      if (!wallpaperUrl) {
        throw new Error("Upload thành công nhưng không nhận được URL ảnh");
      }

      await conversationService.setWallpaper(selectedChat.id, wallpaperUrl);
      setInfo((prev: any) => ({
        ...prev,
        wallpaperUrl,
        conversation: prev?.conversation
          ? { ...prev.conversation, wallpaperUrl }
          : prev?.conversation,
      }));
      onGroupUpdated?.({ wallpaperUrl });
      window.dispatchEvent(new Event("chatList:refresh"));
      closeWallpaperCrop();
      toast.success("Cập nhật hình nền thành công!", { id: toastId });
    } catch (error: any) {
      console.error("Failed to update wallpaper:", error);
      toast.error(error?.message || "Không thể cập nhật hình nền", {
        id: toastId,
      });
    } finally {
      setIsUpdatingWallpaper(false);
    }
  };

  const handleRemoveWallpaper = async () => {
    if (!selectedChat?.id || isUpdatingWallpaper) return;

    const toastId = toast.loading("Đang xóa hình nền...");
    setIsUpdatingWallpaper(true);
    try {
      await conversationService.removeWallpaper(selectedChat.id);
      setInfo((prev: any) => ({
        ...prev,
        wallpaperUrl: null,
        conversation: prev?.conversation
          ? { ...prev.conversation, wallpaperUrl: null }
          : prev?.conversation,
      }));
      onGroupUpdated?.({ wallpaperUrl: null });
      window.dispatchEvent(new Event("chatList:refresh"));
      toast.success("Đã xóa hình nền", { id: toastId });
    } catch (error: any) {
      console.error("Failed to remove wallpaper:", error);
      toast.error(error?.message || "Không thể xóa hình nền", { id: toastId });
    } finally {
      setIsUpdatingWallpaper(false);
    }
  };

  const handleSelectWallpaperPreset = async (presetValue: string | null) => {
    if (!selectedChat?.id || isUpdatingWallpaper) return;
    if ((currentWallpaperUrl || null) === presetValue) return;

    if (!presetValue) {
      await handleRemoveWallpaper();
      return;
    }

    const preset = getWallpaperPresetByValue(presetValue);
    const toastId = toast.loading("Đang cập nhật màu nền...");
    setIsUpdatingWallpaper(true);
    try {
      await conversationService.setWallpaper(selectedChat.id, presetValue);
      setInfo((prev: any) => ({
        ...prev,
        wallpaperUrl: presetValue,
        conversation: prev?.conversation
          ? { ...prev.conversation, wallpaperUrl: presetValue }
          : prev?.conversation,
      }));
      onGroupUpdated?.({ wallpaperUrl: presetValue });
      window.dispatchEvent(new Event("chatList:refresh"));
      toast.success(
        preset ? `Đã chọn màu nền ${preset.label}` : "Đã cập nhật màu nền",
        { id: toastId },
      );
    } catch (error: any) {
      console.error("Failed to update wallpaper preset:", error);
      toast.error(error?.message || "Không thể cập nhật màu nền", {
        id: toastId,
      });
    } finally {
      setIsUpdatingWallpaper(false);
    }
  };

  const refreshMembers = async () => {
    if (!selectedChat?.id) return;
    const membersData = await conversationService.getGroupMembers(
      selectedChat.id,
    );
    const rawMembersList = Array.isArray(membersData)
      ? membersData
      : membersData?.members || membersData?.data || [];

    const enrichedMembers = await Promise.all(
      rawMembersList.map(async (m: any) => {
        const participant = m.user || m;
        if (
          participant.displayName ||
          participant.name ||
          participant.username
        )
          return m;
        if (!m.userId) return m;
        try {
          const userRes = await userService.getUserById(m.userId);
          return { ...m, user: userRes.data || userRes };
        } catch (err) {
          return m;
        }
      }),
    );
    setMembers(enrichedMembers);
  };

  const handleSaveGroupInfo = async (settingsPayload?: GroupSettingsPayload) => {
    if (!selectedChat?.id) return;
    try {
      setIsLoading(true);
      let finalAvatarUrl = editAvatarUrl;

      if (avatarFile) {
        setIsUploadingAvatar(true);
        const res = await mediaService.uploadMedia(avatarFile);
        setIsUploadingAvatar(false);
        if (res?.url) {
          finalAvatarUrl = res.url;
        }
      }

      const updatePayload: any = { name: editName };
      if (finalAvatarUrl !== groupAvatar) {
        updatePayload.avatarUrl = finalAvatarUrl || "";
      }
      await conversationService.updateGroupInfo(selectedChat.id, updatePayload);
      if (settingsPayload && Object.keys(settingsPayload).length > 0) {
        await groupSettingsService.updateSettings(selectedChat.id, settingsPayload);
      }
      setIsEditing(false);
      setAvatarFile(null);

      const infoData = await conversationService.getGroupInfo(selectedChat.id);
      const actualInfo = infoData?.data || infoData;
      setInfo(actualInfo || null);

      if (onGroupUpdated && actualInfo) {
        onGroupUpdated({
          name: actualInfo.conversation?.name || actualInfo.name,
          avatarUrl: actualInfo.conversation?.avatarUrl || actualInfo.avatarUrl,
          settings: {
            ...mergeGroupSettings(
              selectedChat?.settings,
              info?.conversation?.settings || info?.settings,
              settingsPayload,
            ),
          },
        });
      }

      // Emit socket event to notify other members
      if (socketService.messagesSocket?.connected) {
        socketService.messagesSocket.emit("conversation:updated", {
          conversationId: selectedChat.id,
          updates: {
            name: actualInfo.conversation?.name || actualInfo.name,
            avatarUrl:
              actualInfo.conversation?.avatarUrl || actualInfo.avatarUrl,
          },
        });
      }
    } catch (err) {
      console.error("Failed to update group info:", err);
      setIsUploadingAvatar(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMembers = async (memberIds: string[]) => {
    try {
      setIsLoading(true);
      const addedMembers = await groupChatService.addMembers(
        selectedChat.id,
        memberIds,
      );

      const membersData = await conversationService.getGroupMembers(
        selectedChat.id,
      );
      const rawMembersList = Array.isArray(membersData)
        ? membersData
        : membersData?.members || membersData?.data || [];

      const enrichedMembers = await Promise.all(
        rawMembersList.map(async (m: any) => {
          const participant = m.user || m;
          if (
            participant.displayName ||
            participant.name ||
            participant.username
          )
            return m;
          if (!m.userId) return m;
          try {
            const userRes = await userService.getUserById(m.userId);
            return { ...m, user: userRes.data || userRes };
          } catch (err) {
            return m;
          }
        }),
      );
      setMembers(enrichedMembers);
      if (Array.isArray(addedMembers) && onGroupUpdated) {
        onGroupUpdated({
          membersCount:
            Math.max(membersCount, members.length) + addedMembers.length,
        });
      }
      setActiveSubView("members");
    } catch (error) {
      console.error("Failed to add members", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    const targetMember = members.find(
      (m: any) => String(getMemberUserId(m)) === String(userId),
    );
    setRemoveMemberState({
      targetUserId: userId,
      targetName: getMemberDisplayName(targetMember),
      isConfirmOpen: true,
      isSubmitting: false,
    });
  };

  const handleConfirmRemoveMember = async () => {
    const userId = removeMemberState.targetUserId;
    if (!userId) return;

    try {
      setRemoveMemberState((prev) => ({
        ...prev,
        isSubmitting: true,
        error: undefined,
      }));
      await groupChatService.removeMember(selectedChat.id, userId);

      setMembers((prev) =>
        prev.filter((m: any) => String(getMemberUserId(m)) !== String(userId)),
      );
      setRemoveMemberState({ isConfirmOpen: false, isSubmitting: false });
    } catch (error) {
      console.error("Failed to remove member", error);
      setRemoveMemberState((prev) => ({
        ...prev,
        isSubmitting: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to remove this member.",
      }));
    } finally {
      window.dispatchEvent(new Event("chatList:refresh"));
    }
  };

  const handlePromoteAdmin = async (userId: string) => {
    try {
      setIsLoading(true);
      await conversationService.setGroupAdmin(selectedChat.id, userId, true);
      setMembers((prev) =>
        prev.map((m: any) => {
          if ((m.userId || m.user?.id || m.user?._id) === userId) {
            return { ...m, role: "admin" };
          }
          return m;
        }),
      );

      if (socketService.messagesSocket?.connected) {
        socketService.messagesSocket.emit("conversation:updated", {
          conversationId: selectedChat.id,
          updates: {},
        });
      }
    } catch (error) {
      console.error("Failed to promote to admin", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    try {
      setIsLoading(true);
      await groupChatService.leaveGroup(selectedChat.id);
      onClose();
      notifyCurrentUserLeftGroup(selectedChat.id);
    } catch (error) {
      console.error("Failed to leave group via API", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async (deleteForAll: boolean) => {
    if (canDissolveGroup && !deleteForAll) {
      if (membersCount <= 1) {
        await handleDeleteGroup(true);
        return;
      }
      setIsSelectAdminModalOpen(true);
      setIsDeleteModalOpen(false);
    } else {
      await handleDeleteGroup(deleteForAll);
    }
  };

  const handleDeleteGroup = async (deleteForAll: boolean = false) => {
    try {
      setIsLoading(true);

      if (deleteForAll) {
        await conversationService.deleteGroupConversation(selectedChat.id);
      } else {
        await groupChatService.leaveGroup(selectedChat.id);
      }

      onClose();
      if (!deleteForAll) {
        notifyCurrentUserLeftGroup(selectedChat.id);
      } else {
        window.dispatchEvent(new Event("chatList:refresh"));
      }
    } catch (error) {
      console.error("Failed to delete/leave group", error);
      throw error; // Re-throw to let modal know about the error
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferAdminAndLeave = async (newOwnerId: string) => {
    if (!selectedChat?.id) return;

    try {
      setIsLoading(true);

      // Step 1: Transfer ownership using transfer-owner endpoint
      await conversationService.transferGroupOwnership(
        selectedChat.id,
        newOwnerId,
      );

      // Step 2: Leave the group via HTTP business API
      await groupChatService.leaveGroup(selectedChat.id);

      setIsSelectAdminModalOpen(false);
      setIsDeleteModalOpen(false);
      onClose();
      notifyCurrentUserLeftGroup(selectedChat.id);
    } catch (error) {
      console.error("Failed to transfer ownership and leave:", error);
      setIsLoading(false);
      throw error;
    }
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 flex flex-col h-full z-20 shadow-[-5px_0_15px_-10px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out relative overflow-hidden ${
        isOpen
          ? "w-[360px] lg:w-[390px] border-l opacity-100"
          : "w-0 border-l-0 opacity-0"
      }`}
    >
      <input
        ref={wallpaperInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleWallpaperFileChange}
      />
      <div
        className={`w-[360px] lg:w-[390px] flex h-full shrink-0 relative transition-transform duration-300 ease-in-out overflow-hidden ${isOpen ? "translate-x-0" : "translate-x-[50px]"}`}
      >
        <div
          className="flex h-full shrink-0 transition-transform duration-300 ease-in-out"
          style={{
            width: "400%",
            transform:
              activeSubView === "addMember"
                ? "translateX(-75%)"
                : activeSubView !== "none"
                  ? "translateX(-50%)"
                  : isEditing
                    ? "translateX(-25%)"
                    : "translateX(0)",
          }}
        >
          <RightSidebarInfo
            isGroup={isGroup}
            groupName={groupName}
            groupAvatar={groupAvatar}
            membersCount={membersCount}
            members={members}
            isLoading={isLoading}
            notificationsEnabled={notificationsEnabled}
            setNotificationsEnabled={setNotificationsEnabled}
            onClose={onClose}
            onEditClick={handleEditClick}
            canEdit={canEditGroup}
            currentUserRole={currentUserRole}
            currentUserId={currentUserId}
            canInviteMembers={canInviteMembers}
            onRemoveMember={handleRemoveMember}
            onPromoteAdmin={handlePromoteAdmin}
            onSendMessage={onSendMessage}
            onLeaveGroup={handleLeaveGroup}
            targetUserId={
              !isGroup && !isSavedMessages
                ? selectedChat?.targetUserId ||
                  selectedChat?.participantId ||
                  selectedChat?.targetUser?.id ||
                  selectedChat?.targetUser?._id ||
                  selectedChat?.participant?.id ||
                  selectedChat?.participant?._id ||
                  selectedChat?.user?.id ||
                  selectedChat?.user?._id ||
                  selectedChat?.friend?.id ||
                  selectedChat?.friend?._id ||
                  (selectedChat?.pairKey
                    ? selectedChat.pairKey
                        .split("_")
                        .find((id: string) => id !== currentUserId)
                    : null)
                : null
            }
            conversationId={selectedChat?.id}
            wallpaperUrl={currentWallpaperUrl}
            isWallpaperUpdating={isUpdatingWallpaper}
            onChangeWallpaper={() => wallpaperInputRef.current?.click()}
            onRemoveWallpaper={handleRemoveWallpaper}
            onSelectWallpaperPreset={handleSelectWallpaperPreset}
            isSavedMessages={isSavedMessages}
            onShowInChat={
              onShowInChat &&
              ((mediaUrl) => {
                onShowInChat(mediaUrl);
                onClose();
              })
            }
            messages={messages}
          />

          <RightSidebarEdit
            groupName={groupName}
            groupAvatar={groupAvatar}
            editName={editName}
            setEditName={setEditName}
            editAvatarUrl={editAvatarUrl}
            isUploadingAvatar={isUploadingAvatar}
            onAvatarChange={handleAvatarChange}
            membersCount={membersCount}
            adminCount={adminCount}
            currentUserRole={currentUserRole}
            onClose={() => setIsEditing(false)}
            onSave={handleSaveGroupInfo}
            onMembersClick={() => setActiveSubView("members")}
            onAdminsClick={() => setActiveSubView("admins")}
            onGroupSettingsClick={() => setIsGroupSettingsOpen(true)}
            onDeleteGroupClick={() => setIsDeleteModalOpen(true)}
          />

          <RightSidebarMembers
            type={
              activeSubView === "none" || activeSubView === "addMember"
                ? "members"
                : activeSubView
            }
            members={members}
            onClose={() => setActiveSubView("none")}
            groupName={groupName}
            onAddMemberClick={() => setActiveSubView("addMember")}
            currentUserRole={currentUserRole}
            currentUserId={currentUserId}
            canInviteMembers={canInviteMembers}
            onRemoveMember={handleRemoveMember}
            onPromoteAdmin={handlePromoteAdmin}
            onSendMessage={onSendMessage}
            onLeaveGroup={handleLeaveGroup}
          />

          <RightSidebarAddMember
            members={members}
            onClose={() => setActiveSubView("members")}
            onAddMembers={handleAddMembers}
          />
        </div>
      </div>

      <DeleteGroupModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        groupName={groupName}
        isLoading={isLoading}
        isAdmin={canDissolveGroup}
      />

      <SelectAdminModal
        isOpen={isSelectAdminModalOpen}
        onClose={() => setIsSelectAdminModalOpen(false)}
        onConfirm={handleTransferAdminAndLeave}
        members={members}
        isLoading={isLoading}
        currentUserId={currentUserId}
      />

      <GroupSettingsModal
        isOpen={isGroupSettingsOpen}
        onClose={() => setIsGroupSettingsOpen(false)}
        groupId={selectedChat?.id}
        groupName={groupName}
        groupAvatar={groupAvatar}
        groupDescription={
          info?.conversation?.description ||
          info?.description ||
          selectedChat?.description
        }
        groupType={
          info?.conversation?.groupType ||
          info?.groupType ||
          selectedChat?.groupType ||
          "private"
        }
        settings={groupSettings}
        isAdmin={canEditGroup}
        editName={editName}
        setEditName={setEditName}
        editAvatarUrl={editAvatarUrl}
        isUploadingAvatar={isUploadingAvatar}
        onAvatarChange={handleAvatarChange}
        onSaveGeneral={handleSaveGroupInfo}
        onSettingsUpdated={(settings) => {
          const nextSettings = mergeGroupSettings(
            selectedChat?.settings,
            info?.conversation?.settings || info?.settings,
            settings,
          );
          setInfo((prev: any) => ({
            ...prev,
            settings: nextSettings,
            conversation: prev?.conversation
              ? { ...prev.conversation, settings: nextSettings }
              : prev?.conversation,
          }));
          onGroupUpdated?.({ settings: nextSettings });
        }}
        onMembersChanged={refreshMembers}
      />

      {wallpaperCropUrl && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[680px] rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-gray-900 dark:text-gray-100">
                Chỉnh hình nền
              </h2>
              <button
                type="button"
                onClick={closeWallpaperCrop}
                disabled={isUpdatingWallpaper}
                className="w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-300 disabled:opacity-50"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <div className="px-5 py-4">
              <div
                ref={wallpaperCropFrameRef}
                className="relative mx-auto w-full max-w-[600px] aspect-[16/10] overflow-hidden rounded-lg bg-slate-950 cursor-grab active:cursor-grabbing select-none border border-gray-200 dark:border-slate-700"
                onPointerDown={handleWallpaperDragStart}
                onPointerMove={handleWallpaperDragMove}
                onPointerUp={handleWallpaperDragEnd}
                onPointerCancel={handleWallpaperDragEnd}
              >
                <img
                  src={wallpaperCropUrl}
                  alt=""
                  draggable={false}
                  onLoad={(event) => {
                    const image = event.currentTarget;
                    setWallpaperImageSize({
                      width: image.naturalWidth,
                      height: image.naturalHeight,
                    });
                  }}
                  className="absolute left-1/2 top-1/2 w-full h-full object-contain pointer-events-none"
                  style={{
                    transform: `translate(calc(-50% + ${wallpaperCropOffset.x}px), calc(-50% + ${wallpaperCropOffset.y}px)) scale(${wallpaperCropScale})`,
                  }}
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-white/40 pointer-events-none" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.22)_1px,transparent_1px)] bg-[length:33.333%_33.333%] pointer-events-none" />
              </div>

              <div className="mt-4 flex items-center gap-3">
                <span className="text-[13px] font-medium text-gray-600 dark:text-gray-300 w-20">
                  Thu phóng
                </span>
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="0.05"
                  value={wallpaperCropScale}
                  disabled={isUpdatingWallpaper}
                  onChange={(event) => {
                    const nextScale = Number(event.target.value);
                    setWallpaperCropScale(nextScale);
                    setWallpaperCropOffset((current) =>
                      getClampedWallpaperOffset(current, nextScale),
                    );
                  }}
                  className="flex-1 accent-blue-600"
                />
                <button
                  type="button"
                  disabled={isUpdatingWallpaper}
                  onClick={() => {
                    setWallpaperCropScale(1);
                    setWallpaperCropOffset({ x: 0, y: 0 });
                  }}
                  className="px-3 py-2 text-[13px] font-semibold rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  Đặt lại
                </button>
              </div>
            </div>

            <div className="px-5 py-3 bg-gray-50 dark:bg-slate-800/70 flex justify-end gap-2">
              <button
                type="button"
                disabled={isUpdatingWallpaper}
                onClick={closeWallpaperCrop}
                className="px-4 py-2 text-[14px] font-semibold rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isUpdatingWallpaper}
                onClick={handleConfirmWallpaperCrop}
                className="px-4 py-2 text-[14px] font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isUpdatingWallpaper ? "Đang lưu..." : "Lưu hình nền"}
              </button>
            </div>
          </div>
        </div>
      )}

      {removeMemberState.isConfirmOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[380px] rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800">
              <h2 className="text-[16px] font-semibold text-gray-900 dark:text-gray-100">
                Remove member
              </h2>
            </div>
            <div className="px-5 py-4">
              <p className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed">
                Are you sure you want to remove {removeMemberState.targetName}{" "}
                from this group?
              </p>
              {removeMemberState.error && (
                <p className="mt-3 text-[13px] text-red-500">
                  {removeMemberState.error}
                </p>
              )}
            </div>
            <div className="px-5 py-3 bg-gray-50 dark:bg-slate-800/70 flex justify-end gap-2">
              <button
                type="button"
                disabled={removeMemberState.isSubmitting}
                onClick={() =>
                  setRemoveMemberState({
                    isConfirmOpen: false,
                    isSubmitting: false,
                  })
                }
                className="px-4 py-2 text-[14px] font-semibold rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={removeMemberState.isSubmitting}
                onClick={handleConfirmRemoveMember}
                className="px-4 py-2 text-[14px] font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
              >
                {removeMemberState.isSubmitting ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
