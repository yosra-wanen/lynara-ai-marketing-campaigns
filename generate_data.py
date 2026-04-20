from faker import Faker
from supabase import create_client
import random
from datetime import datetime, timedelta
import json

# Supabase connection
SUPABASE_URL = "https://jwkjqowuponrqmxwhgsj.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a2pxb3d1cG9ucnFteHdoZ3NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3NzExNCwiZXhwIjoyMDg2NzUzMTE0fQ.cZPC5QXFMOyWBJgDBKc9uXoo-a6x0E-vbaH3AqHwsIc"
COMPANY_ID = "1c7e1651-d68a-4725-abd7-ecf63719a70d"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
fake = Faker(['fr_FR'])

DESTINATIONS = ["Maldives", "Dubai", "Bali", "Paris", "Istanbul", "Santorini", "Tokyo", "Marrakech", "Rome", "New York"]
CAMPAIGNS = ["Offre Été 2025 - Maldives", "Pack Dubai Luxe", "Escapade Istanbul", "Paris Romantique", "Bali Découverte", "Santorini Premium", "Offre Famille Bali", "Offre Ramadan Dubaï", "Newsletter Été 2025", "Promo Automne 2025"]
CHANNELS = ["instagram", "facebook", "tiktok", "whatsapp", "email"]
CHANNEL_WEIGHTS = [0.35, 0.20, 0.18, 0.15, 0.12]
STATUSES = ["new", "contacted", "qualified", "negotiation", "converted", "lost"]
STATUS_WEIGHTS = [0.20, 0.18, 0.20, 0.12, 0.20, 0.10]
TUNISIAN_CITIES = ["Tunis", "Sfax", "Sousse", "Monastir", "Nabeul", "Bizerte", "Ariana", "Gafsa", "Gabès", "Kairouan"]
JOB_TITLES = ["Médecin", "Ingénieur", "Directeur Général", "CEO", "Avocat(e)", "Pharmacien(ne)", "Architecte", "Expert Comptable", "Manager", "Entrepreneur", "Dentiste", "DRH"]
COMPANIES = ["Poulina Group", "BIAT", "Vermeg", "Tunisair", "Ooredoo", "Orange TN", "Telnet", "Steg", "BNA", "PWC", None, None, None]
INTENTS = ["price_inquiry", "visit_request", "availability_inquiry", "interest", "contact_request", "price_objection", "property_search"]
INTENT_WEIGHTS = [0.35, 0.15, 0.15, 0.20, 0.05, 0.05, 0.05]
SENTIMENTS = ["positive", "neutral", "negative"]
SENTIMENT_WEIGHTS = [0.70, 0.20, 0.10]
INTERACTION_TYPES = ["comment", "dm", "reaction"]
INTERACTION_WEIGHTS = [0.45, 0.40, 0.15]
SOCIAL_COMMENTS = [
    "C est quoi le prix pour {dest} svp?",
    "Magnifique! On peut réserver comment?",
    "Wallah {dest} c magnifique je veux y aller!",
    "Trop cher pour moi malheureusement",
    "Le vol est inclus dans le prix?",
    "C est quelle agence ça?",
    "Super agence je recommande vivement!",
    "{dest} one day inchallah",
    "Vous faites des facilites de paiement?",
    "Le meilleur voyage de ma vie grâce à vous!",
]
SOCIAL_DMS = [
    "Bonjour je cherche un voyage pour 2 personnes à {dest}",
    "Salam c est quoi les prix pour {dest}?",
    "Bonjour budget 5000 TND pour 2 vous avez quoi?",
    "Bonjour voyage de noces pour décembre budget 20000 TND",
    "Salam je veux partir en famille à {dest} on est 4",
    "Bonjour je veux partir en juillet vous avez de la dispo?",
    "Bonjour voyage entreprise pour 15 personnes à {dest}",
    "Salam je veux partir en lune de miel à {dest}",
]

def random_date(days_ago_max=90, days_ago_min=0):
    days = random.randint(days_ago_min, days_ago_max)
    return datetime.now() - timedelta(days=days)

def pick(items, weights=None):
    return random.choices(items, weights=weights, k=1)[0]

# ─── Generate Leads (uses crm.leads via core schema RPC) ──────────────────────

