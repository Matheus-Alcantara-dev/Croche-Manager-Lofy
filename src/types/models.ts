export type OrderStatus = 'received' | 'pending' | 'approved' | 'production' | 'ready' | 'delivered' | 'cancelled';
export type ProjectStatus = 'planned' | 'active' | 'paused' | 'finished' | 'cancelled';
export type Entity = { id: string; artisan_id: string; created_at: string; updated_at: string };
export type Customer = Entity & { name: string; phone: string; email: string | null; address: string | null; notes: string | null };
export type Category = Entity & { name: string };
export type Product = Entity & {
  name: string; description: string; category_id: string | null; price: number | null;
  photos: string[]; published: boolean; featured: boolean; available: boolean;
};
export type Project = Entity & {
  name: string; description: string; customer_id: string | null; order_id: string | null;
  status: ProjectStatus; progress: number; start_date: string | null; due_date: string | null;
  hours: number; cost: number; price: number | null; photos: string[]; archived: boolean; published?: boolean;
};
export type Material = Entity & { name: string; unit: string; unit_cost: number };
export type ProjectMaterial = Entity & { project_id: string; material_id: string; quantity: number };
export type Order = Entity & {
  customer_id: string | null; requester_id: string | null; requester_name: string | null;
  requester_email: string | null; requester_phone: string | null; status: OrderStatus;
  due_date: string | null; desired_date: string | null; total: number | null;
  request_notes: string | null; internal_notes: string | null;
  confirmed_at?: string;
  delivery_max?: string;
  deposit_id?: string;
};
export type OrderItem = Entity & { order_id: string; product_id: string | null; project_id?: string | null; name: string; quantity: number; color: string | null };
export type History = Entity & { order_id: string; status: OrderStatus };
export type Transaction = Entity & {
  order_id: string | null; name: string; kind: 'income' | 'expense'; category: string; amount: number; transaction_date: string;
};
export type Calculation = Entity & {
  name: string; input: Record<string, number>; materials: number; labor: number; overhead: number;
  margin: number; discount: number; suggested: number; project_id: string | null; product_id: string | null; order_id: string | null;
};
export type Tables = {
  customers: Customer; product_categories: Category; products: Product; projects: Project;
  materials: Material; project_materials: ProjectMaterial; orders: Order; order_items: OrderItem;
  order_status_history: History; financial_transactions: Transaction; price_calculations: Calculation;
};
export type CustomerOrder = Pick<Order, 'id' | 'status' | 'created_at' | 'due_date' | 'desired_date' | 'total' | 'request_notes'> & {
  shop: string;
  items: Pick<OrderItem, 'name' | 'quantity' | 'color'>[];
  history: Pick<History, 'status' | 'created_at'>[];
};
