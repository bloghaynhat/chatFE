import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type LanguageCode = "en" | "vi";

type TranslationKey =
  | "app.back"
  | "app.cancel"
  | "app.close"
  | "app.copy"
  | "app.create"
  | "app.delete"
  | "app.edit"
  | "app.loading"
  | "app.save"
  | "app.saving"
  | "app.send"
  | "app.online"
  | "app.offline"
  | "app.unknown"
  | "app.unknownDevice"
  | "app.unknownLocation"
  | "app.user"
  | "app.you"
  | "auth.hidePassword"
  | "auth.showPassword"
  | "auth.passwordStrength"
  | "auth.passwordWeak"
  | "auth.passwordMedium"
  | "auth.passwordStrong"
  | "auth.passwordRuleLength"
  | "auth.passwordRuleUppercase"
  | "auth.passwordRuleNumberSpecial"
  | "auth.requiredAll"
  | "auth.phone"
  | "auth.email"
  | "auth.otp"
  | "auth.password"
  | "auth.displayName"
  | "auth.confirmPassword"
  | "auth.newPassword"
  | "auth.phonePlaceholder"
  | "auth.emailPlaceholder"
  | "auth.displayNamePlaceholder"
  | "auth.passwordPlaceholder"
  | "auth.confirmPasswordPlaceholder"
  | "auth.newPasswordPlaceholder"
  | "auth.confirmNewPasswordPlaceholder"
  | "auth.otpPlaceholder"
  | "loginPage.subtitle"
  | "loginPage.forgotPassword"
  | "loginPage.noAccount"
  | "loginPage.registerNow"
  | "login.success"
  | "login.emailVerifyRequired"
  | "login.emailUnverified"
  | "login.failed"
  | "login.loading"
  | "login.submit"
  | "register.success"
  | "register.failed"
  | "register.passwordMismatch"
  | "register.passwordMinLength"
  | "register.phoneInvalid"
  | "register.emailInvalid"
  | "register.mustAgreeTerms"
  | "register.loading"
  | "register.submit"
  | "registerPage.title"
  | "registerPage.subtitle"
  | "registerPage.haveAccount"
  | "registerPage.backToLogin"
  | "register.agreePrefix"
  | "register.termsLink"
  | "forgotPasswordPage.title"
  | "forgotPasswordPage.subtitle"
  | "forgotPasswordPage.rememberPassword"
  | "forgotPasswordPage.backToLogin"
  | "forgotPassword.requestFailed"
  | "forgotPassword.emailRequired"
  | "forgotPassword.emailInvalid"
  | "forgotPassword.otpExpired"
  | "forgotPassword.otpRequired"
  | "forgotPassword.otpInvalid"
  | "forgotPassword.newPasswordRequired"
  | "forgotPassword.newPasswordMinLength"
  | "forgotPassword.confirmMismatch"
  | "forgotPassword.otpSent"
  | "forgotPassword.missingTempTokenVerify"
  | "forgotPassword.otpVerified"
  | "forgotPassword.otpResent"
  | "forgotPassword.missingTempTokenReset"
  | "forgotPassword.resetSuccess"
  | "forgotPassword.processing"
  | "forgotPassword.sendOtp"
  | "forgotPassword.verifyOtp"
  | "forgotPassword.resetPassword"
  | "forgotPassword.resendingOtp"
  | "forgotPassword.resendOtp"
  | "forgotPassword.loginNow"
  | "forgotPassword.expiresIn"
  | "forgotPassword.emailLabel"
  | "verifyEmailPage.title"
  | "verifyEmailPage.subtitle"
  | "verifyEmailPage.donePrompt"
  | "verifyEmailPage.loginNow"
  | "emailVerification.resolveEmailNotFound"
  | "emailVerification.resolveEmailFailed"
  | "emailVerification.registerOtpSent"
  | "emailVerification.accountOtpSent"
  | "emailVerification.sendOtpFailed"
  | "emailVerification.otpResent"
  | "emailVerification.resendFailed"
  | "emailVerification.required"
  | "emailVerification.success"
  | "emailVerification.failed"
  | "emailVerification.resolvingEmail"
  | "emailVerification.preparingOtp"
  | "emailVerification.verifying"
  | "emailVerification.verifyEmail"
  | "emailVerification.resendOtp"
  | "emailVerification.backToRegister"
  | "nav.savedMessages"
  | "nav.archivedChats"
  | "nav.contacts"
  | "nav.settings"
  | "nav.newGroup"
  | "nav.logout"
  | "nav.openMenu"
  | "search.placeholder"
  | "search.clear"
  | "settings.title"
  | "settings.phone"
  | "settings.username"
  | "settings.birthday"
  | "settings.notifications"
  | "settings.dataStorage"
  | "settings.privacySecurity"
  | "settings.general"
  | "settings.chatFolders"
  | "settings.stickersEmoji"
  | "settings.devices"
  | "settings.language"
  | "settings.chooseLanguage"
  | "settings.languageSaved"
  | "settings.english"
  | "settings.vietnamese"
  | "settings.premium"
  | "privacy.title"
  | "privacy.changePassword"
  | "privacy.blockList"
  | "privacy.blockListDescription"
  | "changePassword.title"
  | "changePassword.currentPassword"
  | "changePassword.newPassword"
  | "changePassword.confirmPassword"
  | "changePassword.currentRequired"
  | "changePassword.newRequired"
  | "changePassword.confirmRequired"
  | "changePassword.confirmMismatch"
  | "changePassword.newWeak"
  | "changePassword.ruleLength"
  | "changePassword.ruleUppercase"
  | "changePassword.ruleNumberSpecial"
  | "changePassword.strength"
  | "changePassword.weak"
  | "changePassword.medium"
  | "changePassword.strong"
  | "changePassword.submit"
  | "changePassword.saving"
  | "changePassword.success"
  | "changePassword.error"
  | "changePassword.description"
  | "devices.title"
  | "devices.thisDevice"
  | "devices.current"
  | "devices.refresh"
  | "devices.loadingSessions"
  | "devices.loadingActiveSessions"
  | "devices.currentNotFound"
  | "devices.terminateOthers"
  | "devices.terminateOthersDescription"
  | "devices.activeSessions"
  | "devices.noOtherSessions"
  | "devices.reviewDescription"
  | "devices.logoutDevice"
  | "devices.confirmLogoutDevice"
  | "devices.confirmLogoutOthers"
  | "devices.loadError"
  | "devices.logoutDeviceError"
  | "devices.logoutOthersError"
  | "blockList.title"
  | "blockList.loading"
  | "blockList.loadError"
  | "blockList.emptyTitle"
  | "blockList.emptyDescription"
  | "blockList.unblock"
  | "blockList.unblockError"
  | "contacts.searchPlaceholder"
  | "contacts.notFound"
  | "contacts.noneYet"
  | "contacts.searchToAdd"
  | "contacts.phone"
  | "contacts.notAvailable"
  | "contacts.sendRequest"
  | "contacts.cancelRequest"
  | "contacts.accept"
  | "contacts.reject"
  | "attach.photoVideo"
  | "attach.document"
  | "attach.poll"
  | "sidebar.groupInfo"
  | "sidebar.userInfo"
  | "sidebar.inviteLink"
  | "sidebar.inviteManage"
  | "sidebar.inviteRestricted"
  | "sidebar.notifications"
  | "sidebar.changeWallpaper"
  | "sidebar.updatingWallpaper"
  | "sidebar.wallpaperFormats"
  | "sidebar.backgroundColor"
  | "sidebar.removeWallpaper"
  | "invite.groupLink"
  | "invite.regenerate"
  | "invite.revoke"
  | "invite.noPermission"
  | "invite.loadError"
  | "invite.noActiveLink"
  | "invite.generate"
  | "invite.url"
  | "invite.copy"
  | "invite.share"
  | "invite.showQr"
  | "invite.hideQr"
  | "invite.downloadQr"
  | "invite.shareTitle"
  | "invite.shareText"
  | "profileCard.shareContact"
  | "profileCard.sendToCurrentChat"
  | "profileCard.sent"
  | "profileCard.sentToast"
  | "profileCard.sharedToast"
  | "profileCard.sendFailed"
  | "profileCard.shareFailedPrivacy"
  | "profileCard.shareFailed"
  | "profileCard.friends"
  | "profileCard.search"
  | "profileCard.searchFriends"
  | "profileCard.searchUsers"
  | "profileCard.enterMinChars"
  | "profileCard.noMatchingContacts"
  | "profileCard.userCard"
  | "profileCard.shareTo"
  | "profileCard.searchConversations"
  | "profileCard.noMatchingConversations"
  | "profileCard.group"
  | "profileCard.message"
  | "profileCard.contactCard"
  | "profileCard.userNotFound"
  | "profileCard.openChatFailed"
  | "profileCard.loadProfileFailed"
  | "profileCard.messageUser"
  | "profileCard.viewProfile"
  | "profileCard.joinedSince"
  | "media.shared"
  | "poll.title"
  | "poll.question"
  | "poll.questionRequired"
  | "poll.minOptions"
  | "poll.option"
  | "poll.removeOption"
  | "poll.addOption"
  | "poll.maxOptions"
  | "poll.allowChangeVote"
  | "poll.showResultsEarly"
  | "poll.membersCanAddOptions"
  | "poll.multipleVotes"
  | "poll.hideVoters"
  | "chat.forward"
  | "chat.openLink"
  | "chat.copyLink"
  | "chat.download"
  | "chat.showInChat"
  | "chat.pinTop"
  | "chat.unpinTop"
  | "chat.archive"
  | "chat.unarchive"
  | "chat.chats"
  | "chat.messages"
  | "chat.groups"
  | "chat.media"
  | "chat.links"
  | "chat.files"
  | "chat.voice"
  | "chat.noMatchingConversations"
  | "chat.noResults"
  | "chat.noChats"
  | "chat.noGroups"
  | "chat.noMessages"
  | "chat.noMedia"
  | "chat.noLinks"
  | "chat.noFiles"
  | "chat.noImages"
  | "chat.noVoice"
  | "chat.enterKeyword"
  | "chat.tryDifferentKeyword"
  | "chat.typeMessage"
  | "chat.reply"
  | "chat.replyTo"
  | "chat.forwardMessage"
  | "chat.forwardTo"
  | "chat.forwardHereToSave"
  | "chat.selected"
  | "chat.photo"
  | "chat.photos"
  | "chat.addCaption"
  | "chat.editing"
  | "chat.someone"
  | "chat.messagePlaceholder"
  | "chat.openEmoji"
  | "chat.openAttachments"
  | "chat.aiSmartReply"
  | "chat.speechToText"
  | "chat.stopSpeechToText"
  | "chat.textWillBeTyped"
  | "chat.recordAudio"
  | "chat.sendAudioFile"
  | "chat.searchConversation"
  | "chat.openConversationActions"
  | "chat.aiSummarize"
  | "chat.aiSmartSearch"
  | "chat.aiExtractTasks"
  | "chat.extracting"
  | "chat.mute"
  | "chat.unmute"
  | "chat.call"
  | "chat.videoCall"
  | "chat.shareContact"
  | "chat.deleteChat"
  | "chat.closeSearch"
  | "chat.searchByDate"
  | "chat.searchSmartPlaceholder"
  | "chat.savedMessagesLower"
  | "chat.openingConversation"
  | "chat.members"
  | "chat.justNow"
  | "chat.lastSeenMinutes"
  | "chat.lastSeenHours"
  | "chat.lastSeenDate"
  | "chat.deleteContact"
  | "chat.blockUser"
  | "chat.unblockUser"
  | "chat.voiceMessage"
  | "chat.completed"
  | "chat.missed"
  | "chat.declined"
  | "chat.cancelled"
  | "chat.duration"
  | "group.addPeople"
  | "group.addMembers"
  | "group.edit"
  | "group.name"
  | "group.settings"
  | "group.settingsDescription"
  | "group.addCommentsChat"
  | "group.administrators"
  | "group.owner"
  | "group.admin"
  | "group.notes"
  | "group.reminders"
  | "group.delete"
  | "group.deleteAndLeave"
  | "group.leave"
  | "group.thisGroup"
  | "group.deleting"
  | "group.leaving"
  | "group.deleteConfirm"
  | "group.deleteWarning"
  | "group.deleteForAll"
  | "group.deleteForAllDescription"
  | "group.leaveConfirm"
  | "group.leaveWarning"
  | "chat.editMessage"
  | "chat.copy"
  | "chat.pin"
  | "chat.unpin"
  | "chat.deleteForEveryone"
  | "chat.deleteForMe"
  | "chat.select"
  | "chat.recall"
  | "chat.tryAgain"
  | "chat.loadMoreHint"
  | "chat.noMessagesYet"
  | "chat.sendGreeting"
  | "chat.loadingOlder"
  | "call.voice"
  | "call.video"
  | "call.groupVoice"
  | "call.groupVideo"
  | "call.waitingAnswer"
  | "call.waitingMembers"
  | "call.ringing"
  | "call.unavailable"
  | "call.busy"
  | "call.recipient"
  | "call.caller"
  | "call.isCallingYou"
  | "call.isCallingFrom"
  | "call.cancel"
  | "call.decline"
  | "call.accept"
  | "call.cameraOff"
  | "call.cameraOn"
  | "call.connected"
  | "call.participants"
  | "call.restoreWindow"
  | "call.maximizeWindow"
  | "call.restore"
  | "call.maximize"
  | "call.resizeWindow"
  | "call.dragResize"
  | "call.connecting"
  | "call.mute"
  | "call.unmute"
  | "call.leave"
  | "call.end"
  | "profile.title"
  | "profile.edit"
  | "profile.displayName"
  | "profile.email"
  | "profile.phoneNumber"
  | "profile.bio"
  | "profile.bioPlaceholder"
  | "profile.unsavedConfirm"
  | "profile.avatarUpdated"
  | "profile.updateFailed"
  | "profile.updated"
  | "profile.saveChanges"
  | "profile.myProfile"
  | "profile.wallet"
  | "profile.newChannel"
  | "profile.setEmojiStatus"
  | "profile.calls"
  | "archive.conversation"
  | "archive.conversations"
  | "archive.previewFallback"
  | "app.featureUnderDevelopment";

