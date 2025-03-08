console.log("Running Script.js")

function getHash(text) {
    const hashHex = sha256(text); // Compute the SHA-256 hash as a hex string
    return "TXT_" + hashHex.substring(0, 30);
}

function shuffleOptions() {
  const parent = document.getElementById('question').parentElement;
  const options = Array.from(document.querySelectorAll('.opt_div'));
  const explanation = document.getElementById('explanation');
  const click_explainer = document.getElementById('click-explainer');
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  options.forEach(option => parent.appendChild(option));
  parent.appendChild(click_explainer);
  parent.appendChild(explanation);
}

const SCORE = {
    isShowScore: true,
    isQuestionAnswered: false,
    isQuestionAnsweredCorrectly: false,
    num_correct: 0,
    num_incorrect: 0,
    get_perc(){
        const total = this.num_correct + this.num_incorrect
        if (total === 0) {
            return ""
        } else {
            const perc = Math.floor(100 * (this.num_correct / total))
            return perc 
        }

    },
    renderScore(){
        if (this.isShowScore === false) {
            document.querySelector("#category").innerHTML = "Question: " + STATE._questions[STATE._index]["id"]
        } else {
            const tmp = Math.floor(this.num_correct) + " of " + Math.floor(this.num_correct + this.num_incorrect) + " (" + this.get_perc() + "%)"
            document.querySelector("#category").innerHTML = tmp
        }
    }
}

