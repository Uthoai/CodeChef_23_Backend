import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import validator from "validator";
import jwt from "jsonwebtoken";
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js";
import mongoose from "mongoose";


// generate access and refresh token
const generateAccessAndRefreshTokens = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        if (!accessToken || !refreshToken) {
            throw new ApiError(409, "Failed to generate tokens");
        }

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});
        return {
            accessToken,
            refreshToken
        }
        
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token")
    }
}

// register user
const registerUser = asyncHandler( async(req, res)=>{
    
    const {username, email, fullName, password, avatar, phone, userType, fcmToken} = req.body;

    if(
        [username, email, fullName, password, phone, userType].some((field)=> field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    if(!validator.isEmail(email)){
        throw new ApiError(400, "Invalid email format")
    }

    // Password validation (must be at least 8 characters)
    if (password.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters long");
    }

    // check user is exist or not
    const existedUser = await User.findOne({
        $or: [{email}, {username}]
    })

    if (existedUser) {
        throw new ApiError(409, "email/username already used")
    }

    // create user
    const user = await User.create({
        username: username.trim(),
        email: email.trim(),
        fullName: fullName.trim(),
        phone: phone ? phone.trim() : "",
        avatar: avatar ? avatar.trim() : "",
        userType: userType.trim(),
        password: password.trim(),
        fcmToken: fcmToken ? fcmToken.trim() : ""
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while register in server..")
    }

    res.status(200).json(
        new ApiResponse(200, createdUser, "User created successfully")
    )

})

// login user
const loginUser = asyncHandler( async(req, res)=>{
    const {email, phone, password} = req.body;

    // check email/phone is empty or not
    if (!(email || phone)) {
        throw new ApiError(400, "Email or phone is required");
    }

    // check user exist or not
    const user = await User.findOne({
        $or: [{email}, {phone}]
    })

    if(!user){
        throw new ApiError(404, "User not found")
    }

    // check password is valid
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Password incorrect")
    }
    
    // access and refresh token
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    // logIn user
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    if(!loggedInUser){
        throw new ApiError(500, "Something went wrong while login in server..")
    }

    // send cookie
    const options = {
        httpOnly: true,
        secure: true,
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
                // again access and refresh token sent because in mobile app can't set cookie
            },
            "User logged in successfully"
        )
    )
})

// logout
const logoutUser = asyncHandler( async(req, res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res.status(200)
    .cookie("accessToken", options)
    .cookie("refreshToken", options)
    .json(
        new ApiResponse(
            200, 
            {},
            "User logged out successfully"
        )
    )
})

// refresh Access Token
const refreshAccessToken = asyncHandler( async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password")
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        // generate new access and refresh token
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res.status(200)
        .cookie("accessToken", accessToken, options)    
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {
                    accessToken, refreshToken
                },
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

// Change Current Password
const changeCurrentPassword = asyncHandler( async (req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res.status(200)
    .json(
        new ApiResponse(200,{}, "password change successfully")
    )
})

// get current user
const getCurrentUser = asyncHandler( async (req, res) => {
    return res.status(200)
    .json(new ApiResponse(
        200, 
        req.user, 
        "user fetched successfully"
    ))
})

// Update Account Details
const updateAccountDetails = asyncHandler( async (req, res) => {
    const { fullName, email, phone } = req.body

    if (!fullName || !email || !phone) {
        throw new ApiError(400, "All fields are required.")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                fullName: fullName,
                email: email,
                phone: phone
            }
            // set is mongodb operator 
        },
        {
            new: true   // this is for when update is complete object will return 
        }
    ).select("-password -refreshToken")

    return res.status(200)
    .json(new ApiResponse(
        200,
        user,
        "Account details updated successfully"
    ))
})

// update user avatar
const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar file is missing.")
    }

    // Delete old avatar from Cloudinary if it exists
    if (req.user.avatar) {
        const publicId = req.user.avatar.split('/').pop().split('.')[0];
        await deleteFromCloudinary(publicId); 
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(400,"Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken")

    return res.status(200)
    .json(new ApiResponse(
        200,
        user,
        "avater update successfully."
    ))
})

// get user profile by id
const getUserProfileById = asyncHandler(async (req, res) => {
    const userId = req.params.id;

    const user = await User.findById(userId).select("-password -refreshToken");
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200)
    .json(new ApiResponse(
        200,
        user,
        "user fetched successfully"
    ))
})


// for admin site
// get user by email or phone
const getUserProfileByEmailOrPhone = asyncHandler(async (req, res) => {
    const { email, phone } = req.body;

    // check field is empty or not
    if (!(email || phone)) {
        throw new ApiError(400, "Email or phone is required");
    }

    //check user is exist or not
    const user = await User.findOne({
        $or: [{email}, {phone}]
    })

    if(!user){
        throw new ApiError(404, "User not found")
    }

    const userInfo = await User.findById(user._id).select("-password -refreshToken")

    return res.status(200)
    .json(new ApiResponse(
        200,
        userInfo,
        "user fetched successfully"
    ))
})

const deleteUserProfile = asyncHandler(async (req, res) => {
    const userId = req.params.id
    const user = await User.findById(userId)

    if(!user){
        throw new ApiError(404, "User not found")
    }

    if (user.avatar) {
        const publicId = user.avatar.split('/').pop().split('.')[0];
        await deleteFromCloudinary(publicId); 
    }

    try {
        await User.findByIdAndDelete(userId);
    } catch (error) {
        throw new ApiError(500, "Something went wrong while deleting user")
    }

    return res.status(200)
    .json(new ApiResponse(
        200,
        {},
        "user deleted successfully"
    ))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    getUserProfileById,
    getUserProfileByEmailOrPhone,
    deleteUserProfile
}



