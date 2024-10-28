//Authentication controller
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { CreateError } from "../utils/error.js";
import { CreateSuccess } from "../utils/success.js";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import formidable from 'formidable';


//Function to move and rename the file to the target directory.
//Mainly used for user's profile image handling.
//Saves the file into the designated folder and also renames them using uuidv4.
//This is done to make sure that no two files can have the same name.
const moveAndRenameFile = (fileArray, targetDir) => {
  //Checks if array received is not empty or invalid.
  if (!fileArray || fileArray.length === 0 || !fileArray[0]) {
      console.error("File array is empty or invalid.");
      return null;
  }
  const file = fileArray[0];
  //Checks if the file object is valid and has the required properties.
  if (!file.filepath || !file.newFilename) {
      console.error("Invalid file object or missing properties.");
      return undefined;
  }
  //Retreives the new file path, then change the name to the new file name.
  const currentFilePath = file.filepath;
  const currentFileName = file.newFilename;
  //Retreives the file extension from the file name.
  const fileExtension = path.extname(currentFileName);
  //Creates a unique file name using uuidv4, then add the extension again.
  const uniquePrefix = uuidv4();
  const newFileName = uniquePrefix + fileExtension;
  //Creates the target path using the target directory and the new file name.
  const targetPath = path.join(targetDir, newFileName);
  //Moves the images from the temp path to the new path (productimg folder).
  fs.copyFileSync(currentFilePath, targetPath);
  fs.unlinkSync(currentFilePath);
  return newFileName;
};

//Checks if an email address is already taken.
//Returns an error if the specified email address is already taken.
export const checkEmail = async (req, res, next) => {
  try {
    const email = req.body.email;
    const doesEmailExist = await User.findOne({ email });
    if (doesEmailExist) {
      return next(CreateError(403, "Email Taken"));
    } else {
      return next(CreateSuccess(200, "Email Available"));
    }
  } catch (error) {
    return next(CreateError(500, "Internal Server Error", error));
  }
};

//Registers a user into the db according to their role.
//Passwords are hashed before being saved into the db using bcrypt.
//User images are also saved into the userimg folder using the movAndRenameFile function.
export const register = async (req, res, next) => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const uploadDir = path.join(__dirname, '..', 'userimg');

  //Check if the upload directory exists.
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const form = formidable({
    multiples: true,
    uploadDir,
    keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024,
    maxFieldsSize: 50 * 1024 * 1024,
    maxFields: 1000,
  });
  
  //This parses the incoming form data.
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return next(CreateError(601, "Could not update product", err));
    }
    //This simplifies the process of retrieving the field values.
    const getFieldValue = (fieldValue) => Array.isArray(fieldValue) ? fieldValue[0] : fieldValue;
    //This retreives the email entered, then checks if it's already taken.
    const email = getFieldValue(fields.email);
    try {
      const doesEmailExist = await User.findOne({ email });
      if (doesEmailExist) {
        return res.status(403).json(CreateError(403, "Email already taken"));
      }
    } catch (error) {
      console.error("Error checking email:", error);
      return next(CreateError(500, "Internal Server Error", error));
    }
    //This hashes the password before saving it into the db.
    //Done by using bcrypt with 10 salt rounds.
    let hashedPassword;
    try {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(getFieldValue(fields.password), saltRounds);
    } catch (error) {
      console.error("Error hashing password:", error);
      return next(CreateError(602, "Internal Server Error", error));
    }
    //Moves then renames the uploaded user image (if it exists).
    const newUserImgName = await moveAndRenameFile(files.userImg, uploadDir);

    //Creates a new user object with the required fields.
    //Then saves the user into the db.
    const user = new User({
      email,
      password: hashedPassword,
      address: getFieldValue(fields.address),
      name: getFieldValue(fields.name),
      roles: getFieldValue(fields.roles),
      phoneNo: getFieldValue(fields.phoneNo),
      employeeId: getFieldValue(fields.employeeId),
      userimg: newUserImgName,
    });
    //Finally, try saving the user into the db.
    try {
      await user.save();
      return res.status(201).json(CreateSuccess(201, "User created successfully", user));
    } catch (error) {
      console.error("Error creating user:", error);
      return res.status(603).json(CreateError(500, "Error creating user", error));
    }
  });
};