def generate_leads(count=100):
    print(f"Generating {count} leads...")
    success = 0
    for _ in range(count):
        status = pick(STATUSES, STATUS_WEIGHTS)
        channel = pick(CHANNELS, CHANNEL_WEIGHTS)
        city = pick(TUNISIAN_CITIES)
        first_touch = random_date(90, 10)
        last_touch = first_touch + timedelta(days=random.randint(1, 30))

        score = {
            "converted": random.randint(80, 98),
            "negotiation": random.randint(68, 82),
            "qualified": random.randint(55, 72),
            "contacted": random.randint(40, 58),
            "new": random.randint(35, 55),
            "lost": random.randint(15, 35),
        }[status]

        rating = "hot" if score >= 70 else "warm" if score >= 40 else "cold"
        priority = "high" if score >= 70 else "medium" if score >= 45 else "low"

        estimated_value = {
            "converted": round(random.uniform(4500, 18000), 2),
            "negotiation": round(random.uniform(3000, 10000), 2),
            "qualified": round(random.uniform(2000, 6000), 2),
            "contacted": round(random.uniform(1500, 4000), 2),
            "new": round(random.uniform(1000, 4000), 2),
            "lost": 0,
        }[status]

        conversion_value = estimated_value if status == "converted" else 0
        destination = pick(DESTINATIONS)
        campaign = pick(CAMPAIGNS)

        try:
            result = supabase.rpc("create_lead", {
                "p_company_id": COMPANY_ID,
                "p_customer_name": fake.name(),
                "p_customer_email": fake.email(),
                "p_customer_phone": f"+2169{random.randint(10000000, 99999999)}",
                "p_customer_phone2": None,
                "p_customer_job_title": pick(JOB_TITLES),
                "p_company_name": pick(COMPANIES),
                "p_source": channel,
                "p_source_details": campaign,
                "p_status": status,
                "p_score": score,
                "p_rating": rating,
                "p_priority": priority,
                "p_estimated_value": estimated_value,
                "p_probability": random.randint(10, 90),
                "p_crm_notes": f"Intéressé par {destination} via {campaign}",
                "p_next_action": None,
                "p_industry": "Tourisme",
                "p_website": None,
                "p_linkedin_url": None,
                "p_company_size": None,
                "p_billing_city": city,
                "p_billing_country": "Tunisie",
            }).execute()
            success += 1
            if success % 10 == 0:
                print(f"  Inserted {success} leads...")
        except Exception as e:
            print(f"  Error inserting lead: {e}")

    print(f"✅ {success} leads inserted!")

# ─── Generate Analytics Events ────────────────────────────────────────────────

def generate_events(count=500):
    print(f"Generating {count} analytics events...")
    events = []
    event_types = ["lead_created", "lead_converted", "post_published", "message_sent", "dm_received"]
    event_weights = [0.30, 0.10, 0.25, 0.20, 0.15]

    for _ in range(count):
        event_type = pick(event_types, event_weights)
        channel = pick(CHANNELS, CHANNEL_WEIGHTS)
        destination = pick(DESTINATIONS)
        campaign = pick(CAMPAIGNS)
        event_ts = random_date(90)

        if event_type == "post_published":
            properties = {
                "likes": random.randint(100, 25000),
                "comments": random.randint(10, 2000),
                "shares": random.randint(5, 5000),
                "reach": random.randint(500, 250000),
                "saves": random.randint(10, 1500),
                "campaign": campaign,
                "destination": destination,
            }
        elif event_type == "lead_converted":
            properties = {
                "value": round(random.uniform(4000, 18000), 2),
                "campaign": campaign,
                "destination": destination,
            }
        elif event_type == "message_sent":
            properties = {
                "campaign": campaign,
                "status": "delivered",
                "opened": random.random() > 0.4,
                "clicked": random.random() > 0.6,
                "recipients": random.randint(100, 3000),
                "open_rate": round(random.uniform(0.25, 0.55), 2),
                "click_rate": round(random.uniform(0.08, 0.30), 2),
            }
        elif event_type == "dm_received":
            properties = {
                "intent": pick(INTENTS, INTENT_WEIGHTS),
                "sentiment": pick(SENTIMENTS, SENTIMENT_WEIGHTS),
                "urgency": random.randint(40, 98),
                "destination": destination,
            }
        else:
            properties = {
                "campaign": campaign,
                "destination": destination,
                "utm_source": channel,
                "utm_medium": pick(["reel", "post", "story", "video", "ad", "newsletter", "dm", "broadcast"]),
            }

        events.append({
            "company_id": COMPANY_ID,
            "event_type": event_type,
            "channel": channel,
            "source_platform": channel,
            "properties": properties,
            "event_ts": event_ts.isoformat(),
        })

    for i in range(0, len(events), 100):
        batch = events[i:i+100]
        try:
            supabase.table("analytics_events").insert(batch).execute()
            print(f"  Inserted events {i+1} to {min(i+100, len(events))}")
        except Exception as e:
            print(f"  Error: {e}")

    print(f"✅ {count} events inserted!")