const STATE = {
    _questions: [{"Question": "", "RightAnswer": "", "WrongAnswers": "", "Explanation": ""}],
    _index: 0,
    _voices: [],
    _category: "ALL",
    _voice: "echo",
    _isPhonetic: true,
    _isRepeat: true,    
    _isSoftMuted: false,
    _isHardMuted: true,
    _mapVoiceNames: {
            // Edge
            "Ava": "Microsoft Ava Online (Natural) - English (United States)",
            "Andrew": "Microsoft Andrew Online (Natural) - English (United States)",
            "Emma": "Microsoft Emma Online (Natural) - English (United States)",
            "Brian": "Microsoft Brian Online (Natural) - English (United States)",
            "Ana": "Microsoft Ana Online (Natural) - English (United States)",
            "Aria": "Microsoft Aria Online (Natural) - English (United States)",
            "Chris": "Microsoft Christopher Online (Natural) - English (United States)",
            "Eric": "Microsoft Eric Online (Natural) - English (United States)",
            "Guy": "Microsoft Guy Online (Natural) - English (United States)",
            "Jenny": "Microsoft Jenny Online (Natural) - English (United States)",
            "Michelle": "Microsoft Michelle Online (Natural) - English (United States)",
            "Roger": "Microsoft Roger Online (Natural) - English (United States)",
            "Steffan": "Microsoft Steffan Online (Natural) - English (United States)",
            // Chrome
            "UK Male": "Google UK English Male",
            "US Female": "Google US English",            
            "UK Female": "Google UK English Female",
    },

    increase_prob() {
        const key = this._questions[this._index]["Question"]
        localStorage.setItem(key, 1)
    },
    
    decrease_prob() {
        const old_val = this.get_prob()
        const new_val = old_val / 10
        const key = this._questions[this._index]["Question"]
        localStorage.setItem(key, new_val)
    },

    get_prob() {
        const key = this._questions[this._index]["Question"]
        const tmp = localStorage.getItem(key)
        const num = (tmp === undefined || tmp === null || tmp === 0) ? 0.1 : Number(tmp)
        return num
    },

    get_text_to_read(){
        if (document.querySelector("#explanation_text").innerHTML.trim() === ""){
            // return document.querySelector("#question_text").innerHTML.trim()
            return this._questions[this._index]["Question"]
        } else {
            // return document.querySelector("#explanation_text").innerHTML.trim()
            return this._questions[this._index]["Explanation"]
        }
        
    },

    next_question(){
        SCORE.isQuestionAnswered = false;
        SCORE.isQuestionAnsweredCorrectly = false;
        document.querySelector("#opt01").classList.remove('green_div');
        document.querySelector("#opt02").classList.remove('red_div');
        document.querySelector("#opt03").classList.remove('red_div');
        document.querySelector("#opt04").classList.remove('red_div');
        document.querySelector("#explanation_text").innerHTML = ""
        document.querySelector("#click-explainer").firstElementChild.innerHTML = ""
        shuffleOptions()

        if (this._isRepeat === true) {
            this._index = Math.floor(Math.random() * this._questions.length)
        } else {
            this._index = this._index + 1;
            if (this._index === this._questions.length) {
                this._index = 0;
            }
        }
        const prob_limit = Math.random()
        const prob = this.get_prob()
        if (prob_limit < prob) {
            console.log(">>> " + this.get_prob())
            this.refresh_text()
            play()
            return
        } else {
            this.next_question()
            return
        }
    },

    show_explanation(){
        if (window.showExplainer === undefined) {
            document.querySelector("#click-explainer").firstElementChild.innerHTML = "[Click below to move to the next question]"
            window.showExplainer = "Don't show click explainer again"
        } else {
            document.querySelector("#click-explainer").style.margin = 0
            document.querySelector("#click-explainer").style.padding = 0
            document.querySelector("#click-explainer").style.height = 0
            document.querySelector("#click-explainer").style.minHeight = "20px";
        }
        const explantion = this._questions[this._index]["trans_Explanation"]
        document.querySelector("#explanation_text").innerHTML = explantion
        play()
    },

    load_voices(){
        this._voices = window.speechSynthesis.getVoices().filter(voice => {
            return Object.values(this._mapVoiceNames).includes(voice.name)
        });
    },

    get voice(){
        return this._voice
    },

    set voice(value){
        this._voice = value
    },

    get isPhonetic(){
        return this._isPhonetic
    },

    set isPhonetic(value){
        this._isPhonetic = !!value
        this.refresh_text()
    },

    get isRepeat(){
        return this._isRepeat
    },

    set isRepeat(value){
        this._isRepeat = !!value
        this.refresh_repeat()
    },

    get isSoftMuted(){
        return this._isSoftMuted
    },

    set isSoftMuted(value){
        this._isSoftMuted = !!value
        this.refresh_SoftMuted()
    },

    get isHardMuted(){
        return this._isHardMuted
    },

    set isHardMuted(value){
        this._isHardMuted = !!value
        this.refresh_HardMuted()
    },

    get_mode_text(){
        if (this._isPhonetic) {
            return "tran"
        } else {
            return "text"
        }
    },

    toggleSpellingMode(){
        this._isPhonetic = !this.isPhonetic;
        this.refresh()
    },

    next_voice() {
        if (this._voices.length !== 0) {
            const index = this._voices.indexOf(this._voice)
            if (index === -1 && this._voice !== "echo") {
                this._voice = "echo"
            } else if (index === -1 ) {
                this._voice = this._voices[0]
            } else if  (index === this._voices.length - 1) {
                this._voice = "echo"
            } else {
                this._voice = this._voices[index + 1]
            }
        } else {
            this._voice = "echo"
        }
        this.refresh_voice()
        play()
    },

    refresh_voice() {
        if (this._voice === "echo") {
            document.querySelector("#voice").innerHTML = "echo"
        } else {
            document.querySelector("#voice").innerHTML = Object.keys(this._mapVoiceNames).find(key => this._mapVoiceNames[key] === this._voice.name)
        }
    },

    refresh_text() {
        SCORE.renderScore()
        document.querySelector("#question_text").innerHTML =  this._questions[this._index]["trans_Question"]
        document.querySelector("#opt01_text").innerHTML = this._questions[this._index]["trans_RightAnswer"]
        try {
            document.querySelector("#opt02_text").innerHTML = this._questions[this._index]["trans_WrongAnswers"][0]
            document.querySelector("#opt03_text").innerHTML = this._questions[this._index]["trans_WrongAnswers"][1]
            document.querySelector("#opt04_text").innerHTML = this._questions[this._index]["trans_WrongAnswers"][2]
        } catch {
            console.log("# Error")
        }
        // if (this._isPhonetic){
        //     document.querySelector("#text").innerHTML = this.sentence.ipa.replace(":", "<br><br>")
        // } else {
        //     document.querySelector("#text").innerHTML = this.sentence.txt.replace(":", "<br><br>")
        // }
    },

    refresh_repeat(){
        if (this._isRepeat){
            document.querySelector("#repeat").innerHTML = get_ICON("si_repeat")
        } else {
            document.querySelector("#repeat").innerHTML = get_ICON("no_repeat")
        }
    },

    refresh_HardMuted(){
        if (this._isHardMuted){
            document.querySelector("#sound").innerHTML = get_ICON("no_sound")
            pause_play()
        } else {
            document.querySelector("#sound").innerHTML = get_ICON("si_sound")
            play()
        }
    },

    refresh_SoftMuted(){
        if (this._isSoftMuted){
            document.querySelector("#sound").innerHTML = get_ICON("no_sound")
            pause_play()
        } else {
            document.querySelector("#sound").innerHTML = get_ICON("si_sound")
            play()
        }
    },

    refresh_text_mode(){
        if (this._isPhonetic){
            document.querySelector("#text_mode").innerHTML = "æ"
        } else {
            document.querySelector("#text_mode").innerHTML = "a"
        }
    },

    refresh_category(){
        // document.querySelector("#category").innerHTML = this._category
    },

    refresh(){
        this.refresh_text_mode()
        this.refresh_text()
        this.refresh_repeat()
        this.refresh_HardMuted()
        this.refresh_voice()
        this.refresh_category()
    },

    next_category(){
        // "C001", "C002", "ALL", "TheRestauration", "battles", "difficult", "questions001", "questions002", "TheGloriousRevolution"
        const categories = ["ALL"] 
        const index = categories.indexOf(this._category)
        this._category = categories[(index + 1) % categories.length]
        this._index = 0
        read_data()
    }
}

