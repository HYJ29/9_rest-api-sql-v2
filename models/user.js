'use strict';
const fetch = require('node-fetch');
const apiKeys = require('../apiKeys');
const {User} = require('./index.js');

//validating email middleware
const validateEmail = async (value) =>{
  let message = null;
  await fetch(`http://apilayer.net/api/check?access_key=${apiKeys.emailValidate}&email=${value}&smtp=1&format=1`)
    .then(res => res.json())
    .then(json => {
      if(json.format_valid){
        if(!json.smtp_check){
          console.log(`${json.email} is valid format but not existing email`);
        }
      } else {
        message ="Not valid email";
      }
    })
    if(message){
      throw new Error(message);
    }
}

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    firstName: {
      type:DataTypes.STRING,
      allowNull:false,
      validate:{
        notEmpty:{msg:'FirstName cannot be empty.'},
        notNull:{msg:'FirstName cannot be null.'}
      }
    },
    lastName: {
      type:DataTypes.STRING,
      allowNull:false,
      validate:{
        notEmpty:{msg:'LastName cannot be empty.'},
        notNull:{msg:'LastName cannot be null.'}
      }
    },
    emailAddress: {
      type:DataTypes.STRING,
      allowNull:false,
      validate:{
        notEmpty:{msg:'EmailAddress cannot be empty.'},
        notNull:{msg:'EmailAddress cannot be null.'},
        validateEmail
      }
    },
    password: {
      type:DataTypes.STRING,
      allowNull:false,
      validate:{
        notEmpty:{msg:'Password cannot be empty.'},
        notNull:{msg:'Password cannot be null.'}
      }
    },
  }, {});
  User.associate = function(models) {
    // associations can be defined here
    User.hasMany(models.Course, {
      as:'courses',
    });
  };
  return User;
};
