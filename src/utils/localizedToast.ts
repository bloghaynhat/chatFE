import { toast } from "sonner";

type LanguageCode = "en" | "vi";
type ToastMethod = "success" | "error" | "info" | "warning" | "loading";

const LANGUAGE_STORAGE_KEY = "appLanguage";

const exactMessages: Record<LanguageCode, Record<string, string>> = {
  en: {
    "A participant left the call": "A participant left the call",
    "The other person ended the call": "The other person ended the call",
    "Cannot access call devices": "Cannot access call devices",
    "Cannot connect to the call": "Cannot connect to the call",
    "Cannot enable camera. The call will continue without camera.": "Cannot enable camera. The call will continue without camera.",
    "Microphone was not found or cannot be accessed.": "Microphone was not found or cannot be accessed.",
    "A call is already in progress": "A call is already in progress",
    "Cannot start the call": "Cannot start the call",
    "Cannot join the call": "Cannot join the call",
    "Cannot change camera status": "Cannot change camera status",
    "Cannot change microphone status": "Cannot change microphone status",
    "The call was not answered": "The call was not answered",
    "The recipient is busy": "The recipient is busy",
    "Your request to join the group is pending approval from administrators.": "Your request to join the group is pending approval from administrators.",
    "Failed to join group.": "Failed to join group.",
    "Failed to block user": "Failed to block user",
    "Could not create poll.": "Could not create poll.",
    "Đã gửi lời mời kết bạn": "Friend request sent",
    "Không thể gửi lời mời": "Could not send friend request",
    "Đã hủy lời mời": "Friend request cancelled",
    "Không thể hủy lời mời": "Could not cancel friend request",
    "Đã chấp nhận lời mời": "Friend request accepted",
    "Không thể chấp nhận lời mời": "Could not accept friend request",
    "Đã từ chối lời mời": "Friend request rejected",
    "Không thể từ chối lời mời": "Could not reject friend request",
    "Conversation unpinned": "Conversation unpinned",
    "Conversation pinned": "Conversation pinned",
    "Could not update conversation pin": "Could not update conversation pin",
    "Conversation unarchived": "Conversation unarchived",
    "Conversation archived": "Conversation archived",
    "Could not update conversation archive": "Could not update conversation archive",
    "Bạn đã bị quản trị viên mời khỏi nhóm này.": "You were removed from this group by an administrator.",
    "Vui lòng chọn ảnh JPG, PNG hoặc WebP": "Please choose a JPG, PNG, or WebP image",
    "Kích thước ảnh quá lớn, vui lòng chọn ảnh dưới 5MB": "Image is too large. Please choose an image under 5MB",
    "Đang tải ảnh lên...": "Uploading image...",
    "Upload thành công nhưng không nhận được URL ảnh": "Upload succeeded but no image URL was returned",
    "Cập nhật hình nền thành công!": "Wallpaper updated successfully!",
    "Không thể cập nhật hình nền": "Could not update wallpaper",
    "Đang xóa hình nền...": "Removing wallpaper...",
    "Đã xóa hình nền": "Wallpaper removed",
    "Không thể xóa hình nền": "Could not remove wallpaper",
    "Đang cập nhật màu nền...": "Updating background color...",
    "Đã cập nhật màu nền": "Background color updated",
    "Không thể cập nhật màu nền": "Could not update background color",
    "User ID not found": "User ID not found",
    "Failed to process friend request": "Failed to process friend request",
    "Failed to accept friend request": "Failed to accept friend request",
    "Failed to reject friend request": "Failed to reject friend request",
    "Failed to unfriend": "Failed to unfriend",
    "Bạn không còn trong nhóm này.": "You are no longer in this group.",
    "Bạn đã bị quản trị viên chặn khỏi nhóm này.": "You were blocked from this group by an administrator.",
    "Could not delete this conversation.": "Could not delete this conversation.",
    "Đã chuyển tiếp tin nhắn": "Message forwarded",
    "Không thể chặn thành viên này.": "Could not block this member.",
    "Không thể gỡ chặn người dùng này.": "Could not unblock this user.",
    "Không thể chuyển tiếp tin nhắn": "Could not forward message",
    "Trình duyệt của bạn không hỗ trợ nhận diện giọng nói!": "Your browser does not support speech recognition!",
    "Không thể truy cập Microphone": "Could not access microphone",
    "Không tìm thấy công việc nào.": "No tasks found.",
    "Lỗi khi trích xuất công việc.": "Error extracting tasks.",
    "Lỗi khi tìm kiếm bằng AI.": "Error searching with AI.",
    "Note updated": "Note updated",
    "Note created": "Note created",
    "Could not save note": "Could not save note",
    "Note deleted": "Note deleted",
    "Could not delete note": "Could not delete note",
    "Reminder updated": "Reminder updated",
    "Reminder created": "Reminder created",
    "Could not save reminder": "Could not save reminder",
    "Reminder cancelled": "Reminder cancelled",
    "Could not cancel reminder": "Could not cancel reminder",
    "Reminder pin updated": "Reminder pin updated",
    "Could not update pin": "Could not update pin",
    "Failed to delete contact": "Failed to delete contact",
    "Failed to update block status": "Failed to update block status",
    "Could not vote this poll.": "Could not vote this poll.",
    "Could not close this poll.": "Could not close this poll.",
    "Could not add this option.": "Could not add this option.",
    "Current password is incorrect": "Current password is incorrect",
    "Password changed successfully": "Password changed successfully",
    "Password changed successfully!": "Password changed successfully!",
    "Password changed succesfully": "Password changed successfully",
    "Password changed succesfully!": "Password changed successfully!",
  },
  vi: {
    "A participant left the call": "Một người tham gia đã rời cuộc gọi",
    "The other person ended the call": "Người kia đã kết thúc cuộc gọi",
    "Cannot access call devices": "Không thể truy cập thiết bị cuộc gọi",
    "Cannot connect to the call": "Không thể kết nối cuộc gọi",
    "Cannot enable camera. The call will continue without camera.": "Không thể bật camera. Cuộc gọi sẽ tiếp tục không có camera.",
    "Microphone was not found or cannot be accessed.": "Không tìm thấy hoặc không thể truy cập micro.",
    "A call is already in progress": "Đang có một cuộc gọi diễn ra",
    "Cannot start the call": "Không thể bắt đầu cuộc gọi",
    "Cannot join the call": "Không thể tham gia cuộc gọi",
    "Cannot change camera status": "Không thể thay đổi trạng thái camera",
    "Cannot change microphone status": "Không thể thay đổi trạng thái micro",
    "The call was not answered": "Cuộc gọi không được trả lời",
    "The recipient is busy": "Người nhận đang bận",
    "Your request to join the group is pending approval from administrators.": "Yêu cầu tham gia nhóm của bạn đang chờ quản trị viên phê duyệt.",
    "Failed to join group.": "Không thể tham gia nhóm.",
    "Failed to block user": "Không thể chặn người dùng",
    "Could not create poll.": "Không thể tạo bình chọn.",
    "Đã gửi lời mời kết bạn": "Đã gửi lời mời kết bạn",
    "Không thể gửi lời mời": "Không thể gửi lời mời",
    "Đã hủy lời mời": "Đã hủy lời mời",
    "Không thể hủy lời mời": "Không thể hủy lời mời",
    "Đã chấp nhận lời mời": "Đã chấp nhận lời mời",
    "Không thể chấp nhận lời mời": "Không thể chấp nhận lời mời",
    "Đã từ chối lời mời": "Đã từ chối lời mời",
    "Không thể từ chối lời mời": "Không thể từ chối lời mời",
    "Conversation unpinned": "Đã bỏ ghim cuộc trò chuyện",
    "Conversation pinned": "Đã ghim cuộc trò chuyện",
    "Could not update conversation pin": "Không thể cập nhật ghim cuộc trò chuyện",
    "Conversation unarchived": "Đã bỏ lưu trữ cuộc trò chuyện",
    "Conversation archived": "Đã lưu trữ cuộc trò chuyện",
    "Could not update conversation archive": "Không thể cập nhật trạng thái lưu trữ",
    "Bạn đã bị quản trị viên mời khỏi nhóm này.": "Bạn đã bị quản trị viên mời khỏi nhóm này.",
    "Vui lòng chọn ảnh JPG, PNG hoặc WebP": "Vui lòng chọn ảnh JPG, PNG hoặc WebP",
    "Kích thước ảnh quá lớn, vui lòng chọn ảnh dưới 5MB": "Kích thước ảnh quá lớn, vui lòng chọn ảnh dưới 5MB",
    "Đang tải ảnh lên...": "Đang tải ảnh lên...",
    "Upload thành công nhưng không nhận được URL ảnh": "Upload thành công nhưng không nhận được URL ảnh",
    "Cập nhật hình nền thành công!": "Cập nhật hình nền thành công!",
    "Không thể cập nhật hình nền": "Không thể cập nhật hình nền",
    "Đang xóa hình nền...": "Đang xóa hình nền...",
    "Đã xóa hình nền": "Đã xóa hình nền",
    "Không thể xóa hình nền": "Không thể xóa hình nền",
    "Đang cập nhật màu nền...": "Đang cập nhật màu nền...",
    "Đã cập nhật màu nền": "Đã cập nhật màu nền",
    "Không thể cập nhật màu nền": "Không thể cập nhật màu nền",
    "User ID not found": "Không tìm thấy ID người dùng",
    "Failed to process friend request": "Không thể xử lý lời mời kết bạn",
    "Failed to accept friend request": "Không thể chấp nhận lời mời kết bạn",
    "Failed to reject friend request": "Không thể từ chối lời mời kết bạn",
    "Failed to unfriend": "Không thể hủy kết bạn",
    "Bạn không còn trong nhóm này.": "Bạn không còn trong nhóm này.",
    "Bạn đã bị quản trị viên chặn khỏi nhóm này.": "Bạn đã bị quản trị viên chặn khỏi nhóm này.",
    "Could not delete this conversation.": "Không thể xóa cuộc trò chuyện này.",
    "Đã chuyển tiếp tin nhắn": "Đã chuyển tiếp tin nhắn",
    "Không thể chặn thành viên này.": "Không thể chặn thành viên này.",
    "Không thể gỡ chặn người dùng này.": "Không thể gỡ chặn người dùng này.",
    "Không thể chuyển tiếp tin nhắn": "Không thể chuyển tiếp tin nhắn",
    "Trình duyệt của bạn không hỗ trợ nhận diện giọng nói!": "Trình duyệt của bạn không hỗ trợ nhận diện giọng nói!",
    "Không thể truy cập Microphone": "Không thể truy cập Microphone",
    "Không tìm thấy công việc nào.": "Không tìm thấy công việc nào.",
    "Lỗi khi trích xuất công việc.": "Lỗi khi trích xuất công việc.",
    "Lỗi khi tìm kiếm bằng AI.": "Lỗi khi tìm kiếm bằng AI.",
    "Note updated": "Đã cập nhật ghi chú",
    "Note created": "Đã tạo ghi chú",
    "Could not save note": "Không thể lưu ghi chú",
    "Note deleted": "Đã xóa ghi chú",
    "Could not delete note": "Không thể xóa ghi chú",
    "Reminder updated": "Đã cập nhật nhắc hẹn",
    "Reminder created": "Đã tạo nhắc hẹn",
    "Could not save reminder": "Không thể lưu nhắc hẹn",
    "Reminder cancelled": "Đã hủy nhắc hẹn",
    "Could not cancel reminder": "Không thể hủy nhắc hẹn",
    "Reminder pin updated": "Đã cập nhật ghim nhắc hẹn",
    "Could not update pin": "Không thể cập nhật ghim",
    "Failed to delete contact": "Không thể xóa liên hệ",
    "Failed to update block status": "Không thể cập nhật trạng thái chặn",
    "Could not vote this poll.": "Không thể bình chọn.",
    "Could not close this poll.": "Không thể đóng bình chọn.",
    "Could not add this option.": "Không thể thêm lựa chọn.",
    "Current password is incorrect": "Mật khẩu hiện tại không đúng",
    "Password changed successfully": "Đổi mật khẩu thành công",
    "Password changed successfully!": "Đổi mật khẩu thành công!",
    "Password changed succesfully": "Đổi mật khẩu thành công",
    "Password changed succesfully!": "Đổi mật khẩu thành công!",
  },
};

