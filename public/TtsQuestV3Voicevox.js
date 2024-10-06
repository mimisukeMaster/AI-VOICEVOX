class TtsQuestV3Voicevox extends Audio {
    constructor(speakerId, text, apiKey) {
        super();
        var params = {};
        params['key'] = apiKey;
        params['speaker'] = speakerId;
        params['text'] = text;
        const query = new URLSearchParams(params);
        this.#main(this, query);
    }
    
    #main(owner, query) {
        if (owner.src.length > 0) return;

        var apiUrl = 'https://api.tts.quest/v3/voicevox/synthesis';
        fetch(apiUrl + '?' + query.toString())
        .then(response => {
            if (response.status === 429) {
                alert("リクエストが多すぎます。数秒してから再度お試しください。");
                throw new Error("429 Too many requests");
            }
            return response.json();
        })
        .then(response => {
            if (typeof response.retryAfter !== 'undefined') {
            setTimeout(owner.#main, 1000 * (1 + response.retryAfter), owner, query);
            }
            else if (typeof response.mp3StreamingUrl !== 'undefined') {
                owner.src = response.mp3StreamingUrl;
                owner.playbackRate = 1.2;
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
