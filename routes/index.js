const express =require('express');
const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');
const fetch = require('node-fetch');
const router = express.Router();
const {Course, User} = require('../models');
const apiKeys = require('../apiKeys');

//validating email middleware
const validateEmail = (req,res,next) =>{
  let message = null;
  fetch(`http://apilayer.net/api/check?access_key=${apiKeys.emailValidate}&email=${req.body.emailAddress}&smtp=1&format=1`)
    .then(res => res.json())
    .then(json => {
      if(json.format_valid){
        if(!json.smtp_check){
          console.log(`${json.email} is valid format but not existing email`);
        }
          next();
      } else {
        message ="Not valid email";
        res.status(400).json({message});
      }
    })
}

//authenticating middelware
const authenticateUser = async (req,res,next) =>{
  let message = null;
  const credential = auth(req);
  if(credential){
    await User.findAll().then(users=>{
      const user = users.find(user=> user.emailAddress === credential.name);
      if(user){
        const match = bcryptjs.compareSync(credential.pass,user.password);
        if(match){
          req.currentUser=user;
        } else {
          message = `Authentication failure with user name: ${user.name}`;
        }
      } else {
        message = `Not found with user name: ${credential.name}`;
      }
    })
  } else {
    message ='Auth Header not found';
  }
  if(message){
    console.warn(message);
    res.status(401).json({message:"Access Denied"})
  } else {
    next();
  }
}

//authorizing user middleware (can only access their own courses)
const authorizeUser = (req,res,next) =>{
  Course.findByPk(req.params.id)
    .then(course => {
      if(req.currentUser.id === course.userId){
        next();
      } else {
        res.status(403).json({message:"Not authorized to access"})
      }
    })
}


//get all the users
router.get('/users',authenticateUser,(req,res)=>{
  User.findAll({
    order:[['createdAt','DESC']],
    include:[
      {
        model: Course,
        as:'courses',
        attributes:['title','description','estimatedTime','materialsNeeded']
      }
    ],
    attributes:{exclude:['password','createdAt','updatedAt']}
  }).then(users=>{
    res.status(200).json(users);
  })
})

//post a user
router.post('/users',validateEmail,(req,res)=>{
  const user = req.body;
  user.password = bcryptjs.hashSync(user.password);
  User.create(user).then(user=>{
    res.status(201).redirect('/');
  }).catch(error=>{
    if(error.name==="SequelizeValidationError"){
      const errorMessages= error.errors.map(error=> error.message);
      res.status(400).json(errorMessages)
      next(error)
    }else{
      throw error
    }
  })
})

//get all the courses
router.get('/courses',(req,res)=>{
  Course.findAll({
    order:[['createdAt','DESC']],
    include:[
      {
        model: User,
        as:'user',
        attributes:{exclude:['password','createdAt','updatedAt']}
      }
    ],
    attributes:{exclude:['createdAt','updatedAt']}
  }).then(function(courses){
    res.status(200).json(courses);
  })
})

//get a course
router.get('/courses/:id', (req,res)=>{
  Course.findByPk(req.params.id,{
    include:[
      {
        model: User,
        as:'user'
      }
    ],
    attributes:{exclude:['createdAt','updatedAt']}
  }).then(function(course){
    res.status(200).json(course);
  })
})

//post new course
router.post('/courses',authenticateUser, (req,res)=>{
  Course.create(req.body).then(function(course){
    res.status(201).redirect(`/api/courses/${course.id}`)
  }).catch(error=>{
    if(error.name==="SequelizeValidationError"){
      const errorMessages= error.errors.map(error=> error.message);
      console.log(error)
      res.status(400).json(errorMessages)
    }else{
      throw error
    }
  })
})

//put course
router.put('/courses/:id',authenticateUser, authorizeUser, (req,res)=>{
  Course.findByPk(req.params.id).then(function(course){
    course.update(req.body).then(function(){
      res.status(204).end();
    }).catch(error=>{
      if(error.name==="SequelizeValidationError"){
        const errorMessages= error.errors.map(error=> error.message);
        res.status(400).json(errorMessages)
      }else{
        throw error
      }
    })
  })
})

//delete course
router.delete('/courses/:id',authenticateUser, authorizeUser, (req,res)=>{
  Course.findByPk(req.params.id).then(function(course){
    course.destroy().then(function(){
      res.status(204).end();
    });
  })
})



module.exports = router;
