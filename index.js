var gulp = require('gulp');
var fs = require('fs');
var path = require('path');
var del = require('del');
var mkdirp = require('mkdirp');

function PathConstructor(path_to_object, is_absolute) {
    if (is_absolute) {
        this.lock_relative = true;
        this.absolute_path = path_to_object;
    }
    else {
        this.relative_path = path_to_object;
    }

    this.getRel = function () {
        if (this.lock_relative) {
            throw "This path is abolsute!";
        }
        return this.relative_path;
    }

    this.getAbs = function () {
        if (this.relative_path === undefined && this.absolute_path !== undefined) {
            return this.absolute_path;
        }
        return path.join(PATH_TO_MAIN, this.relative_path);
    }

    return this;
}

var PATH_TO_MAIN = "";
var PATH_TO_SCRIPTS = new PathConstructor("./Scripts", false);
var PATH_TO_DEVELOPMENT = new PathConstructor("./wwwroot/development", false);
var PATH_TO_VIEWS = new PathConstructor("./Views", false);
var PATH_TO_JSTEMPLATES = new PathConstructor(path.join(__dirname, "JS_Templates"), true);

REGEX_DETECTING_SCRIPT_TEMPLATE_PRESENCE = /<script.+src=(\'|\").+(\'|\").+script-type=(\'|\")automatically included(\'|\").*>.*<\/script>/;
REGEX_DETECTING_SPLIT_JS_FILES = /.*(\\|\/)((\w+)\-\w+)\.\w+$/; //Like '/path/to/file/About-something.js'

var is_init_completed = false;
function path_to_absolute(p) {
    return path.join(PATH_TO_MAIN, p);
}
function generate_template_path(name) {
    return path.join(PATH_TO_JSTEMPLATES.getAbs(), name);
}


/// Creates file in 'filename' path with given content
function createFile(filename, content) {
    var fd;
    try {
        fd = fs.openSync(filename, 'wx');
        if (fd != null) {
            console.log("Writing to new file " + filename + "..." + content);
            fs.writeSync(fd, content);
        }
        else {
            console.log(filename + " fd is null!");
        }
    }
    catch (err) {
        if (err.code != "EEXIST") {
            console.error(err);
        }
        else {
            console.log(filename + " already exists. Skipping...");
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
    console.log("Appending to " + filename + " texttoappend: " + textToAppend + " text: " + text);
    try {
        fs.appendFileSync(filename, textToAppend + "\n\n", { flag: "a+" });
    }
    catch (err) {
        console.error(err);
    }
}

/// Gets path to some folder from `originalPath` and creates exact same folder structure
/// For each new file `createFileFunction` will be called, where you actually create that file
function mirrorFolder(originalPath, newPath, createFileFunction) {
    // if (!fs.existsSync(newPath)) {
    //     console.log(newPath + " DOESN'T EXIST");
    //     fs.mkdirSync(newPath);
    // }
    mkdirp.sync(newPath);
    fs.readdirSync(originalPath).forEach(file => {
        var fileOriginalFullPath = path.join(originalPath, file);
        var fileNewFullPath = path.join(newPath, file);
        //console.log("--- " + fileNewFullPath);
        try {
            if (fs.lstatSync(fileOriginalFullPath).isDirectory()) {
                console.log("---");
                console.log("Mirroring folder... " + fileNewFullPath);
                mirrorFolder(fileOriginalFullPath, fileNewFullPath, createFileFunction);
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

/**
 * Check if file passes regex test. If not, write `lineContent` at the beginning
 * 
 * @param {any} pathToFile  - path to file that should be checked
 * @param {any} regexToFindLine - regex used for tests
 * @param {any} pathToTemplate - location of template that will be used for code generation
 * @param {any} templateReplaceValuesArray - data for template
 */
function ensureFileContainsTemplate(pathToFile, regexToFindLine, pathToTemplate, templateReplaceValuesArray) {
    var fileContent = fs.readFileSync(pathToFile, { encoding: 'utf8' });
    if (!regexToFindLine.test(fileContent)) {
        // test passed
        // write lineContent at the beginning of file
        //var buffer = new Buffer(lineContent);
        var template = fs.readFileSync(pathToTemplate, { encoding: 'utf8' });
        for (var v in templateReplaceValuesArray) {
            template = template.replace("[" + v + "]", templateReplaceValuesArray[v]);
        }

        var fd = fs.openSync(pathToFile, 'w+');
        fs.writeSync(fd, template, 0, 'utf8');
        fs.writeSync(fd, fileContent, template.length, 'utf8');
        console.log("Created new <script> tag for " + pathToFile);
    }
    else {
        console.log("<script> tag already exists in " + pathToFile);
    }
}

exports._privatesForTestPurposes = {
    REGEX_DETECTING_SCRIPT_TEMPLATE_PRESENCE: REGEX_DETECTING_SCRIPT_TEMPLATE_PRESENCE,
    REGEX_DETECTING_SPLIT_JS_FILES: REGEX_DETECTING_SPLIT_JS_FILES
};

exports.init = function (direct_project_path) {
    console.log("jsScriptsOrganizer: project path specified to: " + direct_project_path);
    PATH_TO_MAIN = direct_project_path;
    is_init_completed = true;
    return this;
}

function ensure_everything_is_configured() {
    if (!is_init_completed)
        throw "jsScriptsOrganizer: init hasn't been runned";
}

exports.ensure_every_view_has_javascript = function (rel_folder_with_built_scripts, templateName) {
    ensure_everything_is_configured();

    var view_folder_path = PATH_TO_VIEWS.getAbs();
    var scripts_folder_path = PATH_TO_SCRIPTS.getAbs();

    //make sure all *.cshtml files have their own *.js equivalents
    mirrorFolder(view_folder_path, scripts_folder_path, function (fileOriginalFullPath, fileNewFullPath) {
        fileNewFullPath = fileNewFullPath.replace(/\.[^/.]+$/, ".js");
        //creates empty *.js files in place of *.cshtml files
        createFile(fileNewFullPath, "");
        //makes sure the origin (view file) links to script file (has <script> object that loads javascript)
        ensureFileContainsTemplate(
            fileOriginalFullPath,
            REGEX_DETECTING_SCRIPT_TEMPLATE_PRESENCE,
            generate_template_path(templateName),
            {
                "path_to_script": path.join(rel_folder_with_built_scripts, path.relative(scripts_folder_path, fileNewFullPath))
            }
        );
    });
}

exports.copy_to_wwwroot_wrap_in_containers = function (template_file) {
    ensure_everything_is_configured();

    var scripts_folder_path = PATH_TO_SCRIPTS.getAbs();
    var development_folder_path = PATH_TO_DEVELOPMENT.getAbs();

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
        //var re = /.*\\((\w+)\-\w+)\.\w+$/; //Like '/path/to/file/About-something.js'
        var finalFullPath = fileNewFullPath;
        if (REGEX_DETECTING_SPLIT_JS_FILES.test(fileNewFullPath)) {
            var parts = fileNewFullPath.match(REGEX_DETECTING_SPLIT_JS_FILES);
            var prefix = parts[3]; //About
            var prefixPlusName = parts[2]; //About-something
            finalFullPath = fileNewFullPath.replace(prefixPlusName, prefix);
            console.log("Merging " + prefixPlusName + " to " + finalFullPath + "...");
        }

        appendToFile(finalFullPath, fs.readFileSync(fileOriginalFullPath), generate_template_path(template_file));
    });
}