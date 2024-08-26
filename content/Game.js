class Game {
  static keyNeighbours = {
    en: {
      a: ["q", "w", "s", "z"],
      b: ["g", "h", "v", "n"],
      c: ["d", "f", "x", "v"],
      d: ["e", "r", "s", "f", "x", "c"],
      e: ["w", "r", "s", "d"],
      f: ["r", "t", "d", "g", "c", "v"],
      g: ["t", "y", "f", "h", "v", "b"],
      h: ["y", "u", "g", "j", "b", "n"],
      i: ["u", "o", "j", "k"],
      j: ["u", "i", "h", "k", "n", "m"],
      k: ["i", "o", "j", "l", "m"],
      l: ["o", "p", "k"],
      m: ["j", "k", "n"],
      n: ["h", "j", "b", "m"],
      o: ["i", "p", "k", "l"],
      p: ["o", "l"],
      q: ["w", "a"],
      r: ["e", "t", "d", "f"],
      s: ["w", "e", "a", "d", "z", "x"],
      t: ["r", "y", "f", "g"],
      u: ["y", "i", "h", "j"],
      v: ["f", "g", "c", "b"],
      w: ["q", "e", "a", "s"],
      x: ["s", "d", "z", "c"],
      y: ["t", "u", "g", "h"],
      z: ["a", "s", "x"],
    },
    fr: {
      a: ["z", "q"],
      b: ["g", "h", "v", "n"],
      c: ["d", "f", "x", "v"],
      d: ["e", "r", "s", "f", "x", "c"],
      e: ["z", "r", "s", "d"],
      f: ["r", "t", "d", "g", "c", "v"],
      g: ["t", "y", "f", "h", "v", "b"],
      h: ["y", "u", "g", "j", "b", "n"],
      i: ["u", "o", "j", "k"],
      j: ["u", "i", "h", "k", "n"],
      k: ["i", "o", "j", "l"],
      l: ["o", "p", "k", "m"],
      m: ["o", "p", "l"],
      n: ["h", "j", "b"],
      o: ["i", "p", "k", "l"],
      p: ["o", "l", "m"],
      q: ["a", "z", "s", "w"],
      r: ["e", "t", "d", "f"],
      s: ["z", "e", "q", "d", "w", "x"],
      t: ["r", "y", "f", "g"],
      u: ["y", "i", "h", "j"],
      v: ["f", "g", "c", "b"],
      w: ["q", "s", "x"],
      x: ["s", "d", "w", "c"],
      y: ["t", "u", "g", "h"],
      z: ["a", "e", "q", "s"],
    },
  };

  constructor(inputNode) {
    this.input = inputNode;
    this.paused = false;
  }

  async setLang(language) {
    const langCodes = {
      English: "en",
      French: "fr",
    };

    if (!language in langCodes) {
      console.log(`${language} is not an available language!`);
    }

    if (this.words && this.lang === langCodes[language]) return;
    this.lang = langCodes[language];
    this.words = await Game.getWords(this.lang);
    console.log(`Bomb party buddy loaded in ${this.lang}!`);
  }

  static async getWords(lang) {
    let url = "";
    if (lang == "en") {
      url = chrome.runtime.getURL("../words/en.txt");
    } else if (lang == "fr") {
      url = chrome.runtime.getURL("../words/fr.txt");
    }

    let words = {};
    if (url) {
      const res = await fetch(url);
      const text = await res.text();
      text
        .split("\n")
        .map((word) => word.trim())
        .sort((a, b) => a.length - b.length)
        .forEach((word) => (words[word] = 1));
    }
    return words;
  }

  async playTurn() {
    if (this.paused) return;
    if (this.typingId) clearTimeout(this.typingId);
    const word = await this.getWord();
    if (!word) return;
    this.typeWord(word);
  }

  async getWord() {
    for (const word in this.words) {
      if (word.includes(this.syllable) && this.words[word]) {
        this.words[word] = 0;
        await new Promise((r) => setTimeout(r, Math.random() * 100 + 500));
        return word;
      }
    }
  }

  typeWord(word, lastIsMistake) {
    if (!word) {
      this.input.parentNode.requestSubmit();
      return;
    }
    if (lastIsMistake) {
      this.input.value = this.input.value.slice(0, -1);
      this.input.dispatchEvent(new InputEvent("input"));
      this.typingId = setTimeout(() => this.typeWord(word, false), Math.random() * 400); // 400
      return;
    }

    let inputLetter = word[0];
    const isMistake = inputLetter in Game.keyNeighbours[this.lang] && Math.random() < 0.1;
    if (isMistake) {
      const neighbours = Game.keyNeighbours[this.lang][inputLetter];
      inputLetter = neighbours[Math.floor(Math.random() * neighbours.length)];
    }
    this.input.value += inputLetter;
    this.input.dispatchEvent(new InputEvent("input"));
    this.typingId = setTimeout(
      () => this.typeWord(isMistake ? word : word.substring(1), isMistake),
      Math.random() * 400 // 400
    );
  }

  // listener
  onCorrectWord(word) {
    this.words[word] = 0;
  }
}