// function trimText(elementSelector) {
//     let loop = 0
//     const isOverflown = ({ clientWidth, scrollWidth }) => scrollWidth > clientWidth;
//     const element = document.querySelector(elementSelector)
//     while (isOverflown(element) && element.innerHTML.length > 6 && loop < 500) {
//         element.innerHTML = element.innerHTML.slice(0, -5) + " ..."
//         loop += 1
//     }
// }

// function trimElementText(element) {
//     let loop = 0
//     const isOverflown = ({ clientWidth, scrollWidth }) => scrollWidth > clientWidth;
//     const tmp = {
//         a: element.clientWidth,
//         b: element.scrollWidth,
//         c: isOverflown(element),
//         d: element.innerHTML.length
//     }
//     while (isOverflown(element) && element.innerHTML.length > 6 && loop < 500) {
//         element.innerHTML = element.innerHTML.slice(0, -5) + " ..."
//         loop += 1
//     }
// }

function read_data(){
    const jsonFilePath = `./data/questions/${STATE._category}.json`;
    fetch(jsonFilePath).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json(); // Parse the JSON data
    }).then(data => {
        console.log('JSON data:', data);
        STATE._questions = data;
        STATE.refresh();
        STATE.next_question();
    }).catch(error => {
        console.error('Error loading JSON file:', error);
    });
}

// function openInNewTab(url) {
//     let newTab = document.createElement('a');
//     newTab.href = url;
//     newTab.target = "_blank";
//     newTab.click();
// }

// function get_filters(){
//     const url = "./filters/filters.txt"
//     const filters_text = get_text(url)
//     return filters_text.split("\n").filter(line => {
//         return line.slice(0, 3) === "[o]"
//     }).reduce((acc, line) => {
//         const BXXXCXXX = line.slice(4, 12)
//         acc[BXXXCXXX] = line
//         return acc
//     }, {})
// }

// function* enumerate(iterable) {
//     let index = 0;
//     for (const item of iterable) {
//       yield [index, item];
//       index++;
//     }
// }

// function get_text(url) {
//     return data[0].txt
// }

function play(){
    STATE.refresh_text();
    const text = STATE.get_text_to_read()
    if (!STATE.isHardMuted && !STATE.isSoftMuted) {
        if (STATE.voice === "echo"){
            pause_play()
            const file_name = getHash(text.trim()).replace("TXT_", "ECHO_") + ".mp3"
            const audioFileFullPath = `./data/audio/${file_name}`;
            const audio = new Audio(audioFileFullPath);
            audio.playbackRate = playbackRate;
            audios.push(audio)
            audio.addEventListener("ended", function () {
                setTimeout(function() { // <<< Make so it can only be one of this one queue
                    play();
                }, 600);
            })
            audio.play()
        } else {
            pause_play()
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = STATE.voice
            utterance.rate = 0.85;
            utterance.onend = function(){
                setTimeout(function () {
                    play()        
                }, 600)
            }
            window.speechSynthesis.speak(utterance);                 
        }
    }
}

function pause_play() {
    window.speechSynthesis.cancel()
    audios.map(audio => {
        audio.pause();
    })
}

document.querySelector("#text_mode").addEventListener("click", function () {
    STATE._isPhonetic = !STATE._isPhonetic
    STATE.refresh()
})

