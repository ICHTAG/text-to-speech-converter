let speech = new SpeechSynthesisUtterance();
let voices = [];
let voiceSelect = document.querySelector("select");

window.speechSynthesis.onvoiceschanged = () => {
    voices = window.speechSynthesis.getVoices();
    voiceSelect.innerHTML = ""; // clear previous options
    voices.forEach((voice, i) => {
        voiceSelect.options[i] = new Option(voice.name, i);
    });
    speech.voice = voices[0]; // default voice
};

voiceSelect.addEventListener("change", () => {
    speech.voice = voices[voiceSelect.value];
});

document.querySelector(".btn").addEventListener("click", () => {
    const text = document.querySelector("#textarea").value;
    if (text.trim() === "") {
        alert("Please enter text to convert!");
        return;
    }
    speech.text = text;
    window.speechSynthesis.speak(speech);
});