//Logs the user in by verifying the credentials and providing a JWT token.
export const login = async (req, res, next) => {
  try {
    //Checks if the email is indeed registered into the db.
    //Returns an error if the email is not found.
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json(CreateError(404, "Email is not found"));
    }
    //Compare the password provided with the one in the database.
    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    //Returns an error if the password is invalid.
    if (!validPassword) {
      return res.status(402).json(CreateError(402, "Invalid password"));
    }
    //Set token to expire within 5hrs by default.
    let tokenExpiration = "5h";
    //Signs the JWT token with the appropriate user data.
    const token = jwt.sign(
      {
        id: user._id,
        roles: user.roles,
        name: user.name,
        email: user.email,
        hasResetPassword: user.hasResetPassword,
      },
      process.env.TOKEN_SECRET,
      {
        expiresIn: tokenExpiration,
      }
    );
    //Returns the token as a cookie to the browser.
    res.cookie("session_token", token, { httpOnly: true }).status(200).json({
      message: "Logged in successfully!",
      session_token: token,
      status: 200,
    });
  } catch (error) {
    return res.status(500).json(CreateError(500, "Internal Server Error", error));
  }
};

//TODO:pastiin token masih valid
//Ubah error code nanti

export const update = async (req, res, next) => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const uploadDir = path.join(__dirname, '..', 'userimg');

  // Ensure the upload directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const form = formidable({
    multiples: true,
    uploadDir,
    keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024,
    maxFieldsSize: 50 * 1024 * 1024, 
    maxFields: 1000, 
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      // return next(CreateError(500, "Could not update user", err));
      return res.status(500).json(CreateError(500, "Could not update user", err));
    }
    // Retrieve all field values without having to manually retrieve them
    const getFieldValue = (fieldValue) => Array.isArray(fieldValue) ? fieldValue[0] : fieldValue;
    const token = req.headers['session_token'];
    const userId = getFieldValue(fields.userId);

    try {
      if(!req.headers['session_token']){
          return res.status(403).json(CreateError(403, "Forbidden"));
      const decoded = jwt.verify(req.headers['session_token'], process.env.TOKEN_SECRET);
      //also check if the decoded token is still valid.
      if (decoded.roles !== 'admin') {
        return res.status(403).json(CreateError(403, "Forbidden"));
      }
    } catch (error) {
         return res.status(403).json(CreateError(403, "Forbidden", error))
    }

    // Retrieve the user by ID
    let user;
    try {
      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json(CreateError(404, "User not found"));
      }
    } catch (error) {
      console.error("Error retrieving user:", error);
      // return next(CreateError(500, "Internal Server Error", error));
      return res.status(500).json(CreateError(500, "Internal Server Error", error));
    }

    const email = getFieldValue(fields.email);

    // Check if the email is being changed and if it already exists in the database
    if (email && email !== user.email) {
      try {
        const doesEmailExist = await User.findOne({ email });
        if (doesEmailExist) {
          if(doesEmailExist._id != userId){
            console.log("ID di DB:  ", doesEmailExist._id);
            console.log("ID yang diinput:  ", userId);
            return res.status(403).json(CreateError(403, "Email already taken"));
          }
        }
      } catch (error) {
        console.error("Error checking email:", error);
        return next(CreateError(500, "Internal Server Error", error));
      }
    }

    // Hash the password if it's being updated
    let hashedPassword;
    if (fields.password) {
      try {
        const saltRounds = 10;
        hashedPassword = await bcrypt.hash(getFieldValue(fields.password), saltRounds);
      } catch (error) {
        console.error("Error hashing password:", error);
        return next(CreateError(500, "Internal Server Error", error));
      }
    }

    // Move and rename the uploaded file if it exists, and delete the old file
    let newUserImgName;
    if (files.userImg) {
      if (user.userimg) {
        const oldImagePath = path.join(uploadDir, user.userimg);
        fs.unlink(oldImagePath, (err) => {
          if (err) {
            console.error("Error deleting old user image:", err);
            // Don't return an error, just log it
          }
        });
      }
      newUserImgName = await moveAndRenameFile(files.userImg, uploadDir);
    }

    // Build the update object
    const updateData = {
      email: email !== user.email ? email : user.email,
      address: getFieldValue(fields.address),
      name: getFieldValue(fields.name),
      roles: getFieldValue(fields.roles),
      phoneNo: getFieldValue(fields.phoneNo),
      employeeId: getFieldValue(fields.employeeId),
      userimg: newUserImgName,
    };

    if (hashedPassword) {
      updateData.password = hashedPassword;
    }

    // Remove undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    // Update the user in the database
    try {
      const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
      return res.status(200).json(CreateSuccess(200, "User updated successfully", updatedUser));
    } catch (error) {
      console.error("Error updating user:", error);
      return res.status(500).json(CreateError(500, "Error updating user", error));
    }
  });
};


