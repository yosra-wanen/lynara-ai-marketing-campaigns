export type Address = {
    line1: string;
    city: string;
    state: string | null;
    postal_code: string | null;
    country: string;
};

export type Company = {
    company_id: string;
    legal_name: string;
    industry: string | null;
    email: string | null;
    phone: string | null;
    country: string;
    currency: string | null;
    logo_url: string | null;
    role: string;
    status: string;
    capital_social: number | null;
    director_name: string | null;
    start_date: string | null;
    activity_description: string | null;
    addresses: Address[] | null;
};

export type CompanyUpdateForm = {
    legal_name: string;
    capital_social: string;
    director_name: string;
    start_date: string;
    industry: string;
    currency: string;
    activity_description: string;
    email: string;
    phone_prefix: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    state_code: string;
    postal_code: string;
    country: string;
};

// ─── Erreurs formulaire édition ───────────────────────────────────────────────
export type CompanyFormErrors = {
    legal_name: string;
    capital_social: string;
    director_name: string;
    industry: string;
    currency: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
};

// ─── Types create-enterprise (étape 1) ───────────────────────────────────────
export type CreateEnterpriseStepOneData = {
    legal_name: string;
    capital_social: string;
    director_name: string;
    start_date: string;
    industry: string;
    activity_description: string;
};

export type CreateEnterpriseStepOneErrors = {
    legal_name: string;
    director_name: string;
    industry: string;
    capital_social: string;
};

// ─── Types create-enterprise (étape 2) ───────────────────────────────────────
export type CreateEnterpriseStepTwoData = {
    email: string;
    phone: string;
    country: string;
    currency: string;
    phone_prefix: string;
    street: string;
    city: string;
    state: string;
    state_code: string;
    postal_code: string;
};

export type CreateEnterpriseStepTwoErrors = {
    email: string;
    postal_code: string;
    phone: string;
    street: string;
    country: string;
    city: string;
    state: string;
};


// ─── Valeurs initiales partagées ─────────────────────────────────────────────
export const emptyCompanyFormErrors: CompanyFormErrors = {
    legal_name: '', capital_social: '', director_name: '', industry: '',
    currency: '', email: '', phone: '', street: '', city: '',
    state: '', country: '', postal_code: '',
};

export const emptyCreateEnterpriseStepOneErrors: CreateEnterpriseStepOneErrors = {
    legal_name: '', director_name: '', industry: '', capital_social: '',
};

export const emptyCreateEnterpriseStepTwoErrors: CreateEnterpriseStepTwoErrors = {
    email: '', postal_code: '', phone: '',
    street: '', country: '', city: '', state: '',
};