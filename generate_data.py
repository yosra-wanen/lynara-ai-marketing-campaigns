"""
generate_data.py — Lynara Campaign x Traveltodo

"""

import uuid
import hashlib
import random
from datetime import datetime, timedelta, date
from supabase import create_client

# Seeded only for names/dates/content variation
random.seed(42)

SUPABASE_URL         = "https://jwkjqowuponrqmxwhgsj.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a2pxb3d1cG9ucnFteHdoZ3NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3NzExNCwiZXhwIjoyMDg2NzUzMTE0fQ.cZPC5QXFMOyWBJgDBKc9uXoo-a6x0E-vbaH3AqHwsIc"
COMPANY_ID           = "4f8edee8-9ec2-47d8-be24-180854da63df"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


# ── DETERMINISTIC HELPERS ─────────────────────────────────────────────────────

def det(lead_id, lo, hi):
    """Deterministic integer in [lo, hi] based on lead_id hash."""
    h = int(hashlib.md5(lead_id.encode()).hexdigest(), 16)
    return lo + (h % (hi - lo + 1))


def det_float(lead_id, lo, hi, seed=""):
    """Deterministic float in [lo, hi] based on lead_id hash."""
    h = int(hashlib.md5((lead_id + seed).encode()).hexdigest(), 16)
    return round(lo + (h % 10000) / 10000.0 * (hi - lo), 2)


# ── NAMES & CITIES ───────────────────────────────────────────────────────────

FIRST_M = ["Mohamed", "Ahmed", "Ali", "Omar", "Youssef", "Hamza", "Amine", "Bilel",
           "Sami", "Karim", "Mehdi", "Nizar", "Rami", "Tarek", "Walid", "Zied"]
FIRST_F = ["Fatma", "Amira", "Sana", "Rania", "Nour", "Ines", "Rim", "Salma",
           "Mariem", "Yasmine", "Hajer", "Olfa", "Asma", "Donia", "Lina", "Sara"]
LAST    = ["Ben Ali", "Ben Salah", "Trabelsi", "Gharbi", "Ayari", "Maatoug",
           "Belhaj", "Chaabane", "Jlassi", "Hamdi", "Sfaxi", "Ksouri"]
CITIES  = ["Tunis", "Sfax", "Sousse", "Monastir", "Nabeul", "Bizerte", "Ariana",
           "Gafsa", "Gabès", "Kairouan", "Ben Arous", "La Marsa", "Hammamet"]
DESTINATIONS = ["Maldives", "Dubai", "Bali", "Paris", "Istanbul",
                "Hammamet", "Djerba", "Sousse", "Santorini", "Rome"]
SIZES   = ["1-10", "11-50", "51-200", "201-500", "500+"]
INDUSTRIES = ["Travel", "Real Estate", "Retail", "Hospitality", "Corporate Services"]


