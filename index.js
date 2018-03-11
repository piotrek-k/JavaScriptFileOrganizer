var gulp = require('gulp');
var fs = require('fs');
var path = require('path');
var del = require('del');
var mkdirp = require('mkdirp');

/// Creates file in 'filename' path with given content
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

/// Adds text at the end of file. Optionally you can specify path to template
/// in which the code will be pasted
function appendToFile(filename, text, templateFilePath) {
    var textToAppend = text;
    if (templateFilePath !== undefined) {
        var template = fs.readFileSync(templateFilePath, { encoding: 'utf8' });
        if (template != null) {
            textToAppend = template.replace("//[paste code here]", text);
        }
        else {
            console.log("No template!");
        }
    }
    fs.appendFileSync(filename, textToAppend + "\n\n", { flag: "a+" });
}

/// Gets path to some folder from `originalPath` and creates exact same folder structure
/// For each new file `createFileFunction` will be called, where you actually create that file
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

exports.ensure_every_view_has_javascript = function (view_folder_path, scripts_folder_path) {
    //make sure all *.cshtml files have their own *.js equivalents
    mirrorFolder(view_folder_path, scripts_folder_path, function (fileOriginalFullPath, fileNewFullPath) {
        //creates empty *.js files in place of *.cshtml files
        createFile(fileNewFullPath.replace(/\.[^/.]+$/, ".js"), "");
    });
}

exports.copy_to_wwwroot_wrap_in_containers = function (scripts_folder_path, development_folder_path, template_file_path) {
    //mkDirByPathSync(development_folder_path);
    mkdirp.sync(development_folder_path);

    if (fs.readdirSync(development_folder_path).length > 0) {
        throw "development folder have to be cleaned before build";
    }

    //build javascript files for development
    mirrorFolder(scripts_folder_path, development_folder_path, function (fileOriginalFullPath, fileNewFullPath) {
        //Find scripts that are divided to multiple files
        //File division can be made in files that have 'prefixes'
        //Like '/path/to/file/About-something.js'
        //where prefix is 'About'
        var re = /.*\\((\w+)\-\w+)\.\w+$/;
        var finalFullPath = fileNewFullPath;
        if (re.test(fileNewFullPath)) {
            var parts = fileNewFullPath.match(re);
            var prefix = parts[2]; //About
            var prefixPlusName = parts[1]; //About-something
            finalFullPath = fileNewFullPath.replace(prefixPlusName, prefix);
            console.log("Merging " + prefixPlusName + " to " + finalFullPath + "...");
        }

        appendToFile(finalFullPath, fs.readFileSync(fileOriginalFullPath), template_file_path);
    });
}