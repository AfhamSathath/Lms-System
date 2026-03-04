const Notification = require('../models/notification');
const User = require('../models/user');

class NotificationService {

    static getExpiry(days = 30) {
        return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }

    static async notifyUser(userId, data) {
        return await Notification.create({
            user: userId,
            ...data,
            expiresAt: this.getExpiry(),
        });
    }

    static async notifyMany(userIds, data) {
        const notifications = userIds.map(id => ({
            user: id,
            ...data,
            expiresAt: this.getExpiry(),
        }));

        return await Notification.insertMany(notifications);
    }

    static async broadcastToRole(role, data) {
        const users = await User.find({ role }).select('_id');
        const userIds = users.map(u => u._id);

        return this.notifyMany(userIds, data);
    }
}

module.exports = NotificationService;