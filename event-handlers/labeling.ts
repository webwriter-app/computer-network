// import { Connector } from "../components/physicalNodes/Connector";
// import { Host } from "../components/physicalNodes/Host";

// export function createHtmlLabelingForHost(showIp:boolean, showBinIp:boolean, showMac: boolean, host: Host): string {

//     //if no data needed to be shown
//     if (!showIp && !showBinIp && !showMac) {
//         return "";
//     }

//     let additionalLabel = "";

//     if(host.wifiEnabled){
//         additionalLabel +=`<div><sl-icon name="wifi" style="font-size: 0.5vw;"></sl-icon>`;
//     }
//     else{
//         additionalLabel +=`<div><sl-icon name="wifi-off" style="font-size: 0.5vw;"></sl-icon>`;
//     }

//     let hasPre: boolean = false;

//     additionalLabel += `<span class="element-info-box"><p>`;

//     if (showIp) {
//         additionalLabel += `IP: ${host.ip.address}`;
//         hasPre = true;
//     }

//     if (showMac) {
//         if (hasPre) {
//             additionalLabel += `<br>`;
//         }
//         additionalLabel += `MAC: ${host.mac.address}`;
//         hasPre = true;
//     }

//     if (showBinIp) {
//         if (hasPre) {
//             additionalLabel += `<br>`;
//         }
//         additionalLabel += `IP(2): ${host.ip.binaryOctets.join(".")}`;
//     }
//     return additionalLabel + `</p></div>`;

// }

// //TODO: what labeling is needed for connector?
// export function createHtmlLabelingForConnector(connector: Connector): string {

//     let additionalLabel = "";

//     if(connector.wifiEnabled){
//         additionalLabel +=`<div><sl-icon name="wifi" style="font-size: 0.5vw;"></sl-icon>`;
//     }
//     else{
//         additionalLabel +=`<div><sl-icon name="wifi-off" style="font-size: 0.5vw;"></sl-icon>`;
//     }

//     return additionalLabel + `</div>`;

// }