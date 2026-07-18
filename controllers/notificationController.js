import Notification from "../models/notification.js";

export const getUserNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        const notifications = await Notification.findAll({
            where: { UserId: userId },
            order: [['createdAt', 'DESC']],
            limit: 50 // Limit to last 50 notifications
        });

        const unreadCount = await Notification.count({
            where: { 
                UserId: userId,
                read: false 
            }
        });

        return res.status(200).json({
            success: true,
            data: {
                notifications,
                unreadCount
            }
        });
    } catch (error) {
        console.error("Get notifications error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch notifications",
            error: error.message
        });
    }
};

export const markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findOne({
            where: { 
                id,
                UserId: userId 
            }
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        await notification.update({ read: true });

        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            data: notification
        });
    } catch (error) {
        console.error("Mark notification as read error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to mark notification as read",
            error: error.message
        });
    }
};

export const markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await Notification.update(
            { read: true },
            { 
                where: { 
                    UserId: userId,
                    read: false 
                } 
            }
        );

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read"
        });
    } catch (error) {
        console.error("Mark all notifications as read error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to mark all notifications as read",
            error: error.message
        });
    }
};

export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findOne({
            where: { 
                id,
                UserId: userId 
            }
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        await notification.destroy();

        return res.status(200).json({
            success: true,
            message: "Notification deleted"
        });
    } catch (error) {
        console.error("Delete notification error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete notification",
            error: error.message
        });
    }
};
