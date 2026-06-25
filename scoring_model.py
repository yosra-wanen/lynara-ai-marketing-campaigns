"""
scoring_model.py — Lynara Campaign Lead Scoring (v2)

"""
 
import os
import io
import ssl
import json
import urllib.request
import numpy as np
import pickle
from pathlib import Path
from supabase import create_client
 
try:
    import pandas as pd
    from sklearn.preprocessing import LabelEncoder, StandardScaler
    from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
    from sklearn.linear_model import LogisticRegression
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.metrics import (
        accuracy_score, roc_auc_score, f1_score,
        precision_recall_curve, auc as sk_auc,
        classification_report
    )
    import xgboost as xgb
    import optuna
except ImportError:
    print("Installing required packages...")
    os.system("pip install scikit-learn xgboost pandas optuna --quiet --break-system-packages")
    import pandas as pd
    from sklearn.preprocessing import LabelEncoder, StandardScaler
    from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
    from sklearn.linear_model import LogisticRegression
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.metrics import (
        accuracy_score, roc_auc_score, f1_score,
        precision_recall_curve, auc as sk_auc,
        classification_report
    )
    import xgboost as xgb
    import optuna
 
# Suppress Optuna logs (keep only warnings)
optuna.logging.set_verbosity(optuna.logging.WARNING)
 
SUPABASE_URL = "https://jwkjqowuponrqmxwhgsj.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a2pxb3d1cG9ucnFteHdoZ3NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3NzExNCwiZXhwIjoyMDg2NzUzMTE0fQ.cZPC5QXFMOyWBJgDBKc9uXoo-a6x0E-vbaH3AqHwsIc"
COMPANY_ID   = "4f8edee8-9ec2-47d8-be24-180854da63df"
 
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
 
UCI_URL = "https://raw.githubusercontent.com/girishkhadse/UCI_Bank_Marketing/master/bank-additional-full.csv"
 
# Features — duration explicitly excluded (known data leakage)
FEATURES_CAT = ['contact', 'job', 'poutcome', 'month', 'day_of_week', 'marital', 'education']
FEATURES_NUM = ['campaign', 'previous', 'age']
ALL_FEATURES  = FEATURES_CAT + FEATURES_NUM
 
MODEL_PATH = Path("lynara_model.pkl")
 
 
# ── STEP 1: DOWNLOAD UCI DATASET ─────────────────────────────────────────────
def download_uci_data():
    print("\n[1/7] Downloading UCI Bank Marketing Dataset...")
    print("      Source: Moro et al. (2014) — CC BY 4.0 License")
    print("      Note: 'duration' column excluded (known data leakage)")
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    req = urllib.request.urlopen(UCI_URL, context=ctx)
    data = req.read().decode('utf-8')
    df = pd.read_csv(io.StringIO(data), sep=',')
    conv_rate = round((df['y'] == 'yes').mean() * 100, 1)
    print(f"  ✅ {len(df):,} real marketing leads downloaded")
    print(f"  ✅ Conversion rate: {conv_rate}% (real benchmark)")
    return df
 
 
# ── STEP 2: PREPARE FEATURES ─────────────────────────────────────────────────
def prepare_features(df):
    """Encode categoricals, scale numericals. Returns X, y, encoders, scaler."""
    encoders = {}
    X_parts = []
 
    for col in FEATURES_CAT:
        enc = LabelEncoder()
        encoded = enc.fit_transform(df[col].astype(str))
        encoders[col] = enc
        X_parts.append(encoded.reshape(-1, 1))
 
    num_data = df[FEATURES_NUM].values.astype(float)
    scaler = StandardScaler()
    num_scaled = scaler.fit_transform(num_data)
    X_parts.append(num_scaled)
 
    X = np.hstack(X_parts)
    y = (df['y'] == 'yes').astype(int).values
 
    return X, y, encoders, scaler
 
 
