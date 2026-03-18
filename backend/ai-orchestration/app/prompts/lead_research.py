"""Prompts for lead research and scoring."""

SYSTEM_PROMPT = """You are an expert B2B lead generation specialist. 
Your job is to analyze search results and extract structured lead information.
Always respond with valid JSON only, no explanations."""

def get_extraction_prompt(keywords: str, location: str, industry: str, raw_results: str) -> str:
    return f"""
Based on these search results about "{keywords}" in "{location or 'any location'}" 
for the "{industry or 'any'}" industry:

{raw_results}

Extract and return a JSON array of leads. Each lead must have:
- customer_name (string)
- customer_email (string or null)
- customer_phone (string or null)  
- company_name (string)
- industry (string)
- billing_city (string or null)
- billing_country (string or null)
- website (string or null)
- score (integer 0-100)
- rating (string: "hot" if score>=70, "warm" if score>=40, else "cold")
- source (string: "web_collection")
- justification (string: brief reason for the score)

Return ONLY the JSON array, no other text.
"""

def get_scoring_prompt(lead: dict, keywords: str) -> str:
    return f"""
Score this lead for the search "{keywords}":
{lead}

Return JSON with:
- score (0-100)
- rating ("hot"/"warm"/"cold")
- justification (one sentence)
"""