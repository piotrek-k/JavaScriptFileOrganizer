var expect = require('chai').expect;
const path = require('path');
var main_app = require('../index').init(path.join(__dirname,"../"));
var fs = require('fs');
//var glob = require("glob")
var del = require('del');

const TEXT_TO_PUT_IN_CONTACT_JS = "CONTACT";
const PATH_TO_MAIN_FOLDER = path.join(__dirname,"../");
const PATH_TO_SCRIPTS = path.join(PATH_TO_MAIN_FOLDER, "./Scripts");
const PATH_TO_DEVELOPMENT = path.join(PATH_TO_MAIN_FOLDER, "./wwwroot/development");
const PATH_TO_VIEWS = path.join(PATH_TO_MAIN_FOLDER, "./Views");
const PATH_TO_JSTEMPLATES = path.join(PATH_TO_MAIN_FOLDER, "./JS_Templates");
console.log(PATH_TO_JSTEMPLATES);

describe('ensure_every_view_has_javascript', function () {
    before(function(){
        return del(PATH_TO_SCRIPTS).then(function(){
            main_app.ensure_every_view_has_javascript("./development", "scriptObjectForHtml.html");
        });
    });

    it('should create the same amount of files', function () {
        var numOfFilesInView = fs.readdirSync(PATH_TO_VIEWS).length;
        var numOfFilesInScripts = fs.readdirSync(PATH_TO_SCRIPTS).length;

        expect(numOfFilesInView).to.be.equal(numOfFilesInScripts);
    });
});

describe('copy_to_wwwroot_wrap_in_containers', function () {
    before(function(){
        return del(PATH_TO_DEVELOPMENT).then(function(){
            fs.writeFileSync(path.join(PATH_TO_SCRIPTS, "/Home/Contact.js"), TEXT_TO_PUT_IN_CONTACT_JS);

            main_app.copy_to_wwwroot_wrap_in_containers("./container.js");
        });
    });

    it('should create wwwroot/development', function () {
        expect(fs.existsSync(PATH_TO_DEVELOPMENT)).to.be.true;
    });

    it('should wrap code from Contact.js', function () {
        var template = fs.readFileSync(path.join(PATH_TO_JSTEMPLATES, "container.js"), { encoding: 'utf8' });
        if (template != null) {
            template = template.replace("//[paste code here]", TEXT_TO_PUT_IN_CONTACT_JS).replace(/\s/g, "");
        }

        var realFileValue = fs.readFileSync(path.join(PATH_TO_DEVELOPMENT, "/Home/Contact.js"), { encoding: 'utf8' }).replace(/\s/g, "");
        expect(realFileValue).to.be.equal(template);
    });

    it('should merge files with the same prefixes', function(){
        //TODO
        // e.g: /Scripts/Home/About.js and /Scripts/Home/About-second.js should all
        // be stored in /wwwroot/development/Home/About.js
    });
});

describe('templates', function () {
    it('scriptObjectForHtml should return true while testing with regex', function () {
        var template = fs.readFileSync(path.join(PATH_TO_JSTEMPLATES, "scriptObjectForHtml.html"), { encoding: 'utf8' });
        expect(main_app._privatesForTestPurposes.REGEX_DETECTING_SCRIPT_TEMPLATE_PRESENCE.test(template)).to.be.true;
    });
});