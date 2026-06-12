import { Button } from "../../shared/components/Button";
import { formatCurrency } from "../../shared/utils/format";
import { getCheckoutTotal } from "./checkout-api";
export function CheckoutPage(){return <section><p>{formatCurrency(getCheckoutTotal())}</p><Button label="Pay"/></section>;}
