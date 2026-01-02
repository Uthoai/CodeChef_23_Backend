import mongoose from "mongoose";

const classSubjectSchema = new mongoose.Schema(
    {
        classNo: {
            type: Number,
            required: true,
            trim: true,
            index: true
        },
        subjectName: {
            type: String,
            required: true,
            trim: true,
        },
        subjectNameBN: {
            type: String
        },
        subjectNo: {
            type: Number,
            required: true,
            trim: true,
            index: true
        },
    },
    {
        timestamps: true
    }
);


export const ClassSubject = mongoose.model("ClassSubject", classSubjectSchema);
 