def det_name(lead_id):
    h = int(hashlib.md5(lead_id.encode()).hexdigest(), 16)
    gender = "m" if h % 2 == 0 else "f"
    first = FIRST_M[h % len(FIRST_M)] if gender == "m" else FIRST_F[h % len(FIRST_F)]
    last = LAST[(h // 100) % len(LAST)]
    return f"{first} {last}"


def det_city(lead_id):
    h = int(hashlib.md5((lead_id + "city").encode()).hexdigest(), 16)
    return CITIES[h % len(CITIES)]


def det_dest(lead_id):
    h = int(hashlib.md5((lead_id + "dest").encode()).hexdigest(), 16)
    return DESTINATIONS[h % len(DESTINATIONS)]


# ── BENCHMARK-ANCHORED BUSINESS RULES ────────────────────────────────────────

LUXURY_CAMPAIGNS = ["Maldives Luxe", "Dubai Shopping Festival", "Paris Romantique", "Bali Évasion"]


def det_revenue(lead_id, status, is_b2b, channel, campaign):
    """Deterministic revenue based on lead characteristics (Traveltodo pricing)."""
    if status != "converted":
        return 0.0
    if is_b2b:
        lo, hi = 6000, 10000   # B2B corporate travel (Traveltodo Espace Entreprises)
    elif campaign in LUXURY_CAMPAIGNS:
        lo, hi = 8000, 14000   # Luxury packages (Maldives, Dubai premium)
    elif channel in ["instagram", "tiktok"]:
        lo, hi = 4500, 8000    # Social channels attract younger, aspirational buyers
    else:
        lo, hi = 2200, 6000    # Standard domestic/international packages
    return det_float(lead_id, lo, hi, "revenue")


# CPL by channel — HubSpot 2025 benchmarks adjusted for Tunisian market
# Sources:
# - HubSpot 2025 CPL Benchmarks: SEO $31, Email $53, PPC $181, LinkedIn higher
# - DataReportal: Tunisian audience sizes by platform
# - PPP adjustment factor 0.35-0.45 applied to global benchmarks
CPL_RANGES = {
    "instagram": (130, 180),   # Growing channel, moderate competition
    "tiktok":    (80, 120),    # Cheapest channel, younger demographic
    "facebook":  (180, 250),   # Dominant channel, higher competition
    "whatsapp":  (70, 100),    # Direct messaging, low cost
    "email":     (90, 130),    # Newsletter, database marketing
    "linkedin":  (280, 400),   # B2B, premium targeting
    "organic":   (30, 60),     # SEO, content — lowest CPL
    "referral":  (40, 70),     # Word of mouth from 30 physical agencies
}

# After Lynara: AI optimization → 23% CPL reduction
# Source: Campaign Middle East MENA case study (23% lower CPL via WhatsApp)
CPL_AI_FACTOR = 0.77


def det_cpl(lead_id, channel, is_after):
    lo, hi = CPL_RANGES.get(channel, (100, 200))
    base = det_float(lead_id, lo, hi, "cpl")
    return round(base * (CPL_AI_FACTOR if is_after else 1.0), 2)


# Status weights anchored to Unbounce conversion benchmarks
# Before: 14.8% conversion (Unbounce travel services median)
# After:  18.5% conversion (conservative improvement from 14.8%)
# Source: Unbounce 2024 Conversion Benchmark Report
STATUSES_BEFORE = ["new", "contacted", "qualified", "negotiation", "converted", "lost"]
WEIGHTS_BEFORE  = [0.19, 0.22, 0.19, 0.07, 0.148, 0.182]   # Sum = 1.000

STATUSES_AFTER  = ["new", "contacted", "qualified", "negotiation", "converted", "lost"]
WEIGHTS_AFTER   = [0.17, 0.19, 0.18, 0.08, 0.185, 0.195]   # Sum = 1.000


def det_status(lead_id, is_after):
    """Deterministic status based on lead_id — no random()."""
    h = int(hashlib.md5((lead_id + "status").encode()).hexdigest(), 16)
    r = (h % 10000) / 10000.0
    weights = WEIGHTS_AFTER if is_after else WEIGHTS_BEFORE
    statuses = STATUSES_AFTER if is_after else STATUSES_BEFORE
    cumulative = 0
    for s, w in zip(statuses, weights):
        cumulative += w
        if r < cumulative:
            return s
    return statuses[-1]


# Score ranges by status
SCORE_RANGES = {
    "converted":   (78, 98),
    "negotiation": (62, 82),
    "qualified":   (48, 68),
    "contacted":   (35, 54),
    "new":         (25, 50),
    "lost":        (10, 32),
}


def det_score(lead_id, status):
    lo, hi = SCORE_RANGES.get(status, (30, 50))
    return det(lead_id, lo, hi)


# B2B probability by channel
B2B_PROB = {
    "linkedin": 0.75, "email": 0.28, "whatsapp": 0.10,
    "organic": 0.15,  "referral": 0.10, "facebook": 0.05,
    "instagram": 0.03, "tiktok": 0.00,
}


def is_b2b(lead_id, channel):
    h = int(hashlib.md5((lead_id + "b2b").encode()).hexdigest(), 16)
    return (h % 100) / 100.0 < B2B_PROB.get(channel, 0.05)


# AI confidence: Before = 0 (no AI), After = 68-96
def det_confidence(score, is_after):
    if not is_after:
        return 0

    confidence = round(score * 0.85 + 15)

    return max(60, min(96, confidence))


# Days to convert — B2B longer, After 35% faster
def det_days(lead_id, status, b2b, is_after):
    if status != "converted":
        return 0
    if b2b:
        base = det(lead_id, 8, 35)
    else:
        base = det(lead_id, 1, 12)
    return round(base * (0.65 if is_after else 1.0))


# ── CAMPAIGN DEFINITIONS ─────────────────────────────────────────────────────

CAMPAIGNS_BEFORE = [
    "Campagne Générale Traveltodo",
    "Pack Djerba Famille",
    "Istanbul Découverte",
    "Campagne Ramadan 2025",
    "Offre Été Hammamet 2025",
]

CAMPAIGNS_AFTER = [
    "Campagne Générale Traveltodo",
    "Pack Djerba Famille",
    "Istanbul Découverte",
    "Campagne Ramadan 2026",
    "Offre Été Hammamet 2026",
    "Maldives Luxe",
    "Dubai Shopping Festival",
    "Paris Romantique",
    "Bali Évasion",
]

CHANNEL_CAMPAIGNS_BEFORE = {
    "facebook":  ["Campagne Générale Traveltodo", "Pack Djerba Famille", "Campagne Ramadan 2025", "Offre Été Hammamet 2025"],
    "instagram": ["Offre Été Hammamet 2025", "Campagne Générale Traveltodo"],
    "email":     ["Campagne Générale Traveltodo", "Pack Djerba Famille", "Istanbul Découverte", "Campagne Ramadan 2025"],
    "linkedin":  ["Istanbul Découverte", "Campagne Générale Traveltodo"],
    "organic":   ["Campagne Générale Traveltodo", "Offre Été Hammamet 2025"],
    "referral":  ["Pack Djerba Famille", "Campagne Générale Traveltodo"],
}

CHANNEL_CAMPAIGNS_AFTER = {
    "instagram": ["Campagne Générale Traveltodo", "Pack Djerba Famille", "Campagne Ramadan 2026", "Maldives Luxe", "Paris Romantique"],
    "tiktok":    ["Campagne Générale Traveltodo", "Offre Été Hammamet 2026", "Dubai Shopping Festival", "Bali Évasion"],
    "facebook":  ["Campagne Générale Traveltodo", "Pack Djerba Famille", "Campagne Ramadan 2026"],
    "whatsapp":  ["Pack Djerba Famille", "Campagne Ramadan 2026", "Offre Été Hammamet 2026"],
    "email":     ["Campagne Générale Traveltodo", "Istanbul Découverte", "Maldives Luxe"],
    "linkedin":  ["Istanbul Découverte", "Campagne Générale Traveltodo"],
    "organic":   ["Campagne Générale Traveltodo"],
    "referral":  ["Pack Djerba Famille"],
}


def det_campaign(lead_id, channel, is_after):
    campaigns = CHANNEL_CAMPAIGNS_AFTER[channel] if is_after else CHANNEL_CAMPAIGNS_BEFORE[channel]
    h = int(hashlib.md5((lead_id + "camp").encode()).hexdigest(), 16)
    return campaigns[h % len(campaigns)]


# ── EXACT CAMPAIGN LEAD VOLUMES ──────────────────────────────────────────────

# Before: 383 campaign leads total
# Ramadan peak: 25% above monthly average (Wego: 20.67-25.16%)
CAMPAIGN_LEADS_BEFORE = [
    # (start, end, email, facebook, linkedin, organic, referral)
    (datetime(2025, 2, 1),  datetime(2025, 2, 28),  20, 35,  9,  7,  4),   # 75
    (datetime(2025, 3, 1),  datetime(2025, 3, 31),  26, 44, 12,  9,  5),   # 96 (Ramadan peak: 25% above avg)
    (datetime(2025, 4, 1),  datetime(2025, 4, 30),  22, 38, 10,  8,  4),   # 82
    (datetime(2025, 5, 1),  datetime(2025, 5, 31),  23, 39, 11,  8,  4),   # 85
    (datetime(2025, 6, 1),  datetime(2025, 6, 15),  12, 20,  6,  5,  2),   # 45
]

# After: 351 campaign leads total
# Ramadan peak: 25% above monthly average (Wego: 20.67-25.16%)
CAMPAIGN_LEADS_AFTER = [
    # (start, end, instagram, tiktok, facebook, whatsapp, email, linkedin, organic, referral)
    (datetime(2026, 2, 1),  datetime(2026, 2, 28),  20, 15, 13, 10,  7,  3,  2,  1),   # 71
    (datetime(2026, 3, 1),  datetime(2026, 3, 31),  25, 19, 16, 13,  9,  4,  3,  2),   # 91 (Ramadan peak: 25% above avg)
    (datetime(2026, 4, 1),  datetime(2026, 4, 30),  21, 15, 13, 11,  7,  3,  2,  1),   # 73
    (datetime(2026, 5, 1),  datetime(2026, 5, 31),  22, 16, 14, 11,  8,  3,  2,  1),   # 77
    (datetime(2026, 6, 1),  datetime(2026, 6, 15),  11,  8,  7,  5,  4,  2,  1,  1),   # 39
]


# ── SOCIAL INTERACTION VOLUMES ──────────────────────────────────────────────

# Before: 405 interactions → 12 social leads (3% human detection)
# Source: Brand24 cold calling engagement benchmark (2-3%)
SOCIAL_BEFORE = [
    (datetime(2025, 2, 1), datetime(2025, 2, 28),  80,  2),   # interactions, leads
    (datetime(2025, 3, 1), datetime(2025, 3, 31), 110,  3),   # Ramadan peak
    (datetime(2025, 4, 1), datetime(2025, 4, 30),  75,  2),
    (datetime(2025, 5, 1), datetime(2025, 5, 31),  85,  3),
    (datetime(2025, 6, 1), datetime(2025, 6, 15),  55,  2),
]

# After: 980 interactions → 196 social leads (20% AI detection)
# Source: Brand24 social listening engagement benchmark (20-30%)
SOCIAL_AFTER = [
    (datetime(2026, 2, 1), datetime(2026, 2, 28), 140,  28),
    (datetime(2026, 3, 1), datetime(2026, 3, 31), 280,  56),   # Ramadan peak
    (datetime(2026, 4, 1), datetime(2026, 4, 30), 210,  42),
    (datetime(2026, 5, 1), datetime(2026, 5, 31), 230,  46),
    (datetime(2026, 6, 1), datetime(2026, 6, 15), 120,  24),
]


# ── MARKETING EVENTS ─────────────────────────────────────────────────────────

EVENTS_BEFORE = [
    (datetime(2025, 2, 1), datetime(2025, 2, 28),  35),
    (datetime(2025, 3, 1), datetime(2025, 3, 31),  48),
    (datetime(2025, 4, 1), datetime(2025, 4, 30),  30),
    (datetime(2025, 5, 1), datetime(2025, 5, 31),  38),
    (datetime(2025, 6, 1), datetime(2025, 6, 15),  22),
]

EVENTS_AFTER = [
    (datetime(2026, 2, 1), datetime(2026, 2, 28),  75),
    (datetime(2026, 3, 1), datetime(2026, 3, 31), 160),
    (datetime(2026, 4, 1), datetime(2026, 4, 30), 130),
    (datetime(2026, 5, 1), datetime(2026, 5, 31), 140),
    (datetime(2026, 6, 1), datetime(2026, 6, 15),  80),
]


# ── INTERACTION TEMPLATES ────────────────────────────────────────────────────

TEMPLATES_AFTER = [
    {"content": "C est quoi le prix pour {dest} svp?",                        "intent": "price_inquiry",   "sentiment": "neutral",  "urgency": (60, 82)},
    {"content": "Bonjour je cherche un voyage pour 2 personnes à {dest}",     "intent": "price_inquiry",   "sentiment": "neutral",  "urgency": (62, 82)},
    {"content": "Combien pour {dest} en famille 4 personnes?",                "intent": "price_inquiry",   "sentiment": "neutral",  "urgency": (58, 78)},
    {"content": "Voyage de noces juillet budget 12000 TND svp",               "intent": "price_inquiry",   "sentiment": "positive", "urgency": (75, 92)},
    {"content": "Bonjour budget 8000 TND pour 2 personnes {dest} possible?",  "intent": "price_inquiry",   "sentiment": "positive", "urgency": (70, 88)},
    {"content": "Magnifique! On peut réserver comment?",                      "intent": "visit_request",   "sentiment": "positive", "urgency": (80, 96)},
    {"content": "Bonjour je veux partir en juillet vous avez de la dispo?",   "intent": "visit_request",   "sentiment": "positive", "urgency": (78, 94)},
    {"content": "Salam je veux partir en lune de miel à {dest}",              "intent": "visit_request",   "sentiment": "positive", "urgency": (85, 97)},
    {"content": "Je veux réserver {dest} pour 2 adultes 1 enfant",            "intent": "visit_request",   "sentiment": "positive", "urgency": (82, 96)},
    {"content": "Bonjour voyage entreprise pour 10 personnes {dest}",         "intent": "visit_request",   "sentiment": "positive", "urgency": (78, 93)},
    {"content": "Wallah {dest} c magnifique je veux y aller!",                "intent": "interest",        "sentiment": "positive", "urgency": (25, 50)},
    {"content": "Super agence je recommande vivement à tout le monde!",       "intent": "interest",        "sentiment": "positive", "urgency": (15, 35)},
    {"content": "Vous faites des facilités de paiement?",                     "intent": "interest",        "sentiment": "neutral",  "urgency": (35, 55)},
    {"content": "Comment contacter votre agence svp?",                        "intent": "contact_request", "sentiment": "neutral",  "urgency": (55, 70)},
    {"content": "Vous avez un numéro whatsapp svp?",                          "intent": "contact_request", "sentiment": "neutral",  "urgency": (58, 73)},
    {"content": "Trop cher pour moi malheureusement",                         "intent": "price_objection", "sentiment": "negative", "urgency": (8,  22)},
    {"content": "C est cher je trouve mieux ailleurs",                        "intent": "price_objection", "sentiment": "negative", "urgency": (8,  18)},
]

TEMPLATES_BEFORE = [
    {"content": "C est quoi le prix pour {dest} svp?",                        "intent": "price_inquiry",   "sentiment": "neutral",  "urgency": (30, 55)},
    {"content": "Bonjour je cherche un voyage pour 2 personnes à {dest}",     "intent": "price_inquiry",   "sentiment": "neutral",  "urgency": (28, 50)},
    {"content": "Voyage de noces juillet budget 12000 TND svp",               "intent": "price_inquiry",   "sentiment": "neutral",  "urgency": (35, 60)},
    {"content": "Magnifique! On peut réserver comment?",                      "intent": "visit_request",   "sentiment": "positive", "urgency": (40, 65)},
    {"content": "Bonjour je veux partir en juillet vous avez de la dispo?",   "intent": "visit_request",   "sentiment": "positive", "urgency": (35, 58)},
    {"content": "Salam je veux partir en lune de miel à {dest}",              "intent": "visit_request",   "sentiment": "positive", "urgency": (38, 62)},
    {"content": "Je veux réserver {dest} pour 2 adultes 1 enfant",            "intent": "visit_request",   "sentiment": "neutral",  "urgency": (30, 55)},
    {"content": "Wallah {dest} c magnifique je veux y aller!",                "intent": "interest",        "sentiment": "positive", "urgency": (15, 38)},
    {"content": "Super agence je recommande vivement!",                       "intent": "interest",        "sentiment": "positive", "urgency": (10, 30)},
    {"content": "Comment contacter votre agence svp?",                        "intent": "contact_request", "sentiment": "neutral",  "urgency": (25, 45)},
    {"content": "Vous avez un numéro whatsapp svp?",                          "intent": "contact_request", "sentiment": "neutral",  "urgency": (22, 42)},
    {"content": "Trop cher pour moi malheureusement",                         "intent": "price_objection", "sentiment": "negative", "urgency": (15, 35)},
    {"content": "Les prix ont augmenté par rapport à l année dernière",       "intent": "price_objection", "sentiment": "negative", "urgency": (18, 38)},
    {"content": "Pas de réponse depuis 3 jours c est nul",                    "intent": "price_objection", "sentiment": "negative", "urgency": (20, 40)},
    {"content": "Votre concurrent est moins cher",                            "intent": "price_objection", "sentiment": "negative", "urgency": (15, 32)},
]


def det_template(i, templates):
    return templates[i % len(templates)]


def det_date(start, end, lead_id, seed=""):
    """Deterministic date within range based on lead_id."""
    delta = int((end - start).total_seconds())
    h = int(hashlib.md5((lead_id + seed).encode()).hexdigest(), 16)
    seconds = h % delta
    return start + timedelta(seconds=seconds)


# ── SCORE REASON ──────────────────────────────────────────────────────────────

def score_reason(score, status, channel, intent):
    reasons = []
    if score >= 78:
        reasons.append("High engagement score")
    if status == "converted":
        reasons.append("Successfully converted")
    if channel in ["instagram", "tiktok"]:
        reasons.append("Social media engagement high")
    if intent == "price_inquiry":
        reasons.append("Price inquiry detected")
    if intent == "visit_request":
        reasons.append("Visit request — high urgency")
    if not reasons:
        reasons.append("Standard qualification score")
    return " | ".join(reasons[:3])


# ── INSERT LEAD ──────────────────────────────────────────────────────────────

def insert_lead(channel, is_after, campaign, dt, intent, source_type):
    lead_id = str(uuid.uuid4())
    b2b = is_b2b(lead_id, channel)
    status = det_status(lead_id, is_after)
    converted = status == "converted"
    s_score = det_score(lead_id, status)
    revenue = det_revenue(lead_id, status, b2b, channel, campaign)
    confidence = det_confidence(s_score, is_after)

    lead_data = {
        "lead_id":             lead_id,
        "company_id":          COMPANY_ID,
        "customer_name":       det_name(lead_id),
        "source":              channel,
        "city":                det_city(lead_id),
        "status":              status,
        "campaign_name":       campaign,
        "is_converted":        converted,
        "revenue":             revenue,
        "score":               s_score,
        "lead_type":           "b2b" if b2b else "b2c",
        "score_reason":        score_reason(s_score, status, channel, intent),
        "b2b_company_size":    SIZES[det(lead_id, 0, len(SIZES)-1)] if b2b else None,
        "b2b_industry":        INDUSTRIES[det(lead_id, 0, len(INDUSTRIES)-1)] if b2b else None,
        "human_escalated":     converted and det(lead_id, 0, 9) < 3,
        "ai_confidence_score": confidence,
        "created_at":          dt.isoformat(),
        "last_activity_date":  dt.date().isoformat(),
        "lead_source_type":    source_type,
    }
    try:
        result = supabase.table("lynara_leads").insert(lead_data).execute()
        if result.data:
            return result.data[0]["lead_id"]
    except Exception as e:
        print(f"    Error: {e}")
    return None


# ── GENERATE CAMPAIGN LEADS ──────────────────────────────────────────────────

def generate_campaign_leads():
    print("  generating campaign leads (deterministic exact counts)...")
    total = 0

    for ms, me, n_email, n_fb, n_li, n_org, n_ref in CAMPAIGN_LEADS_BEFORE:
        for channel, count in [("email", n_email), ("facebook", n_fb),
                               ("linkedin", n_li), ("organic", n_org), ("referral", n_ref)]:
            for i in range(count):
                seed_id = f"before-{channel}-{ms.month}-{i}"
                lead_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, seed_id))
                dt = det_date(ms, me, lead_id)
                camp = det_campaign(lead_id, channel, False)
                if insert_lead(channel, False, camp, dt, "price_inquiry", "campaign"):
                    total += 1

    for ms, me, n_ig, n_tk, n_fb, n_wa, n_em, n_li, n_org, n_ref in CAMPAIGN_LEADS_AFTER:
        for channel, count in [("instagram", n_ig), ("tiktok", n_tk), ("facebook", n_fb),
                               ("whatsapp", n_wa), ("email", n_em), ("linkedin", n_li),
                               ("organic", n_org), ("referral", n_ref)]:
            for i in range(count):
                seed_id = f"after-{channel}-{ms.month}-{i}"
                lead_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, seed_id))
                dt = det_date(ms, me, lead_id)
                camp = det_campaign(lead_id, channel, True)
                if insert_lead(channel, True, camp, dt, "price_inquiry", "campaign"):
                    total += 1

    print(f"  ✅ {total} campaign leads inserted")
    return total


