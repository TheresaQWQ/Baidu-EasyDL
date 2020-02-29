const request = require('request');
const sharp = require('sharp');
const fs = require('fs');
const md5 = require('md5');

// 百度cookie
const cookie = ''

// 文件夹命名
const pathMap = {
    '[default]': '未分类',
    'girl': '美少女',
    'H': '涩图',
    'loli': 'loli',
    'shouer': '兽耳'
}

const quest = (img,cb) => {
    sharp(img).resize(1200).jpeg({
        quality: 75
    }).toBuffer().then(e => {
        let img_base = e.toString('base64');
        request({
            uri: 'https://ai.baidu.com/easydl/api',
            method: 'POST',
            headers: {
                cookie: cookie,
                referer: 'https://ai.baidu.com/easydl/app/1/models/verify',
                'content-type': 'application/json;charset=UTF-8',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36'
            },
            body: JSON.stringify({
                // 请求参数
                threshold: 0.03,
                modelId: 51215,
                iterationId: 77459,
                type: 1,
                returnEntity: false,
                entity: `data:image/jpeg;base64,${img_base}`,
                method: "model/verify"
            })
        },(err,res,body) => {
            if(err || res.statusCode != 200){
                cb(true,`状态码异常 returnCode: ${res.statusCode}`);
            }else{
                let obj = JSON.parse(body);
                if(obj.success == true){
                    cb(null,obj.result.labels);
                }else{
                    cb(true,JSON.stringify(obj.message));
                }
            }
        })
    })
}

const query = (img,time,cb) => {
    quest(img,(err,result) => {
        if(!err){
            let max_score = 0;
            let max_name = '';
            Object.keys(result).forEach(e => {
                if(result[e].score > max_score){
                    max_name = result[e].name;
                    max_score = result[e].score;
                }
            });
            let type = max_name;
            let score = max_score;
            cb(null,{
                msg: 'success',
                type: type,
                score: score,
                time: Math.round((new Date().getTime() - time)/10)/100
            })
        }else{
            cb(err,{
                msg: result,
                type: null,
                score: null,
                time: Math.round((new Date().getTime() - time)/10)/100
            })
        }
    });
}

const start = () => {
    let files = fs.readdirSync('./input');
    let offset = 0;
    let waiting = 0;

    setInterval(() => {
        if(waiting == 0 && offset == files.length){
            if(fs.readFileSync('./input').length == 0){
                console.log('complete!');
                process.exit()
            }else{
                start();
            }
        }

        if(waiting < 5 && offset < files.length){
            waiting++;
            let path = `./input/${files[offset]}`;
            offset++;
            query(path,new Date().getTime(),(err,result) => {
                if(!err){
                    if(!fs.existsSync(`./output/${pathMap[result.type] || result.type}`)){
                        fs.mkdirSync(`./output/${pathMap[result.type] || result.type}`);
                    }

                    let filename = `${md5(fs.readFileSync(path))}.${files[offset].split('.').pop()}`;

                    fs.copyFileSync(path,`./output/${pathMap[result.type] || result.type}/${filename}`)
                    fs.unlinkSync(path);
                    waiting--;
                    console.log(`img: ${files[offset]}, time: ${result.time}s, waiting: ${waiting}, type: ${pathMap[result.type] || result.type}, score: ${result.score}`);
                }else{
                    waiting--;
                    console.log(`img: ${files[offset]}, time: ${result.time}s, waiting: ${waiting}, err: ${result.msg}`);
                }
            })
        }
    }, 100);
}

start();