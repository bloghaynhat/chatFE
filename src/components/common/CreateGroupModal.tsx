import React, { useState } from "react";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";

const mockContacts = [
  { id: "1", name: "A Đăng BKE", avatar: "AB", avatarBg: "bg-orange-400", lastSeen: "last seen Aug 2, 2025 at 15:35", isImage: false },
  { id: "2", name: "A Khánh Hcmc", avatar: "AH", avatarBg: "bg-orange-400", lastSeen: "last seen recently", isImage: false },
  { id: "3", name: "A Trung BKE", avatar: "https://i.pravatar.cc/150?img=11", avatarBg: "", lastSeen: "last seen within a week", isImage: true },
  { id: "4", name: "Anh Cả", avatar: "AC", avatarBg: "bg-teal-400", lastSeen: "last seen 6 hours ago", isImage: false },
  { id: "5", name: "Anh Đạt Pickleball", avatar: "AP", avatarBg: "bg-orange-400", lastSeen: "last seen Mar 26 at 02:25", isImage: false },
  { id: "6", name: "Anh Duy (Linh)", avatar: "https://i.pravatar.cc/150?img=12", avatarBg: "", lastSeen: "last seen within a week", isImage: true },
  { id: "7", name: "Anh Hai", avatar: "https://i.pravatar.cc/150?img=13", avatarBg: "", lastSeen: "last seen Feb 27 at 22:56", isImage: true },
  { id: "8", name: "Anh Minh 0801", avatar: "https://i.pravatar.cc/150?img=14", avatarBg: "", lastSeen: "last seen recently", isImage: true },
  { id: "9", name: "Anh Minh 1015", avatar: "A1", avatarBg: "bg-orange-400", lastSeen: "last seen Apr 8 at 01:38", isImage: false },
  { id: "10", name: "Anh Nam BKE", avatar: "AB", avatarBg: "bg-indigo-400", lastSeen: "last seen Mar 13 at 21:45", isImage: false },
  { id: "11", name: "Anh Phúc 1015", avatar: "A1", avatarBg: "bg-indigo-400", lastSeen: "last seen recently", isImage: false },
];

export const CreateGroupModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const filteredContacts = mockContacts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // We want the modal to open over the whole screen or maybe look like a standalone mobile app 
  // on smaller screens, and standard centered modal on large layout.
  return (
    <div className="fixed inset-0 bg-black/40 flex flex-col items-center justify-center z-[70] p-0 sm:p-4 transition-opacity">
      <div className="bg-white w-full h-[100dvh] sm:max-w-[400px] sm:h-[650px] sm:max-h-[90vh] sm:rounded-xl shadow-2xl flex flex-col relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center px-4 h-14 bg-white flex-shrink-0">
          <button 
            onClick={onClose} 
            className="p-2 mr-3 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
          >
            <FiArrowLeft className="text-xl" />
          </button>
          <h2 className="text-[19px] font-semibold text-gray-900 tracking-tight">Add Members</h2>
        </div>

        {/* Search Input Area */}
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/30 flex-shrink-0">
          <input
            type="text"
            placeholder="Add people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-[15px] placeholder-gray-400 text-gray-800"
          />
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto bg-white" style={{ minHeight: 0 }}>
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center px-5 py-[10px] cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => handleToggleSelect(contact.id)}
            >
              {/* Custom Checkbox */}
              <div className="mr-5 flex-shrink-0">
                <div 
                  className={`w-5 h-5 rounded-[4px] border-[1.5px] flex items-center justify-center transition-all duration-200 ${
                    selectedIds.has(contact.id) 
                    ? 'bg-[#3b82f6] border-[#3b82f6]' 
                    : 'bg-transparent border-gray-400 hover:border-gray-500'
                  }`}
                >
                  {selectedIds.has(contact.id) && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Avatar */}
              <div 
                className={`w-[46px] h-[46px] rounded-full flex-shrink-0 mr-[14px] flex items-center justify-center text-white font-medium text-[17px] tracking-tight ${contact.isImage ? '' : contact.avatarBg} overflow-hidden`}
              >
                 {contact.isImage ? (
                   <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
                 ) : (
                   <span>{contact.avatar}</span>
                 )}
              </div>

              {/* Informational Text */}
              <div className="flex flex-col flex-1 min-w-0 justify-center h-full">
                <span className="text-[16px] font-medium text-gray-900 truncate leading-tight mb-0.5">
                  {contact.name}
                </span>
                <span className="text-[13px] text-gray-500 truncate leading-tight">
                  {contact.lastSeen}
                </span>
              </div>
            </div>
          ))}

          {/* Padding for bottom to avoid overlap with FAB */}
          <div className="h-20" />
        </div>

        {/* Floating Action Button */}
        <div 
          className={`absolute bottom-[20px] right-[20px] transition-all duration-300 ease-out ${
            selectedIds.size > 0 
            ? "transform scale-100 translate-y-0 opacity-100" 
            : "transform scale-75 translate-y-4 opacity-0 pointer-events-none"
          }`}
        >
          <button 
            className="w-[56px] h-[56px] bg-[#3b82f6] hover:bg-[#2563eb] rounded-full flex items-center justify-center text-white shadow-[0_8px_16px_rgba(59,130,246,0.3)] transition-colors active:scale-95"
            aria-label="Continue"
          >
            <FiArrowRight className="text-[26px]" />
          </button>
        </div>
      </div>
    </div>
  );
};
