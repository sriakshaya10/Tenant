export interface User {
  id: string
  email: string
  full_name?: string
  role: string
  is_active: boolean
  created_at: string
}

export interface Dataset {
  id: string
  user_id: string
  name: string
  description?: string
  record_count: number
  generation_method: string
  scenario_id?: string
  seed?: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  quality_score?: number
  file_path?: string
  created_at: string
  updated_at: string
  version: number
}

export interface DatasetPreview {
  columns: string[]
  rows: Record<string, unknown>[]
  total_rows: number
  preview_count?: number
  dtypes: Record<string, string>
}

export interface GenerationJob {
  id: string
  dataset_id: string
  user_id: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  error_message?: string
  started_at?: string
  completed_at?: string
  created_at: string
}

export interface GenerationRequest {
  name: string
  description?: string
  record_count: number
  generation_method: string
  scenario_id?: string
  seed?: number
  income_min?: number
  income_max?: number
  rent_min?: number
  rent_max?: number
  credit_min?: number
  credit_max?: number
  employment_types?: string[]
  missing_value_pct?: number
  ctgan_epochs?: number
}

export interface Scenario {
  id: string
  user_id?: string
  name: string
  description?: string
  scenario_type: string
  config_json: string
  is_preset: boolean
  created_at: string
}

export interface QualityReport {
  id: string
  dataset_id: string
  overall_score: number
  column_scores_json?: string
  distribution_metrics_json?: string
  correlation_metrics_json?: string
  missing_value_metrics_json?: string
  warnings_json?: string
  created_at: string
}

export interface ModelExperiment {
  id: string
  dataset_id: string
  user_id: string
  model_type: string
  train_test_split: number
  random_seed: number
  accuracy?: number
  precision_score?: number
  recall_score?: number
  f1_score?: number
  roc_auc?: number
  results_json?: string
  feature_importance_json?: string
  created_at: string
}

export interface FairnessExperiment {
  id: string
  dataset_id: string
  user_id: string
  experiment_name: string
  group_column: string
  results_json?: string
  created_at: string
}

export interface AnomalyExperiment {
  id: string
  dataset_id: string
  user_id: string
  anomaly_type: string
  pct_affected: number
  severity: number
  seed: number
  results_json?: string
  modified_file_path?: string
  created_at: string
}

export interface DriftExperiment {
  id: string
  baseline_dataset_id: string
  user_id: string
  drift_config_json?: string
  results_json?: string
  created_at: string
}

export interface AIReport {
  id: string
  dataset_id: string
  user_id: string
  report_type: string
  content: string
  model_used: string
  created_at: string
}

export interface DashboardStats {
  total_datasets: number
  total_records: number
  completed_jobs: number
  failed_jobs: number
  avg_quality_score?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  pages: number
}
