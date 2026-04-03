"""Prompts for lead research and scoring."""

SYSTEM_PROMPT = """Tu es un expert en génération de leads B2B. 
Ton travail est d'analyser des résultats de recherche et d'extraire des informations structurées sur les leads.
Réponds toujours avec du JSON valide uniquement, sans explications.
Toutes les justifications et notes doivent être rédigées en français."""

def get_extraction_prompt(keywords: str, location: str, industry: str, raw_results: str) -> str:
    return f"""
Sur la base de ces résultats de recherche concernant "{keywords}" à "{location or 'toute localisation'}" 
pour le secteur "{industry or 'tous secteurs'}":

{raw_results}

Extrait et retourne un tableau JSON de leads. Chaque lead doit avoir:
- customer_name (string)
- customer_email (string ou null)
- customer_phone (string ou null)  
- company_name (string)
- industry (string en français)
- billing_city (string ou null)
- billing_country (string ou null)
- website (string ou null)
- score (entier 0-100)
- rating (string: "hot" si score>=70, "warm" si score>=40, sinon "cold")
- source (string: "web_collection")
- justification (string: brève raison du score, en français)

Retourne UNIQUEMENT le tableau JSON, sans autre texte.
"""

def get_scoring_prompt(lead: dict, keywords: str) -> str:
    return f"""
Évalue ce lead pour la recherche "{keywords}":
{lead}

Retourne du JSON avec:
- score (0-100)
- rating ("hot"/"warm"/"cold")
- justification (une phrase en français)
"""