# ── STEP 3: OPTUNA TUNING FOR XGBOOST ────────────────────────────────────────
def tune_xgboost(X, y, n_trials=50):
    """Tune XGBoost hyperparameters using Optuna with stratified 5-fold CV-AUC."""
    print("\n[2/7] Tuning XGBoost with Optuna (50 trials, 5-fold stratified CV)...")
 
    neg_ratio = (y == 0).sum() / (y == 1).sum()
    print(f"  Class ratio (neg/pos): {neg_ratio:.1f}")
 
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
 
    def objective(trial):
        params = {
            'n_estimators':      trial.suggest_int('n_estimators', 100, 500),
            'max_depth':         trial.suggest_int('max_depth', 3, 10),
            'learning_rate':     trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
            'subsample':         trial.suggest_float('subsample', 0.6, 1.0),
            'colsample_bytree':  trial.suggest_float('colsample_bytree', 0.6, 1.0),
            'scale_pos_weight':  trial.suggest_float('scale_pos_weight', 2.0, 10.0),
            'random_state':      42,
            'eval_metric':       'logloss',
            'verbosity':         0,
        }
        model = xgb.XGBClassifier(**params)
        scores = cross_val_score(model, X, y, cv=cv, scoring='roc_auc', n_jobs=-1)
        return scores.mean()
 
    study = optuna.create_study(direction='maximize', sampler=optuna.samplers.TPESampler(seed=42))
    study.optimize(objective, n_trials=n_trials, show_progress_bar=False)
 
    best = study.best_params
    print(f"  ✅ Best CV-AUC: {study.best_value:.4f}")
    print(f"  ✅ Best params:")
    for k, v in best.items():
        print(f"      {k}: {round(v, 4) if isinstance(v, float) else v}")
 
    return best, study.best_value
 
 
# ── STEP 4: TRAIN AND COMPARE ALL MODELS ─────────────────────────────────────
def train_and_select(X, y, xgb_best_params):
    """Train all 3 models, select based on CV-AUC."""
    print("\n[3/7] Training and comparing 3 models (selection by CV-AUC)...")
 
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
 
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
 
    models_dict = {
        "Logistic Regression": LogisticRegression(
            max_iter=1000, random_state=42, C=0.1, class_weight='balanced'
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=200, random_state=42, n_jobs=-1, class_weight='balanced'
        ),
        "XGBoost (tuned)": xgb.XGBClassifier(
            **xgb_best_params, random_state=42, eval_metric='logloss', verbosity=0
        ),
    }
 
    print(f"\n  {'='*72}")
    print(f"  {'MODEL COMPARISON — UCI Bank Marketing (41,188 leads)':^72}")
    print(f"  {'='*72}")
    print(f"  {'Model':24} {'Acc':>7} {'AUC':>7} {'CV-AUC':>8} {'F1':>6} {'PR-AUC':>8}")
    print(f"  {'-'*68}")
 
    results = {}
    for name, model in models_dict.items():
        model.fit(X_train, y_train)
        y_pred  = model.predict(X_test)
        y_proba = model.predict_proba(X_test)[:, 1]
 
        # Metrics
        acc    = round(accuracy_score(y_test, y_pred) * 100, 2)
        auc    = round(roc_auc_score(y_test, y_proba), 4)
        f1     = round(f1_score(y_test, y_pred), 4)
        prec, rec, _ = precision_recall_curve(y_test, y_proba)
        pr_auc = round(sk_auc(rec, prec), 4)
 
        # CV-AUC (the selection metric)
        cv_scores = cross_val_score(model, X, y, cv=cv, scoring='roc_auc', n_jobs=-1)
        cv_auc    = round(cv_scores.mean(), 4)
        cv_std    = round(cv_scores.std(), 4)
 
        results[name] = {
            "model": model, "accuracy": acc, "auc": auc,
            "cv_auc": cv_auc, "cv_std": cv_std, "f1": f1, "pr_auc": pr_auc,
        }
        print(f"  {name:24} {acc:>6}% {auc:>7} {cv_auc:>8} {f1:>6} {pr_auc:>8}")
 
    print(f"  {'='*72}")
 
    # SELECT BY CV-AUC (the only honest metric for generalization)
    best_name = max(results, key=lambda k: results[k]["cv_auc"])
    best = results[best_name]
 
    print(f"\n  ✅ SELECTED: {best_name}")
    print(f"     CV-AUC = {best['cv_auc']} ± {best['cv_std']}")
    print(f"     Test AUC = {best['auc']} | F1 = {best['f1']} | PR-AUC = {best['pr_auc']}")
 
    # Feature importance (if tree-based model selected)
    selected_model = best["model"]
    if hasattr(selected_model, 'feature_importances_'):
        print(f"\n  Feature Importance:")
        for fname, imp in sorted(
            zip(ALL_FEATURES, selected_model.feature_importances_),
            key=lambda x: -x[1]
        ):
            bar = "█" * int(imp * 40)
            print(f"    {fname:18}: {bar} {round(imp*100,1)}%")
    elif hasattr(selected_model, 'coef_'):
        print(f"\n  Feature Coefficients (absolute):")
        coefs = np.abs(selected_model.coef_[0])
        for fname, c in sorted(zip(ALL_FEATURES, coefs), key=lambda x: -x[1]):
            bar = "█" * int(c / coefs.max() * 30)
            print(f"    {fname:18}: {bar} {round(c, 3)}")
 
    return best_name, selected_model, results
 
 
