import { io } from "socket.io-client";
import { resolveSocketBaseUrl } from "@core/api/resolveApiBaseUrl";

const SOCKET_URL = resolveSocketBaseUrl();

class SocketService {
    socket = null;

    connect() {
        if (this.socket) return this.socket;

        this.socket = io(SOCKET_URL, {
            transports: ["websocket", "polling"],
            upgrade: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
            reconnectionAttempts: Infinity,
            timeout: 20000,
            withCredentials: true,
        });

        this.socket.on("connect", () => {
            console.log("[Socket] Connected to server");
        });

        this.socket.on("disconnect", (reason) => {
            console.log("[Socket] Disconnected from server:", reason);
        });

        this.socket.on("connect_error", (error) => {
            console.error("[Socket] Connection error:", error?.message || error);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    emit(event, data) {
        if (this.socket) {
            this.socket.emit(event, data);
        }
    }

    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }
}

export const socketService = new SocketService();
