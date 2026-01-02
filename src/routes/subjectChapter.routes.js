import { Router } from "express";
import {
    createSubjectChapter,
    getAllSubjectChapters,
    getChaptersBySubjectId,
    getSubjectChapterById,
    updateSubjectChapter,
    deleteSubjectChapter
} from "../controllers/subjectChapter.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();


router.route("/getAllSubjectChapters").get(getAllSubjectChapters)
router.route("/createSubjectChapter").post(createSubjectChapter)

router.route("/getChaptersBySubjectId/:subjectId").get(getChaptersBySubjectId);

// single chapter operations
router.route("/getSubjectChapterById/:id").get(getSubjectChapterById)
router.route("/updateSubjectChapter/:id").patch(verifyJWT, updateSubjectChapter)
router.route("/deleteSubjectChapter/:id").delete(verifyJWT, deleteSubjectChapter)

export default router;
