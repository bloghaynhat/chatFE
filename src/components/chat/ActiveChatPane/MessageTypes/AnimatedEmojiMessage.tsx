import React, { useEffect, useRef } from "react";
import lottie, { AnimationItem } from "lottie-web";

// Cấu hình Asset S3 map Emoji ký tự sang Animation URL dạng JSON
export const JUMBO_EMOJI_ASSETS: Record<string, string> = {
  "❤️": "https://assets9.lottiefiles.com/packages/lf20_U6OKyK.json",
  "👍": "https://assets1.lottiefiles.com/packages/lf20_aPFFXf.json",
  "😂": "https://chatchitcnm.s3.ap-southeast-1.amazonaws.com/Laugh.json",
  "😮": "https://assets8.lottiefiles.com/packages/lf20_tB7dY7.json",
  "😢": "https://assets8.lottiefiles.com/packages/lf20_R1BEM1.json",
  "😡": "https://assets8.lottiefiles.com/packages/lf20_sJ7B8n.json",
  "🔥": "https://assets3.lottiefiles.com/packages/lf20_vmf1y0.json",
};

// Cấu hình hiệu ứng bay văng (Detached Explosions) riêng biệt
export const EXPLOSION_EMOJI_ASSETS: Record<string, string> = {
  // Thêm các link JSON lottie riêng cho hiệu ứng nổ/bay ra màn hình ở đây
  "😂": "https://chatchitcnm.s3.ap-southeast-1.amazonaws.com/Laugh-detached.json",
};