# ── STEP 5: SAVE MODEL ───────────────────────────────────────────────────────
def save_model(model, encoders, scaler, model_name, results):
    """Save model + encoders + scaler + metadata to pickle."""
    print(f"\n[4/7] Saving model to {MODEL_PATH}...")
    bundle = {
        "model": model,
        "encoders": encoders,
        "scaler": scaler,
        "model_name": model_name,
        "features_cat": FEATURES_CAT,
        "features_num": FEATURES_NUM,
        "results": {k: {kk: vv for kk, vv in v.items() if kk != "model"}
                    for k, v in results.items()},
    }
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(bundle, f)
    print(f"  ✅ Model saved ({MODEL_PATH.stat().st_size / 1024:.0f} KB)")
 
 
# ── STEP 6: EXTRACT TRAVELTODO LEADS ─────────────────────────────────────────
def extract_leads():
    print("\n[5/7] Extracting After Lynara leads from dw_fact_leads...")
    all_rows = []
    offset   = 0
    while True:
        res = supabase.table("dw_fact_leads").select(
            "fact_lead_id, channel_id, lead_type, lead_source_type, "
            "ai_confidence_score, cost_per_lead, is_converted, is_post_lynara, "
            "created_at, days_to_convert"
        ).eq("company_id", COMPANY_ID).eq("is_post_lynara", True).range(offset, offset + 999).execute()
        batch = res.data or []
        all_rows.extend(batch)
        if len(batch) < 1000:
            break
        offset += 1000
    print(f"  ✅ {len(all_rows)} After Lynara leads extracted")
    return all_rows
 
 
# ── STEP 7: MAP FEATURES ─────────────────────────────────────────────────────
def map_features(leads, encoders, scaler):
    """
    Map Traveltodo lead features to UCI Bank Marketing feature space.
 
    Mapping assumptions (documented):
      channel → contact:   CPL < 160 → "cellular" (digital), else "telephone"
      lead_type → job:     b2b → "management", b2c → "admin."
      source_type → poutcome: social → "success", campaign → "nonexistent"
      ai_confidence → age: rescaled 68-96 → 25-65 (proxy for lead maturity)
      CPL → campaign:      rescaled to 1-10 (contact intensity proxy)
      month/day_of_week:   confidence-based mapping to UCI calendar
      marital/education:   fixed to most common UCI values
 
    NOTE: These mappings are unvalidated assumptions inherent to the
    transfer learning approach. They are documented here for transparency.
    """
    print("\n[6/7] Mapping Traveltodo features to UCI feature space...")
 
    rows = []
    for l in leads:
        cpl       = float(l.get("cost_per_lead") or 150)
        conf      = float(l.get("ai_confidence_score") or 70)
        lead_type = l.get("lead_type") or "b2c"
        source    = l.get("lead_source_type") or "campaign"
 
        contact    = "cellular" if cpl < 160 else "telephone"
        job        = "management" if lead_type == "b2b" else "admin."
        poutcome   = "success" if source == "social" else "nonexistent"
        month      = "may" if conf > 80 else "aug" if conf > 70 else "nov"
        campaign_n = max(1, min(10, int((cpl - 60) / 40)))
        previous_n = 2 if source == "social" else 0
        age_proxy  = int(25 + (conf / 96) * 40) if conf > 0 else 35
 
        rows.append({
            "contact": contact, "job": job, "poutcome": poutcome,
            "month": month, "day_of_week": "mon",
            "marital": "married", "education": "university.degree",
            "campaign": campaign_n, "previous": previous_n, "age": age_proxy,
        })
 
    # Encode categoricals
    X_parts = []
    for col in FEATURES_CAT:
        enc = encoders[col]
        encoded = []
        for r in rows:
            v = r[col]
            if v in enc.classes_:
                encoded.append(enc.transform([v])[0])
            else:
                encoded.append(0)
        X_parts.append(np.array(encoded).reshape(-1, 1))
 
    # Scale numericals with the SAME scaler used during training
    num_data = np.array([[r[col] for col in FEATURES_NUM] for r in rows], dtype=float)
    num_scaled = scaler.transform(num_data)
    X_parts.append(num_scaled)
 
    X = np.hstack(X_parts)
    fact_ids = [l.get("fact_lead_id") for l in leads]
    print(f"  ✅ {len(rows)} leads mapped to UCI feature space")
    return X, fact_ids
 
 
