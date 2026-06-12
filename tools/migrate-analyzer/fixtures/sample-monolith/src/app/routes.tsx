import { CheckoutPage } from "../features/checkout/CheckoutPage";
import { CartSummary } from "../features/checkout/CartSummary";
import { AdminDashboard } from "../features/admin/AdminDashboard";
import { UserManagement } from "../features/admin/UserManagement";
import { HomePage } from "../features/home/HomePage";
export const routeConfig=[{path:"/",component:HomePage},{path:"/checkout",component:CheckoutPage},{path:"/checkout/cart",component:CartSummary},{path:"/admin",component:AdminDashboard},{path:"/admin/users",component:UserManagement}];
export function AppRoutes(){return <div>{routeConfig.map(r=><div key={r.path} data-route={r.path}/>)}</div>;}
