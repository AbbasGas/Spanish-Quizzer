// Declare global variables
let Sets;               // List of parsed sets
let app;



/**
 * Initialize the Vue app
 */
function loadVue() {
    app = new Vue({
        el: "#app", // Mount to app div

        data: {
            state: "home",
            darkTheme: document.body.classList.contains("dark"),
            verbFilters: [],
            vocabFilters: [],
            errorMsg: "",
            promptType: localStorage.getItem("promptType") || "Text",
            inputType: localStorage.getItem("inputType") || "Text",
            onMissedPrompt: localStorage.getItem("onMissedPrompt") || "Correct me",
            repeatPrompts: localStorage.getItem("repeatPrompts") || "Never",

            prompts: [],
            promptIndex: 0,
        },

        methods: {
            /**
             * Return to the previous state.
             */
            Back: function() {
                switch (app.state) {
                    case "verbQuizzer":
                        app.state = "verbSettings";
                        break;
                    case "vocabQuizzer":
                        app.state = "vocabSettings";
                        break;
                    case "verbSettings":
                    case "vocabSettings":
                    case "home":
                    default:
                        app.state = "home";
                        break;
                }
            },

            /**
             * Add a verb filter on the settings page.
             */
            AddVerbFilter: function() {
                this.verbFilters.push({tense:"All Tenses", type:"All Types", subject:"All Subjects", direction:"Eng. → Conj."});
            },

            /**
             * Remove a verb filter from the settings page.
             * @param {Number} index - The index of the verb filter.
             */
            RemoveVerbFilter: function(index) {
                // Remove filter
                this.verbFilters.splice(index, 1);
            },

            /**
             * Add a vocab filter on the settings page.
             */
            AddVocabFilter: function() {
                this.vocabFilters.push({set:"Verbs", type:"All Types", direction:"Eng. ↔ Esp."});
            },

            /**
             * Remove a vocab filter from the settings page.
             * @param {Number} index - The index of the vocab filter.
             */
            RemoveVocabFilter: function(index) {
                // Remove filter
                this.vocabFilters.splice(index, 1);
            },

            /**
             * Get the regularity filters available for a verb filter.
             * @param {Number} index - The index of the verb filter.
             * @returns {object} - An object with boolean properties for each regularity filter.
             */
            getTenseTypes: function(index) {
                // Get filter options
                let filters = {"All Types":true, "Reflexive":true, "Regular":true, "Nonregular":true, "Stem Changing":true, "Orthographic":true, "Irregular":true}
                switch(this.verbFilters[index].tense)
                {
                    case "All Tenses":
                        break;
                    case "Present Participles":
                        filters["Reflexive"] = false;       // Reflexive
                        filters["Orthographic"] = false;    // Orthographic
                        break;
                    case "Present Tense":
                        filters["Orthographic"] = false;    // Orthographic
                        break;
                    case "Preterite Tense":
                        break;
                    case "Imperfect Tense":
                        filters["Stem Changing"] = false;   // Stem Changing
                        filters["Orthographic"] = false;    // Orthographic
                        break;
                }

                // Reset type if needed
                if (!filters[this.verbFilters[index].type]) {
                    this.verbFilters[index].type = "All Types";
                }

                // Return filters
                return filters;
            },

            /**
             * Get the subject filters available for a verb filter.
             * @param {Number} index - The index of the verb filter.
             * @returns {object} - An object with boolean properties for each subject filter.
             */
            getTenseSubjects: function(index) {
                // Set default filters
                let filters = {"All Subjects":true, "Yo":true, "Tú":true, "Él":true, "Nosotros":true, "Ellos":true}
                
                if (this.verbFilters[index].tense === "Present Participles") {
                    // Override filters
                    filters["Yo"] = false;
                    filters["Tú"] = false;
                    filters["Él"] = false;
                    filters["Nosotros"] = false;
                    filters["Ellos"] = false;
                    
                    // Reset subject
                    this.verbFilters[index].subject = "All Subjects";
                }

                // Return filters
                return filters;
            },

            /**
             * Get the filters available for a vocab Set.
             * @param {Number} index - The index of the vocab filter.
             * @returns {Array} - An array containing available filters.
             */
            getSetFilters: function(index) {
                // Get filter options
                let filters = {"All Types":true, "Adjectives":true, "Nouns":true, "Verbs":true}
                switch(this.vocabFilters[index].set)
                {
                    case "Verbs":
                        filters["Adjectives"] = false;
                        filters["Nouns"] = false;
                        filters["Verbs"] = false;
                        break;
                    
                    case "Adjectives":
                        filters["Nouns"] = false;
                        filters["Verbs"] = false;
                        break;

                    case "Adverbs":
                        filters["Adjectives"] = false;
                        filters["Nouns"] = false;
                        filters["Verbs"] = false;
                        break;

                    case "Prepositions":
                    case "Transitions":
                    case "Questions":
                        filters["Adjectives"] = false;
                        filters["Nouns"] = false;
                        filters["Verbs"] = false;
                        break;
                    
                    case "Colors":
                        filters["Nouns"] = false;
                        filters["Verbs"] = false;
                        break;
                    
                    case "Days":
                    case "Months":
                        filters["Adjectives"] = false;
                        filters["Verbs"] = false;
                        break;
                    
                    case "Weather":
                    case "Professions":
                        filters["Adjectives"] = false;
                        break;

                    case "Family":
                    case "Clothes":
                        filters["Verbs"] = false;
                        break;
                    
                    case "Nature":
                    case "House":
                    case "Vacation":
                    case "Childhood":
                    case "Health":
                        break;
                }

                // Reset type if needed
                if (!filters[this.vocabFilters[index].type]) {
                    this.vocabFilters[index].type = "All Types";
                }

                // Return filters
                return filters;
            },

            /**
             * Get the language code that matches a label.
             * @param {String} label - The label.
             * @returns {String} - The language code ("en", "es", etc.)
             */
            getLang: function(label) {
                if (label.toLowerCase().includes("spanish")) {
                    return "es";
                }
                else {
                    return "en";
                }
            },

            /**
             * Update the user's progress in localStorage.
             * @param {Array} prompts - The list of prompts.
             * @param {Number} index - The index of the current prompt.
             */
            updateProgress: function(prompts, index) {
                // Get localStorage prefix
                let prefix;
                if (app.state === "vocabSettings" || app.state === "vocabQuizzer") {
                    prefix = "vocab-"
                }
                else if (app.state === "verbSettings" || app.state === "verbQuizzer") {
                    prefix = "verb-"
                }
                else {
                    return;
                }

                // Save progress to local storage
                localStorage.setItem(prefix + "prompts", JSON.stringify(prompts));
                localStorage.setItem(prefix + "prompt", JSON.stringify(index));
            }
        },

        watch: {
            /**
             * Update the app theme.
             */
            darkTheme: function(value) {
                SetTheme(value);
            },

            /**
             * Update the promptType setting in localStorage.
             * @param {String} value - The prompt type.
             */
            promptType: function(value) {
                localStorage.setItem("promptType", value);
            },

            /**
             * Update the inputType setting in localStorage.
             * @param {String} value - The input type.
             */
            inputType: function(value) {
                localStorage.setItem("inputType", value);
            },

            /**
             * Update the onMissedPrompt setting in localStorage.
             * @param {String} value - The onMissedPrompt setting value.
             */
            onMissedPrompt: function(value) {
                localStorage.setItem("onMissedPrompt", value);
            },

            /**
             * Update the repeatPrompts setting in localStorage.
             * @param {String} value - The repeat prompts setting value.
             */
            repeatPrompts: function(value) {
                localStorage.setItem("repeatPrompts", value);
            },

            /**
             * Clear the error message when the state changes.
             */
            state: function() {
                // Reset error message
                app.errorMsg = "";
            }
        },
    });
}