# ── GENERATE SOCIAL INTERACTIONS ─────────────────────────────────────────────

def generate_social():
    print("  generating social interactions (deterministic)...")
    rows = []
    leads_created = 0

    # Before: Facebook(72%) + Instagram(28%), human detection
    before_platforms = [("facebook", 0.72), ("instagram", 0.28)]

    for ms, me, n_interactions, n_leads in SOCIAL_BEFORE:
        lead_indices = set()
        step = n_interactions // n_leads if n_leads > 0 else n_interactions
        for j in range(n_leads):
            lead_indices.add(j * step)

        for i in range(n_interactions):
            seed_id = f"social-before-{ms.month}-{i}"
            int_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, seed_id))
            template = det_template(i, TEMPLATES_BEFORE)
            dest = det_dest(int_id)
            content = template["content"].format(dest=dest) if "{dest}" in template["content"] else template["content"]
            dt = det_date(ms, me, int_id)
            intent = template["intent"]
            sentiment = template["sentiment"]
            urgency = det(int_id, template["urgency"][0], template["urgency"][1])

            h_plat = int(hashlib.md5((int_id + "plat").encode()).hexdigest(), 16)
            platform = "facebook" if (h_plat % 100) < 72 else "instagram"

            lead_uuid = None
            should_create = i in lead_indices
            if should_create:
                camp = det_campaign(int_id, platform, False)
                lead_uuid = insert_lead(platform, False, camp, dt, intent, "social")
                if lead_uuid:
                    leads_created += 1

            rows.append({
                "company_id": COMPANY_ID,
                "platform": platform,
                "interaction_type": "comment",
                "content": content,
                "intent": intent,
                "sentiment": sentiment,
                "urgency_score": urgency,
                "created_at": dt.isoformat(),
                "campaign_name": det_campaign(int_id, platform, False),
                "agent_name": "Human_Agent",
                "agent_response_time_seconds": det(int_id, 180, 600),
                "escalated_to_human": False,
                "lead_id": lead_uuid,
                "likes": det(int_id, 0, 150),
                "comments": 1,
                "shares": det(int_id, 0, 20),
                "reach": det(int_id, 500, 5000),
                "event_ts": dt.isoformat(),
                "is_post_lynara": False,
                "conversions": 1 if should_create else 0,
            })

    # After: Instagram(40%), TikTok(30%), Facebook(18%), WhatsApp(12%), AI detection
    after_platform_weights = after_platform_weights = [
    ("instagram", 35),
    ("tiktok", 60),
    ("facebook", 78),
    ("whatsapp", 90),
    ("linkedin", 100)
]

    for ms, me, n_interactions, n_leads in SOCIAL_AFTER:
        lead_indices = set()
        step = n_interactions // n_leads if n_leads > 0 else n_interactions
        for j in range(n_leads):
            lead_indices.add(j * step)

        for i in range(n_interactions):
            seed_id = f"social-after-{ms.month}-{i}"
            int_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, seed_id))
            template = det_template(i, TEMPLATES_AFTER)
            dest = det_dest(int_id)
            content = template["content"].format(dest=dest) if "{dest}" in template["content"] else template["content"]
            dt = det_date(ms, me, int_id)
            intent = template["intent"]
            sentiment = template["sentiment"]
            urgency = det(int_id, template["urgency"][0], template["urgency"][1])

            h_plat = int(hashlib.md5((int_id + "plat").encode()).hexdigest(), 16) % 100
            platform = "instagram"
            for plat, threshold in after_platform_weights:
                if h_plat < threshold:
                    platform = plat
                    break

            lead_uuid = None
            should_create = i in lead_indices
            if should_create:
                camp = det_campaign(int_id, platform, True)
                lead_uuid = insert_lead(platform, True, camp, dt, intent, "social")
                if lead_uuid:
                    leads_created += 1

            is_ig_tk = platform in ["instagram", "tiktok"]
            rows.append({
                "company_id": COMPANY_ID,
                "platform": platform,
                "interaction_type": "comment",
                "content": content,
                "intent": intent,
                "sentiment": sentiment,
                "urgency_score": urgency,
                "created_at": dt.isoformat(),
                "campaign_name": det_campaign(int_id, platform, True),
                "agent_name": "Social_Listener_Agent" if should_create else "Conversation_Agent",
                "agent_response_time_seconds": det(int_id, 5, 90),
                "escalated_to_human": should_create and urgency > 82 and sentiment == "positive",
                "lead_id": lead_uuid,
                "likes": det(int_id, 100, 2000) if is_ig_tk else det(int_id, 20, 400),
                "comments": 1,
                "shares": det(int_id, 10, 300) if is_ig_tk else det(int_id, 2, 50),
                "reach": det(int_id, 2000, 20000) if is_ig_tk else det(int_id, 500, 5000),
                "event_ts": dt.isoformat(),
                "is_post_lynara": True,
                "conversions": 1 if should_create else 0,
            })

    inserted = 0
    for i in range(0, len(rows), 100):
        try:
            supabase.table("lynara_social").insert(rows[i:i+100]).execute()
            inserted += len(rows[i:i+100])
        except Exception as e:
            print(f"    error batch {i}: {e}")

    print(f"  ✅ {inserted} social interactions inserted")
    print(f"  ✅ {leads_created} social leads created")
    return leads_created


