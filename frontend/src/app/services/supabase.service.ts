import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class SupabaseService {
    private client: SupabaseClient;
    constructor() {
        this.client = this.getSupabase();
    }

    getSupabase(): SupabaseClient {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        return createClient(supabaseUrl, supabaseKey);
    }
    async verifyToken(token: string) {;
        return await this.client.auth.getUser(token);
    }
    async setSession(accessToken: string, refreshToken: string) {
        return await this.client.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
        });
    }
    async updateUser(password: string) {
    return await this.client.auth.updateUser({ password });
    }
    
    async killSession() {

    return await this.client.auth.signOut();
}
}