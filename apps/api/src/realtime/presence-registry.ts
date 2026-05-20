type RoomUserKey = string;

const roomUserKey = (roomId: string, userId: string): RoomUserKey => {
  return `${roomId}:${userId}`;
};

export class RealtimePresenceRegistry {
  private readonly connectionRooms = new Map<string, Set<string>>();
  private readonly roomUsers = new Map<string, Set<string>>();
  private readonly roomUserConnections = new Map<RoomUserKey, Set<string>>();

  joinRoom(
    connectionId: string,
    roomId: string,
    userId: string
  ): { joined: boolean; activeUserIds: string[] } {
    const roomSet = this.connectionRooms.get(connectionId) ?? new Set<string>();
    roomSet.add(roomId);
    this.connectionRooms.set(connectionId, roomSet);

    const userKey = roomUserKey(roomId, userId);
    const userConnections = this.roomUserConnections.get(userKey) ?? new Set<string>();
    userConnections.add(connectionId);
    const joined = userConnections.size === 1;
    this.roomUserConnections.set(userKey, userConnections);

    const roomActiveUsers = this.roomUsers.get(roomId) ?? new Set<string>();
    roomActiveUsers.add(userId);
    this.roomUsers.set(roomId, roomActiveUsers);

    return {
      joined,
      activeUserIds: [...roomActiveUsers.values()]
    };
  }

  leaveRoom(
    connectionId: string,
    roomId: string,
    userId: string
  ): { left: boolean; activeUserIds: string[] } {
    const roomSet = this.connectionRooms.get(connectionId);
    if (roomSet) {
      roomSet.delete(roomId);
      if (roomSet.size === 0) {
        this.connectionRooms.delete(connectionId);
      }
    }

    const userKey = roomUserKey(roomId, userId);
    const userConnections = this.roomUserConnections.get(userKey);
    if (userConnections) {
      userConnections.delete(connectionId);
      if (userConnections.size === 0) {
        this.roomUserConnections.delete(userKey);
      }
    }

    const left = !this.roomUserConnections.has(userKey);
    const roomActiveUsers = this.roomUsers.get(roomId) ?? new Set<string>();
    if (left) {
      roomActiveUsers.delete(userId);
      if (roomActiveUsers.size === 0) {
        this.roomUsers.delete(roomId);
      } else {
        this.roomUsers.set(roomId, roomActiveUsers);
      }
    }

    return {
      left,
      activeUserIds: [...roomActiveUsers.values()]
    };
  }

  removeConnection(connectionId: string, userId: string): string[] {
    const rooms = [...(this.connectionRooms.get(connectionId) ?? new Set<string>()).values()];
    for (const roomId of rooms) {
      this.leaveRoom(connectionId, roomId, userId);
    }
    return rooms;
  }
}
