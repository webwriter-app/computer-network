import { Host } from "../components/physicalNodes/Host";

export function createHtmlLabelingForHost(showIp:boolean, showBinIp:boolean, showMac: boolean, host: Host): string {

    //if no data needed to be shown
    if (!showIp && !showBinIp && !showMac) {
        return "";
    }

    let additionalLabel = "";

    let hasPre: boolean = false;

    additionalLabel += `<div><span class="element-info-box"><p>`;

    if (showIp) {
        additionalLabel += `IP: ${host.ip.address}`;
        hasPre = true;
    }

    if (showMac) {
        if (hasPre) {
            additionalLabel += `<br>`;
        }
        additionalLabel += `MAC: ${host.mac.address}`;
        hasPre = true;
    }

    if (showBinIp) {
        if (hasPre) {
            additionalLabel += `<br>`;
        }
        additionalLabel += `IP(2): ${host.ip.binaryOctets.join(".")}`;
    }
    return additionalLabel + `</p></div>`;

}

//TODO: what labeling is needed for connector?
export function createHtmlLabelingForConnector(showIp:boolean, showBinIp:boolean, showMac: boolean, host: Host): string {

    //if no data needed to be shown
    if (!showIp && !showBinIp && !showMac) {
        return "";
    }

    let additionalLabel = "";

    let hasPre: boolean = false;

    additionalLabel += `<div><span class="element-info-box"><p>`;

    if (showIp) {
        additionalLabel += `IP: ${host.ip.address}`;
        hasPre = true;
    }

    if (showMac) {
        if (hasPre) {
            additionalLabel += `<br>`;
        }
        additionalLabel += `MAC: ${host.mac.address}`;
        hasPre = true;
    }

    if (showBinIp) {
        if (hasPre) {
            additionalLabel += `<br>`;
        }
        additionalLabel += `IP(2): ${host.ip.binaryOctets.join(".")}`;
    }
    return additionalLabel + `</p></div>`;

}