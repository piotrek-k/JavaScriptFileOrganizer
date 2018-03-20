var expect = require('chai').expect;
const path = require('path');
var main_app = require('../index').init(path.join(__dirname, "./playground"));
var fs = require('fs');
//var glob = require("glob")
var del = require('del');
var ncp = require('ncp').ncp;

const TEXT_TO_PUT_IN_CONTACT_JS = "CONTACT";
const PATH_TO_MAIN_FOLDER = path.join(__dirname, "../");
const PATH_TO_PLAYGROUND = "./test/playground";
const PATH_TO_TEST_RES = "./test/1_resources";
const PATH_TO_TEST2_RES = "./test/2_resources";
const PATH_TO_SCRIPTS = path.join(PATH_TO_PLAYGROUND, "./Scripts");
const PATH_TO_DEVELOPMENT = path.join(PATH_TO_PLAYGROUND, "./wwwroot/development");
const PATH_TO_VIEWS = path.join(PATH_TO_PLAYGROUND, "./Views");
const PATH_TO_JSTEMPLATES = path.join(PATH_TO_MAIN_FOLDER, "./JS_Templates");

console.log(PATH_TO_JSTEMPLATES);

describe('ensure_every_view_has_javascript', function () {
    before(function (done) {
        del(PATH_TO_PLAYGROUND)
            .then(function () {
                return ncp(PATH_TO_TEST_RES, PATH_TO_PLAYGROUND, function (err) {
                    if (err) {
                        return console.error(err);
                    }
                    main_app.ensure_every_view_has_javascript("./development", "scriptObjectForHtml.html");
                    done();
                });
            });
    });

    it('should create About.js file', function () {
        expect(fs.existsSync(path.join(PATH_TO_PLAYGROUND, "Scripts/About.js"))).to.be.true;
    });

    it('should create <script> tag in About.cshtml', function () {
        var fd = fs.openSync(path.join(PATH_TO_PLAYGROUND, "Views/About.cshtml"), "r");
        var fileContent = fs.readFileSync(fd, { encoding: 'utf8' });
        expect(main_app._privatesForTestPurposes.REGEX_DETECTING_SCRIPT_TEMPLATE_PRESENCE.test(fileContent)).to.be.true;
        fs.close(fd);
    });
});

describe('copy_to_wwwroot_wrap_in_containers', function () {
    // before(function (done) {
    //     console.log("before1");
    //     del(PATH_TO_PLAYGROUND).then(function(){
    //         console.log("Finished");
    //         done();
    //     });
    // });

    before(function (done) {
        ncp(PATH_TO_TEST2_RES, PATH_TO_PLAYGROUND, function (err) {
            if (err) {
                console.log("Err:" + err);
            }
            done();
        });
    });

    before(function (done) {
        main_app.copy_to_wwwroot_wrap_in_containers("./container.js");
        done();
    });

    it('should create wwwroot/development', function () {
        expect(fs.existsSync(PATH_TO_DEVELOPMENT)).to.be.true;
    });

    it('should wrap code from Contact.js', function () {
        //var template = fs.readFileSync(path.join(PATH_TO_JSTEMPLATES, "container.js"), { encoding: 'utf8' });
        var wantedEffect = fs.readFileSync(path.join("./test/", "2_wantedeffect/Contact.js"), { encoding: 'utf8' }).replace(/\s/g, "");
        // if (template != null) {
        //     template = template.replace("//[paste code here]", TEXT_TO_PUT_IN_CONTACT_JS).replace(/\s/g, "");
        // }

        var realFileValue = fs.readFileSync(path.join(PATH_TO_DEVELOPMENT, "/Home/Contact.js"), { encoding: 'utf8' }).replace(/\s/g, "");
        expect(realFileValue.trim()).to.be.equal(wantedEffect.trim());
    });

    it('should merge files with the same prefixes', function () {
        //TODO
        // e.g: /Scripts/Home/About.js and /Scripts/Home/About-second.js should all
        // be stored in /wwwroot/development/Home/About.js
        var wantedEffect = fs.readFileSync(path.join("./test/", "2_wantedeffect/About.js"), { encoding: 'utf8' }).replace(/\s/g, "");
        var realFileValue = fs.readFileSync(path.join(PATH_TO_DEVELOPMENT, "About.js"), { encoding: 'utf8' }).replace(/\s/g, "");
        expect(realFileValue.trim()).to.be.equal(wantedEffect.trim());
    });
});

//TODO: fix names of those tests
describe('regexes', function () {
    it('scriptObjectForHtml should return true while testing with regex', function () {
        var template = fs.readFileSync(path.join(PATH_TO_JSTEMPLATES, "scriptObjectForHtml.html"), { encoding: 'utf8' });
        expect(main_app._privatesForTestPurposes.REGEX_DETECTING_SCRIPT_TEMPLATE_PRESENCE.test(template)).to.be.true;
    });

    it('splitted js files should be correctly recognized', function () {
        var examplePath = "/path/to/file/About-something.js";
        expect(main_app._privatesForTestPurposes.REGEX_DETECTING_SPLIT_JS_FILES.test(examplePath)).to.be.true;
        var parts = examplePath.match(REGEX_DETECTING_SPLIT_JS_FILES);
        //console.log(parts);
        expect(parts[3]).to.be.equal("About");
        expect(parts[2]).to.be.equal("About-something");
    });
});