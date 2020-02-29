const sharp = require('sharp');
const fs = require('fs');

const encode = (name) => {
    fs.mkdir(`./output/${name}`,(err) => {});
    let files = fs.readdirSync(`./input/${name}`);
    files.forEach( async (e,i) => {
        let path = `./input/${name}/${e}`;
        let savePath = `./output/${name}/${i}.jpg`
        let img = sharp(path);
        let info = (await img.raw().toBuffer({resolveWithObject: true})).info;
        fs.writeFileSync(savePath,await (img.jpeg({
            quality: 70
        }).toBuffer()))
        console.log(`img: ${e}, info: ${JSON.stringify(info)}`);
    })
}

encode('tag');