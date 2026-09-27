import type { ToastNotificationType } from "@/app/hooks";

type ToastNotificationProps = { notification: ToastNotificationType };

export const ToastNotification = ({ notification }: ToastNotificationProps) => {
	return (
		<div
			className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-3 py-2 rounded border shadow-xl backdrop-blur-md transition-all duration-300 animate-slideDown ${
				notification.type === "success"
					? "bg-[#18181b] border-blue-500/30 text-blue-400 text-xs font-medium"
					: "bg-[#18181b] border-rose-500/30 text-rose-400 text-xs font-medium"
			}`}
			id="toast-notification"
		>
			{notification.type === "success" ? (
				<span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
			) : (
				<span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
			)}
			<span className="font-mono text-[11px] uppercase tracking-wider">
				{notification.message}
			</span>
		</div>
	);
};
