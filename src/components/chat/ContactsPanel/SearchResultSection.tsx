import { SearchResultCard } from "../../contacts";
import { useFriendManagement } from "../../../hooks";

export const SearchResultSection = ({
  searchResult,
  searchResultRequestStatus,
  processingRequestId,
  handleSendOrCancelRequest,
  handleAcceptSearchRequest,
  handleRejectSearchRequest,
  handleUnfriendSearchResult,
  handleOpenChat,
}) => {
  const { getUserId } = useFriendManagement();

  if (!searchResult) return null;

  return (
    <SearchResultCard
      user={searchResult}
      requestStatus={searchResultRequestStatus}
      isProcessing={processingRequestId === getUserId(searchResult)}
      onSendRequest={handleSendOrCancelRequest}
      onAcceptRequest={handleAcceptSearchRequest}
      onRejectRequest={handleRejectSearchRequest}
      onUnfriend={handleUnfriendSearchResult}
      onClick={() => handleOpenChat(searchResult)}
      style={{ animationDelay: "0s" }}
    />
  );
};
