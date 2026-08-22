import Socket from "@/config/socket";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Notification } from "@/database/models/Notification";

dayjs.extend(utc);
dayjs.extend(timezone);

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