const getCurrentLanguage = (): LanguageCode => {
  if (typeof window === "undefined") return "en";
  const value = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return value === "vi" ? "vi" : "en";
};

const localizeDynamicMessage = (message: string, language: LanguageCode) => {
  const blockAndRemoveMatch = message.match(/^Đã chặn và xóa (.+) khỏi nhóm$/);
  if (blockAndRemoveMatch) {
    return language === "vi"
      ? message
      : `Blocked and removed ${blockAndRemoveMatch[1]} from the group`;
  }

  const unblockMatch = message.match(/^Đã gỡ chặn cho (.+)$/);
  if (unblockMatch) {
    return language === "vi" ? message : `Unblocked ${unblockMatch[1]}`;
  }

  const selectedWallpaperMatch = message.match(/^Đã chọn màu nền (.+)$/);
  if (selectedWallpaperMatch) {
    return language === "vi"
      ? message
      : `Selected background color ${selectedWallpaperMatch[1]}`;
  }

  const reminderDueMatch = message.match(/^Reminder due: (.+)$/);
  if (reminderDueMatch) {
    return language === "vi"
      ? `Nhắc hẹn đến hạn: ${reminderDueMatch[1]}`
      : message;
  }

  if (message.startsWith("AI Extracted Tasks:")) {
    return language === "vi"
      ? message.replace("AI Extracted Tasks:", "AI đã trích xuất công việc:")
      : message;
  }

  if (message.startsWith("AI Search Results:")) {
    return language === "vi"
      ? message.replace("AI Search Results:", "Kết quả tìm kiếm AI:")
      : message;
  }

  if (message.startsWith("AI Found:")) {
    return language === "vi"
      ? message.replace("AI Found:", "AI tìm thấy:").replace("No results", "Không có kết quả")
      : message;
  }

  return null;
};

export const localizeNotificationMessage = (message: unknown) => {
  if (typeof message !== "string") return message;

  const language = getCurrentLanguage();
  const trimmed = message.trim();
  const exact = exactMessages[language][trimmed];
  if (exact) return exact;

  return localizeDynamicMessage(trimmed, language) || message;
};

const localizeToastOptions = (options: unknown) => {
  if (!options || typeof options !== "object") return options;
  const nextOptions = { ...(options as Record<string, unknown>) };

  if (typeof nextOptions.description === "string") {
    nextOptions.description = localizeNotificationMessage(nextOptions.description);
  }

  return nextOptions;
};

let isInstalled = false;

export const installLocalizedToastMessages = () => {
  if (isInstalled) return;
  isInstalled = true;

  (["success", "error", "info", "warning", "loading"] as ToastMethod[]).forEach((method) => {
    const original = (toast as any)[method];
    if (typeof original !== "function") return;

    (toast as any)[method] = (message: unknown, options?: unknown) =>
      original(localizeNotificationMessage(message), localizeToastOptions(options));
  });
};
