var fakeStorage = {
    _data: {},

    setItem: function (id, val) {
        return this._data[id] = String(val);
    },

    getItem: function (id) {
        return this._data.hasOwnProperty(id) ? this._data[id] : undefined;
    },

    removeItem: function (id) {
        return delete this._data[id];
    },

    clear: function () {
        return this._data = {};
    }
};

var localStorageSupported = function () {
    var testKey = "test";
    var storage = window.localStorage;

    try {
        storage.setItem(testKey, "1");
        storage.removeItem(testKey);
        return true;
    } catch (error) {
        return false;
    }
};

var support = localStorageSupported()
if(support){
    module.exports = window.localStorage;
}else{
    module.exports = fakeStorage;
    console.log("NB: local storage not supported");
}

module.exports.localStorageSupported = support;



