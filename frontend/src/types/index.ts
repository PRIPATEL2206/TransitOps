export interface Vehicle {
  id: number;
  registration_number: string;
  make: string;
  model: string;
  year: number;
  vehicle_type: string;
  status: 'available' | 'in_use' | 'maintenance' | 'retired';
  capacity: number;
  mileage: number;
  fuel_type: string;
  color: string;
  chassis_number: string;
  engine_number: string;
  insurance_expiry: string;
  road_tax_expiry: string;
  last_service_date: string | null;
  next_service_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  license_number: string;
  license_type: string;
  license_expiry: string;
  status: 'active' | 'inactive' | 'on_leave' | 'suspended';
  date_of_birth: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  date_joined: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Trip {
  id: number;
  trip_number: string;
  vehicle: number;
  vehicle_details: Vehicle;
  driver: number;
  driver_details: Driver;
  origin: string;
  destination: string;
  scheduled_departure: string;
  actual_departure: string | null;
  scheduled_arrival: string | null;
  actual_arrival: string | null;
  status: 'pending' | 'dispatched' | 'in_progress' | 'completed' | 'cancelled';
  purpose: string;
  passengers: number;
  cargo_weight: number | null;
  notes: string;
  start_odometer: number | null;
  end_odometer: number | null;
  distance_covered: number | null;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRecord {
  id: number;
  vehicle: number;
  vehicle_details: Vehicle;
  maintenance_type: string;
  description: string;
  scheduled_date: string;
  completed_date: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  cost: number;
  vendor: string;
  odometer_reading: number | null;
  next_maintenance_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface FuelLog {
  id: number;
  vehicle: number;
  vehicle_details: Vehicle;
  driver: number | null;
  driver_details: Driver | null;
  date: string;
  fuel_type: string;
  quantity: number;
  unit_price: number;
  total_cost: number;
  odometer_reading: number;
  fuel_station: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: number;
  vehicle: number | null;
  vehicle_details: Vehicle | null;
  driver: number | null;
  driver_details: Driver | null;
  trip: number | null;
  trip_details: Trip | null;
  expense_type: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  receipt_number: string;
  vendor: string;
  payment_method: string;
  approved: boolean;
  approved_by: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_vehicles: number;
  available_vehicles: number;
  in_use_vehicles: number;
  maintenance_vehicles: number;
  retired_vehicles: number;
  total_drivers: number;
  active_drivers: number;
  drivers_on_duty: number;
  total_trips_today: number;
  active_trips: number;
  pending_trips: number;
  completed_trips_today: number;
  fleet_utilization: number;
  total_expenses_month: number;
  total_fuel_cost_month: number;
  alerts: Alert[];
}

export interface Alert {
  id: string;
  type: 'license_expiry' | 'insurance_expiry' | 'maintenance_due' | 'road_tax_expiry';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  entity_type: string;
  entity_id: number;
  due_date: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'dispatcher' | 'driver' | 'viewer';
  is_active: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}
