const { DataTypes, Model } = require('sequelize');

module.exports = class Host extends Model {
    static init(sequelize) {
        return super.init({
            userId: {
                type: DataTypes.STRING,
                primaryKey: true
            },
            guildId: {
                type: DataTypes.STRING
            },
            messageId: {
                type: DataTypes.STRING
            },
            lobby: {
                type: DataTypes.JSON
            },
            slots: {
                type: DataTypes.JSON
            }
        }, {
            tableName: 'Host',
            sequelize
        })
    }
}