document.querySelector("#repeat").addEventListener("click", function () {
    STATE._isRepeat = !STATE._isRepeat
    console.log("click_repeat")
    STATE.refresh_repeat()
})

document.querySelector("#sound").addEventListener("click", function () {
    STATE.isHardMuted = !STATE.isHardMuted
    STATE.refresh_HardMuted()
})

document.querySelector("#max_min").addEventListener("click", function () {
    if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
})

document.addEventListener("fullscreenchange", function () {
    if (document.fullscreenElement) {
        document.querySelector("#max_min").innerHTML = get_ICON("exit_fullscreen")
    } else {
        document.querySelector("#max_min").innerHTML = get_ICON("enter_fullscreen")
    }
});

document.querySelector("#voice").addEventListener('click', function () {
    STATE.next_voice()
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();        
        STATE.next_question();
        STATE.refresh();
    } else if (event.key === "r") {
        event.preventDefault();
        document.querySelector("#repeat").click()
    } else if (event.key === "s") {
        event.preventDefault();
        document.querySelector("#sound").click()
    } else if (event.key === "a") {
        event.preventDefault();
        document.querySelector("#text_mode").click()
    } else if (event.key === "v") {
        event.preventDefault();
        document.querySelector("#voice").click()
    }
});

document.querySelector("#explanation").addEventListener("click", function () {
    STATE.next_question()
});

document.querySelector("#opt01").addEventListener("click", clickOncorrectOption)
document.querySelector("#opt02").addEventListener("click", _ => clickOnIncorrect_option("#opt02"))
document.querySelector("#opt03").addEventListener("click", _ => clickOnIncorrect_option("#opt03"))
document.querySelector("#opt04").addEventListener("click", _ => clickOnIncorrect_option("#opt04"))

function clickOncorrectOption(){
    if (SCORE.isQuestionAnsweredCorrectly === false) {
        if (SCORE.isQuestionAnswered === false) {
            SCORE.num_correct += 1;
            STATE.decrease_prob()
            SCORE.renderScore()
        }        
        SCORE.isQuestionAnswered = true;
        SCORE.isQuestionAnsweredCorrectly = true;
        document.querySelector("#opt01").classList.add('green_div');        
        STATE.show_explanation()
    }
}

function clickOnIncorrect_option(opt){
    if (SCORE.isQuestionAnsweredCorrectly === false){
        if (SCORE.isQuestionAnswered === false) {
            SCORE.num_incorrect += 1;
            STATE.increase_prob()
            SCORE.renderScore();
        }
        SCORE.isQuestionAnswered = true;
        SCORE.isQuestionAnsweredCorrectly = false;
        document.querySelector(opt).classList.add('red_div');        
    }
}

document.querySelector("#category").addEventListener("click", function () {
    SCORE.isShowScore = !SCORE.isShowScore
    SCORE.renderScore()
});

///////////////////////////////////////////////
//                                           //
///////////////////////////////////////////////

// let startX, startY, endX, endY;
// const swipeContainer = document.getElementById('question');

// swipeContainer.addEventListener('touchstart', (e) => {
//     startX = e.touches[0].pageX;
//     startY = e.touches[0].pageY;
// });

// swipeContainer.addEventListener('touchend', (e) => {
//     const min_delta = 5;
//     endX = e.changedTouches[0].pageX;
//     endY = e.changedTouches[0].pageY;

//     const deltaX = endX - startX;
//     const deltaY = endY - startY;

//     if (Math.abs(deltaX) > Math.abs(deltaY)) {
//         // horizontal swipe
//         if (deltaX > +1 * min_delta) {
//             document.getElementById('text-row').click()
//             console.log('Swiped right');
//         } 
//         if (deltaX < -1 * min_delta) {
//             console.log('Swiped left');
//             document.getElementById('text-row').click()
//         }
//     } else {
//         // vertical swipe
//         if (deltaY > +1 * min_delta) {
//             console.log('Swiped down');
//             document.getElementById('text-row').click()
//         }
//         if (deltaY < -1 * min_delta) {
//             console.log('Swiped up');
//             document.getElementById('text-row').click()
//         }
//     }
// });

///////////////////////////////////////////////
//                                           //
///////////////////////////////////////////////

