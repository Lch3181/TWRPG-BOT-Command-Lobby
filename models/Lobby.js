const { DataTypes, Model } = require('sequelize');

module.exports = class Lobby extends Model {
    static init(sequelize) {
        return super.init({
            userId: {
                type: DataTypes.STRING,
                primaryKey: true
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
            tableName: 'Lobby',
            sequelize
        })
    }
}