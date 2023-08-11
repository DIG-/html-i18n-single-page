(function () {
    const me = {};
    me.languages = null;

    me.flag_element = () => document.getElementById("flag");

    me.get_languages = function () {
        if (me.languages != null) {
            return Promise.resolve(me.languages);
        }
        return fetch("languages.json")
            .then((r) => r.json())
            .then((languages) => {
                me.languages = languages;
                return languages;
            });
    };

    me.fill_languages = function () {
        let flag_element = me.flag_element();
        Object.entries(me.languages)
            .filter(([_, data]) => data.flag != null)
            .forEach(([key, data]) => {
                let option = document.createElement("option");
                option.value = key;
                option.text = data.flag;
                flag_element.add(option);
            });
        return Promise.resolve(me.languages);
    };

    me.get_user_language = function (optional) {
        let languages = [];
        if (optional && (optional.length == 2 || optional.length == 5)) {
            languages.push(optional);
        } else {
            let from_location = window.location.hash;
            if (from_location.length == 6 || from_location.length == 3) {
                languages.push(window.location.hash.substring(1));
            } else {
                if (navigator.languages) {
                    languages = languages.concat(navigator.languages);
                } else {
                    languages.push(navigator.language);
                }
            }
        }
        languages.push("en"); // Add default

        const user_language = languages.find((language) => {
            if (me.languages[language]) {
                return true;
            } else if (language.length == 5) {
                if (me.languages[language.substring(0, 2)]) {
                    return true;
                }
            }
            return false;
        });
        return Promise.resolve(user_language);
    };

    me.resolve_language = function (language) {
        const selected = me.languages[language]
        if (selected) {
            if (selected.alias) {
                return me.resolve_language(selected.alias);
            } else {
                return Promise.resolve(language);
            }
        }
        return Promise.reject("Language \"" + language + "\" not found.");
    }

    me.load_language = function (language) {
        return fetch("_" + language + ".json")
            .then((r) => r.json())
            .then((translation) => {
                document.documentElement.setAttribute("lang", language);
                let elements = document.querySelectorAll("[data-i18n]");
                elements.forEach((element) => {
                    let key = element.dataset.i18n.split(".");
                    let value = key.reduce((o, i) => o[i], translation);
                    if (value) {
                        element.innerHTML = value;
                    }
                });
            });
    }

    me.get_languages()
        .then(() => me.fill_languages())
        .then(() => me.get_user_language())
        .then((language) => me.resolve_language(language))
        .then((language) => {
            let flag_element = me.flag_element();
            flag_element.value = language;
            flag_element.onchange = () => {
                me.load_language(flag_element.value)
                    .catch((reason) => {
                        alert("Failed to load language!");
                        console.error("Failed to load language.", reason);
                    });
            };
            return me.load_language(language);
        })
        .catch((reason) => console.error("Failed to load language.", reason));

})();