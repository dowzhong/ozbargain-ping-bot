module.exports = (sequelize, datatypes) => {
    return sequelize.define('readlinks', {
        link: {
            type: datatypes.STRING,
            primaryKey: true
        }
    });
}