//Flag for the device whether this script is being used is an Android device
isAndroid = (typeof Android != 'undefined');

function formatDate(date) {
    var year = date.getFullYear();
    var month = padLeft((date.getMonth() + 1).toString(), "0", 2);
    var day = padLeft(date.getDate().toString(), "0", 2);
    var hour = padLeft(date.getHours().toString(), "0", 2);
    var minute = padLeft(date.getMinutes().toString(), "0", 2);
    var second = padLeft(date.getSeconds().toString(), "0", 2);
    var millisecond = padLeft(date.getMilliseconds().toString(), "0", 3);
    return year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second + '.' + millisecond;
}

function padLeft(source, pad, targetLength) {
    while (source.length < targetLength) {
        source = pad.concat(source);
    }
    return source;
}

function getCurrentDate() {
    var now = new Date();
    var year = now.getFullYear();
    var month = padLeft((now.getMonth() + 1).toString(), '0', 2);
    var day = padLeft(now.getDate().toString(), '0', 2);
    var hour = padLeft(now.getHours().toString(), '0', 2);
    var minute = padLeft(now.getMinutes().toString(), '0', 2);
    var second = padLeft(now.getSeconds().toString(), '0', 2);
    var millisecond = padLeft(now.getMilliseconds().toString(), '0', 3);
    return year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second + '.' + millisecond;
}

function getValue(name) {
    var cookieName = name + '=';
    var chunk = document.cookie.split(';');
    for (var i = 0; i < chunk.length; i++) {
        var c = chunk[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(cookieName) == 0) {
            return c.substring(cookieName.length, c.length);
        }
    }
    return '';
} 

function setValue(name, value) {
    var now = new Date();
    now.setHours(0, 0, 0, 0); // Reset to 12 midnight
    now.setTime(now.getTime() + (1 * 24 * 60 * 60 * 1000)); // 1 day expiry
    var expires = 'expires=' + now.toUTCString();
    document.cookie = name + '=' + value + '; ' + expires;
}

function save(file, eventName) {
    /* SFE RULE 10: No internet connection allowed. 
       Removing XMLHttpRequest to AWS and generating timestamp locally. */
    var localDate = getCurrentDate();
    saveData(file, eventName, localDate);
}

function saveData(file, eventName, date) {
    var name = 'pocketwise_html';
    var value = getValue(name);
    var json;
    
    if (value.length > 0) {
        json = JSON.parse(value);
    } else {
        json = {'details':[]};
    }

    if (isAndroid) {
        androidJson = {'file':file,'event':eventName,'timestamp':date};
        Android.saveCookie(JSON.stringify(androidJson));
    }

    json['details'].push({'file':file,'event':eventName,'timestamp':date});
    setValue(name, JSON.stringify(json));
}

function track() {
    // Injection of link clicks.
    var links = document.getElementsByTagName('a');
    for (var i = 0; i < links.length; i++) {
        var href = links[i].href.split('/').pop();
        if (href.indexOf('#') !== 0 && 
            ((href.indexOf('htm') !== ((href.length - 'htm'.length ) - 1)) 
                || (href.indexOf('html') !== ((href.length - 'html'.length) - 1)))) {
            links[i].onclick = function() {
                if (!isAndroid) {
                    save(this.href.split('/').pop(), 'open'); 
                } else {
                    //For Android devices
                    //trigger different event to open certain files
                    var dir = this.href.split('/').pop();
                    if(dir.indexOf('.pdf') != -1 
                        || dir.indexOf('.xls') != -1 
                        || dir.indexOf('.ppt') != -1) {
                        save(this.href, 'file');
                    } else {
                        save(dir, 'open');
                    }
                }
            };
        }
    }
    // Injection of video events.
    var videos = document.getElementsByTagName('video');
    for (var i = 0; i < videos.length; i++) {
        videos[i].onplay = function() { save(this.src.split('/').pop(), 'play'); };
        videos[i].onpause = function() { save(this.src.split('/').pop(), 'pause'); };
        videos[i].onended = function() { save(this.src.split('/').pop(), 'ended'); };
    }
    setTimeout(track, 250);
}

/* SFE RULE 11: Call track directly instead of using DOMContentLoaded or window.onload */
track();
