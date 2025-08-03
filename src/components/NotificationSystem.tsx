"use client";

// 通知システムコンポーネント
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Card, CardBody, Button } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";

export function NotificationSystem() {
  const { notifications, removeNotification } = useUIStore();

  // 自動削除タイマー
  useEffect(() => {
    notifications.forEach((notification) => {
      if (notification.duration && notification.duration > 0) {
        const timer = setTimeout(() => {
          removeNotification(notification.id);
        }, notification.duration);

        return () => clearTimeout(timer);
      }
    });
  }, [notifications, removeNotification]);

  // notifications配列が空の場合は何も描画しない
  if (notifications.length === 0) return null;

  const getIcon = (type: "success" | "error" | "warning" | "info") => {
    switch (type) {
      case "success":
        return CheckCircleIcon;
      case "error":
        return XMarkIcon;
      case "warning":
        return ExclamationTriangleIcon;
      case "info":
        return InformationCircleIcon;
      default:
        return InformationCircleIcon;
    }
  };

  const getColorClasses = (type: "success" | "error" | "warning" | "info") => {
    switch (type) {
      case "success":
        return {
          card: "border-success bg-success/10",
          icon: "text-success",
          title: "text-success-600",
        };
      case "error":
        return {
          card: "border-danger bg-danger/10",
          icon: "text-danger",
          title: "text-danger-600",
        };
      case "warning":
        return {
          card: "border-warning bg-warning/10",
          icon: "text-warning",
          title: "text-warning-600",
        };
      case "info":
        return {
          card: "border-primary bg-primary/10",
          icon: "text-primary",
          title: "text-primary-600",
        };
      default:
        return {
          card: "border-default bg-default/10",
          icon: "text-default-500",
          title: "text-default-600",
        };
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3 max-w-sm w-full">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => {
          const IconComponent = getIcon(notification.type);
          const colors = getColorClasses(notification.type);

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              layout
            >
              <Card className={cn("border-2", colors.card)}>
                <CardBody className="p-4">
                  <div className="flex items-start gap-3">
                    <IconComponent
                      className={cn(
                        "w-5 h-5 flex-shrink-0 mt-0.5",
                        colors.icon,
                      )}
                    />

                    <div className="flex-1 min-w-0">
                      {notification.title && (
                        <h4
                          className={cn(
                            "font-semibold text-sm mb-1",
                            colors.title,
                          )}
                        >
                          {notification.title}
                        </h4>
                      )}
                      <p className="text-sm text-foreground">
                        {notification.message}
                      </p>
                      {notification.actions &&
                        notification.actions.length > 0 && (
                          <div className="flex gap-2 mt-3">
                            {notification.actions.map((action, index) => (
                              <Button
                                key={index}
                                size="sm"
                                variant="flat"
                                color={
                                  notification.type === "error"
                                    ? "danger"
                                    : "primary"
                                }
                                onClick={() => {
                                  action.handler();
                                  removeNotification(notification.id);
                                }}
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                    </div>

                    <Button
                      isIconOnly
                      variant="light"
                      size="sm"
                      className="text-default-400 hover:text-foreground"
                      onClick={() => removeNotification(notification.id)}
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* プログレスバー（duration指定時） */}
                  {notification.duration && notification.duration > 0 && (
                    <motion.div
                      className={cn(
                        "h-1 mt-3 rounded-full",
                        colors.icon.replace("text-", "bg-"),
                      )}
                      initial={{ width: "100%" }}
                      animate={{ width: "0%" }}
                      transition={{
                        duration: notification.duration / 1000,
                        ease: "linear",
                      }}
                    />
                  )}
                </CardBody>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
