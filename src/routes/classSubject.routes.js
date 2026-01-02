import { Router } from "express";
import {
    createClassSubject,
    getAllClassSubjects,
    getSubjectsByClassNo,
    getClassSubjectById,
    updateClassSubject,
    deleteClassSubject
} from "../controllers/classSubject.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();



router.route("/getAllClassSubjects").get(getAllClassSubjects);
router.route("/createClassSubject").post(createClassSubject);
router.route("/get-subjects-byclass/:classNo").get(getSubjectsByClassNo);

router.route("/getClassSubjectById/:id").get(getClassSubjectById);
router.route("/updateClassSubject/:id").patch(verifyJWT, updateClassSubject);
router.route("/deleteClassSubject/:id").delete(verifyJWT, deleteClassSubject);


export default router;