// Hàm xử lý tạo hiệu ứng "bay văng" (Detached DOM) nhưng chỉ giới hạn trong ActiveChatPane
const playExplosionAnimation = (emoji: string, triggerElement: HTMLElement) => {
  const assetUrl = EXPLOSION_EMOJI_ASSETS[emoji];
  if (!assetUrl) return; // Nếu không có asset nổ riêng thì không tạo detached overlay

  // Lấy container cuộn của danh sách tin nhắn để giới hạn vùng hiển thị
  const chatContainer = triggerElement.closest(".overflow-y-auto") as HTMLElement;
  if (!chatContainer) return;

  // Đảm bảo chatContainer có relative để làm mỏ neo cho overlay absolute
  if (getComputedStyle(chatContainer).position === "static") {
    chatContainer.style.position = "relative";
  }

  let overlayContainer = chatContainer.querySelector("#jumbo-emoji-overlay") as HTMLElement | null;
  if (!overlayContainer) {
    overlayContainer = document.createElement("div");
    overlayContainer.id = "jumbo-emoji-overlay";
    overlayContainer.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; min-height: 100%;
      pointer-events: none; z-index: 99999; overflow: visible;
    `;
    chatContainer.appendChild(overlayContainer);
  }

  const animWrapper = document.createElement("div");
  // Kích thước siêu to khi nổ/click trên màn hình
  const SIZE = 320;
  animWrapper.style.cssText = `position: absolute; width: ${SIZE}px; height: ${SIZE}px; will-change: transform; transition: none;`;
  overlayContainer.appendChild(animWrapper);

  const animItem = lottie.loadAnimation({
    container: animWrapper,
    renderer: "canvas",
    loop: false,
    autoplay: true,
    path: assetUrl,
  });

  const setupPosition = () => {
    // Tọa độ chuẩn xác khi overlayContainer nằm bên trong phần tử có thể cuộn (chatContainer)
    const triggerRect = triggerElement.getBoundingClientRect();
    const containerRect = chatContainer.getBoundingClientRect();

    // Tọa độ top = căn giữa chiều dọc: mép trên emoji + nửa chiều cao emoji - nửa chiều cao detach
    const top = triggerRect.top - containerRect.top + chatContainer.scrollTop - SIZE / 2 + triggerRect.height / 2;
    // Tọa độ left = emoji nằm ở center right của detach (mép phải detach canh bằng mép phải emoji)
    const left = triggerRect.right - containerRect.left - SIZE;

    animWrapper.style.transform = `translate3d(${left}px, ${top}px, 0)`;
  };

  const cleanup = () => {
    try {
      animItem.destroy();
    } catch (e) {}
    if (animWrapper.parentNode) animWrapper.parentNode.removeChild(animWrapper);
  };

  setupPosition();

  if (animItem && animItem.addEventListener) {
    animItem.addEventListener("complete", cleanup);
  } else {
    // Fallback if lottie failed to initialize a valid animItem
    setTimeout(cleanup, 2000);
  }
};

// Bộ nhớ tạm thời lưu các Emoji vừa mới được play để chống giật/chạy lại 2 lần
// (do React StrictMode hoặc do quá trình thay đổi ID tạm của tin nhắn khi gửi socket)
const recentAutoplays: { emoji: string; time: number }[] = [];

export const AnimatedEmojiMessage = ({ emoji, isNew = false }: { emoji: string; isNew?: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const playCountRef = useRef(0); // Biến đếm số lần detached đã được gọi trong lượt play hiện tại

  useEffect(() => {
    const assetUrl = JUMBO_EMOJI_ASSETS[emoji];
    if (!assetUrl || !containerRef.current) return;

    // Kiểm tra xem emoji này đã autoplay ngay lập tức trong vòng 2 giây qua chưa (Optimistic render delay)
    const now = Date.now();
    const recentIndex = recentAutoplays.findIndex((item) => item.emoji === emoji && now - item.time < 2000);
    const isAlreadyPlayedQuickly = recentIndex !== -1;
    const shouldAutoplay = isNew && !isAlreadyPlayedQuickly;

    // Bước 2: Hiển thị emoji lớn (Jumbo), render Lottie thông qua Canvas
    animRef.current = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "canvas",
      loop: false, // Chạy 1 lần rồi kết thúc để thành tĩnh
      autoplay: shouldAutoplay,
      path: assetUrl,
    });

    if (!isNew) {
      // Tin nhắn lịch sử: Tiến thẳng đến frame cuối
      animRef.current.addEventListener("DOMLoaded", () => {
        if (animRef.current) {
          animRef.current.goToAndStop(animRef.current.totalFrames - 1, true);
        }
      });
    } else if (isAlreadyPlayedQuickly) {
      // Tin nhắn mới báo render lại vì đổi ID -> Resume mượt mà dựa trên thời gian đã trôi qua thay vì dừng hẳn
      const elapsedMs = now - recentAutoplays[recentIndex].time;
      animRef.current.addEventListener("DOMLoaded", () => {
        if (animRef.current) {
          const frameRate = animRef.current.frameRate || 30;
          const targetFrame = (elapsedMs / 1000) * frameRate;
          if (targetFrame < animRef.current.totalFrames) {
            animRef.current.goToAndPlay(targetFrame, true); // Play tiếp theo phần đang dở
          } else {
            animRef.current.goToAndStop(animRef.current.totalFrames - 1, true); // Kết thúc
          }
        }
      });
    }

    // Khi gửi / nhận tin nhắn mới (render lần đầu gốc không trùng lặp)
    if (shouldAutoplay) {
      recentAutoplays.push({ emoji, time: now });

      if (EXPLOSION_EMOJI_ASSETS[emoji]) {
        playExplosionAnimation(emoji, containerRef.current);
        playCountRef.current = 1; // Tính là 1 lần detached
      }
    }

    const onComplete = () => {
      // Logic sau khi chạy xong: Reset lại bộ đếm click khi emoji chính kết thúc
      playCountRef.current = 0;
    };
    animRef.current.addEventListener("complete", onComplete);

    return () => {
      animRef.current?.removeEventListener("complete", onComplete);
      animRef.current?.destroy();
    };
  }, [emoji, isNew]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    const isPlaying = animRef.current && !animRef.current.isPaused;

    if (!isPlaying) {
      // Nếu main emoji đang DỪNG -> Play lại từ đầu và gán bộ đếm
      animRef.current?.goToAndPlay(0, true);
      playCountRef.current = 1;

      if (containerRef.current) {
        playExplosionAnimation(emoji, containerRef.current);
      }
    } else {
      // Nếu main emoji ĐANG CHẠY -> Được ấn thêm tối đa 3 lần detached (không replay main)
      if (playCountRef.current <= 3 && containerRef.current) {
        playCountRef.current += 1;
        playExplosionAnimation(emoji, containerRef.current);
      }
    }
  };

  return (
    <div
      className="pb-[4px] pt-[0px] cursor-pointer relative flex justify-center"
      onClick={handleClick}
      title="Bấm để tương tác"
    >
      <div ref={containerRef} className="w-[120px] h-[120px]" />
    </div>
  );
};