//Logout function.
//Clears the cookie from the browser.
export const logout = async (req, res, next) => {
  try {

    res.clearCookie("session_token").status(200).json({
      message: "Logged out successfully!",

    });
  } catch (error) {
    return next(CreateError(500, error));
  }
};



//Deletes a user from the database

export const deleteUser = async (req, res, next) => {
  try {
    const userId = req.query.userId;
    const user = await User.findById(userId);
    //check from the token received that the user is an admin
    //if not, return an error
    try {
      if(!req.headers['session_token']){
          return res.status(403).json(CreateError(403, "Forbidden"));
        };
      const decoded = jwt.verify(req.headers['session_token'], process.env.TOKEN_SECRET);
      //also check if the decoded token is still valid.
      if (decoded.roles !== 'admin') {
        return res.status(403).json(CreateError(403, "Forbidden"));
      }
    } catch (error) {
         return res.status(403).json(CreateError(403, "Forbidden", error))
    }
    if (!user) {
      return res.status(404).json(CreateError(404, "User not found"));
    }
    try {
      await User.findByIdAndDelete(userId);
      return res.status(200).json(CreateSuccess(200, "User deleted successfully", user));
    } catch (error) {
      return res.status(500).json(CreateError(500, "Error Deleting User",error)); 
    }
  } catch (error) {
    return res.status(500).json(CreateError(500, "Error Deleting User",error)); 
  }
}

//Retreives all USER ID along with their email, email, and picture.
export const getAllUsers = async (req, res, next) => {
  try {
    //check if session token is present.
    //check from the token received that the user is an admin
    //if not, return an error
    try {
      if(!req.headers['session_token']){
          return res.status(403).json(CreateError(403, "Forbidden"));
        };
      const decoded = jwt.verify(req.headers['session_token'], process.env.TOKEN_SECRET);
      //also check if the decoded token is still valid.
      if (decoded.roles !== 'admin') {
        return res.status(403).json(CreateError(403, "Forbidden"));
      }
    } catch (error) {
         return res.status(403).json(CreateError(403, "Forbidden", error))
    }
    const users = await User.find({}, { password: 0, __v: 0, updatedAt: 0 });
    return res.status(200).json(CreateSuccess(200, "Users retrieved successfully", users));
  } catch (error) {
    return next(CreateError(500, error));
  }
}

//Retreive all information regarding a user, without their password.

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.body.userId, { password: 0, __v: 0, updatedAt: 0 });
    if (!user) {
      return res.status(404).json(CreateError(404, "User not found"));
    }
    return res.status(200).json(CreateSuccess(200, "User retrieved successfully", user));
  }
  catch (error) {
    return next(CreateError(500, error));
  }
}

