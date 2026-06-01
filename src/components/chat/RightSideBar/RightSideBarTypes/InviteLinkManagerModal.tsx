import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiCopy,
  FiCheck,
  FiShare2,
  FiRefreshCw,
  FiTrash2,
  FiDownload,
  FiMoreVertical,
} from "react-icons/fi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inviteService } from "../../../../services/inviteService";

interface InviteLinkManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  isAdmin: boolean;
  canUseInviteLink?: boolean;
  groupName: string;
  groupAvatar?: string;
}

export const InviteLinkManagerModal: React.FC<InviteLinkManagerModalProps> = ({
  isOpen,
  onClose,
  groupId,
  isAdmin,
  canUseInviteLink = isAdmin,
  groupName,
  groupAvatar,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: inviteData, isLoading, error: inviteError } = useQuery({
    queryKey: ["group-invite", groupId],
    queryFn: () => inviteService.getInviteLink(groupId),
    enabled: isOpen && canUseInviteLink,
    staleTime: 60000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const regenerateMutation = useMutation({
    mutationFn: () => inviteService.regenerateInviteLink(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-invite", groupId] });
      setShowMenu(false);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: () => inviteService.revokeInviteLink(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-invite", groupId] });
      setShowMenu(false);
      onClose();
    },
  });

  // Always use the frontend's origin to avoid backend port mismatch
  const inviteUrl = inviteData?.token
    ? `${window.location.origin}/invite/${inviteData.token}`
    : inviteData?.joinUrl
      ? inviteData.joinUrl
      : "";

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      if (window.navigator.vibrate) window.navigator.vibrate(50);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link", err);
    }
  };

  const handleShare = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.share({
        title: `Join ${groupName} on Chat`,
        text: `You have been invited to join ${groupName}`,
        url: inviteUrl,
      });
    } catch (err) {
      console.log("Error sharing", err);
    }
  };

  const handleDownloadQR = async () => {
    if (!qrRef.current) return;
    try {
      const dataUrl = await toPng(qrRef.current, { cacheBust: true, quality: 1, pixelRatio: 3 });
      const link = document.createElement("a");
      link.download = `${groupName}-invite-qr.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download QR", err);
    }
  };

  if (!isOpen || typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Group Invite Link
            </h2>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                  >
                    <FiMoreVertical className="w-5 h-5" />
                  </button>
                  <AnimatePresence>
                    {showMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, originX: 1, originY: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-700 rounded-xl shadow-xl border border-gray-100 dark:border-slate-600 overflow-hidden z-10 origin-top-right"
                      >
                        <button
                          onClick={() => regenerateMutation.mutate()}
                          disabled={regenerateMutation.isPending}
                          className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600 flex items-center gap-3 transition-colors disabled:opacity-50"
                        >
                          <FiRefreshCw className={regenerateMutation.isPending ? "animate-spin" : ""} />
                          Regenerate Link
                        </button>
                        <button
                          onClick={() => revokeMutation.mutate()}
                          disabled={revokeMutation.isPending}
                          className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-3 transition-colors disabled:opacity-50"
                        >
                          <FiTrash2 />
                          Revoke Link
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {!canUseInviteLink ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  You do not have permission to view this invite link.
                </p>
              </div>
            ) : inviteError ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  Could not load the invite link. Please check your group permissions.
                </p>
              </div>
            ) : isLoading ? (
              <div className="animate-pulse flex flex-col gap-4">
                <div className="h-12 bg-gray-200 dark:bg-slate-700 rounded-xl"></div>
                <div className="h-40 bg-gray-200 dark:bg-slate-700 rounded-xl mt-4"></div>
              </div>
            ) : !inviteUrl ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No active invite link found.</p>
                {isAdmin && (
                  <button
                    onClick={() => regenerateMutation.mutate()}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                  >
                    Generate Link
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {/* Link Box */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Invite URL
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 overflow-hidden">
                      <p className="text-sm text-gray-800 dark:text-gray-200 truncate select-all">
                        {inviteUrl}
                      </p>
                    </div>
                    <button
                      onClick={handleCopy}
                      className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors relative"
                      title="Copy link"
                    >
                      <AnimatePresence mode="wait">
                        {copied ? (
                          <motion.div
                            key="check"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                          >
                            <FiCheck className="w-5 h-5 text-green-500" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="copy"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                          >
                            <FiCopy className="w-5 h-5" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                    {typeof navigator.share === "function" && (
                      <button
                        onClick={handleShare}
                        className="p-3 bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                        title="Share link"
                      >
                        <FiShare2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* QR Toggle */}
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="text-blue-500 font-medium text-sm hover:underline self-start"
                >
                  {showQR ? "Hide QR Code" : "Show QR Code"}
                </button>

                <AnimatePresence>
                  {showQR && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col items-center gap-4 bg-gray-50 dark:bg-slate-900/50 p-6 rounded-xl border border-gray-100 dark:border-slate-700">
                        <div
                          ref={qrRef}
                          className="bg-white p-4 rounded-2xl shadow-sm relative flex flex-col items-center gap-3 w-full"
                        >
                          <div className="flex items-center gap-3 w-full justify-center pb-2">
                            {groupAvatar && (
                              <img src={groupAvatar} alt="Group" className="w-8 h-8 rounded-full object-cover" />
                            )}
                            <span className="font-semibold text-gray-900 truncate max-w-[200px]">
                              {groupName}
                            </span>
                          </div>
                          <QRCodeSVG
                            value={inviteUrl}
                            size={200}
                            level="H"
                            includeMargin={false}
                            imageSettings={
                              groupAvatar
                                ? {
                                    src: groupAvatar,
                                    x: undefined,
                                    y: undefined,
                                    height: 40,
                                    width: 40,
                                    excavate: true,
                                  }
                                : undefined
                            }
                          />
                        </div>
                        <button
                          onClick={handleDownloadQR}
                          className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                        >
                          <FiDownload /> Download QR
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body,
  );
};
