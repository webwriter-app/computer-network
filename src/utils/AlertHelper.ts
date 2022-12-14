import { SlAlert } from "@shoelace-style/shoelace";

type AlertType = "primary" | "success" | "neutral" | "warning" | "danger";

export class AlertHelper{
    static toasted = false;

    static toastAlert(variant: AlertType, icon: string, headerMessage: string, subMessage: string): void{
        const alert = new SlAlert();
        alert.closable = true;
        alert.innerHTML = `<sl-icon slot=\"icon\" name=\"`+icon+`\"></sl-icon>`;
        alert.innerHTML += headerMessage!=null && headerMessage!="" ? `<strong>`+headerMessage+`</strong><br/>` : "";
        alert.innerHTML += subMessage!=null && subMessage!="" ? subMessage : "";
        alert.variant = variant;
        alert.toast();
    }
}