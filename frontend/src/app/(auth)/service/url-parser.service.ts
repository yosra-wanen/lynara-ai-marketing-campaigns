export class UrlParserService {
    getTokenFromHash() {
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        return {
            accessToken: params.get('access_token'),
            refreshToken: params.get('refresh_token') ?? '',
            type: params.get('type'),
        };
    }
}