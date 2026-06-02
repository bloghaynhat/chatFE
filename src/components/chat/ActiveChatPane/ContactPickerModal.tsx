import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { FiCheck, FiSearch, FiSend, FiUserPlus, FiX } from "react-icons/fi";
import { userService } from "../../../services/userService";
import { sendProfileCard } from "../../../services/messageService";
import { useLanguage } from "../../../context";

const unwrapList = (payload: any) => {
  const data = payload?.data || payload || {};
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.users)) return data.users;
  if (Array.isArray(data.data)) return data.data;
  return [];
};

const getUserId = (user: any) =>
  user?.friendUserId || user?.userId || user?.targetUserId || user?.id || user?._id;

const getUserName = (user: any) =>
  user?.displayName || user?.name || user?.username || user?.phone || "Unknown";

export const ContactPickerModal = ({
  isOpen,
  onClose,
  conversationId,
  friends = [],
}: any) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"friends" | "search">("friends");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setActiveTab("friends");
    setSentIds(new Set());
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || activeTab !== "search" || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    let alive = true;
    setIsSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await userService.searchUsers({ q: query.trim(), limit: 20 });
        if (alive) setSearchResults(unwrapList(response));
      } catch (error) {
        if (alive) setSearchResults([]);
      } finally {
        if (alive) setIsSearching(false);
      }
    }, 350);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [activeTab, isOpen, query]);

  const filteredFriends = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return friends;
    return friends.filter((friend: any) => getUserName(friend).toLowerCase().includes(keyword));
  }, [friends, query]);

  const contacts = activeTab === "friends" ? filteredFriends : searchResults;

  const mutation = useMutation({
    mutationFn: (userId: string) => sendProfileCard(conversationId, { userId }),
    onSuccess: (_data, userId) => {
      setSentIds((prev) => new Set(prev).add(userId));
      toast.success(t("profileCard.sentToast"));
    },
    onError: (error: any) => {
      const status = error?.status || error?.response?.status;
      toast.error(
        status === 403
          ? t("profileCard.shareFailedPrivacy")
          : error?.message || t("profileCard.sendFailed"),
      );
    },
  });

  const sendingId = mutation.variables as string | undefined;

  return (
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
              <div>
                <h2 className="text-[17px] font-semibold text-gray-900 dark:text-gray-100">{t("profileCard.shareContact")}</h2>
                <p className="text-[12px] text-gray-500 dark:text-gray-400">{t("profileCard.sendToCurrentChat")}</p>
              </div>
              <button onClick={onClose} className="h-9 w-9 rounded-full inline-flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800">
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-4 pt-3 pb-2 border-b border-gray-100 dark:border-slate-800">
              <div className="grid grid-cols-2 p-1 rounded-xl bg-gray-100 dark:bg-slate-800 mb-3">
                {[
                  ["friends", t("profileCard.friends")],
                  ["search", t("profileCard.search")],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id as any)}
                    className={`h-9 rounded-lg text-sm font-semibold transition ${activeTab === id ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm" : "text-gray-500 dark:text-gray-400"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="h-10 rounded-full bg-gray-100 dark:bg-slate-800 px-3 flex items-center gap-2">
                <FiSearch className="text-gray-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={activeTab === "friends" ? t("profileCard.searchFriends") : t("profileCard.searchUsers")}
                  className="flex-1 bg-transparent outline-none text-sm text-gray-800 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
              {isSearching ? (
                <div className="py-8 flex justify-center">
                  <div className="h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                </div>
              ) : contacts.length === 0 ? (
                <div className="py-10 px-6 text-center text-sm text-gray-500">
                  {activeTab === "search" && query.trim().length < 2 ? t("profileCard.enterMinChars") : t("profileCard.noMatchingContacts")}
                </div>
              ) : (
                contacts.map((contact: any) => {
                  const userId = getUserId(contact);
                  const name = getUserName(contact);
                  const avatarUrl = contact?.avatarUrl || contact?.avatar;
                  const isSent = sentIds.has(userId);
                  const isSending = sendingId === userId && mutation.isPending;

                  return (
                    <div key={userId} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition">
                      <div className="h-11 w-11 rounded-full bg-blue-100 text-blue-600 font-semibold overflow-hidden flex items-center justify-center shrink-0">
                        {avatarUrl ? <img src={avatarUrl} alt={name} className="h-full w-full object-cover" /> : name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold text-gray-900 dark:text-gray-100">{name}</p>
                        <p className="truncate text-[12px] text-gray-500 dark:text-gray-400">{contact?.phone || contact?.email || t("profileCard.userCard")}</p>
                      </div>
                      <button
                        disabled={!userId || isSent || isSending}
                        onClick={() => mutation.mutate(userId)}
                        className={`min-h-[44px] px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition disabled:cursor-default ${isSent ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-70"}`}
                      >
                        {isSending ? (
                          <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        ) : isSent ? (
                          <FiCheck />
                        ) : (
                          <FiSend />
                        )}
                        {isSent ? t("profileCard.sent") : t("app.send")}
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
};
