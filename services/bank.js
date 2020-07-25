const Sequelize = require('sequelize');
const db = require('./db');
const Model = Sequelize.Model;

class Bank extends Model {
    static async findByBin(bin) {
        return await Bank.findOne({
            where: {
                bin,
            }
        });
    }
}

Bank.init({
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
    },
    nameBank: { ///change
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
    },
    internalFee: {
        type: Sequelize.DOUBLE,
        allowNull: false,
    },
    externalFee: {
        type: Sequelize.DOUBLE,
        allowNull: false,
    },
    bin: {
        type: Sequelize.STRING,
        allowNull: false,
    },
}, {
    underscored: true, ////change
    sequelize: db,
    modelName: 'bank'
});

module.exports = Bank;