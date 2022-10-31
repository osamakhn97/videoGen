const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const {fabric} = require('fabric')
const {overrideFabricObjs} = require("./fabric-overrides/index")
const app = express();
const canvas = require('canvas');
var Frame = require("canvas-to-buffer");
const {startAnimation,addAllObjs} = require('./animations')
const {addAnnotation} = require('./annotateLine')
const {setExportVideoSize} = require('./utils')
const datals1 = require('./data')
const PORT = process.env.PORT || 5000
const uuid = require("uuid");
const myHost = 'http://192.168.100.141:5000/' // provide the url of your own ip
const cors = require('cors');
var recordedBlobs = [];
overrideFabricObjs(fabric);
addAnnotation(fabric)
app.use(cors({
    origin: '*'
}));
app.use(bodyParser({limit: '5000mb'}))
app.use(express.json({limit: '5000mb'}));
app.use(express.urlencoded({limit: '5000mb'}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('videos'))
app.use(bodyParser.json());
app.post('/generateVideo:id',async (req,res)=>{
    await generateVideo(req,res).then((value => {
        console.log('resolved')
        res.send({
            url:myHost+`${value}.mp4`
        })
    }))
})
const generateVideo = async (req,res)=>{
    return new Promise(resolveAnimation =>{
        let datals = req.body.data
        console.log('id',req.params.id)
        let id = req.params.id;
        let dir = `\\frames\\${id}\\`;
        let bufferArr = []
        let videoDir = '\\videos\\'
        let backgroundsDir = '\\bg\\'
        if (!fs.existsSync(dir)){
            fs.mkdirSync(__dirname+dir,{recursive:true});    }
        if(!fs.existsSync(videoDir)){
            fs.mkdirSync(__dirname+videoDir,{recursive:true})
        }
        if(!fs.existsSync(backgroundsDir)){
            fs.mkdirSync(__dirname+backgroundsDir,{recursive:true})
        }
        let canvasEl = new fabric.Canvas(`${id}`, {width: datals.canvasWidth, height: datals.canvasHeight });
        var frameC = new Frame(canvasEl, {
            quality: 0.4,
            types: ["png"]
        });
        recordedBlobs = []
        canvasEl.clear();
        setExportVideoSize(false,canvasEl,canvasEl.getZoom(),canvasEl.getWidth(),canvasEl.getHeight());
        fabric.Image.fromURL(datals.img, async function (img) {
            canvasEl.setBackgroundImage(img, canvasEl.renderAll.bind(canvasEl), {
                scaleX: (canvasEl.width / canvasEl.getZoom()) / img.width,
                scaleY: (canvasEl.height / canvasEl.getZoom()) / img.height
            });
            var buffer = frameC.toBuffer();
            console.log(__dirname+`\\bg\\${id}.png`)
            fs.writeFileSync(__dirname+`\\bg\\${id}.png`,buffer);
            canvasEl.clear();
            console.log('before add all objs')
            await addAllObjs(datals.frames, canvasEl);
            startAnimation(0, true, canvasEl, datals.frames, datals.shadowFrames, false, datals.svgPaths, frameC,res,id,resolveAnimation,bufferArr)
        })
    } )

}


app.listen(PORT,()=>{
    console.log('listening at port '+ PORT)
});