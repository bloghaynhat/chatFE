import React, { useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FiUsers, FiArrowLeft, FiAlertCircle } from "react-icons/fi";
import { inviteService } from "../services/inviteService";
import { useAuth } from "../hooks/useAuth";

export const InvitePreviewPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const {
    data: preview,
    isLoading: previewLoading,
    error: previewError,
  } = useQuery({
    queryKey: ["invite-preview", token],
    queryFn: () => inviteService.previewInviteLink(token!),
    enabled: !!token,
    retry: false,
  });

  const joinMutation = useMutation({
    mutationFn: () => inviteService.joinGroupByInvite(token!),
    onSuccess: (data) => {
      // Navigate to the group chat or show pending message
      if (data?.isPending) {
        alert("Your request to join the group is pending approval from administrators.");
        navigate("/");
      } else if (data?.conversationId || preview?.groupId) {
        navigate(`/?conversation=${data?.conversationId || preview?.groupId}`);
      } else {
        navigate("/");
      }
    },
    onError: (err: any) => {
      alert(err.message || "Failed to join group.");
    },
  });

  const handleAction = () => {
    if (!isAuthenticated) {
      // Save current URL to return after login
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    joinMutation.mutate();
  };

  if (authLoading) return null;

  if (previewError) {
    const is404 = (previewError as any)?.status === 404;
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiAlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {is404 ? "Invite Link Expired" : "Error Loading Invite"}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            {is404
              ? "This invite link has expired or been revoked by the group administrator."
              : "Failed to load invite link details. Please try again later."}
          </p>
          <button
            onClick={() => navigate("/")}
            className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 rounded-xl font-medium transition-colors"
          >
            <FiArrowLeft /> Return to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50 dark:bg-slate-900">
      {/* Background with blurred avatar */}
      {preview?.groupAvatar && (
        <div
          className="absolute inset-0 opacity-30 dark:opacity-20 scale-110"
          style={{
            backgroundImage: `url(${preview.groupAvatar})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(60px)",
          }}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-sm backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/50 p-8 rounded-3xl shadow-2xl text-center"
      >
        {previewLoading ? (
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-28 h-28 bg-gray-300 dark:bg-slate-700 rounded-full mb-6"></div>
            <div className="h-6 w-48 bg-gray-300 dark:bg-slate-700 rounded mb-3"></div>
            <div className="h-4 w-32 bg-gray-300 dark:bg-slate-700 rounded mb-8"></div>
            <div className="h-12 w-full bg-gray-300 dark:bg-slate-700 rounded-xl"></div>
          </div>
        ) : preview ? (
          <>
            <div className="relative inline-block mb-6">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg mx-auto bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                {(preview.groupAvatar || (preview as any).avatarUrl || (preview as any).avatar) ? (
                  <img src={preview.groupAvatar || (preview as any).avatarUrl || (preview as any).avatar} alt={preview.groupName || (preview as any).name || "Group"} className="w-full h-full object-cover" />
                ) : (
                  <FiUsers className="w-12 h-12 text-gray-400" />
                )}
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
              {preview.groupName || (preview as any).name || "Unknown Group"}
            </h1>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-8 font-medium bg-white/50 dark:bg-slate-800/50 py-1.5 px-4 rounded-full w-max mx-auto border border-gray-200/50 dark:border-slate-700/50">
              <FiUsers className="w-4 h-4" />
              <span>{preview.membersCount || (preview as any).memberCount || 0} members</span>
            </div>

            {/* <div className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Invited by {preview.createdBy}
            </div> */}

            <button
              onClick={handleAction}
              disabled={joinMutation.isPending}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {joinMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Joining...
                </>
              ) : isAuthenticated ? (
                "Join Group"
              ) : (
                "Login to Join"
              )}
            </button>
          </>
        ) : null}
      </motion.div>
    </div>
  );
};