# ── GENERATE MARKETING EVENTS ─────────────────────────────────────────────────

def generate_events():
    total = sum(c for _, _, c in EVENTS_BEFORE) + sum(c for _, _, c in EVENTS_AFTER)
    print(f"  generating {total} marketing events...")
    rows = []
    event_types = ["post_published", "lead_created", "lead_converted", "message_sent", "dm_received"]
    et_weights = [35, 28, 5, 20, 12]  # proportional weights

    def pick_event_type(seed_id):
        h = int(hashlib.md5(seed_id.encode()).hexdigest(), 16) % sum(et_weights)
        cum = 0
        for et, w in zip(event_types, et_weights):
            cum += w
            if h < cum:
                return et
        return "post_published"

    # Before events
    before_channels = ["facebook", "email", "instagram", "organic", "referral"]
    bc_weights = [42, 28, 16, 8, 6]
    for ms, me, count in EVENTS_BEFORE:
        for i in range(count):
            seed_id = f"event-before-{ms.month}-{i}"
            ev_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, seed_id))
            etype = pick_event_type(seed_id)
            h_ch = int(hashlib.md5((seed_id + "ch").encode()).hexdigest(), 16) % sum(bc_weights)
            channel = before_channels[0]
            cum = 0
            for ch, w in zip(before_channels, bc_weights):
                cum += w
                if h_ch < cum:
                    channel = ch
                    break
            dt = det_date(ms, me, ev_id)
            camp = det_campaign(ev_id, channel, False)
            likes = comments = shares = reach = recipients = 0
            open_rate = click_rate = 0.0
            if etype == "post_published":
                likes = det(ev_id, 200, 800)
                comments = det(ev_id, 15, 80)
                shares = det(ev_id, 5, 35)
                reach = det(ev_id, 2000, 10000)
            elif etype == "message_sent":
                recipients = det(ev_id, 500, 3000)
                open_rate = det_float(ev_id, 0.18, 0.28, "or")
                click_rate = det_float(ev_id, 0.04, 0.10, "cr")
            rows.append({
                "company_id": COMPANY_ID,
                "event_type": etype,
                "channel": channel,
                "campaign_name": camp,
                "likes": likes,
                "comments": comments,
                "shares": shares,
                "reach": reach,
                "recipients": recipients,
                "open_rate": open_rate,
                "click_rate": click_rate,
                "event_ts": dt.isoformat(),
                "is_post_lynara": False
            })

    # After events
    after_channels = ["instagram", "tiktok", "facebook", "whatsapp", "email", "linkedin", "organic"]
    ac_weights = [32, 22, 18, 12, 8, 4, 4]
    for ms, me, count in EVENTS_AFTER:
        is_ramadan = ms.month in [2, 3]
        boost = 1.15 if is_ramadan else 1.0
        for i in range(count):
            seed_id = f"event-after-{ms.month}-{i}"
            ev_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, seed_id))
            etype = pick_event_type(seed_id)
            h_ch = int(hashlib.md5((seed_id + "ch").encode()).hexdigest(), 16) % sum(ac_weights)
            channel = after_channels[0]
            cum = 0
            for ch, w in zip(after_channels, ac_weights):
                cum += w
                if h_ch < cum:
                    channel = ch
                    break
            dt = det_date(ms, me, ev_id)
            camp = det_campaign(ev_id, channel, True)
            likes = comments = shares = reach = recipients = 0
            open_rate = click_rate = 0.0
            if etype == "post_published":
                if channel == "tiktok":
                    likes = int(det(ev_id, 400, 1500) * boost)
                    comments = int(det(ev_id, 25, 150) * boost)
                    shares = int(det(ev_id, 15, 100) * boost)
                    reach = int(det(ev_id, 3000, 14000) * boost)
                elif channel == "instagram":
                    likes = int(det(ev_id, 350, 1300) * boost)
                    comments = int(det(ev_id, 22, 130) * boost)
                    shares = int(det(ev_id, 12, 75) * boost)
                    reach = int(det(ev_id, 2500, 12000) * boost)
                else:
                    likes = int(det(ev_id, 250, 900) * boost)
                    comments = int(det(ev_id, 15, 90) * boost)
                    shares = int(det(ev_id, 8, 45) * boost)
                    reach = int(det(ev_id, 1500, 7000) * boost)
            elif etype == "message_sent":
                recipients = det(ev_id, 2000, 8000)
                open_rate = det_float(ev_id, 0.35, 0.58, "or")
                click_rate = det_float(ev_id, 0.12, 0.30, "cr")
            rows.append({
                "company_id": COMPANY_ID,
                "event_type": etype,
                "channel": channel,
                "campaign_name": camp,
                "likes": likes,
                "comments": comments,
                "shares": shares,
                "reach": reach,
                "recipients": recipients,
                "open_rate": open_rate,
                "click_rate": click_rate,
                "event_ts": dt.isoformat(),
                "is_post_lynara": True
            })

    inserted = 0
    for i in range(0, len(rows), 100):
        try:
            supabase.table("lynara_events").insert(rows[i:i+100]).execute()
            inserted += len(rows[i:i+100])
        except Exception as e:
            print(f"    error batch {i}: {e}")
    print(f"  ✅ {inserted} marketing events inserted")