function get_ICON(x){
    const ICON_PATH = {
        start: '<path d="m384-334 96-74 96 74-36-122 90-64H518l-38-124-38 124H330l90 64-36 122ZM233-120l93-304L80-600h304l96-320 96 320h304L634-424l93 304-247-188-247 188Zm247-369Z"/>',
        exit_fullscreen: '<path d="M240-120v-120H120v-80h200v200h-80Zm400 0v-200h200v80H720v120h-80ZM120-640v-80h120v-120h80v200H120Zm520 0v-200h80v120h120v80H640Z"/>',
        enter_fullscreen: '<path d="M240-120v-120H120v-80h200v200h-80Zm400 0v-200h200v80H720v120h-80ZM120-640v-80h120v-120h80v200H120Zm520 0v-200h80v120h120v80H640Z"/>',
        si_sound: '<path d="M560-131v-82q90-26 145-100t55-168q0-94-55-168T560-749v-82q124 28 202 125.5T840-481q0 127-78 224.5T560-131ZM120-360v-240h160l200-200v640L280-360H120Zm440 40v-322q47 22 73.5 66t26.5 96q0 51-26.5 94.5T560-320ZM400-606l-86 86H200v80h114l86 86v-252ZM300-480Z"/>',
        no_sound: '<path d="M792-56 671-177q-25 16-53 27.5T560-131v-82q14-5 27.5-10t25.5-12L480-368v208L280-360H120v-240h128L56-792l56-56 736 736-56 56Zm-8-232-58-58q17-31 25.5-65t8.5-70q0-94-55-168T560-749v-82q124 28 202 125.5T840-481q0 53-14.5 102T784-288ZM650-422l-90-90v-130q47 22 73.5 66t26.5 96q0 15-2.5 29.5T650-422ZM480-592 376-696l104-104v208Zm-80 238v-94l-72-72H200v80h114l86 86Zm-36-130Z"/>',
        si_repeat: '<path d="M280-80 120-240l160-160 56 58-62 62h406v-160h80v240H274l62 62-56 58Zm-80-440v-240h486l-62-62 56-58 160 160-160 160-56-58 62-62H280v160h-80Z"/>',
        no_repeat: '<path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z"/>',
        home: '<path d="M400 -160 L400 -400 L560 -400 L560 -160 L760 -160 L760 -480 L880 -480 L480 -840 L80 -480 L200 -480 L200 -160 Z"/>'
    }
    if (ICON_PATH[x] === undefined) {
        console.log("ERROR: Icon not found" + x)
        return ""
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"> ${ICON_PATH[x]} </svg>`
}

document.querySelector("#sound").innerHTML = get_ICON("no_sound")
document.querySelector("#logo").innerHTML = get_ICON("home")
document.querySelector("#help-logo").innerHTML = get_ICON("home")

// Start Loading voices
window.speechSynthesis.getVoices()

///////////////////////////////////////////////

const audios = []
const playbackRate = 0.85

setTimeout(_ => {
    STATE.load_voices()
    if (STATE._voices.length !== 0) {
        document.querySelector("#voice").style.display = "flex";
        STATE.next_voice()
    }
    read_data()
    STATE.refresh()
}, 1000)

///////////////////////////////////////////////
//                                           //
///////////////////////////////////////////////

document.addEventListener('keydown', (event) => {
    if (event.key === 'd') {
        downloadJSON(STATE._questions);
    }
});

function downloadJSON(data, filename = 'data.json') {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function showScreen(id) {
    pause_play()
    const home = document.getElementById("home");
    const help = document.getElementById("help");
    const app = document.getElementById("app");
    if (id === "home") {
        home.style.display = "flex";
        help.style.display = "none";
        app.style.display = "none";
    } else if (id === "help") {
        home.style.display = "none";
        help.style.display = "flex";
        app.style.display = "none";
    } else if (id === "app") {
        home.style.display = "none";
        help.style.display = "none";
        app.style.display = "flex";
        play()
    } else {
      console.error(`Element with id "${id}" not found.`);
    }
}

function loadApp(x) {
    pause_play()
    const home = document.getElementById("home");
    const help = document.getElementById("help");
    const app = document.getElementById("app");
    home.style.display = "none";
    help.style.display = "none";
    app.style.display = "flex";
    STATE._category = x
    read_data()
    play()
}

document.querySelector("#logo").onclick = _ => {
    const home = document.getElementById("home");
    const app = document.getElementById("app");
    home.style.display = "flex";
    app.style.display = "none";
}

const xs = ["house", "padel", "clothes", "machine_learning", "statistics"]
for (const x of xs){
    if (document.querySelector(`#enter-btn-${x}`) !== null) {
        document.querySelector(`#enter-btn-${x}`).onclick = _ => loadApp(x)
    }
}

console.log("#02")