# ── STEP 8: SCORE AND UPDATE ─────────────────────────────────────────────────
def score_leads(model, model_name, X, fact_ids):
    print(f"\n[7/7] Scoring leads with {model_name}...")
    proba  = model.predict_proba(X)[:, 1]
    scores = [round(float(p) * 100, 1) for p in proba]
 
    hot  = sum(1 for s in scores if s >= 76)
    warm = sum(1 for s in scores if 51 <= s < 76)
    cold = sum(1 for s in scores if s < 51)
 
    print(f"  Score range: {min(scores):.1f} — {max(scores):.1f}")
    print(f"  Avg score:   {round(sum(scores)/len(scores), 1)}")
    print(f"  Très Chaud (≥76): {hot} leads")
    print(f"  Chaud (51-75):    {warm} leads")
    print(f"  Froid (<51):      {cold} leads")
    return list(zip(fact_ids, scores))
 
 
def update_scores(scored_leads):
    print(f"\n  Updating lead_score in dw_fact_leads ({len(scored_leads)} leads)...")
    updated = 0
    errors  = 0
    for fact_id, score in scored_leads:
        if not fact_id:
            continue
        try:
            supabase.table("dw_fact_leads").update(
                {"lead_score": score}
            ).eq("fact_lead_id", fact_id).execute()
            updated += 1
        except Exception as e:
            errors += 1
            if errors <= 3:
                print(f"    ⚠️ Error: {e}")
    print(f"  ✅ {updated} leads scored in Supabase")
    if errors:
        print(f"  ⚠️  {errors} errors")
    return updated
 
 
# ── MAIN ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 66)
    print("🤖 Lynara Lead Scoring v2 — Transfer Learning from UCI Data")
    print("   Fixes: Optuna tuning | CV-AUC selection | StandardScaler")
    print("=" * 66)
 
    # Step 1: Download UCI data
    uci_df = download_uci_data()
 
    # Step 2: Prepare features (encode + scale)
    X, y, encoders, scaler = prepare_features(uci_df)
 
    # Step 3: Tune XGBoost with Optuna
    xgb_best_params, xgb_cv_auc = tune_xgboost(X, y, n_trials=50)
 
    # Step 4: Train all 3 models, select by CV-AUC
    best_name, best_model, results = train_and_select(X, y, xgb_best_params)
 
    # Step 5: Save model
    save_model(best_model, encoders, scaler, best_name, results)
 
    # Step 6: Extract Traveltodo leads
    leads = extract_leads()
 
    # Step 7: Map and score
    X_leads, fact_ids = map_features(leads, encoders, scaler)
    scored = score_leads(best_model, best_name, X_leads, fact_ids)
    updated = update_scores(scored)
 
    # Summary
    best_r = results[best_name]
    print(f"\n{'='*66}")
    print(f"🎉 Scoring complete — {updated} leads updated")
    print(f"   Model: {best_name}")
    print(f"   CV-AUC: {best_r['cv_auc']} | Test AUC: {best_r['auc']}")
    print(f"   F1: {best_r['f1']} | PR-AUC: {best_r['pr_auc']}")
    print(f"   Source: Moro, S., Cortez, P., & Rita, P. (2014)")
    print(f"\n▶️  Export CSVs from Supabase → refresh Power BI")
    print(f"{'='*66}")