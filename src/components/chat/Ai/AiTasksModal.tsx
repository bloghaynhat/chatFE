import React, { useEffect, useState } from "react";
import { CheckCircle, X, Sparkles, AlertCircle } from "lucide-react";
import { aiService } from "../../../services/aiService";

interface AiTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  members?: any[];
}

export const AiTasksModal: React.FC<AiTasksModalProps> = ({
  isOpen,
  onClose,
  conversationId,
  members,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res: any = await aiService.extractTasks({ conversationId });
      let extractedTasks = res?.tasks || res?.data?.tasks || [];
      if (members && members.length > 0) {
        extractedTasks = extractedTasks.map((task: any) => {
          let updatedAssignee = task.assignee;
          if (updatedAssignee && typeof updatedAssignee === "string") {
            members.forEach((member: any) => {
              const user = member?.user || member;
              const userId = String(user?.id || user?._id || member?.userId);
              const shortId = userId.substring(0, 8);
              if (updatedAssignee.includes(userId) || updatedAssignee.includes(shortId)) {
                const name = user?.displayName || user?.name || user?.username || "Người dùng";
                updatedAssignee = updatedAssignee
                  .replace(new RegExp(`Người dùng ${userId}`, 'gi'), name)
                  .replace(new RegExp(`Người dùng ${shortId}`, 'gi'), name)
                  .replace(new RegExp(userId, 'gi'), name)
                  .replace(new RegExp(shortId, 'gi'), name);
              }
            });
          }
          return { ...task, assignee: updatedAssignee };
        });
      }
      setTasks(extractedTasks);
    } catch (err: any) {
      setError(err?.message || "Lỗi khi trích xuất công việc.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && conversationId) {
      fetchTasks();
    } else {
      setTasks([]);
      setError(null);
    }
  }, [isOpen, conversationId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-emerald-50 rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Trích xuất công việc (AI)
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-white/50 p-1.5 rounded-full transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 min-h-[300px]">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-emerald-100" />
                <div className="w-12 h-12 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin absolute top-0 left-0" />
                <Sparkles className="w-5 h-5 text-emerald-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-gray-500 font-medium animate-pulse">
                AI đang đọc và trích xuất công việc...
              </p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-red-500" />
              <p className="text-red-600 font-medium">{error}</p>
              <button
                type="button"
                onClick={fetchTasks}
                className="mt-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : tasks.length > 0 ? (
            <div className="space-y-4">
              <ul className="space-y-3">
                {tasks.map((task, index) => (
                  <li
                    key={index}
                    className="flex flex-col gap-1 text-gray-700 leading-relaxed bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100/50"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold mt-0.5">•</span>
                      <span className="font-medium text-gray-900">{task.description}</span>
                    </div>
                    <div className="ml-4 flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span>Phụ trách: <span className="font-semibold text-gray-700">{task.assignee || 'Chưa rõ'}</span></span>
                      <span>Trạng thái: <span className="font-semibold text-gray-700">{task.status || 'pending'}</span></span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
              <p>Không tìm thấy công việc nào trong cuộc trò chuyện này.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
