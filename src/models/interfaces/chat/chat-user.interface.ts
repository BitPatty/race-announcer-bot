interface ChatUser {
  identifier: string;
  displayName: string;
  isBotOwner: boolean;
  canUseBotCommands: boolean;
}

export default ChatUser;