/**
 * Load the document.
 */
function Load() {
    // Call LoadPage method from global.js
    LoadPage();

    // Initialize the Vue app
    loadVue();

    // Unhide hidden divs
    // Divs were hidden to improve interface for users with JS blocked
    document.getElementById("home").hidden = false;
    document.getElementById("settings").hidden = false;
    document.getElementById("quizzer").hidden = false;
    document.querySelector("footer").hidden = false;

    // Add event Listeners
    document.addEventListener("keydown", KeyDown);

    // Load CSVs
    Sets = [];
    let setNames = ["Verbs", "Adjectives", "Adverbs", "Prepositions", "Transitions",
                    "Colors", "Days", "Months", "Questions", "Weather", "Family", "Clothes",
                    "Nature", "House", "Vacation", "Childhood", "Professions", "Health"];
    for (let setName of setNames) {
        Papa.parse(`vocab/${setName}.csv`, {
            download: true,
            complete: function(results) {
                // Set verbs
                Sets[setName] = results.data;
            }
        });
    }
}



/**
 * Handle a keyDown event (implements some keyboard shortcuts).
 * @param {object} e - The event args.
 */
function KeyDown(e) {
    if (e.key === "Escape") {
        app.Back();
    }

    // Home shortcuts
    if (app.state === "home") {
        if (e.key === "c") {
            app.state = "verbSettings";
        }
        if (e.key === "v") {
            app.state = "vocabSettings";
        }
        if (e.key === "r") {
            window.location = "reference.html";
        }
    }

    // Settings shortcuts
    if (app.state === "verbSettings" || app.state === "vocabSettings") {
        if (e.key === "s") {
            CreateSession();
        }
        if (e.key === "r") {
            ResumeSession();
        }
    }
}
