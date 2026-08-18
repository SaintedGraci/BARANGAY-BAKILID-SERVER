import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./user.js";
import Announcement from "./announcement.js";

const AnnouncementReaction = sequelize.define("AnnouncementReaction", {
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
    type: {
        type: DataTypes.ENUM('helpful', 'like'),
        defaultValue: 'helpful'
    }
}, {
    indexes: [
        {
            unique: true,
            fields: ['announcementId', 'userId']
        }
    ]
});

// Define associations
AnnouncementReaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
AnnouncementReaction.belongsTo(Announcement, { foreignKey: 'announcementId', as: 'announcement' });

export default AnnouncementReaction;
