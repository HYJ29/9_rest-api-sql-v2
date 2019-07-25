'use strict';
module.exports = (sequelize, DataTypes) => {
  const Course = sequelize.define('Course', {
    title: {
      type:DataTypes.STRING,
      allowNull:false,
      validate:{
        notEmpty:{msg:'Title cannot be empty.'},
        notNull:{msg:'Title cannot be null.'}
      }
    },
    description: {
      type:DataTypes.TEXT,
      allowNull:false,
      validate:{
        notEmpty:{msg:'Description cannot be empty.'},
        notNull:{msg:'Description cannot be null.'}
      }
    },
    estimatedTime: {
      type:DataTypes.STRING,
      allowNull:true,
    },
    materialsNeeded: {
      type:DataTypes.STRING,
      allowNull:true,
    }
  }, {});
  Course.associate = function(models) {
    // associations can be defined here
    Course.belongsTo(models.User, {
      as:'user',
      foreignKey:{
        allowNull:false,
        validate:{
          notEmpty:{msg:'UserId cannot be empty.'},
          notNull:{mesg:'UserId cannot be null.'}
        }
      }

    })
  };
  return Course;
};
