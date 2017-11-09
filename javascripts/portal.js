// NOTE you have to configure this!
var _pEXTERNAL_ASSETS = "http://www.brain-map.org/external_assets";

// Google Analytics
document.writeln("<script src='" + _pEXTERNAL_ASSETS + "/javascripts/ga.js'><\/script>");
document.writeln("<script src='" + _pEXTERNAL_ASSETS + "/javascripts/appConfig.js'><\/script>");

// NOTE this is a global hack to get the zap viewers to work
// NOTE the second rule is a hack to get zap tile borders to be invisible
document.writeln("<style>.simstripCont{white-space:nowrap} .zap_container img { transform:scale(1.005); }</style>");

/**
 * Protect window.console method calls, e.g. console is not defined on IE8, IE9
 * unless dev tools are open, and IE doesn't define console.debug
 * If 'console' is undefined, then it is defined and all possible console.* functions are defined,
 * but operationally do nothing. This prevents javascript exceptions in IE8, IE9.
 * Adapted from https://stackoverflow.com/questions/3326650/console-is-undefined-error-for-internet-explorer
 */
(function () {
    if (!window.console) {
        window.console = {};
    }
    // union of Chrome, FF, IE, and Safari console methods
    var m = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeStamp', 'trace', 'warn'
    ];
    // define undefined methods as noops to prevent errors
    for (var i = 0; i < m.length; i++) {
        if (!window.console[m[i]]) {
            window.console[m[i]] = function () {
            };
        }
    }
})();

