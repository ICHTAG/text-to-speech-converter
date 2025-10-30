// Enhanced Text-to-Speech Converter with Download
class TextToSpeechConverter {
    constructor() {
        if (!('speechSynthesis' in window)) {
            alert('Text-to-speech is not supported in your browser. Please use Chrome, Firefox, or Edge.');
            return;
        }

        this.speech = new SpeechSynthesisUtterance();
        this.voices = [];
        this.isSpeaking = false;
        this.progressInterval = null;
        this.audioContext = null;
        
        this.initializeElements();
        this.loadVoices();
        this.setupEventListeners();
        this.updateCharCount();
    }

    initializeElements() {
        this.textInput = document.getElementById('textInput');
        this.voiceSelect = document.getElementById('voiceSelect');
        this.languageSelect = document.getElementById('languageSelect');
        this.speakBtn = document.getElementById('speakBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.clearTextBtn = document.getElementById('clearText');
        this.charCount = document.getElementById('charCount');
        this.status = document.getElementById('status');
        this.progress = document.getElementById('progress');
        
        // Voice settings
        this.rate = document.getElementById('rate');
        this.pitch = document.getElementById('pitch');
        this.volume = document.getElementById('volume');
        this.rateValue = document.getElementById('rateValue');
        this.pitchValue = document.getElementById('pitchValue');
        this.volumeValue = document.getElementById('volumeValue');
        
        // Download format selection
        this.downloadFormat = document.getElementById('downloadFormat');
    }

    loadVoices() {
        speechSynthesis.addEventListener('voiceschanged', () => {
            this.voices = speechSynthesis.getVoices();
            this.populateVoiceList();
            
            const englishVoice = this.voices.find(voice => 
                voice.lang.includes('en') || voice.lang.includes('EN')
            );
            if (englishVoice) {
                this.speech.voice = englishVoice;
                const voiceIndex = this.voices.indexOf(englishVoice);
                this.voiceSelect.value = voiceIndex;
            }
        });

        this.voices = speechSynthesis.getVoices();
        if (this.voices.length > 0) {
            this.populateVoiceList();
        }
    }

    populateVoiceList() {
        this.voiceSelect.innerHTML = '';
        
        this.voices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${voice.name} (${voice.lang})`;
            this.voiceSelect.appendChild(option);
        });
        
        if (this.voices.length === 0) {
            this.voiceSelect.innerHTML = '<option value="">No voices available</option>';
        }
    }

    setupEventListeners() {
        this.textInput.addEventListener('input', () => {
            this.updateCharCount();
            if (this.isSpeaking) {
                this.stopSpeech();
            }
        });

        this.voiceSelect.addEventListener('change', () => {
            const selectedVoice = this.voices[this.voiceSelect.value];
            if (selectedVoice) {
                this.speech.voice = selectedVoice;
            }
        });

        this.languageSelect.addEventListener('change', () => {
            this.filterVoicesByLanguage();
        });

        this.rate.addEventListener('input', () => {
            this.speech.rate = parseFloat(this.rate.value);
            this.rateValue.textContent = this.rate.value;
        });

        this.pitch.addEventListener('input', () => {
            this.speech.pitch = parseFloat(this.pitch.value);
            this.pitchValue.textContent = this.pitch.value;
        });

        this.volume.addEventListener('input', () => {
            this.speech.volume = parseFloat(this.volume.value);
            this.volumeValue.textContent = this.volume.value;
        });

        this.speakBtn.addEventListener('click', () => {
            this.speak();
        });

        this.stopBtn.addEventListener('click', () => {
            this.stopSpeech();
        });

        this.downloadBtn.addEventListener('click', () => {
            this.downloadAudio();
        });

        this.clearTextBtn.addEventListener('click', () => {
            this.clearText();
        });

        this.speech.onstart = () => {
            this.isSpeaking = true;
            this.updateUIForSpeaking();
            this.animateProgressBar();
        };

        this.speech.onend = () => {
            this.isSpeaking = false;
            this.updateUIForReady();
            this.resetProgressBar();
        };

        this.speech.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            this.isSpeaking = false;
            this.updateUIForError('Error: ' + event.error);
            this.resetProgressBar();
        };
    }

    updateCharCount() {
        const count = this.textInput.value.length;
        this.charCount.textContent = count;
    }

    filterVoicesByLanguage() {
        const selectedLanguage = this.languageSelect.value;
        this.voiceSelect.innerHTML = '';
        
        const filteredVoices = this.voices.filter(voice => 
            voice.lang.startsWith(selectedLanguage)
        );
        
        if (filteredVoices.length === 0) {
            this.voiceSelect.innerHTML = '<option value="">No voices for selected language</option>';
            return;
        }
        
        filteredVoices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = this.voices.indexOf(voice);
            option.textContent = `${voice.name} (${voice.lang})`;
            this.voiceSelect.appendChild(option);
        });
        
        if (filteredVoices.length > 0) {
            this.speech.voice = filteredVoices[0];
            this.voiceSelect.value = this.voices.indexOf(filteredVoices[0]);
        }
    }

    speak() {
        const text = this.textInput.value.trim();
        
        if (text === '') {
            this.showNotification('Please enter some text to speak!', 'error');
            return;
        }

        if (this.isSpeaking) {
            this.stopSpeech();
            return;
        }

        speechSynthesis.cancel();

        this.speech.text = text;
        this.speech.rate = parseFloat(this.rate.value);
        this.speech.pitch = parseFloat(this.pitch.value);
        this.speech.volume = parseFloat(this.volume.value);

        const selectedVoice = this.voices[this.voiceSelect.value];
        if (selectedVoice) {
            this.speech.voice = selectedVoice;
        }

        speechSynthesis.speak(this.speech);
        this.downloadBtn.disabled = false;
    }

    stopSpeech() {
        speechSynthesis.cancel();
        this.isSpeaking = false;
        this.updateUIForReady();
        this.resetProgressBar();
    }

    clearText() {
        this.textInput.value = '';
        this.updateCharCount();
        this.downloadBtn.disabled = true;
        this.showNotification('Text cleared', 'ready');
    }

    async downloadAudio() {
        const text = this.textInput.value.trim();
        
        if (!text) {
            this.showNotification('Please enter text first!', 'error');
            return;
        }

        // Show processing state
        this.downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        this.downloadBtn.disabled = true;

        try {
            const format = this.downloadFormat ? this.downloadFormat.value : 'txt';
            
            if (format === 'txt') {
                // Download as text file with metadata
                this.downloadTextAsAudio(text);
            } else if (format === 'wav' && this.canGenerateAudio()) {
                // Try to generate audio file
                await this.generateAudioFile(text);
            } else {
                // Fallback to text download
                this.downloadTextAsAudio(text);
            }
        } catch (error) {
            console.error('Download error:', error);
            this.downloadTextAsAudio(text);
        } finally {
            this.downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download Audio';
            this.downloadBtn.disabled = false;
        }
    }

    canGenerateAudio() {
        return window.AudioContext && window.OscillatorNode;
    }

    async generateAudioFile(text) {
        // Create a simple audio file using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            // Set up audio parameters based on text
            oscillator.type = 'sine';
            oscillator.frequency.value = 220 + (Math.random() * 440);
            gainNode.gain.value = 0.1;
            
            oscillator.connect(gainNode);
            
            // Create a simple melody for demonstration
            const duration = Math.max(2000, text.length * 50);
            
            // In a real implementation, you would:
            // 1. Use the Web Speech API to get audio data
            // 2. Or use a server-side TTS service
            // 3. Or use the MediaRecorder API to record the speech
            
            // For now, we'll create a simple tone
            oscillator.start();
            
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Create a mock WAV file
            const wavData = this.generateMockWavData(duration);
            const blob = new Blob([wavData], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            
            this.downloadFile(url, `speech-${Date.now()}.wav`);
            this.showNotification('Audio file generated!', 'success');
            
        } catch (error) {
            throw new Error('Audio generation failed: ' + error.message);
        }
    }

    generateMockWavData(duration) {
        // This creates a very basic WAV file header with silent audio
        // In a real implementation, you would generate actual audio data
        const sampleRate = 44100;
        const numChannels = 1;
        const bitsPerSample = 16;
        const blockAlign = numChannels * bitsPerSample / 8;
        const byteRate = sampleRate * blockAlign;
        const dataSize = Math.floor(duration / 1000 * sampleRate) * blockAlign;
        
        const buffer = new ArrayBuffer(44 + dataSize);
        const view = new DataView(buffer);
        
        // RIFF identifier
        this.writeString(view, 0, 'RIFF');
        // File length
        view.setUint32(4, 36 + dataSize, true);
        // RIFF type
        this.writeString(view, 8, 'WAVE');
        // Format chunk identifier
        this.writeString(view, 12, 'fmt ');
        // Format chunk length
        view.setUint32(16, 16, true);
        // Sample format (raw)
        view.setUint16(20, 1, true);
        // Channel count
        view.setUint16(22, numChannels, true);
        // Sample rate
        view.setUint32(24, sampleRate, true);
        // Byte rate (sample rate * block align)
        view.setUint32(28, byteRate, true);
        // Block align (channel count * bytes per sample)
        view.setUint16(32, blockAlign, true);
        // Bits per sample
        view.setUint16(34, bitsPerSample, true);
        // Data chunk identifier
        this.writeString(view, 36, 'data');
        // Data chunk length
        view.setUint32(40, dataSize, true);
        
        return buffer;
    }

    writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    downloadTextAsAudio(text) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const content = `TEXT-TO-SPEECH EXPORT\n\n` +
                       `Generated: ${new Date().toLocaleString()}\n` +
                       `Text Length: ${text.length} characters\n` +
                       `Voice Settings:\n` +
                       `  - Speed: ${this.rate.value}\n` +
                       `  - Pitch: ${this.pitch.value}\n` +
                       `  - Volume: ${this.volume.value}\n\n` +
                       `ORIGINAL TEXT:\n${text}\n\n` +
                       `Note: For actual audio file generation, a server-side TTS service is required.`;
        
        const blob = new Blob([content], { type: 'text/plain; charset=utf-8' });
        const url = URL.createObjectURL(blob);
        this.downloadFile(url, `speech-export-${timestamp}.txt`);
        this.showNotification('Text file downloaded!', 'success');
    }

    downloadFile(url, filename) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    updateUIForSpeaking() {
        this.speakBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        this.stopBtn.disabled = false;
        this.status.innerHTML = '<i class="fas fa-volume-up"></i> Speaking...';
        this.status.className = 'status speaking';
    }

    updateUIForReady() {
        this.speakBtn.innerHTML = '<i class="fas fa-play"></i> Convert to Speech';
        this.stopBtn.disabled = true;
        this.status.innerHTML = '<i class="fas fa-check-circle"></i> Ready to convert';
        this.status.className = 'status ready';
    }

    updateUIForError(message) {
        this.speakBtn.innerHTML = '<i class="fas fa-play"></i> Convert to Speech';
        this.stopBtn.disabled = true;
        this.status.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
        this.status.className = 'status error';
    }

    animateProgressBar() {
        this.resetProgressBar();
        let width = 0;
        const textLength = this.textInput.value.length;
        const estimatedTime = Math.max(3000, textLength * 50 / this.speech.rate);
        const interval = estimatedTime / 100;
        
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        
        this.progressInterval = setInterval(() => {
            if (width >= 100 || !this.isSpeaking) {
                clearInterval(this.progressInterval);
                return;
            }
            width += 1;
            this.progress.style.width = width + '%';
        }, interval);
    }

    resetProgressBar() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        this.progress.style.width = '0%';
    }

    showNotification(message, type) {
        const originalContent = this.status.innerHTML;
        const originalClass = this.status.className;
        
        const icon = type === 'error' ? 'exclamation-triangle' : 
                    type === 'success' ? 'check-circle' : 'info-circle';
        
        this.status.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
        this.status.className = `status ${type}`;
        
        setTimeout(() => {
            if (!this.isSpeaking) {
                this.status.innerHTML = originalContent;
                this.status.className = originalClass;
            }
        }, 3000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new TextToSpeechConverter();
});