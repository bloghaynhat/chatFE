import { FriendRequestCard } from "../../contacts";

export const FriendRequestsSection = ({
  friendRequests,
  processingRequestId,
  handleAcceptRequest,
  handleRejectRequest,
  handleOpenChat,
}) => {
  if (friendRequests.length === 0) return null;

  return (
    <div>
      <div className="px-3 pt-3 pb-2">
        <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          Friend Requests ({friendRequests.length})
        </h3>
      </div>
      {friendRequests.map((request, index) => (
        <FriendRequestCard
          key={request._id || request.id}
          request={request}
          isProcessing={processingRequestId === (request._id || request.id)}
          onAccept={() => handleAcceptRequest(request._id || request.id)}
          onReject={() => handleRejectRequest(request._id || request.id)}
          style={{ animationDelay: `${index * 0.05}s` }}
          onClick={() => handleOpenChat(request)}
        />
      ))}
      <div className="h-px bg-gray-200 dark:bg-slate-700 mt-2" />
    </div>
  );
};