var _pBrowserSupport = {

    // initialize with an object containing keys & values for browser names & versions such as:
    // {webkit:'602.1.50', msie:'11.0', firefox:'51.0', chrome:'56.0.2924.87'};

    //
    // "this.supported" means the current browser has version >= the minimum_list.
    // "this.not_supported" means the current browser is in the minimum_list and
    // has version less than that given.
    //
    // NOTE that both supported & not_supported may legitimately be false, if the
    // current browser is not in the list.
    initialize: function (minimum_list) {

        var userAgent = navigator.userAgent.toLowerCase();
        this.minimum_list = minimum_list ? minimum_list : {};
        this.version = (userAgent.match(/.+(?:rv|it|ra|ie|edge|me)[\/: ]([\d.]+)/) || [])[1];

        this.webkit = /webkit/.test(userAgent); // Safari
        this.opera = /opera/.test(userAgent);
        this.msie = /msie|trident/.test(userAgent) && !/opera/.test(userAgent); // only IE11 and lower uses trident rendering engine
        this.edge = /edge/.test(userAgent); // Microsoft Edge
        this.firefox = /firefox/.test(userAgent) && !/(trident|compatible|webkit)/.test(userAgent);
        this.chrome = /chrome/.test(userAgent);

        this.ie_compat_version = this.version; // is this used??

        // Note: IE browser version is based on the Trident rendering engine version number,
        // which is used on post IE7 browsers, and up to and including IE11.
        // Trident info: https://en.wikipedia.org/wiki/Trident_(layout_engine)
        if (this.msie) {
            var calcVersion = this._browserVersionFromTrident(userAgent);
            this.version = calcVersion ? calcVersion : this.version;
        }

        // MS Edge's agent string has other browser names included, so ignore the other names
        if (this.edge) {
            this.webkit = this.opera = this.msie = this.firefox = this.chrome = undefined;
        }

        this.extended_version = this._version_to_number(this.version);

        this.name = this.chrome ? 'chrome' : this.webkit ? 'webkit' : this.opera ? 'opera' : this.msie ? 'msie' : this.edge ? 'edge' : this.firefox ? 'firefox' : 'unknown';

        this.supported = this._is_supported(this.minimum_list);
        this.not_supported = this._is_not_supported(this.minimum_list);

        this.cookies = this._cookie_check();
        this.supported_flash = true; // old Adobe Flash checks
        this.flash_version = true; // old Adobe Flash checks
    },

    /**
     * Determine IE browser version based on Trident rendering engine version.
     * This is effective beginning with IE8, Trident4
     *
     * For IE8, Trident4, the versions of both browser and trident have incremented by one each all the way
     * up to and including IE11, Trident7
     * We will use this algorithm until it fails someday in the future, at which point the business logic
     * can be adjusted.
     *
     * @param {string} userAgent downcased version of the user agent string
     * @returns {string} [version number].0, or undefined if trident number is too low
     */
    _browserVersionFromTrident: function (userAgent) {
        var ieStart = 8;
        var tridentStart = 4;
        var ieVersion;

        var tridentMatch = userAgent.match(/trident\/(\d+)/);
        if (tridentMatch) {
            var tridentNum = parseInt(tridentMatch[1]);
            if (tridentNum >= tridentStart) {
                var delta = tridentNum - tridentStart;
                ieVersion = (ieStart + delta) + ".0";
            }
        }

        return ieVersion;
    },

    _is_not_supported: function (list) {

        for (var key in list) {
            if (key == this.name) {
                var supported_version = this._version_to_number(list[key]);

                if (supported_version.major > this.extended_version.major)
                    return (true);

                if ((supported_version.major == this.extended_version.major)
                    &&
                    (supported_version.minor > this.extended_version.minor))
                    return (true);

                if ((supported_version.major == this.extended_version.major)
                    &&
                    (supported_version.minor == this.extended_version.minor)
                    &&
                    (supported_version.build > this.extended_version.build))
                    return (true);
            }
        }
        return (false);
    },

    _is_supported: function (list) {
        for (var key in list) {
            if (key == this.name) {
                var supported_version = this._version_to_number(list[key]);

                if ((supported_version.major == this.extended_version.major)
                    &&
                    (supported_version.minor == this.extended_version.minor)
                    &&
                    (supported_version.build <= this.extended_version.build))
                    return (true);

                if ((supported_version.major == this.extended_version.major)
                    &&
                    (supported_version.minor <= this.extended_version.minor))
                    return (true);

                if (supported_version.major <= this.extended_version.major)
                    return (true);
            }
        }
        return (false);
    },

    _version_to_number: function (version) {

        var version_components = version ? version.split('.') : [0];
        var ret = {};

        ret.major = parseInt(version_components[0]);
        ret.minor = version_components.length > 1 ? parseInt(version_components[1]) : 0;
        ret.build = version_components.length > 2 ? parseInt(version_components[2]) : 0;
        return (ret);
    },

    _cookie_check: function () {

        var tmpcookie = new Date();
        var chkcookie = (tmpcookie.getTime() + '');
        document.cookie = "chkcookie=" + chkcookie + "; path=/";
        if (document.cookie.indexOf(chkcookie, 0) < 0)
            return (false);

        return (true);
    }
};

