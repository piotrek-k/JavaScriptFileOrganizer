var gulp = require('gulp');
const fs = require('fs');
var path = require('path');
var del = require('del');

function createFile(filename, content) {
    var fd;
    try {
        fd = fs.openSync(filename, 'wx');
        if (fd != null) {
            console.log("Writing to new file " + filename + "..." + content);
            fs.writeSync(fd, content);
        }
    }
    catch (err) {
        if (err.code != "EEXIST") {
            console.error(err);
        }
        else {
            console.log(filename + " exists...");
        }
    } finally {
        if (fd !== undefined)
            fs.closeSync(fd);
    }
}

function appendToFile(filename, text, templateFilePath) {
    var template = fs.readFileSync(templateFilePath, { encoding: 'utf8' });
    if (template != null) {
        template = template.replace("//[paste code here]", text);
    }
    else {
        console.log("No template!");
    }
    fs.appendFileSync(filename, template + "\n\n", { flag: "a+" });
}

function mirrorFolder(originalPath, newPath, createFileFunction) {
    if (!fs.existsSync(newPath)) {
        fs.mkdirSync(newPath);
    }
    fs.readdirSync(originalPath).forEach(file => {
        var fileOriginalFullPath = path.join(originalPath, file);
        var fileNewFullPath = path.join(newPath, file);
        console.log("--- " + fileNewFullPath);
        try {
            if (fs.lstatSync(fileOriginalFullPath).isDirectory()) {
                mirrorFolder(fileOriginalFullPath, fileNewFullPath, createFileFunction);
                console.log("Mirroring folder... " + fileNewFullPath)
            }
            else {
                createFileFunction(fileOriginalFullPath, fileNewFullPath);
                //console.log("Creating file..." + fileNewFullPath)
            }
        } catch (e) {
            console.log(e);
        }
    });
}

exports.buildJavascript = function(){
    //make sure all *.cshtml files have their own *.js equivalents
    mirrorFolder("./Views", "./Scripts", function (fileOriginalFullPath, fileNewFullPath) {
        //creates empty *.js files in place of *.cshtml files
        createFile(fileNewFullPath.replace(/\.[^/.]+$/, ".js"), "");
    });

    if(fs.readdirSync("./wwwroot/development").length > 0){
        throw "development folder have to be cleaned before build";
    }

    //build javascript files for development
    mirrorFolder("./Scripts", "./wwwroot/development", function (fileOriginalFullPath, fileNewFullPath) {
        //Find scripts that are divided to multiple files
        var re = /.*\\((\w+)\-\w+)\.\w+$/;
        var finalFullPath = fileNewFullPath;
        if (re.test(fileNewFullPath)) {
            //part of larger file
            var parts = fileNewFullPath.match(re);
            var prefix = parts[2];
            var prefixPlusName = parts[1];
            //console.log("parts: " + parts);
            finalFullPath = fileNewFullPath.replace(prefixPlusName, prefix);
            console.log("Merging " + prefixPlusName + " to " + finalFullPath + "...");
        }

        appendToFile(finalFullPath, fs.readFileSync(fileOriginalFullPath), "./JS_Templates/container.js");
    });
}