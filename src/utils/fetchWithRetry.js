const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (fn, ms = 1000, retries = 3) => {
    let attempt = 0;
    while (attempt < retries) {
        try {
            return await fn();
        } catch (error) {
            if (error.response?.status === 429 && error.response.headers['retry-after']) {
                // Wait for the time specified in the Retry-After header
                const retryAfter = parseInt(error.response.headers['retry-after'], 10) * ms;
                console.warn(`Rate limit hit. Retrying after ${retryAfter}ms...`);
                await delay(retryAfter);
            } else {
                console.error(`Error on attempt ${attempt + 1}:`, error);
                if (attempt === retries - 1) {
                    throw error; // Re-throw the error if maximum retries are reached
                }
            }
        }
        attempt++;
    }
    throw new Error('Exceeded maximum retries');
};

export default fetchWithRetry;