function _pSiteWarning() {

    this.warn_box_zindex = 100000; // make sure above SIV, Dual Viewer SIV
    this.warn_box = null;
    this.warn_content = '';
    this.warning_present = false;

    this.show_stats = function () {

        var msg = "Browser name: " + _pBrowserSupport.name;
        msg += "<br/>Version: " + _pBrowserSupport.version;
        msg += "<br/>IE compat version: " + _pBrowserSupport.ie_compat_version;
        msg += "<br/>Cookies enabled: " + _pBrowserSupport.cookies;
        add_warning(msg);
    };

    var _self = this;

    function create_warning_box() {

        _self.warn_box = document.createElement('div');
        _self.warn_box.setAttribute('id', 'version_warning_container');
        _self.warn_box.style.cssText = 'width:480px; height:74px; border:1px solid #f00; position:absolute; top:8px; left:260px;background-color:#fee;padding:6px;color:#c00' + ';z-index:' + _self.warn_box_zindex;
        document.body.appendChild(_self.warn_box);
    }

    function add_warning(msg) {

        if (!_self.warn_box)
            create_warning_box();

        // warn some other way?
        if (!_self.warn_box)
            return;

        _self.warn_content += msg;
        _self.warn_box.innerHTML = _self.warn_content;
    }

    function show_warning(browser_info) {

        var was_shown;
        var msg = "Your web browser does not meet one or more of the system requirements for this site:<ul id='_pWarnList' style='padding:0px; margin:0px;'>";

        if (!browser_info.supported)
            msg += "<li style='margin-left:22px;'>Your browser version is not supported.</li>";
        if (!browser_info.cookies)
            msg += "<li style='margin-left:22px;'>Your browser is configured to not allow cookies.</li>";
        msg += "</ul>";

        was_shown = warning_was_shown();
        if ((!browser_info.supported || !browser_info.cookies) && was_shown === false) {

            // if the legacy warning is already present, hide it.
            var old_warn = document.getElementById('js_cookie_check');
            if (old_warn)
                old_warn.style.cssText = "display:none";

            msg += "<div style='margin-top:4px;'>To see the minimum requirements for this site click <a href='javascript:_pShowSysReqs();'>here</a>.</div>";
            _self.warning_present = true;
            add_warning(msg);

            // update localStorage to indicate warning was shown once, so that we don't show again for this entire day
            update_warning_storage();
        }
    }

    function add_warning_closer() {

        if (!_self.warn_box)
            return;

        var style = "width:16px; height:16px; border:0px solid #a99; position:absolute; top:3px; right:3px; cursor:pointer";
        var src = _pEXTERNAL_ASSETS + "/images/close_x.png";
        _self.warn_content += "<img id='version_warning_closer' src='" + src + "' style='" + style + "'/>";
        _self.warn_box.innerHTML = _self.warn_content;

        var closer = document.getElementById('version_warning_closer');
        if (closer.addEventListener) {
            document.getElementById('version_warning_closer').addEventListener(
                'click',
                function () {
                    document.getElementById('version_warning_container').style.display = "none";
                },
                false);
        } else {
            document.getElementById('version_warning_closer').attachEvent(
                'onclick',
                function () {
                    document.getElementById('version_warning_container').style.display = "none";
                },
                false);
        }
    }

    /**
     * Checks localStorage to determine if the warning message was previously displayed.
     * This is based on the existence of a warning key with a valid and unexpired value.
     *
     * @returns {boolean} - true if warning previously shown, else false.
     */
    function warning_was_shown() {
        var already_shown = false;
        var new_key;
        var value;

        new_key = create_warning_key();
        if (value !== null) {
            if (is_warning_expired(new_key) === false) {
                already_shown = true;
            }
        }

        return already_shown;
    }

    /**
     * Check if warning is expired, which happens if the localStorage
     * value for the warning key is not equal to the expected key.
     * Contains business logic determining key inequality.
     *
     * @returns {boolean} true if expired, else false.
     */
    function is_warning_expired() {
        var expired = false;
        var days_duration = 7; // days
        var key;
        var DELIMITER = '_';
        var key_time;
        var new_time;
        var d;
        var expire_time;
        var d2;
        var current_time;

        key = find_existing_warning_key();

        if (key == '') {
            expired = true;
        } else {
            // get time component of existing key, it's the last delimited substring
            key_time = key.substring(key.lastIndexOf(DELIMITER) + 1);

            // add days_duration to the key time to get the expiration time
            d = new Date();
            d.setTime(parseInt(key_time));
            expire_time = d.setDate(d.getDate() + days_duration);

            // time right now
            d2 = new Date();
            current_time = d2.getTime();

            if (parseInt(current_time) > expire_time) {
                expired = true;
            }
        }

        return expired;
    }

    /**
     * Find the warning key appropriate for the current app and browser
     * Business logic: function understands components of the warning key
     *
     * @returns {string} - the located key , or empty string if not found
     */
    function find_existing_warning_key() {
        var found_key = '';
        var i;
        var len;
        var key;
        var app_id;
        var browser_id;
        var app_found;
        var browser_found;
        var warning_value = create_warning_value();

        app_id = _pTabId;
        browser_id = _pBrowserSupport.name + '_' + _pBrowserSupport.version;

        for (i = 0, len = localStorage.length; i < len; ++i) {
            key = localStorage.key(i);
            app_found = key.substring(app_id) === -1 ? false : true;
            browser_found = key.substring(browser_id) === -1 ? false : true;
            if (app_found && browser_found) {
                if (localStorage.getItem(key) === warning_value) {
                    found_key = key;
                    break;
                }
            }
        }

        return found_key;
    }
    /**
     * Creates a warning key based on web app, browser version and current time (milliseconds elapsed between 1 January 1970 00:00:00 UTC)
     * Business logic: function understands components of the warning key
     *
     * @returns {string} warning storage key
     */
    function create_warning_key() {
        var key = '';
        var DELIMITER = '_';
        var app_id;
        var browser_id;
        var d;
        var t;
        var time;


        app_id = _pTabId;
        browser_id = _pBrowserSupport.name + DELIMITER + _pBrowserSupport.version;

        d = new Date();
        t = d.getTime();
        time = t.toString();

        if (_pTabId) {
            key = app_id + DELIMITER + browser_id + DELIMITER + time;
        }

        return key;
    }

    /**
     * Delete existing warning key/values that correspond to the current web app and browser (ignoring the embedded date component)
     */
    function delete_existing_warning_key() {
        var key;

        key = find_existing_warning_key();
        localStorage.removeItem(key);
    }

    /**
     * Create the localStorage value for the 'warning shown' key
     *
     * @returns {string}
     */
    function create_warning_value() {
        var value = 'warning_shown';

        return value;
    }

    /**
     * Get web app's localStorage value
     *
     * @param {string} key - localStorage key
     * @returns {string|null} - 'warning was displayed' or null if value not found
     */
    function get_warning_storage_value(key) {
        var value = null;

        if (_pTabId && _pStorageAvailable) {
            value = localStorage.getItem(key);
        }

        return value;
    }

    /**
     * Removes existing warning storage key and value, and adds new key/value pair.
     * Key is a concatenation of app + browser + date
     *
     */
    function update_warning_storage() {
        var key;
        var value;

        if (_pStorageAvailable === false) {
            return;
        }

        delete_existing_warning_key();
        key = create_warning_key();
        value = create_warning_value();

        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.log("localStorage error for 'warning shown' key': " + e);
        }
    }

    function init() {

        _pBrowserSupport.initialize(_pSUPPORTED_BROWSERS);
        var url = document.URL;

        if (url.indexOf('show_browser_stats') >= 0)
            _self.show_stats();
        else {

            show_warning(_pBrowserSupport);
        }

        add_warning_closer();
    }

    init();
}

