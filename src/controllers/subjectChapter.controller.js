import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { SubjectChapter } from "../models/subject.chapter.model.js";
import { ClassSubject } from "../models/class.subject.model.js";
import mongoose from "mongoose";
import { cloudinaryUpload } from "../utils/cloudinary.js";

/**
 * Create Subject Chapter
 */
const createSubjectChapter = asyncHandler(async (req, res) => {
    const {
        subjectID,
        chapterName,
        chapterNo,
        chapterFilePageSize
    } = req.body;

    if (
        [subjectID, chapterName, chapterNo, chapterFilePageSize]
            .some(field => field === undefined || field === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }

    if (!mongoose.Types.ObjectId.isValid(subjectID)) {
        throw new ApiError(400, "Invalid subject ID");
    }

    const chapterFile = req.file ? req.file.path : null;
    if (!chapterFile) {
        throw new ApiError(400, "Chapter file is required");
    }

    const uploadedChapterFile = await cloudinaryUpload(chapterFile);

    if (!uploadedChapterFile || !uploadedChapterFile.secure_url) {
        throw new ApiError(500, "Failed to upload chapter file");
    }

    const chapterFileUrl = uploadedChapterFile.secure_url;

    // check subject exists
    const subjectExists = await ClassSubject.findById(subjectID);
    if (!subjectExists) {
        throw new ApiError(404, "Subject not found");
    }

    // prevent duplicate chapter number per subject
    const existedChapter = await SubjectChapter.findOne({
        subjectID,
        chapterNo
    });

    if (existedChapter) {
        throw new ApiError(409, "Chapter already exists for this subject");
    }

    const chapter = await SubjectChapter.create({
        subjectID,
        chapterName: chapterName.trim(),
        chapterNo,
        chapterFile: chapterFileUrl,
        chapterFilePageSize
    });

    return res.status(201).json(
        new ApiResponse(201, chapter, "Chapter created successfully")
    );
});

/**
 * Get All Chapters
 */
const getAllSubjectChapters = asyncHandler(async (req, res) => {
    const chapters = await SubjectChapter.find()
        .populate("subjectID", "classNo subjectName subjectNo")
        .sort({ chapterNo: 1 });

    return res.status(200).json(
        new ApiResponse(200, chapters, "Chapters fetched successfully")
    );
});

/**
 * Get Chapters By Subject ID
 */
const getChaptersBySubjectId = asyncHandler(async (req, res) => {
    const { subjectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
        throw new ApiError(400, "Invalid subject ID");
    }

    const chapters = await SubjectChapter.find({ subjectID: subjectId })
        .sort({ chapterNo: 1 });

    return res.status(200).json(
        new ApiResponse(200, chapters, "Chapters fetched successfully")
    );
});

/**
 * Get Chapter By ID
 */
const getSubjectChapterById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid chapter ID");
    }

    const chapter = await SubjectChapter.findById(id)
        .populate("subjectID", "classNo subjectName subjectNo");

    if (!chapter) {
        throw new ApiError(404, "Chapter not found");
    }

    return res.status(200).json(
        new ApiResponse(200, chapter, "Chapter fetched successfully")
    );
});

/**
 * Update Subject Chapter
 */
const updateSubjectChapter = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        chapterName,
        chapterNo,
        chapterFile,
        chapterFilePageSize
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid chapter ID");
    }

    const chapter = await SubjectChapter.findByIdAndUpdate(
        id,
        {
            $set: {
                chapterName,
                chapterNo,
                chapterFile,
                chapterFilePageSize
            }
        },
        { new: true }
    );

    if (!chapter) {
        throw new ApiError(404, "Chapter not found");
    }

    return res.status(200).json(
        new ApiResponse(200, chapter, "Chapter updated successfully")
    );
});

/**
 * Delete Subject Chapter
 */
const deleteSubjectChapter = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid chapter ID");
    }

    const chapter = await SubjectChapter.findByIdAndDelete(id);

    if (!chapter) {
        throw new ApiError(404, "Chapter not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Chapter deleted successfully")
    );
});

export {
    createSubjectChapter,
    getAllSubjectChapters,
    getChaptersBySubjectId,
    getSubjectChapterById,
    updateSubjectChapter,
    deleteSubjectChapter
};