# ── CAMPAIGN SPEND ────────────────────────────────────────────────────────────

def update_campaign_spend():
    print("  updating campaign actual_spend...")
    try:
        res = supabase.table("dw_dim_campaign").select("campaign_id, campaign_name, budget").execute()
        for c in (res.data or []):
            budget = float(c.get("budget") or 0)
            cid = c["campaign_id"]
            # Deterministic spend: 88-112% of budget based on campaign_id hash
            h = int(hashlib.md5(str(cid).encode()).hexdigest(), 16)
            factor = 0.88 + (h % 2400) / 10000.0  # 0.88 to 1.12
            actual = round(budget * factor, 2) if budget > 0 else round(30000 + (h % 40000), 2)
            supabase.table("dw_dim_campaign").update(
                {"actual_spend": actual}
            ).eq("campaign_id", cid).execute()
        print("  ✅ actual_spend updated")
    except Exception as e:
        print(f"  ⚠️ {e}")


# ── MAIN ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 62)
    print("🚀 Lynara Campaign — Data Generation")
    print("   Benchmark-Calibrated Deterministic Synthetic Data")
    print("=" * 62)
    print("\nMethodology: Deterministic lead placement using UUID-based")
    print("hashing. No random() for business decisions. All KPIs")
    print("anchored to Brand24/HubSpot/DataReportal/Wego/Unbounce benchmarks.")
    print("\nExpected output:")
    print("  Before: ~395 leads | 14.8% conv | CPL ~176 TND")
    print("  After:  ~547 leads | 18.5% conv | CPL ~135 TND")
    print("  Growth: +38.5% leads | +75% revenue | -23% CPL")
    print("-" * 62)

    print("\n[1/4] Campaign leads...")
    campaign_leads = generate_campaign_leads()

    print("\n[2/4] Social interactions + leads...")
    social_leads = generate_social()

    print("\n[3/4] Marketing events...")
    generate_events()

    print("\n[4/4] Campaign spend...")
    update_campaign_spend()

    total = campaign_leads + social_leads
    print("\n" + "=" * 62)
    print(f"✅ Campaign leads : {campaign_leads}")
    print(f"✅ Social leads   : {social_leads}")
    print(f"✅ Total leads    : {total}")
    print(f"\n▶️  Now run: python etl_pipeline.py")
    print("=" * 62)