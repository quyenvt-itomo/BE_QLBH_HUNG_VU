import Socket from "@/config/socket";
import { Notification } from "@/database/models/Notification";

export interface SocketData {
  userId: string;
  notification: Notification;
}

export class SocketUtils {
  static getUserSocket(userId: string) {
    return Socket.getSocketsByKey(`user-${userId}`);
  }

  static sendSocketNotifications(
    userIds: string[],
    socketName: string,
    data: Notification,
  ) {
    userIds.forEach((userId) => {
      const userSockets = Socket.getSocketsByKey(`user-${userId}`);
      if (userSockets?.length) {
        userSockets.forEach((socketId) => {
          Socket.getIO()
            .to(socketId)
            .emit(socketName, {
              ...data,
              isRead: false,
            });
        });
      }
    });
  }

  static sendSocketUpdateData<T>(userIds: string[], entity: string, data: T) {
    if (!userIds || userIds.length === 0) {
      console.warn(
        `[SocketUtils] No userIds provided for sending socket update "${entity}-update" with data:`,
        data,
      );
      return;
    }
    userIds.forEach((userId) => {
      const userSockets = Socket.getSocketsByKey(`user-${userId}`);
      if (userSockets?.length) {
        userSockets.forEach((socketId) => {
          Socket.getIO().to(socketId).emit(`${entity}-update`, data);
        });
      }
    });
  }

  static sendSocketDeleteData(userIds: string[], entity: string, id: string) {
    if (!userIds || userIds.length === 0) {
      console.warn(
        `[SocketUtils] No userIds provided for sending socket delete "${entity}-delete" with id: ${id}`,
      );
      return;
    }

    userIds.forEach((userId) => {
      const userSockets = Socket.getSocketsByKey(`user-${userId}`);

      if (userSockets?.length) {
        userSockets.forEach((socketId) => {
          Socket.getIO().to(socketId).emit(`${entity}-delete`, { id });
        });
      }
    });
  }

  static sendSocketRole(userIds: string[]) {
    userIds.forEach((userId) => {
      const userSockets = Socket.getSocketsByKey(`user-${userId}`);
      if (userSockets?.length) {
        userSockets.forEach((socketId) => {
          Socket.getIO().to(socketId).emit("role-update", {
            message: "Role updated",
          });
        });
      }
    });
  }

  static sendSocketChatbotResponse(userId: string, data: any) {
    const userSockets = Socket.getSocketsByKey(`user-${userId}`);
    if (userSockets?.length) {
      userSockets.forEach((socketId) => {
        Socket.getIO().to(socketId).emit("chatbot-response", data);
      });
    }
  }

  static sendSocketLoginRequest(deviceId: string, remember: boolean) {
    const deviceSockets = Socket.getSocketsByKey(`device-${deviceId}`);
    if (deviceSockets?.length) {
      deviceSockets.forEach((socketId) => {
        Socket.getIO().to(socketId).emit("login-request", {
          remember,
        });
      });
    }
  }

  static isUserOnline(userId: string): boolean {
    const userSockets = Socket.getSocketsByKey(`user-${userId}`);
    return !!(userSockets && userSockets.length > 0);
  }

  static sendSocketImportProgress(userId: string, data: any) {
    const userSockets = Socket.getSocketsByKey(`user-${userId}`);
    if (userSockets?.length) {
      console.log(
        `📤 [Socket] Sending import-progress to user ${userId} (${userSockets.length} sockets) - Progress: ${data.progress}% (${data.processedRows}/${data.totalRows})`,
      );
      userSockets.forEach((socketId) => {
        Socket.getIO().to(socketId).emit("import-progress", data);
      });
    } else {
      console.log(
        `⚠️ [Socket] No sockets found for user ${userId} - Cannot send import-progress`,
      );
    }
  }
}
