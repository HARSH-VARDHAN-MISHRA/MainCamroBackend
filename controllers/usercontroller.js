//imports
const User = require("../models/user.model");
const sendEmail = require("../utils/sendMail");
const sendToken = require("../utils/SendToken")
const Contact = require("../models/contactModel");
const bcrypt = require('bcrypt');

// ... Other imports and controller functions ...

// Change Password
// Change Password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword, id } = req.body;
    const userId = id; // Assuming you have user information stored in req.user

    // Validate if no empty field
    const emptyFields = [];

    if (!oldPassword) {
      emptyFields.push('Old Password');
    }

    if (!newPassword) {
      emptyFields.push('New Password');
    }

    if (!confirmPassword) {
      emptyFields.push('Confirm Password');
    }

    if (emptyFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `The following fields are required: ${emptyFields.join(', ')}`,
      });
    }

    // Check if the new password and confirm password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New Password and Confirm Password do not match',
      });
    }

    // Check if the provided old password matches the current password in the database
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isPasswordMatch = await user.comparePassword(oldPassword);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Old Password is incorrect',
      });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    user.Password = hashedNewPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Error during password change:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};


exports.createContact = async (req, res) => {
  try {
    const { Name, Email, PhoneNumber, Message } = req.body;

    // Validate request data (you might want to add more validation)
    if (!Name || !Email || !PhoneNumber || !Message) {
      return res.status(400).json({ error: 'Please provide all required fields.' });
    }

    const newContact = new Contact({
      Name,
      Email,
      PhoneNumber,
      Message,
    });

    // Save the new contact to the database
    await newContact.save();

    res.status(201).json({ message: 'Contact created successfully.' });
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find();
    res.status(200).json(contacts);
  } catch (error) {
    console.error('Error retrieving contacts:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
exports.getAllUser = async (req, res) => {
  try {
    const Users = await User.find();
    res.status(200).json(Users);
  } catch (error) {
    console.error('Error retrieving Users:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
// Register
exports.RegisterUser = async (req, res) => {
  try {
    console.log(req.body)
    const { Name, Email, Password, ContactNumber, Role } = req.body;

    // Validate if no any empty field

    const emptyFields = [];

    if (!Name) {
      emptyFields.push('Name');
    }

    if (!Email) {
      emptyFields.push('Email');
    }

    if (!ContactNumber) {
      emptyFields.push('Number');
    }

    if (!Password) {
      emptyFields.push('Password');
    }



    if (emptyFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `The following fields are required: ${emptyFields.join(', ')}`,
      });
    }

    // Check if the email already exists in the database
    const existingUser = await User.findOne({ Email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email address is already registered',
      });
    }
    const existingUserByContactNumber = await User.findOne({ ContactNumber });
    if (existingUserByContactNumber) {
      return res.status(409).json({
        success: false,
        message: 'Contact number is already registered',
      });
    }
    // Save a new user
    const newUser = new User({
      Name,
      Email,
      Password,
      ContactNumber,
      Role,
    });

    const emailOptions = {
      email: Email,
      subject: 'Welcome To Ecommerce Project',
      message: `Congratulations Buddy ${Name}`,
    };



    // Save the new user to the database
    await newUser.save();
    // Send welcome email
    await sendEmail(emailOptions);
    return res.status(200).json({
      success: true,
      data: newUser,
      message: 'Registration successful',
    });
  } catch (error) {
    console.error('Error during user registration:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};


//Login 
exports.LogginUser = async (req, res) => {
  try {

    const { Email, Password } = req.body

    if (!Email || !Password) {
      return res.status(403).json({
        success: false,
        message: "Please enter all fields"
      })
    }
    const checkUser = await User.findOne({ Email })

    if (!checkUser) {
      return res.status(401).json({
        success: false,
        message: "User Not Found"
      })
    }

    const PasswordMatch = await checkUser.comparePassword(Password)
    if (!PasswordMatch) {
      return res.status(401).json({
        succes: false,
        message: "Invalid Password"
      })
    }

    await sendToken(checkUser, res, 200);
  } catch (error) {
    console.log(error)
  }
}


//Logout

exports.LogoutUser = async (req, res) => {
  //clear cookie
  try {
    res.cookie('Token')
    // console.log('LogoutUser')

    return res.status(200).json({
      success: true,
      message: 'Logged out'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    })
  }
}


exports.getUserIdbyUser = async (req, res) => {
  try {
    let userid = req.params.user_id;
    let UserInfo = await User.findById(userid, -"password");
    if (!UserInfo) {
      return res.status(403).json({
        success: false,
        msg: 'user is not found'
      })
    }



    return res.status(200).json({
      success: true,
      msg: 'user is found',
      data: UserInfo
    })


  }
  catch (error) {
    console.log(error)
  }
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Check if OTP is expired
function isOtpExpired(otpGeneratedAt) {
  const now = new Date();
  const expiryTime = 5 * 60 * 1000; // 5 minutes in milliseconds
  return now - otpGeneratedAt > expiryTime;
}
exports.PasswordChangeRequest = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(403).json({
        success: false,
        msg: "Please Fill All Required Fields"
      });
    }

    const user = await User.findOne({ Email: email });
    if (!user) {
      return res.status(401).json({
        success: false,
        msg: "User Not Available With this Email"
      });
    }

    const otp = generateOtp();
    user.ForgetPasswordOtp = otp;
    user.OtpGeneratedAt = new Date();

    await user.save();

    const options = {
      email: email,
      subject: "Password Reset Request",
      message: `Your OTP for password reset is: ${otp}`
    };

    await sendEmail(options);

    return res.status(200).json({
      success: true,
      msg: "OTP sent to your email"
    });
  } catch (error) {
    console.log(error);
    res.status(501).json({
      success: false,
      msg: "Internal Server Error"
    });
  }
};

//Resend OTP
exports.ResendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(403).json({
        success: false,
        msg: "Please provide an email"
      });
    }

    const user = await User.findOne({ Email: email });
    if (!user) {
      return res.status(401).json({
        success: false,
        msg: "User Not Available With this Email"
      });
    }

    const otp = generateOtp();
    user.ForgetPasswordOtp = otp;
    user.OtpGeneratedAt = new Date();

    await user.save();

    const options = {
      to: email,
      subject: "Password Reset Request - Resend OTP",
      message: `Your new OTP for password reset is: ${otp}`
    };

    await sendEmail(options);

    return res.status(200).json({
      success: true,
      msg: "OTP resent to your email"
    });
  } catch (error) {
    console.log(error);
    res.status(501).json({
      success: false,
      msg: "Internal Server Error"
    });
  }
};

//Verify OTP and Change Password
exports.VerifyOtp = async (req, res) => {
  try {
    const { otp } = req.body; // Ensure newPassword is retrieved from req.body
    const { email,newPassword } = req.params; // email is retrieved from req.params

    if (!email || !otp || !newPassword) {
      return res.status(403).json({
        success: false,
        msg: "Please Fill All Required Fields"
      });
    }

    const user = await User.findOne({ Email: email });
    if (!user || user.ForgetPasswordOtp !== otp) {
      return res.status(401).json({
        success: false,
        msg: "Invalid OTP or Email"
      });
    }

    if (isOtpExpired(user.OtpGeneratedAt)) {
      return res.status(401).json({
        success: false,
        msg: "OTP has expired"
      });
    }

    
    user.Password = newPassword
    user.ForgetPasswordOtp = null;
    user.OtpGeneratedAt = null;

    await user.save();

    return res.status(200).json({
      success: true,
      msg: "Password updated successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(501).json({
      success: false,
      msg: "Internal Server Error"
    });
  }
};
