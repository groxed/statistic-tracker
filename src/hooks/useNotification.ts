import { useState } from "react";

export type NotificationType = "success" | "error";

export type ToastNotificationType = {
  message: string;
  type: NotificationType | null;
};

export const useNotification = () => {
  const [notification, setNotification] = useState<ToastNotificationType>({
    message: "",
    type: null,
  });

  const showNotification = (message: string, type: NotificationType) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification({ message: "", type: null });
    }, 4500);
  };

  return { showNotification, notification };
};
