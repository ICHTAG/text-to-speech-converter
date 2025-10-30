// Enhanced Speech-to-Text Converter with Download Features
class SpeechToTextConverter {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.isPaused = false;
        this.finalTranscript = '';
        this.visualizerBars = [];
        
        this.initializeElements();
        this.initializeRecognition();
        this.setupEventListeners();
        this.initializeVisualizer();
    }

    initializeElements() {
        this.textOutput = document.getElementById('textOutput');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.copyTextBtn = document.getElementById('copyText');
        this.clearOutputBtn = document.getElementById('clearOutput');
        this.saveTextBtn = document.getElementById('saveText');
        this.languageSelect = document.getElementById('languageSelect');
        this.downloadFormat = document.getElementById('downloadFormat');
        this.status = document.getElementById('status');
        this.recordingStatus = document.getElementById('recordingStatus');
        this.visualizer = document.querySelector('.visualizer');
    }

    initializeRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            this.setErrorState('Speech recognition is not supported in this browser. Please try Chrome or Edge.');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.languageSelect.value;

        this.recognition.onstart = () => {
            this.isListening = true;
            this.isPaused = false;
            this.updateUIForListening();
            this.status.innerHTML = '<i class="fas fa-microphone"></i> Listening... Speak now!';
            this.status.className = 'status listening';
            this.recordingStatus.innerHTML = '<i class="fas fa-circle"></i> Listening';
            this.recordingStatus.className = 'recording-status listening';
            this.startVisualizer();
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                
                if (event.results[i].isFinal) {
                    this.finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            const outputText = this.finalTranscript + 
                (interimTranscript ? `<span style="color: #00d2b4; font-style: italic;">${interimTranscript}</span>` : '');
            
            this.textOutput.innerHTML = outputText;
            this.textOutput.scrollTop = this.textOutput.scrollHeight;
            
            this.updateVisualizer(interimTranscript.length > 0);
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            
            if (event.error === 'not-allowed') {
                this.setErrorState('Microphone access denied. Please allow microphone access in your browser settings.');
            } else if (event.error === 'audio-capture') {
                this.setErrorState('No microphone found. Please ensure a microphone is connected and try again.');
            } else if (event.error === 'network') {
                this.setErrorState('Network error occurred. Please check your internet connection.');
            } else {
                this.setErrorState(`Recognition error: ${event.error}`);
            }
            
            this.stopListening();
        };

        this.recognition.onend = () => {
            if (this.isListening && !this.isPaused) {
                try {
                    this.recognition.start();
                } catch (error) {
                    console.error('Error restarting recognition:', error);
                    this.stopListening();
                }
            }
        };
    }

    initializeVisualizer() {
        this.visualizerBars = Array.from(this.visualizer.querySelectorAll('.bar'));
        this.visualizerBars.forEach(bar => {
            bar.style.height = '5px';
        });
    }

    startVisualizer() {
        this.visualizerBars.forEach(bar => {
            bar.style.height = '5px';
        });
    }

    updateVisualizer(isActive) {
        if (!this.isListening) return;
        
        this.visualizerBars.forEach(bar => {
            if (isActive) {
                const height = 5 + Math.random() * 45;
                bar.style.height = `${height}px`;
                bar.style.background = 'linear-gradient(to top, #00d2b4, #00c9a7)';
            } else {
                const height = 5 + Math.random() * 15;
                bar.style.height = `${height}px`;
                bar.style.background = 'var(--accent)';
            }
        });
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => {
            if (this.isListening) {
                this.stopListening();
            } else {
                this.startListening();
            }
        });

        this.pauseBtn.addEventListener('click', () => {
            if (this.isPaused) {
                this.resumeListening();
            } else {
                this.pauseListening();
            }
        });

        this.languageSelect.addEventListener('change', () => {
            if (this.recognition) {
                this.recognition.lang = this.languageSelect.value;
                
                if (this.isListening) {
                    this.stopListening();
                    setTimeout(() => this.startListening(), 500);
                }
            }
        });

        this.copyTextBtn.addEventListener('click', () => {
            this.copyToClipboard();
        });

        this.clearOutputBtn.addEventListener('click', () => {
            this.clearOutput();
        });

        this.saveTextBtn.addEventListener('click', () => {
            this.saveAsFile();
        });
    }

    startListening() {
        if (!this.recognition) {
            this.initializeRecognition();
        }

        if (!this.recognition) {
            this.setErrorState('Speech recognition is not available.');
            return;
        }

        this.finalTranscript = '';
        this.textOutput.innerHTML = '';
        
        try {
            this.recognition.start();
        } catch (error) {
            console.error('Error starting recognition:', error);
            this.setErrorState('Error starting speech recognition. Please try again.');
        }
    }

    stopListening() {
        this.isListening = false;
        this.isPaused = false;
        
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (error) {
                console.error('Error stopping recognition:', error);
            }
        }

        this.updateUIForReady();
        this.status.innerHTML = '<i class="fas fa-info-circle"></i> Click "Start Listening" to begin';
        this.status.className = 'status ready';
        this.recordingStatus.innerHTML = '<i class="fas fa-circle"></i> Ready to listen';
        this.recordingStatus.className = 'recording-status';
        
        this.visualizerBars.forEach(bar => {
            bar.style.height = '5px';
        });
    }

    pauseListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isPaused = true;
            this.pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
            this.status.innerHTML = '<i class="fas fa-pause"></i> Listening paused';
            this.status.className = 'status ready';
            this.recordingStatus.innerHTML = '<i class="fas fa-pause-circle"></i> Paused';
            this.recordingStatus.className = 'recording-status';
            
            this.visualizerBars.forEach(bar => {
                bar.style.height = '5px';
            });
        }
    }

    resumeListening() {
        if (this.isPaused) {
            this.startListening();
        }
    }

    updateUIForListening() {
        this.startBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Listening';
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = false;
        this.pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
    }

    updateUIForReady() {
        this.startBtn.innerHTML = '<i class="fas fa-microphone"></i> Start Listening';
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
    }

    setErrorState(message) {
        this.status.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
        this.status.className = 'status error';
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = true;
    }

    copyToClipboard() {
        const textToCopy = this.textOutput.textContent || this.textOutput.innerText;
        
        if (!textToCopy.trim()) {
            this.showNotification('No text to copy!', 'error');
            return;
        }

        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = this.copyTextBtn.innerHTML;
            this.copyTextBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            this.showNotification('Text copied to clipboard!', 'success');
            
            setTimeout(() => {
                this.copyTextBtn.innerHTML = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            this.showNotification('Failed to copy text', 'error');
        });
    }

    clearOutput() {
        this.finalTranscript = '';
        this.textOutput.innerHTML = '';
        this.showNotification('Text cleared', 'ready');
    }

    saveAsFile() {
        const textToSave = this.textOutput.textContent || this.textOutput.innerText;
        
        if (!textToSave.trim()) {
            this.showNotification('No text to save!', 'error');
            return;
        }

        const format = this.downloadFormat ? this.downloadFormat.value : 'txt';
        
        // Show processing state
        const originalText = this.saveTextBtn.innerHTML;
        this.saveTextBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        this.saveTextBtn.disabled = true;

        try {
            switch (format) {
                case 'txt':
                    this.downloadTextFile(textToSave);
                    break;
                case 'pdf':
                    this.downloadAsPDF(textToSave);
                    break;
                case 'doc':
                    this.downloadAsDOC(textToSave);
                    break;
                case 'json':
                    this.downloadAsJSON(textToSave);
                    break;
                default:
                    this.downloadTextFile(textToSave);
            }
        } catch (error) {
            console.error('Save error:', error);
            this.downloadTextFile(textToSave);
        } finally {
            setTimeout(() => {
                this.saveTextBtn.innerHTML = originalText;
                this.saveTextBtn.disabled = false;
            }, 1000);
        }
    }

    downloadTextFile(text) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const metadata = `SPEECH-TO-TEXT TRANSCRIPTION\n\n` +
                        `Generated: ${new Date().toLocaleString()}\n` +
                        `Language: ${this.languageSelect.options[this.languageSelect.selectedIndex].text}\n` +
                        `Characters: ${text.length}\n` +
                        `Words: ${text.split(/\s+/).filter(word => word.length > 0).length}\n\n` +
                        `TRANSCRIPTION:\n${text}`;
        
        const blob = new Blob([metadata], { type: 'text/plain; charset=utf-8' });
        const url = URL.createObjectURL(blob);
        this.downloadFile(url, `transcription-${timestamp}.txt`);
        this.showNotification('Text file downloaded!', 'success');
    }

    downloadAsPDF(text) {
        // Simple PDF generation using browser print (fallback)
        const printWindow = window.open('', '_blank');
        const timestamp = new Date().toLocaleString();
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Speech-to-Text Transcription</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                    .metadata { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
                    .content { line-height: 1.6; white-space: pre-wrap; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Speech-to-Text Transcription</h1>
                </div>
                <div class="metadata">
                    <strong>Generated:</strong> ${timestamp}<br>
                    <strong>Language:</strong> ${this.languageSelect.options[this.languageSelect.selectedIndex].text}<br>
                    <strong>Characters:</strong> ${text.length}<br>
                    <strong>Words:</strong> ${text.split(/\s+/).filter(word => word.length > 0).length}
                </div>
                <div class="content">${text}</div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
        this.showNotification('PDF generated for printing!', 'success');
    }

    downloadAsDOC(text) {
        // Create a simple DOC file using HTML format
        const timestamp = new Date().toLocaleString();
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Speech-to-Text Transcription</title>
            </head>
            <body>
                <h1>Speech-to-Text Transcription</h1>
                <p><strong>Generated:</strong> ${timestamp}</p>
                <p><strong>Language:</strong> ${this.languageSelect.options[this.languageSelect.selectedIndex].text}</p>
                <p><strong>Characters:</strong> ${text.length}</p>
                <p><strong>Words:</strong> ${text.split(/\s+/).filter(word => word.length > 0).length}</p>
                <hr>
                <div style="white-space: pre-wrap;">${text}</div>
            </body>
            </html>
        `;
        
        const blob = new Blob([htmlContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        this.downloadFile(url, `transcription-${Date.now()}.doc`);
        this.showNotification('DOC file downloaded!', 'success');
    }

    downloadAsJSON(text) {
        const transcriptionData = {
            transcription: text,
            metadata: {
                generated: new Date().toISOString(),
                language: this.languageSelect.value,
                languageName: this.languageSelect.options[this.languageSelect.selectedIndex].text,
                characterCount: text.length,
                wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
                source: 'Speech-to-Text Converter'
            }
        };
        
        const jsonContent = JSON.stringify(transcriptionData, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        this.downloadFile(url, `transcription-${Date.now()}.json`);
        this.showNotification('JSON file downloaded!', 'success');
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

    showNotification(message, type) {
        const originalContent = this.status.innerHTML;
        const originalClass = this.status.className;
        
        const icon = type === 'error' ? 'exclamation-triangle' : 
                    type === 'success' ? 'check-circle' : 'info-circle';
        
        this.status.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
        this.status.className = `status ${type}`;
        
        setTimeout(() => {
            if (!this.isListening) {
                this.status.innerHTML = originalContent;
                this.status.className = originalClass;
            }
        }, 3000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new SpeechToTextConverter();
});