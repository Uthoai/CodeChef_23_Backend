import mongoose, {Schema, Types} from "mongoose";

const subjectChapterSchema = new mongoose.Schema(
    {
        subjectID:{
            type: Schema.Types.ObjectId,
            ref: "ClassSubject"
        },
        chapterName: {
            type: String,
            required: true,
            trim: true,
        },
        chapterNo: {
            type: Number,
            required: true,
            index: true
        },
        chapterFile: {
            type: String,
            required: true
        },
        chapterFilePageSize: {
            type: Number,
            required: true
        },
    },
    {
        timestamps: true
    }
);


export const SubjectChapter = mongoose.model("SubjectChapter", subjectChapterSchema);
 