# ─── Generate Social Interactions ─────────────────────────────────────────────

def generate_social_interactions(count=200):
    print(f"Generating {count} social interactions...")
    interactions = []
    social_channels = ["instagram", "facebook", "tiktok", "whatsapp"]
    social_weights = [0.40, 0.25, 0.20, 0.15]

    for _ in range(count):
        platform = pick(social_channels, social_weights)
        interaction_type = pick(INTERACTION_TYPES, INTERACTION_WEIGHTS)
        intent = pick(INTENTS, INTENT_WEIGHTS)
        sentiment = pick(SENTIMENTS, SENTIMENT_WEIGHTS)
        destination = pick(DESTINATIONS)
        created_at = random_date(90)

        urgency = {
            "price_inquiry": random.randint(70, 98),
            "visit_request": random.randint(80, 98),
            "availability_inquiry": random.randint(60, 85),
            "interest": random.randint(30, 70),
            "contact_request": random.randint(75, 95),
            "price_objection": random.randint(10, 30),
            "property_search": random.randint(65, 90),
        }[intent]

        if interaction_type == "comment":
            template = pick(SOCIAL_COMMENTS)
            content = template.format(dest=destination)
        elif interaction_type == "dm":
            template = pick(SOCIAL_DMS)
            content = template.format(dest=destination)
        else:
            content = pick(["like", "love", "wow", "share"])

        interactions.append({
            "company_id": COMPANY_ID,
            "platform": platform,
            "interaction_type": interaction_type,
            "content": content,
            "intent": intent,
            "sentiment": sentiment,
            "urgency_score": urgency,
            "created_at": created_at.isoformat(),
        })

    for i in range(0, len(interactions), 100):
        batch = interactions[i:i+100]
        try:
            supabase.table("social_interactions").insert(batch).execute()
            print(f"  Inserted interactions {i+1} to {min(i+100, len(interactions))}")
        except Exception as e:
            print(f"  Error: {e}")

    print(f"✅ {count} social interactions inserted!")

# ─── Generate Lead Scores ─────────────────────────────────────────────────────

def generate_lead_scores():
    print("Generating lead scores...")
    try:
        leads = supabase.schema("crm").table("leads").select("lead_id, company_id, status").eq("company_id", COMPANY_ID).execute()
        scores = []
        for lead in leads.data:
            status = lead.get("status", "new")
            score = {
                "converted": random.randint(80, 98),
                "negotiation": random.randint(68, 82),
                "qualified": random.randint(55, 72),
                "contacted": random.randint(40, 58),
                "new": random.randint(35, 55),
                "lost": random.randint(15, 35),
            }.get(status, 50)

            scores.append({
                "lead_id": lead["lead_id"],
                "company_id": COMPANY_ID,
                "score": score,
                "model_version": "v1.0",
                "score_reason": json.dumps({
                    "profile": "high" if score > 70 else "medium",
                    "engagement": "strong" if score > 70 else "moderate",
                    "channel": pick(CHANNELS),
                    "destination": pick(DESTINATIONS),
                }),
                "predicted_conversion_probability": round(score / 100 * random.uniform(0.8, 1.2), 2),
            })

        for i in range(0, len(scores), 100):
            batch = scores[i:i+100]
            supabase.table("lead_scores").insert(batch).execute()
        print(f"✅ {len(scores)} lead scores inserted!")
    except Exception as e:
        print(f"  Error generating scores: {e}")

# ─── Run ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("🚀 Starting data generation for Tunisie Booking...")
    print(f"Company ID: {COMPANY_ID}")
    print("-" * 50)

    generate_leads(100)
    generate_events(500)
    generate_social_interactions(200)
    generate_lead_scores()

    print("-" * 50)
    print("🎉 Done! Database is ready for dashboards.")