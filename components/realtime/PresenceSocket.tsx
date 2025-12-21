"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { io, type Socket } from "socket.io-client";

export default function PresenceSocket() {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const socket = io({
      path: "/socket.io",
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;
    socket.on("connect", () => {
      if (!session?.user?.id) return;
      socket.emit("identify-user", {
        userId: session.user.id,
        userName: session.user.name || "User",
        role: (session.user as any)?.role || null,
      });
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socketRef.current?.connected) return;
    if (!session?.user?.id) return;
    socketRef.current.emit("identify-user", {
      userId: session.user.id,
      userName: session.user.name || "User",
      role: (session.user as any)?.role || null,
    });
  }, [session?.user?.id, session?.user?.name]);

  return null;
}
