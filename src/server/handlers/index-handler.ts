import { router, app } from "../base/base"
import { auth } from "../utils/auth"

/* GET home page. */
router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
    res.send('oh yeah!')
})

router.get('/index.html*',(req,res)=>{
    res.render('index')
})

router.get('/*.html', function(req, res) {
    res.render(`${  req.originalUrl.substring(1,req.originalUrl.indexOf('.'))}`)//req.originalUrl获取当前URL
})

export const _router = auth(app, router)
