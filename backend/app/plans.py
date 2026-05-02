PLAN_LIMITS = {
    "free":     {"label": "Miễn phí",   "trees": 1, "members_per_tree": 30,   "price": 0,         "color": "#6b7280"},
    "basic":    {"label": "Cơ bản",     "trees": 1, "members_per_tree": 200,  "price": 300_000,   "color": "#2D5016"},
    "standard": {"label": "Tiêu chuẩn", "trees": 1, "members_per_tree": 1000, "price": 500_000,   "color": "#1d4ed8"},
    "premium":  {"label": "Cao cấp",    "trees": 3, "members_per_tree": 2000, "price": 1_000_000, "color": "#92400e"},
}


def get_plan(plan: str, db=None) -> dict:
    """Return plan config. If db provided, reads live values from DB."""
    if db is not None:
        try:
            from .models import PlanSetting
            row = db.query(PlanSetting).filter_by(key=plan).first()
            if row:
                base = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
                return {**base, "label": row.label, "trees": row.trees, "members_per_tree": row.members_per_tree, "price": row.price}
        except Exception:
            pass
    return PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
