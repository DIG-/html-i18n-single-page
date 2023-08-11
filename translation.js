(function () {
    const me = {};
    me.languages = null;

    me.flag_element = () => document.getElementById("flag");

    me.get_languages = async () => me.languages != null ? me.languages :
        fetch("languages.json")
            .then((r) => r.json())
            .then((languages) => {
                me.languages = languages;
                return languages;
            });

    me.fill_languages = async () => {
        let flag_element = me.flag_element();
        Object.entries(me.languages)
            .filter(([_, data]) => data.flag != null)
            .forEach(([key, data]) => {
                let option = document.createElement("option");
                option.value = key;
                option.text = data.flag;
                flag_element.add(option);
            });
        return me.languages;
    };

    me.get_user_language = async (optional) => {
        let languages = [];
        if (optional && (optional.length == 2 || optional.length == 5)) {
            languages.push(optional);
        } else if (navigator.languages) {
            languages = languages.concat(navigator.languages);
        } else {
            languages.push(navigator.language);
        }
        languages.push(document.documentElement.getAttribute("lang") || "en"); // Default language at startup

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
        return user_language;
    };

    me.resolve_language = async (language) => {
        const selected = me.languages[language]
        if (selected) {
            if (selected.alias) {
                return me.resolve_language(selected.alias);
            } else {
                return language;
            }
        }
        return Promise.reject("Language \"" + language + "\" not found.");
    }

    me.walk = (source, keys) => {
        var current = source;
        keys.forEach((key) => {
            if (current) {
                current = current[key];
            }
        })
        return current;
    }

    me.load_language = async (language) => fetch("_" + language + ".json")
        .then((r) => r.json())
        .then((translation) => {
            document.documentElement.setAttribute("lang", language);
            let elements = document.querySelectorAll("[data-i18n]");
            elements.forEach((element) => {
                let keys = element.dataset.i18n.split(".");
                let value = me.walk(translation, keys);
                if (value) {
                    element.innerHTML = value;
                }
            });
        });

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