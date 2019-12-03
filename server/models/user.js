const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');



const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if(!validator.isEmail(value)) {
        throw new Error('Invalid Email')
      }
    }
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: 6
  },
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }],
  avatar: {
    type: Buffer
  }
}, {timestamps: true});

userSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'owner'
})

userSchema.pre('save', async function(next) {
  if(this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8);
    next();
  }else {
    next();
  }
});


userSchema.methods.getAuthToken = function() {
  const token = jwt.sign({_id: this._id}, process.env.JWT_SECRET, {expiresIn: '7 days'});

  this.tokens = this.tokens.concat({token});

  return token;
}

userSchema.statics.findByCredentials = async (email, password) => {
  try {
   const user = await User.findOne({email});
   if(!user) {
     throw new Error('Unable to find user');
   }
   const isMatch = await bcrypt.compare(password, user.password);
   if(!isMatch) {
     throw new Error('Unable to find user');
   }
   return user;
  } catch (e) {
    throw new Error('Unable to find user');
  }
}

userSchema.methods.toJSON = function() {
  const user = this.toObject(); 
  delete user.password;
  delete user.tokens;
  return user;
}


const User = mongoose.model('User', userSchema);

module.exports = User;