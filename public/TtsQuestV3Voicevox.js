class TtsQuestV3Voicevox extends Audio {
    constructor(speakerId, text, speed, intonationScale, apiKey) {
        super();
        var params = {};
        params['key'] = apiKey;
        params['speaker'] = speakerId;
        params['text'] = text;
        params['speedScale'] = speed;
        params['intonationScale'] = intonationScale;
        const query = new URLSearchParams(params);
        this.#main(this, query);
    }
    
    #main(owner, query) {
        if (owner.src.length > 0) return;

        var apiUrl = 'https://api.tts.quest/v3/voicevox/synthesis';
        fetch(apiUrl + '?' + query.toString())
        .then(response => response.json())
        .then(response => {
            if (typeof response.retryAfter !== 'undefined') {
            setTimeout(owner.#main, 1000 * (1 + response.retryAfter), owner, query);
            }
            else if (typeof response.mp3StreamingUrl !== 'undefined') {
                owner.src = response.mp3StreamingUrl;
            }
            else if (typeof response.errorMessage !== 'undefined') {
                throw new Error(response.errorMessage);
            }
            else {
                throw new Error("serverError");
            }
        });
    }
}