type LanguageContextValue = {
  language: LanguageCode;
  languageLabel: string;
  setLanguage: (nextLanguage: LanguageCode) => void;
  t: (key: TranslationKey) => string;
};

const LANGUAGE_STORAGE_KEY = "appLanguage";

const translations: Record<LanguageCode, Record<TranslationKey, string>> = {
  en: {
    "app.back": "Back",
    "app.cancel": "Cancel",
    "app.close": "Close",
    "app.copy": "Copy",
    "app.create": "Create",
    "app.delete": "Delete",
    "app.edit": "Edit",
    "app.loading": "Loading...",
    "app.save": "Save",
    "app.saving": "Saving...",
    "app.send": "Send",
    "app.online": "Online",
    "app.offline": "Offline",
    "app.unknown": "Unknown",
    "app.unknownDevice": "Unknown device",
    "app.unknownLocation": "Unknown location",
    "app.user": "User",
    "app.you": "You",
    "app.featureUnderDevelopment": "Feature is under development",
    "auth.hidePassword": "Hide password",
    "auth.showPassword": "Show password",
    "auth.passwordStrength": "Password strength",
    "auth.passwordWeak": "Weak",
    "auth.passwordMedium": "Medium",
    "auth.passwordStrong": "Strong",
    "auth.passwordRuleLength": "At least 8 characters",
    "auth.passwordRuleUppercase": "Contains an uppercase letter",
    "auth.passwordRuleNumberSpecial": "Contains a number or special character",
    "auth.requiredAll": "Please fill in all required information.",
    "auth.phone": "Phone number",
    "auth.email": "Email",
    "auth.otp": "OTP code",
    "auth.password": "Password",
    "auth.displayName": "Display name",
    "auth.confirmPassword": "Confirm password",
    "auth.newPassword": "New password",
    "auth.phonePlaceholder": "0912345678",
    "auth.emailPlaceholder": "your@email.com",
    "auth.displayNamePlaceholder": "Your name",
    "auth.passwordPlaceholder": "Enter password",
    "auth.confirmPasswordPlaceholder": "Re-enter password",
    "auth.newPasswordPlaceholder": "Enter new password",
    "auth.confirmNewPasswordPlaceholder": "Re-enter new password",
    "auth.otpPlaceholder": "Enter OTP code",
    "loginPage.subtitle": "Log in to your account",
    "loginPage.forgotPassword": "Forgot password?",
    "loginPage.noAccount": "Don't have an account?",
    "loginPage.registerNow": "Register now",
    "login.success": "Login successful",
    "login.emailVerifyRequired": "Please verify your email to continue.",
    "login.emailUnverified": "Email is not verified. Please enter the OTP to continue.",
    "login.failed": "Login failed",
    "login.loading": "Logging in...",
    "login.submit": "Log in",
    "register.success": "Registration successful. Please check your email to enter the OTP.",
    "register.failed": "Registration failed",
    "register.passwordMismatch": "Confirmation password does not match.",
    "register.passwordMinLength": "Password must be at least 6 characters.",
    "register.phoneInvalid": "Phone number must have 10 digits and start with 0.",
    "register.emailInvalid": "Please enter a valid email address.",
    "register.mustAgreeTerms": "You need to agree to the policies and terms.",
    "register.loading": "Registering...",
    "register.submit": "Register",
    "registerPage.title": "Create a new account",
    "registerPage.subtitle": "Join ChatChit and start connecting with friends.",
    "registerPage.haveAccount": "Already have an account?",
    "registerPage.backToLogin": "Back to login",
    "register.agreePrefix": "I agree to the",
    "register.termsLink": "policies and terms",
    "forgotPasswordPage.title": "Forgot password?",
    "forgotPasswordPage.subtitle": "Enter your email to receive password reset instructions.",
    "forgotPasswordPage.rememberPassword": "Remember your password?",
    "forgotPasswordPage.backToLogin": "Back to login",
    "forgotPassword.requestFailed": "Request failed",
    "forgotPassword.emailRequired": "Please enter your email.",
    "forgotPassword.emailInvalid": "Email is invalid.",
    "forgotPassword.otpExpired": "OTP has expired. Please request a new code.",
    "forgotPassword.otpRequired": "Please enter the OTP.",
    "forgotPassword.otpInvalid": "OTP must contain exactly 6 digits.",
    "forgotPassword.newPasswordRequired": "Please enter a new password.",
    "forgotPassword.newPasswordMinLength": "New password must be at least 6 characters.",
    "forgotPassword.confirmMismatch": "Confirmation password does not match.",
    "forgotPassword.otpSent": "OTP has been sent. Please check your email/SMS to continue.",
    "forgotPassword.missingTempTokenVerify": "No tempToken was returned after OTP verification.",
    "forgotPassword.otpVerified": "OTP is valid. Please enter your new password.",
    "forgotPassword.otpResent": "OTP has been resent. Please check your email/SMS again.",
    "forgotPassword.missingTempTokenReset": "Missing tempToken. Please verify the OTP again.",
    "forgotPassword.resetSuccess": "Password reset successfully. You can log in again.",
    "forgotPassword.processing": "Processing...",
    "forgotPassword.sendOtp": "Send OTP",
    "forgotPassword.verifyOtp": "Verify OTP",
    "forgotPassword.resetPassword": "Reset password",
    "forgotPassword.resendingOtp": "Resending...",
    "forgotPassword.resendOtp": "Resend OTP",
    "forgotPassword.loginNow": "Log in now",
    "forgotPassword.expiresIn": "Code expires in {time}.",
    "forgotPassword.emailLabel": "Your email:",
    "verifyEmailPage.title": "Verify email",
    "verifyEmailPage.subtitle": "Enter the OTP sent to your email to complete account registration.",
    "verifyEmailPage.donePrompt": "Finished verifying?",
    "verifyEmailPage.loginNow": "Log in now",
    "emailVerification.resolveEmailNotFound": "Could not find the email for this account. Please enter your email to receive the OTP.",
    "emailVerification.resolveEmailFailed": "Could not get the account email. Please enter your email to receive the OTP.",
    "emailVerification.registerOtpSent": "The OTP was sent during registration. Please check your email and enter the code to verify.",
    "emailVerification.accountOtpSent": "Your account is not verified. An OTP has been sent to your email.",
    "emailVerification.sendOtpFailed": "Could not send OTP. Please press resend.",
    "emailVerification.otpResent": "A new OTP has been sent to your email. Please use the latest code.",
    "emailVerification.resendFailed": "Resending OTP failed.",
    "emailVerification.required": "Please enter both email and OTP.",
    "emailVerification.success": "Email verified successfully",
    "emailVerification.failed": "OTP verification failed",
    "emailVerification.resolvingEmail": "Getting account email...",
    "emailVerification.preparingOtp": "Preparing OTP...",
    "emailVerification.verifying": "Verifying...",
    "emailVerification.verifyEmail": "Verify email",
    "emailVerification.resendOtp": "Resend OTP code",
    "emailVerification.backToRegister": "Back to registration",
    "nav.savedMessages": "Saved Messages",
    "nav.archivedChats": "Archived Chats",
    "nav.contacts": "Contacts",
    "nav.settings": "Settings",
    "nav.newGroup": "New Group",
    "nav.logout": "Logout",
    "nav.openMenu": "Open navigation menu",
    "search.placeholder": "Search",
    "search.clear": "Clear search",
    "settings.title": "Settings",
    "settings.phone": "Phone",
    "settings.username": "Username",
    "settings.birthday": "Birthday",
    "settings.notifications": "Notifications and Sounds",
    "settings.dataStorage": "Data and Storage",
    "settings.privacySecurity": "Privacy and Security",
    "settings.general": "General Settings",
    "settings.chatFolders": "Chat Folders",
    "settings.stickersEmoji": "Stickers and Emoji",
    "settings.devices": "Devices",
    "settings.language": "Language",
    "settings.chooseLanguage": "Choose language",
    "settings.languageSaved": "Language preference saved",
    "settings.english": "English",
    "settings.vietnamese": "Tiếng Việt",
    "settings.premium": "ChatChit Premium",
    "privacy.title": "Privacy and Security",
    "privacy.changePassword": "Change Password",
    "privacy.blockList": "Block List",
    "privacy.blockListDescription":
      "Manage people you have blocked. Blocked users cannot message or call you.",
    "changePassword.title": "Change Password",
    "changePassword.currentPassword": "Current password",
    "changePassword.newPassword": "New password",
    "changePassword.confirmPassword": "Confirm new password",
    "changePassword.currentRequired": "Current password is required.",
    "changePassword.newRequired": "New password is required.",
    "changePassword.confirmRequired": "Please confirm your new password.",
    "changePassword.confirmMismatch": "New password and confirmation do not match.",
    "changePassword.newWeak": "New password must satisfy all requirements.",
    "changePassword.ruleLength": "At least 8 characters",
    "changePassword.ruleUppercase": "Contains an uppercase letter",
    "changePassword.ruleNumberSpecial": "Contains a number or special character",
    "changePassword.strength": "Password strength",
    "changePassword.weak": "Weak",
    "changePassword.medium": "Medium",
    "changePassword.strong": "Strong",
    "changePassword.submit": "Update password",
    "changePassword.saving": "Updating...",
    "changePassword.success": "Password updated successfully.",
    "changePassword.error": "Could not update password.",
    "changePassword.description":
      "Use a strong password that you do not use elsewhere. Other active sessions remain signed in unless you terminate them from Devices.",
    "devices.title": "Active Sessions",
    "devices.thisDevice": "This device",
    "devices.current": "Current",
    "devices.refresh": "Refresh",
    "devices.loadingSessions": "Loading sessions...",
    "devices.loadingActiveSessions": "Loading active sessions...",
    "devices.currentNotFound": "Current device not found.",
    "devices.terminateOthers": "Terminate All Other Sessions",
    "devices.terminateOthersDescription":
      "Logs out all devices except for this one.",
    "devices.activeSessions": "Active sessions",
    "devices.noOtherSessions": "No other active sessions.",
    "devices.reviewDescription":
      "You can review all logged-in devices and remotely log out sessions you no longer use.",
    "devices.logoutDevice": "Log out this device",
    "devices.confirmLogoutDevice": "Log out this device?",
    "devices.confirmLogoutOthers": "Log out all other devices?",
    "devices.loadError": "Could not load active sessions.",
    "devices.logoutDeviceError": "Could not log out this device.",
    "devices.logoutOthersError": "Could not log out other devices.",
    "blockList.title": "Block List",
    "blockList.loading": "Loading blocked users...",
    "blockList.loadError": "Failed to load blocked users",
    "blockList.emptyTitle": "No blocked users",
    "blockList.emptyDescription": "People you block will appear here.",
    "blockList.unblock": "Unblock",
    "blockList.unblockError": "Failed to unblock user",
    "contacts.searchPlaceholder": "Search contacts...",
    "contacts.notFound": "No contacts found",
    "contacts.noneYet": "No contacts yet",
    "contacts.searchToAdd": "Search to add friends",
    "contacts.phone": "Phone",
    "contacts.notAvailable": "Not available",
    "contacts.sendRequest": "Send Request",
    "contacts.cancelRequest": "Cancel Request",
    "contacts.accept": "Accept",
    "contacts.reject": "Reject",
    "attach.photoVideo": "Photo or Video",
    "attach.document": "Document",
    "attach.poll": "Poll",
    "sidebar.groupInfo": "Group Info",
    "sidebar.userInfo": "User Info",
    "sidebar.inviteLink": "Invite Link",
    "sidebar.inviteManage": "Tap to manage group invite link",
    "sidebar.inviteRestricted": "Only admins or permitted members can invite",
    "sidebar.notifications": "Notifications",
    "sidebar.changeWallpaper": "Change wallpaper",
    "sidebar.updatingWallpaper": "Updating wallpaper...",
    "sidebar.wallpaperFormats": "JPG, PNG or WebP, up to 5MB",
    "sidebar.backgroundColor": "Background color",
    "sidebar.removeWallpaper": "Remove wallpaper",
    "invite.groupLink": "Group Invite Link",
    "invite.regenerate": "Regenerate Link",
    "invite.revoke": "Revoke Link",
    "invite.noPermission":
      "You do not have permission to view this invite link.",
    "invite.loadError":
      "Could not load the invite link. Please check your group permissions.",
    "invite.noActiveLink": "No active invite link found.",
    "invite.generate": "Generate Link",
    "invite.url": "Invite URL",
    "invite.copy": "Copy link",
    "invite.share": "Share link",
    "invite.showQr": "Show QR Code",
    "invite.hideQr": "Hide QR Code",
    "invite.downloadQr": "Download QR",
    "invite.shareTitle": "Join {groupName} on Chat",
    "invite.shareText": "You have been invited to join {groupName}",
    "profileCard.shareContact": "Share contact",
    "profileCard.sendToCurrentChat": "Send a contact card to this conversation",
    "profileCard.sent": "Sent",
    "profileCard.sentToast": "Contact card sent",
    "profileCard.sharedToast": "Contact card shared",
    "profileCard.sendFailed": "Could not send contact card",
    "profileCard.shareFailedPrivacy":
      "Cannot share this contact card because of privacy settings",
    "profileCard.shareFailed": "Cannot share this contact card",
    "profileCard.friends": "Friends",
    "profileCard.search": "Search",
    "profileCard.searchFriends": "Search friends",
    "profileCard.searchUsers": "Search users",
    "profileCard.enterMinChars": "Enter at least 2 characters to search",
    "profileCard.noMatchingContacts": "No matching contacts",
    "profileCard.userCard": "User contact card",
    "profileCard.shareTo": "Share to...",
    "profileCard.searchConversations": "Search conversations",
    "profileCard.noMatchingConversations": "No matching conversations",
    "profileCard.group": "Group",
    "profileCard.message": "Message",
    "profileCard.contactCard": "Contact card",
    "profileCard.userNotFound": "Could not find the user in this contact card",
    "profileCard.openChatFailed": "Could not open the conversation right now",
    "profileCard.loadProfileFailed": "Could not load profile",
    "profileCard.messageUser": "Message",
    "profileCard.viewProfile": "View profile",
    "profileCard.joinedSince": "Joined since {year}",
    "media.shared": "Shared Media",
    "poll.title": "Poll",
    "poll.question": "Question",
    "poll.questionRequired": "Question is required.",
    "poll.minOptions": "Poll needs at least 2 options.",
    "poll.option": "Option",
    "poll.removeOption": "Remove option",
    "poll.addOption": "Add option",
    "poll.maxOptions": "Maximum 10 options",
    "poll.allowChangeVote": "Allow changing vote",
    "poll.showResultsEarly": "Show results early",
    "poll.membersCanAddOptions": "Members can add options",
    "poll.multipleVotes": "Multiple votes",
    "poll.hideVoters": "Hide voters",
    "chat.forward": "Forward",
    "chat.openLink": "Open link",
    "chat.copyLink": "Copy link",
    "chat.download": "Download",
    "chat.showInChat": "Show in chat",
    "chat.pinTop": "Pin to top",
    "chat.unpinTop": "Unpin from top",
    "chat.archive": "Archive",
    "chat.unarchive": "Unarchive",
    "chat.chats": "Chats",
    "chat.messages": "Messages",
    "chat.groups": "Groups",
    "chat.media": "Media",
    "chat.links": "Links",
    "chat.files": "Files",
    "chat.voice": "Voice",
    "chat.noMatchingConversations": "No matching conversations found",
    "chat.noResults": "No results found",
    "chat.noChats": "No chats found",
    "chat.noGroups": "No groups found",
    "chat.noMessages": "No messages found",
    "chat.noMedia": "No media found",
    "chat.noLinks": "No links found",
    "chat.noFiles": "No files found",
    "chat.noImages": "No images",
    "chat.noVoice": "No voice messages found",
    "chat.enterKeyword": "Enter a keyword to search",
    "chat.tryDifferentKeyword":
      "Try a different keyword or start a new message from the + button.",
    "chat.typeMessage": "Type a message",
    "chat.reply": "Reply",
    "chat.replyTo": "Reply to",
    "chat.forwardMessage": "Forward Message",
    "chat.forwardTo": "Forward to...",
    "chat.forwardHereToSave": "forward here to save",
    "chat.selected": "selected",
    "chat.photo": "Photo",
    "chat.photos": "Photos",
    "chat.addCaption": "Add a caption...",
    "chat.editing": "Editing",
    "chat.someone": "Someone",
    "chat.messagePlaceholder": "Message",
    "chat.openEmoji": "Open emoji picker",
    "chat.openAttachments": "Open attachment actions",
    "chat.aiSmartReply": "AI smart reply",
    "chat.speechToText": "Speech to Text",
    "chat.stopSpeechToText": "Stop speech to text",
    "chat.textWillBeTyped": "Text will be typed automatically",
    "chat.recordAudio": "Record Audio",
    "chat.sendAudioFile": "Send as an audio file",
    "chat.searchConversation": "Search in conversation",
    "chat.openConversationActions": "Open conversation actions",
    "chat.aiSummarize": "Summarize conversation (AI)",
    "chat.aiSmartSearch": "Smart search (AI)",
    "chat.aiExtractTasks": "Extract tasks (AI)",
    "chat.extracting": "Extracting...",
    "chat.mute": "Mute",
    "chat.unmute": "Unmute",
    "chat.call": "Call",
    "chat.videoCall": "Video Call",
    "chat.shareContact": "Share contact",
    "chat.deleteChat": "Delete Chat",
    "chat.closeSearch": "Close search",
    "chat.searchByDate": "Search by date",
    "chat.searchSmartPlaceholder": "Search... (Type '/ai ' for Smart Search)",
    "chat.savedMessagesLower": "Saved messages",
    "chat.openingConversation": "Opening conversation...",
    "chat.members": "members",
    "chat.justNow": "Just now",
    "chat.lastSeenMinutes": "last seen {count}m ago",
    "chat.lastSeenHours": "last seen {count}h ago",
    "chat.lastSeenDate": "last seen {date}",
    "chat.deleteContact": "Delete Contact",
    "chat.blockUser": "Block User",
    "chat.unblockUser": "Unblock User",
    "chat.voiceMessage": "Voice Message",
    "chat.completed": "Completed",
    "chat.missed": "Missed",
    "chat.declined": "Declined",
    "chat.cancelled": "Cancelled",
    "chat.duration": "Duration",
    "group.addPeople": "Add people...",
    "group.addMembers": "Add Members",
    "group.edit": "Edit",
    "group.name": "Group Name",
    "group.settings": "Group Settings",
    "group.settingsDescription": "Info, invite links, permissions",
    "group.addCommentsChat": "Add a group chat for comments",
    "group.administrators": "Administrators",
    "group.owner": "Owner",
    "group.admin": "Admin",
    "group.notes": "Notes",
    "group.reminders": "Reminders",
    "group.delete": "Delete Group",
    "group.deleteAndLeave": "Delete Group and Leave",
    "group.leave": "Leave Group",
    "group.thisGroup": "this group",
    "group.deleting": "Deleting...",
    "group.leaving": "Leaving...",
    "group.deleteConfirm": 'Are you sure you want to delete "{groupName}"?',
    "group.deleteWarning":
      "This will permanently remove the group and all its messages for every member. This action cannot be undone.",
    "group.deleteForAll": "Delete for all members",
    "group.deleteForAllDescription":
      "Remove this group for everyone and delete all messages",
    "group.leaveConfirm": "Are you sure you want to leave this group?",
    "group.leaveWarning":
      "You will lose access to messages and media. This action cannot be undone.",
    "chat.editMessage": "Edit Message",
    "chat.copy": "Copy",
    "chat.pin": "Pin",
    "chat.unpin": "Unpin",
    "chat.deleteForEveryone": "Delete for everyone",
    "chat.deleteForMe": "Delete for me only",
    "chat.select": "Select",
    "chat.recall": "Recall",
    "chat.tryAgain": "Try again",
    "chat.loadMoreHint": "Scroll up to load more messages",
    "chat.noMessagesYet": "No messages here yet...",
    "chat.sendGreeting": "Send a message or tap the greeting below.",
    "chat.loadingOlder": "Loading older messages...",
    "call.voice": "Voice call",
    "call.video": "Video call",
    "call.groupVoice": "Group voice call",
    "call.groupVideo": "Group video call",
    "call.waitingAnswer": "Waiting for answer...",
    "call.waitingMembers": "Waiting for members to answer...",
    "call.ringing": "ringing",
    "call.unavailable": "unavailable",
    "call.busy": "busy",
    "call.recipient": "Recipient",
    "call.caller": "Caller",
    "call.isCallingYou": "is calling you",
    "call.isCallingFrom": "is calling from",
    "call.cancel": "Cancel",
    "call.decline": "Decline",
    "call.accept": "Accept",
    "call.cameraOff": "Camera off",
    "call.cameraOn": "Turn camera on",
    "call.connected": "Connected",
    "call.participants": "participants",
    "call.restoreWindow": "Restore call window",
    "call.maximizeWindow": "Maximize call window",
    "call.restore": "Restore",
    "call.maximize": "Maximize",
    "call.resizeWindow": "Resize call window",
    "call.dragResize": "Drag to resize",
    "call.connecting": "Connecting...",
    "call.mute": "Mute microphone",
    "call.unmute": "Unmute microphone",
    "call.leave": "Leave call",
    "call.end": "End call",
    "profile.title": "My Profile",
    "profile.edit": "Edit Profile",
    "profile.displayName": "Display Name",
    "profile.email": "Email",
    "profile.phoneNumber": "Phone Number",
    "profile.bio": "Bio",
    "profile.bioPlaceholder": "Tell us about yourself...",
    "profile.unsavedConfirm":
      "You have unsaved changes. Are you sure you want to close?",
    "profile.avatarUpdated": "Avatar updated successfully!",
    "profile.updateFailed": "Failed to update profile",
    "profile.updated": "Profile updated successfully!",
    "profile.saveChanges": "Save Changes",
    "profile.myProfile": "My Profile",
    "profile.wallet": "Wallet",
    "profile.newChannel": "New Channel",
    "profile.setEmojiStatus": "Set Emoji Status",
    "profile.calls": "Calls",
    "archive.conversation": "conversation",
    "archive.conversations": "conversations",
    "archive.previewFallback": "archived",
  },
  vi: {
    "app.back": "Quay lại",
    "app.cancel": "Hủy",
    "app.close": "Đóng",
    "app.copy": "Sao chép",
    "app.create": "Tạo",
    "app.delete": "Xóa",
    "app.edit": "Sửa",
    "app.loading": "Đang tải...",
    "app.save": "Lưu",
    "app.saving": "Đang lưu...",
    "app.send": "Gửi",
    "app.online": "Đang hoạt động",
    "app.offline": "Ngoại tuyến",
    "app.unknown": "Không xác định",
    "app.unknownDevice": "Thiết bị không xác định",
    "app.unknownLocation": "Vị trí không xác định",
    "app.user": "Người dùng",
    "app.you": "Bạn",
    "app.featureUnderDevelopment": "Tính năng đang phát triển",
    "auth.hidePassword": "Ẩn mật khẩu",
    "auth.showPassword": "Hiện mật khẩu",
    "auth.passwordStrength": "Độ mạnh mật khẩu",
    "auth.passwordWeak": "Yếu",
    "auth.passwordMedium": "Trung bình",
    "auth.passwordStrong": "Mạnh",
    "auth.passwordRuleLength": "Ít nhất 8 ký tự",
    "auth.passwordRuleUppercase": "Có chữ in hoa",
    "auth.passwordRuleNumberSpecial": "Có số hoặc ký tự đặc biệt",
    "auth.requiredAll": "Vui lòng nhập đầy đủ thông tin.",
    "auth.phone": "Số điện thoại",
    "auth.email": "Email",
    "auth.otp": "Mã OTP",
    "auth.password": "Mật khẩu",
    "auth.displayName": "Tên hiển thị",
    "auth.confirmPassword": "Xác nhận mật khẩu",
    "auth.newPassword": "Mật khẩu mới",
    "auth.phonePlaceholder": "0912345678",
    "auth.emailPlaceholder": "your@email.com",
    "auth.displayNamePlaceholder": "Tên của bạn",
    "auth.passwordPlaceholder": "Nhập mật khẩu",
    "auth.confirmPasswordPlaceholder": "Nhập lại mật khẩu",
    "auth.newPasswordPlaceholder": "Nhập mật khẩu mới",
    "auth.confirmNewPasswordPlaceholder": "Nhập lại mật khẩu mới",
    "auth.otpPlaceholder": "Nhập mã OTP",
    "loginPage.subtitle": "Đăng nhập vào tài khoản của bạn",
    "loginPage.forgotPassword": "Quên mật khẩu?",
    "loginPage.noAccount": "Chưa có tài khoản?",
    "loginPage.registerNow": "Đăng ký ngay",
    "login.success": "Đăng nhập thành công",
    "login.emailVerifyRequired": "Vui lòng xác thực email để tiếp tục.",
    "login.emailUnverified": "Email chưa được xác thực. Vui lòng nhập OTP để tiếp tục.",
    "login.failed": "Đăng nhập thất bại",
    "login.loading": "Đang đăng nhập...",
    "login.submit": "Đăng nhập",
    "register.success": "Đăng ký thành công. Vui lòng kiểm tra email để nhập OTP.",
    "register.failed": "Đăng ký thất bại",
    "register.passwordMismatch": "Mật khẩu xác nhận không khớp.",
    "register.passwordMinLength": "Mật khẩu phải có ít nhất 6 ký tự.",
    "register.phoneInvalid": "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.",
    "register.emailInvalid": "Vui lòng nhập email hợp lệ.",
    "register.mustAgreeTerms": "Bạn cần đồng ý với chính sách và điều khoản.",
    "register.loading": "Đang đăng ký...",
    "register.submit": "Đăng ký",
    "registerPage.title": "Tạo tài khoản mới",
    "registerPage.subtitle": "Tham gia ChatChit và bắt đầu kết nối với bạn bè.",
    "registerPage.haveAccount": "Đã có tài khoản?",
    "registerPage.backToLogin": "Quay lại đăng nhập",
    "register.agreePrefix": "Tôi đồng ý với các",
    "register.termsLink": "chính sách và điều khoản",
    "forgotPasswordPage.title": "Quên mật khẩu?",
    "forgotPasswordPage.subtitle": "Nhập email để nhận hướng dẫn đặt lại mật khẩu.",
    "forgotPasswordPage.rememberPassword": "Nhớ mật khẩu?",
    "forgotPasswordPage.backToLogin": "Quay lại đăng nhập",
    "forgotPassword.requestFailed": "Yêu cầu thất bại",
    "forgotPassword.emailRequired": "Vui lòng nhập email.",
    "forgotPassword.emailInvalid": "Email không hợp lệ.",
    "forgotPassword.otpExpired": "OTP đã hết hạn. Vui lòng gửi lại mã mới.",
    "forgotPassword.otpRequired": "Vui lòng nhập mã OTP.",
    "forgotPassword.otpInvalid": "OTP phải gồm đúng 6 chữ số.",
    "forgotPassword.newPasswordRequired": "Vui lòng nhập mật khẩu mới.",
    "forgotPassword.newPasswordMinLength": "Mật khẩu mới phải có ít nhất 6 ký tự.",
    "forgotPassword.confirmMismatch": "Mật khẩu xác nhận không khớp.",
    "forgotPassword.otpSent": "Mã OTP đã được gửi. Vui lòng kiểm tra email/SMS để tiếp tục.",
    "forgotPassword.missingTempTokenVerify": "Không nhận được tempToken từ bước xác thực OTP.",
    "forgotPassword.otpVerified": "OTP hợp lệ. Hãy nhập mật khẩu mới.",
    "forgotPassword.otpResent": "Đã gửi lại OTP. Vui lòng kiểm tra lại email/SMS.",
    "forgotPassword.missingTempTokenReset": "Thiếu tempToken. Vui lòng xác thực OTP lại.",
    "forgotPassword.resetSuccess": "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập lại.",
    "forgotPassword.processing": "Đang xử lý...",
    "forgotPassword.sendOtp": "Gửi OTP",
    "forgotPassword.verifyOtp": "Xác thực OTP",
    "forgotPassword.resetPassword": "Đặt lại mật khẩu",
    "forgotPassword.resendingOtp": "Đang gửi lại...",
    "forgotPassword.resendOtp": "Gửi lại OTP",
    "forgotPassword.loginNow": "Đăng nhập ngay",
    "forgotPassword.expiresIn": "Mã hết hạn sau {time}.",
    "forgotPassword.emailLabel": "Email của bạn:",
    "verifyEmailPage.title": "Xác thực email",
    "verifyEmailPage.subtitle": "Nhập mã OTP đã gửi về email để hoàn tất đăng ký tài khoản.",
    "verifyEmailPage.donePrompt": "Đã xác thực xong?",
    "verifyEmailPage.loginNow": "Đăng nhập ngay",
    "emailVerification.resolveEmailNotFound": "Không tìm thấy email của tài khoản này. Vui lòng nhập email để nhận OTP.",
    "emailVerification.resolveEmailFailed": "Không thể lấy email tài khoản. Vui lòng nhập email để nhận OTP.",
    "emailVerification.registerOtpSent": "Mã OTP đã được gửi từ bước đăng ký. Vui lòng kiểm tra email và nhập mã để xác thực.",
    "emailVerification.accountOtpSent": "Tài khoản chưa được xác thực. Mã OTP đã được gửi đến email của bạn.",
    "emailVerification.sendOtpFailed": "Không thể gửi OTP. Vui lòng nhấn gửi lại.",
    "emailVerification.otpResent": "Mã OTP mới đã được gửi đến email của bạn. Vui lòng dùng mã mới nhất.",
    "emailVerification.resendFailed": "Gửi lại OTP thất bại.",
    "emailVerification.required": "Vui lòng nhập đầy đủ email và OTP.",
    "emailVerification.success": "Xác thực email thành công",
    "emailVerification.failed": "Xác thực OTP thất bại",
    "emailVerification.resolvingEmail": "Đang lấy email tài khoản...",
    "emailVerification.preparingOtp": "Đang chuẩn bị OTP...",
    "emailVerification.verifying": "Đang xác thực...",
    "emailVerification.verifyEmail": "Xác thực email",
    "emailVerification.resendOtp": "Gửi lại mã OTP",
    "emailVerification.backToRegister": "Quay lại đăng ký",
    "nav.savedMessages": "Tin nhắn đã lưu",
    "nav.archivedChats": "Đoạn chat lưu trữ",
    "nav.contacts": "Danh bạ",
    "nav.settings": "Cài đặt",
    "nav.newGroup": "Nhóm mới",
    "nav.logout": "Đăng xuất",
    "nav.openMenu": "Mở menu điều hướng",
    "search.placeholder": "Tìm kiếm",
    "search.clear": "Xóa tìm kiếm",
    "settings.title": "Cài đặt",
    "settings.phone": "Điện thoại",
    "settings.username": "Tên người dùng",
    "settings.birthday": "Ngày sinh",
    "settings.notifications": "Thông báo và âm thanh",
    "settings.dataStorage": "Dữ liệu và lưu trữ",
    "settings.privacySecurity": "Quyền riêng tư và bảo mật",
    "settings.general": "Cài đặt chung",
    "settings.chatFolders": "Thư mục chat",
    "settings.stickersEmoji": "Nhãn dán và biểu tượng",
    "settings.devices": "Thiết bị",
    "settings.language": "Ngôn ngữ",
    "settings.chooseLanguage": "Chọn ngôn ngữ",
    "settings.languageSaved": "Đã lưu tùy chọn ngôn ngữ",
    "settings.english": "English",
    "settings.vietnamese": "Tiếng Việt",
    "settings.premium": "ChatChit Premium",
    "privacy.title": "Quyền riêng tư và bảo mật",
    "privacy.changePassword": "Đổi mật khẩu",
    "privacy.blockList": "Danh sách chặn",
    "privacy.blockListDescription":
      "Quản lý những người bạn đã chặn. Người bị chặn không thể nhắn tin hoặc gọi cho bạn.",
    "changePassword.title": "Đổi mật khẩu",
    "changePassword.currentPassword": "Mật khẩu hiện tại",
    "changePassword.newPassword": "Mật khẩu mới",
    "changePassword.confirmPassword": "Xác nhận mật khẩu mới",
    "changePassword.currentRequired": "Vui lòng nhập mật khẩu hiện tại.",
    "changePassword.newRequired": "Vui lòng nhập mật khẩu mới.",
    "changePassword.confirmRequired": "Vui lòng xác nhận mật khẩu mới.",
    "changePassword.confirmMismatch": "Mật khẩu mới và xác nhận mật khẩu không khớp.",
    "changePassword.newWeak": "Mật khẩu mới cần đạt đầy đủ yêu cầu.",
    "changePassword.ruleLength": "Ít nhất 8 ký tự",
    "changePassword.ruleUppercase": "Có chữ in hoa",
    "changePassword.ruleNumberSpecial": "Có số hoặc ký tự đặc biệt",
    "changePassword.strength": "Độ mạnh mật khẩu",
    "changePassword.weak": "Yếu",
    "changePassword.medium": "Trung bình",
    "changePassword.strong": "Mạnh",
    "changePassword.submit": "Cập nhật mật khẩu",
    "changePassword.saving": "Đang cập nhật...",
    "changePassword.success": "Đổi mật khẩu thành công.",
    "changePassword.error": "Không thể đổi mật khẩu.",
    "changePassword.description":
      "Hãy dùng mật khẩu mạnh và không dùng lại ở nơi khác. Các phiên đăng nhập khác vẫn được giữ trừ khi bạn đăng xuất từ mục Thiết bị.",
    "devices.title": "Phiên đăng nhập",
    "devices.thisDevice": "Thiết bị này",
    "devices.current": "Hiện tại",
    "devices.refresh": "Làm mới",
    "devices.loadingSessions": "Đang tải phiên đăng nhập...",
    "devices.loadingActiveSessions": "Đang tải các phiên đang hoạt động...",
    "devices.currentNotFound": "Không tìm thấy thiết bị hiện tại.",
    "devices.terminateOthers": "Đăng xuất tất cả thiết bị khác",
    "devices.terminateOthersDescription":
      "Đăng xuất tất cả thiết bị ngoại trừ thiết bị này.",
    "devices.activeSessions": "Phiên đang hoạt động",
    "devices.noOtherSessions": "Không có phiên hoạt động khác.",
    "devices.reviewDescription":
      "Bạn có thể xem tất cả thiết bị đã đăng nhập và đăng xuất từ xa các phiên không còn sử dụng.",
    "devices.logoutDevice": "Đăng xuất thiết bị này",
    "devices.confirmLogoutDevice": "Đăng xuất thiết bị này?",
    "devices.confirmLogoutOthers": "Đăng xuất tất cả thiết bị khác?",
    "devices.loadError": "Không thể tải các phiên đang hoạt động.",
    "devices.logoutDeviceError": "Không thể đăng xuất thiết bị này.",
    "devices.logoutOthersError": "Không thể đăng xuất các thiết bị khác.",
    "blockList.title": "Danh sách chặn",
    "blockList.loading": "Đang tải người dùng bị chặn...",
    "blockList.loadError": "Không thể tải người dùng bị chặn",
    "blockList.emptyTitle": "Chưa có người dùng bị chặn",
    "blockList.emptyDescription": "Những người bạn chặn sẽ xuất hiện ở đây.",
    "blockList.unblock": "Bỏ chặn",
    "blockList.unblockError": "Không thể bỏ chặn người dùng",
    "contacts.searchPlaceholder": "Tìm kiếm danh bạ...",
    "contacts.notFound": "Không tìm thấy liên hệ",
    "contacts.noneYet": "Chưa có liên hệ",
    "contacts.searchToAdd": "Tìm kiếm để thêm bạn bè",
    "contacts.phone": "Điện thoại",
    "contacts.notAvailable": "Chưa có",
    "contacts.sendRequest": "Gửi lời mời",
    "contacts.cancelRequest": "Hủy lời mời",
    "contacts.accept": "Chấp nhận",
    "contacts.reject": "Từ chối",
    "attach.photoVideo": "Ảnh hoặc video",
    "attach.document": "Tài liệu",
    "attach.poll": "Bình chọn",
    "sidebar.groupInfo": "Thông tin nhóm",
    "sidebar.userInfo": "Thông tin người dùng",
    "sidebar.inviteLink": "Liên kết mời",
    "sidebar.inviteManage": "Nhấn để quản lý liên kết mời nhóm",
    "sidebar.inviteRestricted":
      "Chỉ quản trị viên hoặc thành viên được phép mới có thể mời",
    "sidebar.notifications": "Thông báo",
    "sidebar.changeWallpaper": "Đổi hình nền",
    "sidebar.updatingWallpaper": "Đang cập nhật hình nền...",
    "sidebar.wallpaperFormats": "JPG, PNG hoặc WebP, tối đa 5MB",
    "sidebar.backgroundColor": "Màu nền",
    "sidebar.removeWallpaper": "Xóa hình nền",
    "invite.groupLink": "Liên kết mời nhóm",
    "invite.regenerate": "Tạo lại liên kết",
    "invite.revoke": "Thu hồi liên kết",
    "invite.noPermission": "Bạn không có quyền xem liên kết mời này.",
    "invite.loadError":
      "Không thể tải liên kết mời. Vui lòng kiểm tra quyền nhóm.",
    "invite.noActiveLink": "Chưa có liên kết mời đang hoạt động.",
    "invite.generate": "Tạo liên kết",
    "invite.url": "URL mời",
    "invite.copy": "Sao chép liên kết",
    "invite.share": "Chia sẻ liên kết",
    "invite.showQr": "Hiện mã QR",
    "invite.hideQr": "Ẩn mã QR",
    "invite.downloadQr": "Tải mã QR",
    "invite.shareTitle": "Tham gia {groupName} trên Chat",
    "invite.shareText": "Bạn được mời tham gia {groupName}",
    "profileCard.shareContact": "Chia sẻ danh thiếp",
    "profileCard.sendToCurrentChat": "Gửi danh thiếp vào cuộc trò chuyện này",
    "profileCard.sent": "Đã gửi",
    "profileCard.sentToast": "Đã gửi danh thiếp",
    "profileCard.sharedToast": "Đã chia sẻ danh thiếp",
    "profileCard.sendFailed": "Không thể gửi danh thiếp",
    "profileCard.shareFailedPrivacy":
      "Không thể chia sẻ danh thiếp do cài đặt quyền riêng tư",
    "profileCard.shareFailed": "Không thể chia sẻ danh thiếp này",
    "profileCard.friends": "Bạn bè",
    "profileCard.search": "Tìm kiếm",
    "profileCard.searchFriends": "Tìm trong bạn bè",
    "profileCard.searchUsers": "Tìm người dùng",
    "profileCard.enterMinChars": "Nhập ít nhất 2 ký tự để tìm kiếm",
    "profileCard.noMatchingContacts": "Không có liên hệ phù hợp",
    "profileCard.userCard": "Danh thiếp người dùng",
    "profileCard.shareTo": "Chia sẻ đến...",
    "profileCard.searchConversations": "Tìm cuộc trò chuyện",
    "profileCard.noMatchingConversations": "Không có cuộc trò chuyện phù hợp",
    "profileCard.group": "Nhóm",
    "profileCard.message": "Tin nhắn",
    "profileCard.contactCard": "Danh thiếp liên hệ",
    "profileCard.userNotFound": "Không tìm thấy người dùng trong danh thiếp",
    "profileCard.openChatFailed": "Không thể mở cuộc trò chuyện lúc này",
    "profileCard.loadProfileFailed": "Không thể tải hồ sơ",
    "profileCard.messageUser": "Nhắn tin",
    "profileCard.viewProfile": "Xem hồ sơ",
    "profileCard.joinedSince": "Đã tham gia từ {year}",
    "media.shared": "Media đã chia sẻ",
    "poll.title": "Bình chọn",
    "poll.question": "Câu hỏi",
    "poll.questionRequired": "Vui lòng nhập câu hỏi.",
    "poll.minOptions": "Bình chọn cần ít nhất 2 lựa chọn.",
    "poll.option": "Lựa chọn",
    "poll.removeOption": "Xóa lựa chọn",
    "poll.addOption": "Thêm lựa chọn",
    "poll.maxOptions": "Tối đa 10 lựa chọn",
    "poll.allowChangeVote": "Cho phép đổi bình chọn",
    "poll.showResultsEarly": "Hiển thị kết quả sớm",
    "poll.membersCanAddOptions": "Thành viên có thể thêm lựa chọn",
    "poll.multipleVotes": "Cho phép chọn nhiều",
    "poll.hideVoters": "Ẩn người bình chọn",
    "chat.forward": "Chuyển tiếp",
    "chat.openLink": "Mở liên kết",
    "chat.copyLink": "Sao chép liên kết",
    "chat.download": "Tải xuống",
    "chat.showInChat": "Hiển thị trong chat",
    "chat.pinTop": "Ghim lên đầu",
    "chat.unpinTop": "Bỏ ghim khỏi đầu",
    "chat.archive": "Lưu trữ",
    "chat.unarchive": "Bỏ lưu trữ",
    "chat.chats": "Chat",
    "chat.messages": "Tin nhắn",
    "chat.groups": "Nhóm",
    "chat.media": "Media",
    "chat.links": "Liên kết",
    "chat.files": "Tệp",
    "chat.voice": "Giọng nói",
    "chat.noMatchingConversations": "Không tìm thấy cuộc trò chuyện phù hợp",
    "chat.noResults": "Không tìm thấy kết quả",
    "chat.noChats": "Không tìm thấy chat",
    "chat.noGroups": "Không tìm thấy nhóm",
    "chat.noMessages": "Không tìm thấy tin nhắn",
    "chat.noMedia": "Không tìm thấy media",
    "chat.noLinks": "Không tìm thấy liên kết",
    "chat.noFiles": "Không tìm thấy tệp",
    "chat.noImages": "Không có ảnh",
    "chat.noVoice": "Không tìm thấy tin nhắn thoại",
    "chat.enterKeyword": "Nhập từ khóa để tìm kiếm",
    "chat.tryDifferentKeyword":
      "Thử từ khóa khác hoặc bắt đầu tin nhắn mới từ nút +.",
    "chat.typeMessage": "Nhập tin nhắn",
    "chat.reply": "Trả lời",
    "chat.replyTo": "Trả lời",
    "chat.forwardMessage": "Chuyển tiếp tin nhắn",
    "chat.forwardTo": "Chuyển tiếp đến...",
    "chat.forwardHereToSave": "chuyển tiếp vào đây để lưu",
    "chat.selected": "đã chọn",
    "chat.photo": "Ảnh",
    "chat.photos": "Ảnh",
    "chat.addCaption": "Thêm chú thích...",
    "chat.editing": "Đang sửa",
    "chat.someone": "Ai đó",
    "chat.messagePlaceholder": "Tin nhắn",
    "chat.openEmoji": "Mở bảng emoji",
    "chat.openAttachments": "Mở tùy chọn đính kèm",
    "chat.aiSmartReply": "Gợi ý trả lời AI",
    "chat.speechToText": "Chuyển giọng nói thành văn bản",
    "chat.stopSpeechToText": "Dừng chuyển giọng nói",
    "chat.textWillBeTyped": "Văn bản sẽ được nhập tự động",
    "chat.recordAudio": "Ghi âm",
    "chat.sendAudioFile": "Gửi dưới dạng tệp âm thanh",
    "chat.searchConversation": "Tìm trong cuộc trò chuyện",
    "chat.openConversationActions": "Mở thao tác cuộc trò chuyện",
    "chat.aiSummarize": "Tóm tắt cuộc trò chuyện (AI)",
    "chat.aiSmartSearch": "Tìm kiếm thông minh (AI)",
    "chat.aiExtractTasks": "Trích xuất công việc (AI)",
    "chat.extracting": "Đang trích xuất...",
    "chat.mute": "Tắt thông báo",
    "chat.unmute": "Bật thông báo",
    "chat.call": "Gọi",
    "chat.videoCall": "Gọi video",
    "chat.shareContact": "Chia sẻ liên hệ",
    "chat.deleteChat": "Xóa chat",
    "chat.closeSearch": "Đóng tìm kiếm",
    "chat.searchByDate": "Tìm theo ngày",
    "chat.searchSmartPlaceholder": "Tìm kiếm... (gõ '/ai ' để tìm thông minh)",
    "chat.savedMessagesLower": "Tin nhắn đã lưu",
    "chat.openingConversation": "Đang mở cuộc trò chuyện...",
    "chat.members": "Thành viên",
    "chat.justNow": "Vừa xong",
    "chat.lastSeenMinutes": "hoạt động {count} phút trước",
    "chat.lastSeenHours": "hoạt động {count} giờ trước",
    "chat.lastSeenDate": "hoạt động {date}",
    "chat.deleteContact": "Xóa liên hệ",
    "chat.blockUser": "Chặn người dùng",
    "chat.unblockUser": "Bỏ chặn người dùng",
    "chat.voiceMessage": "Tin nhắn thoại",
    "chat.completed": "Hoàn tất",
    "chat.missed": "Đã nhỡ",
    "chat.declined": "Đã từ chối",
    "chat.cancelled": "Đã hủy",
    "chat.duration": "Thời lượng",
    "group.addPeople": "Thêm người...",
    "group.addMembers": "Thêm thành viên",
    "group.edit": "Chỉnh sửa",
    "group.name": "Tên nhóm",
    "group.settings": "Cài đặt nhóm",
    "group.settingsDescription": "Thông tin, liên kết mời, quyền",
    "group.addCommentsChat": "Thêm chat nhóm cho bình luận",
    "group.administrators": "Quản trị viên",
    "group.owner": "Trưởng nhóm",
    "group.admin": "Quản trị viên",
    "group.notes": "Ghi chú",
    "group.reminders": "Nhắc hẹn",
    "group.delete": "Xóa nhóm",
    "group.deleteAndLeave": "Xóa nhóm và rời nhóm",
    "group.leave": "Rời nhóm",
    "group.thisGroup": "nhóm này",
    "group.deleting": "Đang xóa...",
    "group.leaving": "Đang rời nhóm...",
    "group.deleteConfirm": 'Bạn có chắc muốn xóa "{groupName}"?',
    "group.deleteWarning":
      "Thao tác này sẽ xóa vĩnh viễn nhóm và toàn bộ tin nhắn với mọi thành viên. Không thể hoàn tác.",
    "group.deleteForAll": "Xóa với tất cả thành viên",
    "group.deleteForAllDescription":
      "Xóa nhóm này với mọi người và xóa toàn bộ tin nhắn",
    "group.leaveConfirm": "Bạn có chắc muốn rời nhóm này?",
    "group.leaveWarning":
      "Bạn sẽ mất quyền truy cập tin nhắn và media. Không thể hoàn tác.",
    "chat.editMessage": "Sửa tin nhắn",
    "chat.copy": "Sao chép",
    "chat.pin": "Ghim",
    "chat.unpin": "Bỏ ghim",
    "chat.deleteForEveryone": "Xóa với mọi người",
    "chat.deleteForMe": "Chỉ xóa với tôi",
    "chat.select": "Chọn",
    "chat.recall": "Thu hồi",
    "chat.tryAgain": "Thử lại",
    "chat.loadMoreHint": "Kéo lên để tải thêm tin nhắn",
    "chat.noMessagesYet": "Chưa có tin nhắn...",
    "chat.sendGreeting": "Gửi tin nhắn hoặc bấm lời chào bên dưới.",
    "chat.loadingOlder": "Đang tải tin nhắn cũ...",
    "call.voice": "Cuộc gọi thoại",
    "call.video": "Cuộc gọi video",
    "call.groupVoice": "Cuộc gọi thoại nhóm",
    "call.groupVideo": "Cuộc gọi video nhóm",
    "call.waitingAnswer": "Đang chờ trả lời...",
    "call.waitingMembers": "Đang chờ thành viên trả lời...",
    "call.ringing": "đang đổ chuông",
    "call.unavailable": "không khả dụng",
    "call.busy": "bận",
    "call.recipient": "Người nhận",
    "call.caller": "Người gọi",
    "call.isCallingYou": "đang gọi cho bạn",
    "call.isCallingFrom": "đang gọi từ",
    "call.cancel": "Hủy",
    "call.decline": "Từ chối",
    "call.accept": "Chấp nhận",
    "call.cameraOff": "Camera tắt",
    "call.cameraOn": "Bật camera",
    "call.connected": "Đã kết nối",
    "call.participants": "người tham gia",
    "call.restoreWindow": "Khôi phục cửa sổ cuộc gọi",
    "call.maximizeWindow": "Phóng to cửa sổ cuộc gọi",
    "call.restore": "Khôi phục",
    "call.maximize": "Phóng to",
    "call.resizeWindow": "Đổi kích thước cửa sổ cuộc gọi",
    "call.dragResize": "Kéo để đổi kích thước",
    "call.connecting": "Đang kết nối...",
    "call.mute": "Tắt micro",
    "call.unmute": "Bật micro",
    "call.leave": "Rời cuộc gọi",
    "call.end": "Kết thúc cuộc gọi",
    "profile.title": "Hồ sơ của tôi",
    "profile.edit": "Sửa hồ sơ",
    "profile.displayName": "Tên hiển thị",
    "profile.email": "Email",
    "profile.phoneNumber": "Số điện thoại",
    "profile.bio": "Tiểu sử",
    "profile.bioPlaceholder": "Giới thiệu về bạn...",
    "profile.unsavedConfirm":
      "Bạn có thay đổi chưa lưu. Bạn có chắc muốn đóng không?",
    "profile.avatarUpdated": "Cập nhật ảnh đại diện thành công!",
    "profile.updateFailed": "Không thể cập nhật hồ sơ",
    "profile.updated": "Cập nhật hồ sơ thành công!",
    "profile.saveChanges": "Lưu thay đổi",
    "profile.myProfile": "Hồ sơ của tôi",
    "profile.wallet": "Ví",
    "profile.newChannel": "Kênh mới",
    "profile.setEmojiStatus": "Đặt trạng thái emoji",
    "profile.calls": "Cuộc gọi",
    "archive.conversation": "cuộc trò chuyện",
    "archive.conversations": "cuộc trò chuyện",
    "archive.previewFallback": "đã lưu trữ",
  },
};

const languageLabels: Record<LanguageCode, string> = {
  en: "English",
  vi: "Tiếng Việt",
};

const getInitialLanguage = (): LanguageCode => {
  if (typeof window === "undefined") return "en";

  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (storedLanguage === "en" || storedLanguage === "vi") {
    return storedLanguage;
  }

  return navigator.language.toLowerCase().startsWith("vi") ? "vi" : "en";
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] =
    useState<LanguageCode>(getInitialLanguage);

  const setLanguage = useCallback((nextLanguage: LanguageCode) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      languageLabel: languageLabels[language],
      setLanguage,
      t: (key) => translations[language][key] || translations.en[key] || key,
    }),
    [language, setLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }

  return context;
};
