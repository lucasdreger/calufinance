export enum IncomeSource {
  LUCAS = "lucas",
  CAMILA = "camila",
  OTHER = "other"
}

export interface IncomeState {
  lucas: number;
  camila: number;
  other: number;
} 