/**
 * See if localStorage, sessionStorage available in web browser
 * Code from https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
 *
 * @param {string} type - 'localStorage' or 'sessionStorage'
 * @returns {boolean} - true if available, else false
 */
function _pTryStorageAvailable(type) {

    try {
        var storage = window[type];
        var x = '__storage_test_using reasonable long key/value 2x4x6x8'; // 52 char
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch (e) {
        return false;
    }
}

var _pStorageAvailable; // boolean for web browser localStorage supported, initialized 'onLoad' handler
var _pSiteWarnings = null;
function _pShowFlashWarning() {
   // deprecated, possibly called by individual apps
}

function _pShowSysReqs() {

    var w = 640;
    var h = 405;
    var reqs_win = window.open('', '_blank', 'width='+w+',height='+h+',status=0,scrollbars=0,titlebar=0,location=0' );
    reqs_win.document.writeln("<script src='" + _pEXTERNAL_ASSETS + "/javascripts/browserVersions.js'><\/script>");
}

// event listeners for 'load/onload'
if (window.addEventListener) {
    window.addEventListener('load', function () {
        _pStorageAvailable = _pTryStorageAvailable('localStorage');
        if (!_pSiteWarnings) {
            _pSiteWarnings = new _pSiteWarning();
        }
    }, false);

} else if (window.attachEvent) {
    window.attachEvent('onload', function () {
        _pStorageAvailable = _pTryStorageAvailable('localStorage');
        if (!_pSiteWarnings) {
            _pSiteWarnings = new _pSiteWarning();
        }
    });
}

/*
 * JavaScript used by the ABA Portal.
 *
 * Configuration of the Portal app is done by setting values of the four arrays,
 * _pTabNames, _pTabLinks, _pMoreProjectsMenu, _pFooterLinks
 *
 * Note on IE browser support - needed to put in a hack in _pGetPosOffset() for IE versions > v5
 * browsers. May need to tweak hack for future versions of IE.
 */

//********************************************
//******** define constants for site search ********
//********************************************
var _pSiteSearchUrl  = "http://www.brain-map.org/search/index.html?query=";
var _pSiteSearchButton = "pSiteSearchButton";
var _pSiteSearchTextInput = "pSiteSearchTextInput";

//*****************************************************************
//****** define all tab names, this determines            ********
//****** what is displayed as tab text                    ********
//****** (index is tab CSS ID)                            ********
//****** Note: order of appearance of main menu items is  ********
//****** determined in portalHeader.js                    ********
//****************************************************************
var _pTabNames = [];
// top level menu tabs
_pTabNames["pHome"] = "Home";
_pTabNames["pAnnouncements"] = "Get Started";
_pTabNames["pData"] = "Data";
_pTabNames["pTools"] = "Tools";

// submenus in Get Started
_pTabNames["pOverview"] = "Overview";
_pTabNames["pTutorials"] = "Tutorials";
_pTabNames["pHighlights"] = "Data Highlights";

// submenus in Data
_pTabNames["pMouseBrain"] = "Mouse Brain";
_pTabNames["pDevelopingMouseBrain"] = "Developing Mouse Brain";
_pTabNames["pMouseSpinalCord"] = "Mouse Spinal Cord";

_pTabNames["pHuman"] = "Human Brain";
_pTabNames["pDevelopingHumanBrain"] = "Developing Human Brain";
_pTabNames["pGlioblastoma"] = "Glioblastoma";
_pTabNames["pAgingDementiaTBI"] = "Aging, Dementia and TBI";

_pTabNames["pNonHumanPrimate"] = "Non-Human Primate";

_pTabNames["pMouseConnectivity"] = "Mouse Connectivity";
_pTabNames["pCellTypes"] = "Cell Types";
_pTabNames["pBrainObservatory"] = "Brain Observatory";

// submenus in Tools
_pTabNames["pProductOverview"] = "Overview";
_pTabNames["pAtlas"] = "Reference Atlases";
_pTabNames["pAPI"] = "API";
_pTabNames["pSDK"] = "SDK";

// no longer used!
_pTabNames["pMoreProjects"] = "More";
_pTabNames["pSleep"] = "Sleep";
_pTabNames["pMouseDiversity"] = "Mouse Strains";
_pTabNames["pCaseStudies"] = "Case Study";
_pTabNames["pHelp"] = "Help";



//*************************************
//****** define tab link urls  ********
//****** (index is tab CSS ID) ********
//*************************************
var _pTabLinks = [];
_pTabLinks["pHome"] = "http://www.brain-map.org";
_pTabLinks["pMouseBrain"] = "http://mouse.brain-map.org";
_pTabLinks["pMouseSpinalCord"]  = "http://mousespinal.brain-map.org";
_pTabLinks["pDevelopingMouseBrain"]  = "http://developingmouse.brain-map.org";
_pTabLinks["pHuman"]  = "http://human.brain-map.org";
_pTabLinks["pDevelopingHumanBrain"] = "http://www.brainspan.org";
_pTabLinks["pMouseConnectivity"]  = "http://connectivity.brain-map.org";
_pTabLinks["pNonHumanPrimate"]  = "http://www.blueprintnhpatlas.org";
_pTabLinks["pGlioblastoma"]  = "http://glioblastoma.alleninstitute.org";
_pTabLinks["pCellTypes"]  = "http://celltypes.brain-map.org/";
_pTabLinks["pAgingDementiaTBI"]  = "http://aging.brain-map.org/";
_pTabLinks["pBrainObservatory"]  = "http://observatory.brain-map.org/visualcoding";

_pTabLinks["pAnnouncements"]  = "http://www.brain-map.org/announcements/index.html";
_pTabLinks["pOverview"]  = "http://www.brain-map.org/overview/index.html";
_pTabLinks["pTutorials"]  = "http://www.brain-map.org/tutorials/index.html";
_pTabLinks["pHighlights"]  = "http://www.brain-map.org/highlights/index.html";
_pTabLinks["pCaseStudies"]  = "http://casestudies.brain-map.org/ggb";
_pTabLinks["pAPI"]  = "http://www.brain-map.org/api/index.html";
_pTabLinks["pSDK"] = "http://alleninstitute.github.io/AllenSDK";
_pTabLinks["pProductOverview"] = "http://www.alleninstitute.org/what-we-do/brain-science/research/products-tools/";
_pTabLinks["pAtlas"]  = "http://atlas.brain-map.org";
_pTabLinks["pHelp"]  = "http://help.brain-map.org";

// note: _pTabLinkTargets is a separate table because _pTabLinks values are accessed directly by some of the apps.
var _pTabLinkTargets = [];
_pTabLinkTargets["pHome"] = '_self';
_pTabLinkTargets["pMouseBrain"] = '_self';
_pTabLinkTargets["pMouseSpinalCord"] = '_self';
_pTabLinkTargets["pDevelopingMouseBrain"] = '_self';
_pTabLinkTargets["pHuman"] = '_self';
_pTabLinkTargets["pDevelopingHumanBrain"] = '_blank';
_pTabLinkTargets["pMouseConnectivity"] = '_self';
_pTabLinkTargets["pNonHumanPrimate"] = '_blank';
_pTabLinkTargets["pGlioblastoma"] = '_blank';
_pTabLinkTargets["pCellTypes"] = '_self';
_pTabLinkTargets["pAgingDementiaTBI"] = '_blank';
_pTabLinkTargets["pBrainObservatory"] = '_self';

_pTabLinkTargets["pAnnouncements"] = '_self';
_pTabLinkTargets["pOverview"] = '_self';
_pTabLinkTargets["pTutorials"] = '_self';
_pTabLinkTargets["pHighlights"] = '_self';
_pTabLinkTargets["pCaseStudies"] = '_blank';
_pTabLinkTargets["pAPI"] = '_self';
_pTabLinkTargets["pSDK"] = '_blank';
_pTabLinkTargets["pProductOverview"] = '_blank';
_pTabLinkTargets["pAtlas"] = '_blank';
_pTabLinkTargets["pHelp"] = '_blank';

// clicking on Top Level Tabs actually take you to a page
var _pIsTopLevelTab = {
    "pHome": true,
    "pAnnouncements": true, // now called 'GET STARTED'
    "pHelp": true // no longer used as of Oct 2016
};

//****************************************************
//****** define the apps with custom headers  ********
//****** These are co-branded apps, so they   ********
//****** won't have the Portal top-level menu ********
//****************************************************
var _pCustomHeaders = [
        "pAgingDementiaTBI",
        "pGlioblastoma",
        "pNonHumanPrimate"
    ];

//**************************************************************************
//****** define the "More Projects" drop down menu items and links  ********
//****** 'items' property has array of values: name, link, target   ********
//****** The 'target' value is optional, can be '_blank', '_self'   ********
//
//       Note: this hash and array are probably no longer used
//**************************************************************************
var _pMoreProjectsMenu = {divclass: 'pDropDownMenu', inlinestyle: '', linktarget: '_self'};
_pMoreProjectsMenu.items = [
    [_pTabNames["pDevelopingHumanBrain"], _pTabLinks["pDevelopingHumanBrain"], "_blank"],
    [_pTabNames["pGlioblastoma"], _pTabLinks["pGlioblastoma"], "_blank"],
    [_pTabNames["pNonHumanPrimate"], _pTabLinks["pNonHumanPrimate"], "_blank"],
    [_pTabNames["pMouseSpinalCord"], _pTabLinks["pMouseSpinalCord"]],
    [_pTabNames["pMouseDiversity"], _pTabLinks["pMouseDiversity"]],
    [_pTabNames["pSleep"], _pTabLinks["pSleep"]]
];

//****************************************
//****** define the header links *********
//****************************************
var _pHeaderLinks = new Object();


//****************************************
//****** define the footer links *********
//****************************************
var _pFooterLinks = [];
_pFooterLinks["pPrivacyPolicy"] = "http://alleninstitute.org/legal/privacy-policy/";
_pFooterLinks["pTermsOfUse"] = "http://alleninstitute.org/legal/terms-use/";
_pFooterLinks["pCitationPolicy"] = "http://alleninstitute.org/legal/citation-policy/";
_pFooterLinks["pAbout"] = "http://alleninstitute.org/about/";
_pFooterLinks["pContactUs"] = "http://allins.convio.net/site/PageServer?pagename=send_us_a_message";
_pFooterLinks["pFooterLogo"] = "http://alleninstitute.org/";
_pFooterLinks["pPublications"] = "http://alleninstitute.org/what-we-do/brain-science/research/scientific-publications/";

_pFooterLinks["pFacebook"] = "http://www.facebook.com/AllenInstitute";
_pFooterLinks["pTwitter"] = "http://twitter.com/Allen_Institute";
_pFooterLinks["pYouTube"] = "https://www.youtube.com/user/AllenInstitute";
_pFooterLinks["pLinkedIn"] = "https://www.linkedin.com/company/allen-institute?trk=extra_biz_viewers_viewed";


/*
 * Checks to ensure global javascript vars _pImagePath, _pMoreProjectsId, _pTabId are defined,
 * then uses _pTabId to select the designated project tab.
 *
 * This function needs to be called directly from the host HTML page, in response to a JavaScript "onload"
 * event.
 *
 * Valid values of _pTabId are:
 *   pHome, pMouseBrain, pMouseSpinalCord, pDevelopingMouseBrain, pHumanBrain, pMoreProjects, pSleep, etc.
 */
function _pPortalOnLoad() {
    // ***** use javascript vars defined on main HTML page: _pTabId, _pMoreProjectsId, _pImagePath ********
    // ***** Note: pImagePath must end in a "/" ********

    var error;
    var theTab;

    // validate _pImagePath
    try {
        if (_pImagePath) {
            if (_pImagePath.charAt(_pImagePath.length - 1) != "/") {
                throw "noSlash";
            }
        }
        else if (_pImagePath == undefined) {
            throw "undefined";
        }
        else if (_pImagePath == "") {
            throw "emptyString";
        }
    }
    catch (error) {
        if (error == "noSlash") {
            alert("Javascript var _pImagePath needs to be terminated with a '/'");
        }
        else if (error == "emptyString") {
            alert("Javascript var _pImagePath is an empty String");
        }
        else {
            alert("Javascript var _pImagePath is undeclared or undefined");
        }
        return;
    }

    // validate _pMoreProjectsId
    try {
        if (_pMoreProjectsId) {
            // do nothing, it has a value
        }
        else if (_pMoreProjectsId == undefined) {
            throw "undefined";
        }
        else if (_pMoreProjectsId == "") {
            throw "emptyString";
        }
    }
    catch (error) {
        if (error == "emptyString") {
            alert("Javascript var _pMoreProjectsId is an empty String");
        }
        else {
            alert("Javascript var _pMoreProjectsId is undeclared or undefined");
        }
        return;
    }

    // validate application's Portal tab
    try {
        if (_pTabId) {
            // co-branded apps have unique menus that won't have Allen Institute menu tabs
            for (var i = 0; i < _pCustomHeaders.length; ++i) {
                if (_pCustomHeaders[i] == _pTabId) {
                    return;
                }
            }

            var tabName = _pTabNames[_pTabId];
            theTab = _pSetSelectedTab(_pTabId, "pTabSelected", tabName);
        }
        else if (_pTabId == undefined) {
            throw "undefined";
        }
        else if (_pTabId == "") {
            throw "emptyString";
        }
    }
    catch (error) {

        if (error == "null") {
            alert("Element for menu item _pTabId = " + _pTabId + " was not found in the DOM");
        }
        else if (error == "emptyString") {
            alert("Javascript var _pTabId is an empty String");
        }
        else {
            alert("_pTabId is undeclared or undefined");
        }
        return;
    }
}


/*  
 Set the visual state of the current page's tab menu and/or submenu.
 NOTE that whenever we select a tab we have just loaded a new page,
 so I'm not worrying about UNselecting anything here.
 */
function _pSetSelectedTab(id) {

    var menu = document.getElementById(id);

    // nav item are being treated differently depending on whether they are
    // top-level tabs menus or flyout submenu items.
    if (_pIsTopLevelTab[id]) {

        // top-level tabs are simple, add the class that
        // (currently) just changes the color of the text.
        menu.parentNode.className += " portal_tab_active";
    }
    else {

        // In this case we want to change the text of the menu header tab
        // and replace it with the name of the flyout submenu item
        var submenu = document.getElementById(id);
        var tab_id = submenu.getAttribute("menutabid");

        var tab_menu = document.getElementById(tab_id);
        tab_menu.innerHTML = _pTabNames[id]; // replace with submenu name
        tab_menu.parentNode.className += " portal_menu_active";

        // now highlight the submenu item that's selected in the flyout.
        submenu.className += " portal_menu_item_active";
    }

    return (menu);
}

/* turn "More Projects" triangle green on mouseover */
function _pTriangleMouseOver() {
    if (document.images)
        document._pTriangle.src = _pImagePath + "arrow_over.gif";
}

/* restore "More Projects" triangle image on mouseout */
function _pTriangleMouseOut() {
    if (document.images) {
        if (_pTabId == _pMoreProjectsId) {
            // white triangle (tab selected)
            document._pTriangle.src = _pImagePath + "arrow_on.gif";
        }
        else {
            // blue triangle (tab unselected)
            document._pTriangle.src = _pImagePath + "arrow_off.gif";
        }
    }
}

/* detect Enter/Return key press in Site Search Text input widget,
 * then simulate a click on the Site Search button.
 */
function doSiteSearchKeyPress(e) {
    // look for window.event in case event isn't passed in
    e = e || window.event;
    if (e.keyCode == 13) {
        document.getElementById(_pSiteSearchButton).click();
    }
}

/* build Site Search URL and open page */
function doSiteSearch() {
    var queryString;
    var searchInput = document.getElementById(_pSiteSearchTextInput);
    //auto select the passed qc facet
    var auto_select_facet = "&fa=false&e_sp=t&e_ag=t&e_tr=t&e_fa=t";

    if (searchInput != null) {
        queryString = searchInput.value;
    }

    if ((queryString != null) && (queryString.length > 0)) {
        location.href = _pSiteSearchUrl + encodeURIComponent(queryString) + auto_select_facet;
    }
    else {
        location.href = _pSiteSearchUrl + auto_select_facet;
    }

}
