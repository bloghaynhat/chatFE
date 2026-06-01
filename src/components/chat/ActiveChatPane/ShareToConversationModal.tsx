import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { FiCheck, FiSearch, FiSend, FiX } from "react-icons/fi";
import { conversationService } from "../../../services/conversationService";
import { sendProfileCard } from "../../../services/messageService";

const getConversationName = (conversation: any) =>
  conversation?.name || conversation?.displayName || "Conversation";

export const ShareToConversationModal = ({
  isOpen,
  onClose,
  profileUserId,
}: any) => {
  const [query, setQuery] = useState("");
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSentIds(new Set());
    }
  }, [isOpen]);

  const conversationsQuery = useQuery({
    queryKey: ["share-profile-card-conversations"],
    queryFn: () => conversationService.getConversations({ limit: 50 }),
    enabled: isOpen,
  });

  const conversations = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const list = conversationsQuery.data || [];
    if (!keyword) return list;
    return list.filter((conversation: any) =>
      getConversationName(conversation).toLowerCase().includes(keyword),
    );
  }, [conversationsQuery.data, query]);

  const mutation = useMutation({
    mutationFn: (conversationId: string) =>
      sendProfileCard(conversationId, { userId: profileUserId }),
    onSuccess: (_data, conversationId) => {
      setSentIds((prev) => new Set(prev).add(conversationId));
      toast.success("Đã chia sẻ danh thiếp");
    },
    onError: (error: any) =>
      toast.error(error?.status === 403 ? "Không thể chia sẻ danh thiếp này" : error?.message || "Không thể gửi"),
  });

  const sendingId = mutation.variables as string | undefined;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full sm:max-w-[420px] max-h-[70dvh] sm:max-h-[80vh] bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-white/70 dark:border-slate-700 overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-800">
              <h2 className="text-[17px] font-semibold text-gray-900 dark:text-gray-100">Chia sẻ đến...</h2>
              <button onClick={onClose} className="h-9 w-9 rounded-full inline-flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800">
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-4 py-3 border-b border-gray-100 dark:border-slate-800">
              <div className="h-10 rounded-full bg-gray-100 dark:bg-slate-800 px-3 flex items-center gap-2">
                <FiSearch className="text-gray-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tìm cuộc trò chuyện"
                  className="flex-1 bg-transparent outline-none text-sm text-gray-800 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
              {conversationsQuery.isLoading ? (
                <div className="py-8 flex justify-center">
                  <div className="h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="py-10 px-6 text-center text-sm text-gray-500">Không có cuộc trò chuyện phù hợp</div>
              ) : (
                conversations.map((conversation: any) => {
                  const conversationId = conversation.id || conversation.conversationId || conversation._id;
                  const name = getConversationName(conversation);
                  const isSent = sentIds.has(conversationId);
                  const isSending = sendingId === conversationId && mutation.isPending;

                  return (
                    <div key={conversationId} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition">
                      <div className="h-11 w-11 rounded-full bg-blue-100 text-blue-600 font-semibold overflow-hidden flex items-center justify-center shrink-0">
                        {conversation.avatarUrl ? <img src={conversation.avatarUrl} alt={name} className="h-full w-full object-cover" /> : name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold text-gray-900 dark:text-gray-100">{name}</p>
                        <p className="truncate text-[12px] text-gray-500 dark:text-gray-400">{conversation.type === "group" || conversation.type === "GROUP" ? "Nhóm" : "Tin nhắn"}</p>
                      </div>
                      <button
                        disabled={isSent || isSending}
                        onClick={() => mutation.mutate(conversationId)}
                        className={`min-h-[44px] px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition ${isSent ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-70"}`}
                      >
                        {isSending ? <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : isSent ? <FiCheck /> : <FiSend />}
                        {isSent ? "Đã gửi" : "Gửi"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
};
