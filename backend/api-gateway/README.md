# API Gateway

Backend for the Lynara Campaign app. Must be running for the frontend (e.g. Leads page) to work.

## Run the server

1. **From this folder** (`backend/api-gateway`):

   ```bash
   python run.py
   ```

   Or with uvicorn directly:

   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 3001
   ```

2. **Check it’s up**: open [http://localhost:3001](http://localhost:3001) in the browser. You should see a JSON welcome message.

3. **CORS**: The API allows requests from `http://localhost:3000` (Next.js). If the frontend shows “CORS” or “Failed to fetch”, the API is likely not running — start it with the commands above.

## Environment

Copy `.env.example` to `.env` and set:

- `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` (from your Supabase project) for leads/segments.

Without these, the server still starts, but `/leads` will return an error asking you to set them.
