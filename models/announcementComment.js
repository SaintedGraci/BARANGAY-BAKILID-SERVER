import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./user.js";
import Announcement from "./announcement.js";

const AnnouncementComment = sequelize.define("AnnouncementComment", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    announcementId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Announcements',
            key: 'id'
        }
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    indexes: [
        {
            fields: ['announcementId', 'createdAt']
        }
    ]
});

// Define associations
AnnouncementComment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
AnnouncementComment.belongsTo(Announcement, { foreignKey: 'announcementId', as: 'announcement' });

export default AnnouncementComment;
