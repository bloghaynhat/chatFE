import React, { useState, useRef, useEffect } from "react";
import { FiArrowLeft, FiArrowRight, FiCamera, FiX } from "react-icons/fi";

import { useFriendManagement } from "../../hooks";
import { conversationService } from "../../services/conversationService";
import { mediaService } from "../../services/mediaService";
import { socketService } from "../../services/socketService";

// Helper to get consistent background colors based on name string
const getAvatarBgColor = (name: string) => {
  const colors = [
    "bg-red-500", "bg-orange-500", "bg-amber-500", 
    "bg-green-500", "bg-emerald-500", "bg-teal-500", 
    "bg-cyan-500", "bg-blue-500", "bg-indigo-500", 
    "bg-violet-500", "bg-purple-500", "bg-pink-500"
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name: string) => {
  if (!name) return "";
  const parts = name.split(" ").filter(p => p.length > 0);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const CreateGroupModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"select" | "name">("select");
  const [groupName, setGroupName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { friends, loading: friendsLoading, fetchFriends } = useFriendManagement();

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  React.useEffect(() => {
    if (isOpen) {
      fetchFriends();
      setSearchQuery("");
      setSelectedIds(new Set());
      setStep("select");
      setGroupName("");
      setAvatarFile(null);
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
        setAvatarPreview(null);
      }
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleContinue = async () => {
    if (step === "select") {
      // Move to name step if members are selected
      if (selectedIds.size > 0) {
        setStep("name");
      }
      return;
    }

    // Step "name" - create the group
    if (!groupName.trim() || selectedIds.size === 0) return;

    try {
      setLoading(true);
      setError(null);

      let avatarUrl: string | undefined;
      if (avatarFile) {
        try {
          const uploaded = await mediaService.uploadMedia(avatarFile);
          avatarUrl = uploaded.url;
        } catch (uploadErr) {
          setError("Failed to upload avatar. Please try again.");
          throw uploadErr;
        }
      }

      const memberIds = Array.from(selectedIds);
      const result = await conversationService.createGroupConversation(
        memberIds,
        groupName.trim(),
        avatarUrl
      );

      // Join the newly created group room to receive real-time messages
      try {
        await socketService.joinGroup(result.conversationId);
        console.log("[CreateGroupModal] Joined group room:", result.conversationId);
      } catch (joinErr) {
        console.error("[CreateGroupModal] Failed to join group room:", joinErr);
        // Continue anyway - user can still manually join later
      }

      // Notify chat list to refresh
      window.dispatchEvent(new Event("chatList:refresh"));

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
      setStep("select"); // Go back to name step to retry
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = friends.filter(c => {
    const name = c.displayName || c.name || "Unknown";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // We want the modal to open over the whole screen or maybe look like a standalone mobile app
  // on smaller screens, and standard centered modal on large layout.
  return (
    <div 
      className="fixed inset-0 bg-black/40 flex flex-col items-center justify-center z-[70] p-0 sm:p-4 transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full h-[100dvh] sm:max-w-[400px] sm:h-[650px] sm:max-h-[90vh] sm:rounded-xl shadow-2xl flex flex-col relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 bg-white flex-shrink-0">
          <div className="flex items-center">
            {step === "name" && (
              <button
                onClick={() => setStep("select")}
                className="p-2 mr-3 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
              >
                <FiArrowLeft className="text-xl" />
              </button>
            )}
            <h2 className="text-[19px] font-semibold text-gray-900 tracking-tight">
              {step === "select" ? "Add Members" : "Group Name"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
          >
            <FiX className="text-[22px]" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-white" style={{ minHeight: 0 }}>
          {step === "select" ? (
            <>
              {/* Selected Members and Search Input Area */}
              <div className="px-5 py-3 border-b border-gray-100 flex-shrink-0">
                {selectedIds.size > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {friends.filter(c => selectedIds.has(c.friendUserId)).map((contact: any) => {
                      const name = contact.displayName || contact.name || "Unknown";
                      const avatarBg = getAvatarBgColor(name);
                      const initials = getInitials(name);

                      return (
                        <div
                          key={contact.friendUserId}
                          className="flex items-center bg-[#f0f2f5] rounded-full pr-3 cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={() => handleToggleSelect(contact.friendUserId)}
                        >
                          <div className={`w-[34px] h-[34px] rounded-full flex-shrink-0 flex items-center justify-center text-white font-medium text-[13px] tracking-tight ${contact.avatarUrl ? '' : avatarBg} overflow-hidden mr-2`}>
                            {contact.avatarUrl ? (
                              <img src={contact.avatarUrl} alt={name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{initials}</span>
                            )}
                          </div>
                          <span className="text-[15px] text-gray-900 font-medium truncate max-w-[120px]">
                            {name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <input
                  type="text"
                  placeholder="Add people..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-[16px] placeholder-gray-400 text-gray-800"
                />
              </div>

              {/* Contact List */}
              <div style={{ minHeight: 0 }}>
                {friendsLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="flex justify-center items-center h-40 text-gray-500 text-[15px]">
                    No contacts found
                  </div>
                ) : (
                  filteredContacts.map((contact: any) => {
                    const name = contact.displayName || contact.name || "Unknown";
                    const isSelected = selectedIds.has(contact.friendUserId);
                    const avatarBg = getAvatarBgColor(name);
                    const initials = getInitials(name);

                    return (
                      <div
                        key={contact.id}
                        className="flex items-center px-5 py-[10px] cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handleToggleSelect(contact.friendUserId)}
                      >
                        {/* Custom Checkbox */}
                        <div className="mr-5 flex-shrink-0">
                          <div
                            className={`w-5 h-5 rounded-[4px] border-[1.5px] flex items-center justify-center transition-all duration-200 ${
                              isSelected
                              ? 'bg-[#3b82f6] border-[#3b82f6]'
                              : 'bg-transparent border-gray-400 hover:border-gray-500'
                            }`}
                          >
                            {isSelected && (
                              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>

                        {/* Avatar */}
                        <div
                          className={`w-[46px] h-[46px] rounded-full flex-shrink-0 mr-[14px] flex items-center justify-center text-white font-medium text-[17px] tracking-tight ${contact.avatarUrl ? '' : avatarBg} overflow-hidden`}
                        >
                          {contact.avatarUrl ? (
                            <img src={contact.avatarUrl} alt={name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{initials}</span>
                          )}
                        </div>

                        {/* Informational Text */}
                        <div className="flex flex-col flex-1 min-w-0 justify-center h-full">
                          <span className="text-[16px] font-medium text-gray-900 truncate leading-tight mb-0.5">
                            {name}
                          </span>
                          <span className="text-[13px] text-gray-500 truncate leading-tight">
                            {contact.lastSeen || "last seen recently"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            /* Step: Name Group */
            <div className="px-5 py-4">
              {/* Avatar upload section */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <div
                    className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Group avatar preview" className="w-full h-full object-cover" />
                    ) : (
                      <FiCamera className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  {avatarFile && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAvatarFile(null);
                        if (avatarPreview) {
                          URL.revokeObjectURL(avatarPreview);
                          setAvatarPreview(null);
                        }
                      }}
                      className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          setError("Image size must be less than 5MB");
                          return;
                        }
                        setAvatarFile(file);
                        const preview = URL.createObjectURL(file);
                        setAvatarPreview(preview);
                      }
                    }}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">Tap to add group photo</p>
              </div>

              <div className="mb-4">
                <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-[16px]"
                  autoFocus
                />
              </div>

              {/* Selected members summary */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Members ({selectedIds.size})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {friends.filter(c => selectedIds.has(c.friendUserId)).map((contact: any) => {
                    const name = contact.displayName || contact.name || "Unknown";
                    const initials = getInitials(name);
                    return (
                      <div key={contact.friendUserId} className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs mr-2">
                          {initials}
                        </div>
                        <span className="text-sm text-gray-700 truncate max-w-[100px]">{name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Padding for bottom to avoid overlap with FAB */}
          <div className="h-20" />
        </div>

        {/* Error message */}
        {error && (
          <div className="absolute bottom-[90px] left-4 right-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Floating Action Button */}
        <div
          className={`absolute bottom-[20px] right-[20px] transition-all duration-300 ease-out ${
            selectedIds.size > 0
            ? "transform scale-100 translate-y-0 opacity-100"
            : "transform scale-75 translate-y-4 opacity-0 pointer-events-none"
          }`}
        >
          <button
            className="w-[56px] h-[56px] bg-[#3b82f6] hover:bg-[#2563eb] rounded-full flex items-center justify-center text-white shadow-[0_8px_16px_rgba(59,130,246,0.3)] transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={step === "select" ? "Continue" : "Create"}
            onClick={handleContinue}
            disabled={loading || (step === "select" ? selectedIds.size === 0 : !groupName.trim())}
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              step === "select" ? <FiArrowRight className="text-[26px]" /> : <FiArrowRight className="text-[26px]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
