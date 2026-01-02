import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ClassSubject } from "../models/class.subject.model.js";
import mongoose from "mongoose";

/**
 * Create Class Subject
 */
const createClassSubject = asyncHandler(async (req, res) => {
    const { classNo, subjectName, subjectNameBN, subjectNo } = req.body;

    if (
        [classNo, subjectName, subjectNo].some(
            (field) => field === undefined || field === ""
        )
    ) {
        throw new ApiError(400, "classNo, subjectName and subjectNo are required");
    }

    // Check duplicate subject for same class
    const existedSubject = await ClassSubject.findOne({
        classNo,
        subjectNo
    });

    if (existedSubject) {
        throw new ApiError(
            409,
            "Subject already exists for this class"
        );
    }

    const subject = await ClassSubject.create({
        classNo,
        subjectName: subjectName.trim(),
        subjectNameBN: subjectNameBN?.trim() || "",
        subjectNo
    });

    return res.status(201).json(
        new ApiResponse(201, subject, "Class subject created successfully")
    );
});

/**
 * Get All Subjects
 */
const getAllClassSubjects = asyncHandler(async (req, res) => {
    const subjects = await ClassSubject.find().sort({
        classNo: 1,
        subjectNo: 1
    });

    return res.status(200).json(
        new ApiResponse(200, subjects, "Class subjects fetched successfully")
    );
});

/**
 * Get Subjects By Class No
 */
const getSubjectsByClassNo = asyncHandler(async (req, res) => {
    const { classNo } = req.params;

    if (!classNo) {
        throw new ApiError(400, "Class number is required");
    }

    const subjects = await ClassSubject.find({ classNo }).sort({
        subjectNo: 1
    });

    return res.status(200).json(
        new ApiResponse(200, subjects, "Subjects fetched successfully")
    );
});

/**
 * Get Subject By ID
 */
const getClassSubjectById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid subject ID");
    }

    const subject = await ClassSubject.findById(id);

    if (!subject) {
        throw new ApiError(404, "Subject not found");
    }

    return res.status(200).json(
        new ApiResponse(200, subject, "Subject fetched successfully")
    );
});

/**
 * Update Class Subject
 */
const updateClassSubject = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { classNo, subjectName, subjectNameBN, subjectNo } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid subject ID");
    }

    const subject = await ClassSubject.findByIdAndUpdate(
        id,
        {
            $set: {
                classNo,
                subjectName,
                subjectNameBN,
                subjectNo
            }
        },
        { new: true }
    );

    if (!subject) {
        throw new ApiError(404, "Subject not found");
    }

    return res.status(200).json(
        new ApiResponse(200, subject, "Subject updated successfully")
    );
});

/**
 * Delete Class Subject
 */
const deleteClassSubject = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid subject ID");
    }

    const subject = await ClassSubject.findByIdAndDelete(id);

    if (!subject) {
        throw new ApiError(404, "Subject not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Subject deleted successfully")
    );
});

export {
    createClassSubject,
    getAllClassSubjects,
    getSubjectsByClassNo,
    getClassSubjectById,
    updateClassSubject,
    deleteClassSubject
};
