export interface AuthRequest {
    password: string;
}
export interface AuthResponse {
    success: boolean;
    error?: string;
}
export interface Account {
    id: number;
    name: string;
    type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash';
    balance: number;
    color: string;
    icon: string;
    created_at: Date;
    updated_at: Date;
}
export interface Category {
    id: number;
    name: string;
    type: 'income' | 'expense';
    color: string;
    icon: string;
    parent_id?: number;
    created_at: Date;
    updated_at: Date;
}
export interface Transaction {
    id: number;
    account_id: number;
    amount: number;
    type: 'income' | 'expense' | 'transfer';
    category_id?: number;
    date: Date;
    description: string;
    created_at: Date;
    updated_at: Date;
    account?: Account;
    category?: Category;
}
export interface Budget {
    id: number;
    category_id: number;
    amount: number;
    period: 'monthly' | 'yearly';
    start_date: Date;
    created_at: Date;
    updated_at: Date;
    category?: Category;
}
export interface Goal {
    id: number;
    name: string;
    target_amount: number;
    current_amount: number;
    target_date: Date;
    created_at: Date;
    updated_at: Date;
}
export interface CreateAccountRequest {
    name: string;
    type: Account['type'];
    balance: number;
    color: string;
    icon: string;
}
export interface UpdateAccountRequest extends Partial<CreateAccountRequest> {
    id: number;
}
export interface CreateTransactionRequest {
    account_id: number;
    amount: number;
    type: Transaction['type'];
    category_id?: number;
    date: string;
    description: string;
}
export interface UpdateTransactionRequest extends Partial<CreateTransactionRequest> {
    id: number;
}
export interface CreateCategoryRequest {
    name: string;
    type: Category['type'];
    color: string;
    icon: string;
    parent_id?: number;
}
export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {
    id: number;
}
export interface CreateBudgetRequest {
    category_id: number;
    amount: number;
    period: Budget['period'];
    start_date: string;
}
export interface UpdateBudgetRequest extends Partial<CreateBudgetRequest> {
    id: number;
}
export interface CreateGoalRequest {
    name: string;
    target_amount: number;
    current_amount: number;
    target_date: string;
}
export interface UpdateGoalRequest extends Partial<CreateGoalRequest> {
    id: number;
}
export interface AnalyticsOverview {
    total_income: number;
    total_expenses: number;
    net_income: number;
    account_balances: {
        account_name: string;
        balance: number;
        type: string;
    }[];
}
export interface SpendingByCategory {
    category_name: string;
    amount: number;
    percentage: number;
}
export interface CashFlowData {
    date: string;
    income: number;
    expenses: number;
    net: number;
}
export interface TransactionFilters {
    account_id?: number;
    category_id?: number;
    type?: Transaction['type'];
    start_date?: string;
    end_date?: string;
    search?: string;
    page?: number;
    limit?: number;
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
//# sourceMappingURL=types.d.ts.map