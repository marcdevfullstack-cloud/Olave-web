export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: 'proprietaire' | 'gerant';
  lavage_id?: string;
  telephone?: string;
}

export interface Lavage {
  id: string;
  nom: string;
  adresse?: string;
  ville?: string;
  commune?: string;
  telephone?: string;
  proprietaire_id?: string;
  is_active: boolean;
  nombre_clients?: number;
  nombre_laveurs?: number;
  nombre_gerants?: number;
  chiffre_affaires_mois?: number;
  created_at?: string;
}

export interface Gerant {
  id: string;
  nom: string;
  prenom: string;
  nom_complet?: string;
  email?: string;
  telephone?: string;
  is_active: boolean;
  lavage_id?: string;
  lavage?: { id: string; nom: string };
  created_at?: string;
}

export interface Salaire {
  id: string;
  employe: { id: string; nom_complet: string; type: 'gerant' | 'laveur' };
  lavage?: { id: string; nom: string };
  montant: number;
  montant_formate: string;
  date_paiement: string;
  periode: string;
  observation?: string;
  paye_par: string;
  created_at: string;
}

export interface ProprietaireDashboardStats {
  nombre_lavages: number;
  nombre_lavages_actifs: number;
  nombre_total_clients: number;
  nombre_total_laveurs: number;
  nombre_total_gerants: number;
  ca_jour: number;
  ca_semaine: number;
  ca_mois: number;
  ca_total: number;
  transactions_jour: number;
  transactions_semaine: number;
  transactions_mois: number;
  salaires_mois: number;
  salaires_gerants_mois: number;
  salaires_laveurs_mois: number;
  lavage_plus_performant: { id: string; nom: string; ca_mois: number } | null;
  evolution_ca: { mois_actuel: number; mois_dernier: number; pourcentage: number; tendance: string };
}

export interface LavageComparaison {
  id: string;
  nom: string;
  ville?: string;
  ca_mois: number;
  transactions_mois: number;
  clients_actifs_mois: number;
  nombre_laveurs: number;
  ticket_moyen: number;
}

export interface LavageStats {
  lavage_id: string;
  ca_jour: number;
  ca_mois: number;
  transactions_jour: number;
  transactions_mois: number;
  clients_actifs: number;
  laveurs_actifs: number;
}

export interface Transaction {
  id: string;
  lavage_id: string;
  gerant_id: string;
  laveur_id: string;
  client_id?: string;
  type_lavage: string;
  montant: number;
  montant_formate: string;
  commission_laveur: number;
  commission_formate: string;
  date: string;
  created_at: string;
  client?: { nom_complet?: string; immatriculation?: string };
  laveur?: { nom_complet?: string };
  gerant?: { nom_complet?: string };
}

export interface Client {
  id: string;
  lavage_id: string;
  nom?: string;
  prenom?: string;
  nom_complet: string;
  telephone?: string;
  type_vehicule: string;
  immatriculation: string;
  marque_vehicule?: string;
  couleur_vehicule?: string;
  nombre_visites: number;
  points_fidelite: number;
  created_at: string;
}

export interface Laveur {
  id: string;
  lavage_id: string;
  nom?: string;
  prenom?: string;
  nom_complet: string;
  initiales: string;
  telephone?: string;
  taux_commission: number;
  is_active: boolean;
  date_embauche?: string;
}

export interface LaveurCommission {
  laveur_id: string;
  nom_complet: string;
  nombre_lavages: number;
  ca_genere: number;
  commission_a_payer: number;
  commission_formate: string;
}

export interface Product {
  id: string;
  lavage_id: string;
  nom: string;
  description?: string;
  prix: number;
  prix_formate: string;
  stock: number;
  stock_min: number;
  stock_status: 'normal' | 'faible' | 'rupture';
  image_url?: string;
  is_active: boolean;
  category?: { id: string; nom: string; couleur: string };
}

export interface ProductCategory {
  id: string;
  lavage_id: string;
  nom: string;
  couleur: string;
  products_count?: number;
}

export interface DashboardStats {
  ca_jour: number;
  ca_mois: number;
  ca_formate_jour: string;
  ca_formate_mois: string;
  transactions_jour: number;
  transactions_mois: number;
  clients_actifs: number;
  laveurs_actifs: number;
}

export interface LavageFullStats {
  ca_jour: number;
  ca_hier: number;
  ca_mois: number;
  ca_mois_dernier: number;
  ca_semaine: number;
  transactions_jour: number;
  transactions_mois: number;
  ticket_moyen: number;
  clients_total: number;
  clients_actifs_mois: number;
  laveurs_actifs: number;
  types_lavage: Array<{ type_lavage: string; nombre: number; ca: number; pourcentage?: number }>;
  top_clients: Array<{ id: string; nom_complet: string; nombre_visites: number; total_depense: number }>;
}

export interface EvolutionPoint {
  date: string;
  ca: number;
  nombre_transactions: number;
}

export interface ClientDetail {
  id: string;
  nom?: string;
  prenom?: string;
  nom_complet: string;
  telephone?: string;
  type_vehicule: string;
  immatriculation: string;
  marque_vehicule?: string;
  couleur_vehicule?: string;
  vehicule_info?: string;
  nombre_visites: number;
  total_depense: number;
  dernier_lavage?: string;
  created_at: string;
  transactions_recentes: Array<{ id: string; type_lavage: string; montant: number; date: string }>;
}

export interface ClientLoyalty {
  points_balance: number;
  total_points_earned: number;
  free_washes_available: number;
  tier: string;
  tier_name?: string;
  washes_until_free?: number;
  next_free_wash_at?: number;
  loyalty_account_exists?: boolean;
}

export interface CommissionsJour {
  total_a_payer: number;
  par_laveur: LaveurCommission[];
}

export interface Plan {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  price: number;
  formatted_price: string;
  billing_period: string;
  max_lavages: number;
  max_clients: number;
  max_gerants: number;
  max_laveurs: number;
  max_loyalty_clients: number;
  camera_trial_days: number;
  has_unlimited_lavages: boolean;
  has_unlimited_clients: boolean;
  has_unlimited_gerants: boolean;
  has_unlimited_laveurs: boolean;
  has_unlimited_loyalty: boolean;
  is_free: boolean;
  features: {
    pdf_reports: boolean;
    advanced_stats: boolean;
    customer_support: boolean;
  };
}

export interface SubscriptionInfo {
  id: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  starts_at?: string;
  ends_at?: string;
  days_remaining?: number;
  is_active: boolean;
  payment_method?: string;
}

export interface SubscriptionStatus {
  plan: Plan;
  subscription: SubscriptionInfo | null;
  usage: Record<string, { current: number; max: number; remaining: number | null }>;
  can_create_lavage: boolean;
  can_add_client: boolean;
  can_create_gerant: boolean;
  can_create_laveur: boolean;
  can_add_loyalty: boolean;
  camera_access: {
    is_active: boolean;
    is_trial: boolean;
    days_remaining: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}