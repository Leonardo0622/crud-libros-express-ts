import {Router} from "express"
import {getAll, getOne, create, update, remove} from "../controllers/librosController"
import {validarLibro} from "../middleware/validarLibro"

const router = Router()

router.get("/", getAll)
router.get("/:id",getOne)
router.post("/",validarLibro, create)
router.put("/:id",validarLibro, update)
router.delete("/:id", remove)

export default router