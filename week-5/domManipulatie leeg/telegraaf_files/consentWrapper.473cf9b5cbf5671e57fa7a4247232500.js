//Predefines an empty TMG consent variable so telegraaf will work as usual when consent libraries can not be loaded
TMG = {
    check: function(condition) {
        return true
    },
    consentUrl: 'alert("Something went wrong...")',
    upgrade: function() {
        return true;
    },
    _process: function(c) {
        return true;
    },
    consentOnline: false
}

function consent_level() {
    // checks the telegraaf.nl predefined consent level
    if (TMG.check('essential') && TMG.check('functional') && TMG.check('advertising') && TMG.check('analytics')) {
        if (TMG.check('advertising_network')) {
            if (TMG.check('social') && TMG.check('advertising_targeting')) {
                return 3;
            }
            return 2;
        }
        return 1;
    }
    return 0; // should never happen
}


// Prepare Audience Science
function DM_prepClient(csid, client) {
    if ("undefined" === typeof TMG || "undefined" === typeof TMG.consentOnline || TMG.consentOnline != true) {
        return;
    }

    switch (consent_level()) {
        case 1:
            DM_addEncToLocWrapper('optin', 'btnotpossible', client);
            break;
        case 2:
            DM_addEncToLocWrapper('optin', 'tmgcandobt', client);
            break;
        case 3:
            DM_addEncToLocWrapper('optin', 'externalpartieslive', client);
            if (typeof(intentsegments) != 'undefined' && typeof(intentsegments[0]) != 'undefined') {
                for (i = 0; i < intentsegments.length; i++) {
		    DM_addEncToLocWrapper(intentsegments[i], '1',client);
                }
            }
            break;
        default:
            // should never happen
            break;
    }
    return;
}

function DM_addEncToLocWrapper(n, v, client) {
    if ("undefined" != typeof client) {
        client.DM_addEncToLoc(n, v);
    } else {
        DM_addEncToLoc(n, v);
    }

}
