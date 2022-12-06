import { SlAlert, SlButton, SlDialog, SlInput } from "@shoelace-style/shoelace";
import { ComputerNetwork } from "..";
import { IpAddress } from "../adressing/addressTypes/IpAddress";
import { MacAddress } from "../adressing/addressTypes/MacAddress";
import { Connector } from "../components/physicalNodes/Connector";
import { Host } from "../components/physicalNodes/Host";


export class InputData {
  label: string;
  helpText: string;
  placeHolder: string;
  clearable: boolean;
  disabled: boolean;

  constructor(label: string,
    helpText: string,
    placeHolder: string,
    clearable: boolean,
    disabled?: boolean) {
    this.label = label;
    this.helpText = helpText;
    this.placeHolder = placeHolder;
    this.clearable = clearable;
    this.disabled = disabled;
  }

}

let generateDialog = (id: string, inputs: Map<string, InputData>): SlInput[] => {
  let dialogContent: SlInput[] = [];

  inputs.forEach((data: InputData, key: string) => {

    let input: SlInput = new SlInput();
    input.id = id + key;
    input.label = data.label;
    input.className = "label-on-left";
    input.helpText = data.helpText;
    input.placeholder = data.placeHolder;
    input.clearable = data.clearable;
    if(data.disabled!=null && data.disabled!=undefined){
      input.disabled = data.disabled;
    }
    dialogContent.push(input);
  });

  return dialogContent;
}

export function handleChangesInDialogForHost(id: string, node: any, network: ComputerNetwork) {

  let host: Host = node._private.data;

  //pass data of current node into the dialog
  let inputFields = generateDialog(
    id,
    new Map<string, InputData>([
      ["name", new InputData("Name", "The name of this component", host.name, true)],
      ["mac", new InputData("MAC", "The MAC-Address of this component", host.mac.address, true)],
      ["ip", new InputData("IP", "The IP-Address of this component", host.ip.address, true)],
      ["ipBin", new InputData("IP(2)", "The IP-Address of this component (binary)", host.ip.binaryOctets.join("."), true)],
    ]));

  const saveButton = new SlButton();
  saveButton.slot = "footer";
  saveButton.variant = "primary";
  saveButton.innerHTML = "Save changes";

  let error: boolean = false;

  saveButton.addEventListener('click', () => {
    const alert = new SlAlert();
    alert.closable = true;

    //list of methods to update data, ip, subnet
    let newName = (network.renderRoot.querySelector('#' + id + "name") as SlInput).value.trim();
    let newMac = (network.renderRoot.querySelector('#' + id + "mac") as SlInput).value.trim();
    let newIp = (network.renderRoot.querySelector('#' + id + "ip") as SlInput).value.trim();
    //todo: update with binary IP?
    let newIpBin = (network.renderRoot.querySelector('#' + id + "ipBin") as SlInput).value.trim();

    host.name = newName;
    let newMacAddress: MacAddress = MacAddress.validateAddress(newMac, network.macDatabase);
    if (newMac == "") {
      //do nothing if no input is given
    } else if (newMacAddress != null) {
      host.mac = newMacAddress;
    }
    else {
      error = true;
      alert.innerHTML += "The inserted MAC Address <strong>" + newMac + "</strong> is not valid.\n";
    }

    let newIpAddress: IpAddress = IpAddress.validateAddress(newIp, network.ipDatabase);
    if (newIp == "") {
      //do nothing if no input is given
    }
    else if (newIpAddress != null) {
      host.ip = newIpAddress;
    }
    else {
      error = true;
      alert.innerHTML += "The inserted IP Address <strong>" + newIp + "</strong> is not valid.\n";

    }

    if (newName == "" && newIp == "" && newMac == "") {
      const noti = new SlAlert();
      noti.closable = true;
      noti.variant = "primary";
      noti.innerHTML = "<sl-icon slot=\"icon\" name=\"info-circle\"></sl-icon>No new data is given.";
      noti.toast();
    }
    else if (error) {
      alert.variant = "warning";
      alert.innerHTML = "<sl-icon slot=\"icon\" name=\"exclamation-triangle\"></sl-icon>" + alert.innerHTML;
      alert.toast();
      error = false;
    }
    else {
      const noti = new SlAlert();
      noti.closable = true;
      noti.variant = "success";
      noti.innerHTML = "<sl-icon slot=\"icon\" name=\"check2-circle\"></sl-icon>Your changes have been successfully saved.";
      noti.toast();
    }

    if (node._private.parent.length > 0) {
      adaptSubnetInformationOnIpChanges(network._graph.$('#' + node._private.parent._private), newIpAddress);
    }
  });
  let dialog = (network.renderRoot.querySelector('#infoDialog') as SlDialog);
  dialog.innerHTML = "";
  inputFields.forEach(e => dialog.appendChild(e));
  dialog.appendChild(saveButton);
  dialog.show();
}

export function handleChangesInDialogForConnector(id: string, node: any, network: ComputerNetwork) {

  let connector: Connector = node._private.data;

  let fields: Map<string, InputData> = new Map();

  fields.set("name", new InputData("Name", "", connector.name, true));
  fields.set("layer", new InputData("Layer", "", connector.layer.toString(), true, true));

  switch (connector.layer) {
    case 2:
      connector.addresses.forEach((addresses, port) => {
        fields.set(port + ".MAC", new InputData(port + ".MAC", "", addresses[0].address, true));
      });
      break;
    case 3:
      connector.addresses.forEach((addresses, port) => {
        fields.set(port + ".MAC", new InputData(port + ".MAC", "", addresses[0].address, true));
        fields.set(port + ".IP", new InputData(port + ".IP", "", addresses[1].address, true));
      });
      break;
  }

  //pass data of current connector into the dialog
  let inputFields = generateDialog(id, fields);

  // const saveButton = new SlButton();
  // saveButton.slot = "footer";
  // saveButton.variant = "primary";
  // saveButton.innerHTML = "Save changes";

  // let error: boolean = false;

  // saveButton.addEventListener('click', () => {
  //   const alert = new SlAlert();
  //   alert.closable = true;

  //   //list of methods to update data, ip, subnet
  //   let newName = (network.renderRoot.querySelector('#' + id + "name") as SlInput).value.trim();
  //   let newMac = (network.renderRoot.querySelector('#' + id + "mac") as SlInput).value.trim();
  //   let newIp = (network.renderRoot.querySelector('#' + id + "ip") as SlInput).value.trim();
  //   //todo: update with binary IP?
  //   let newIpBin = (network.renderRoot.querySelector('#' + id + "ipBin") as SlInput).value.trim();

  //   host.name = newName;
  //   let newMacAddress: MacAddress = MacAddress.validateAddress(newMac, network.macDatabase);
  //   if (newMac == "") {
  //     //do nothing if no input is given
  //   } else if (newMacAddress != null) {
  //     host.mac = newMacAddress;
  //   }
  //   else {
  //     error = true;
  //     alert.innerHTML += "The inserted MAC Address <strong>" + newMac + "</strong> is not valid.\n";
  //   }

  //   let newIpAddress: IpAddress = IpAddress.validateAddress(newIp, network.ipDatabase);
  //   if (newIp == "") {
  //     //do nothing if no input is given
  //   }
  //   else if (newIpAddress != null) {
  //     host.ip = newIpAddress;
  //   }
  //   else {
  //     error = true;
  //     alert.innerHTML += "The inserted IP Address <strong>" + newIp + "</strong> is not valid.\n";

  //   }

  //   if (newName == "" && newIp == "" && newMac == "") {
  //     const noti = new SlAlert();
  //     noti.closable = true;
  //     noti.variant = "primary";
  //     noti.innerHTML = "<sl-icon slot=\"icon\" name=\"info-circle\"></sl-icon>No new data is given.";
  //     noti.toast();
  //   }
  //   else if (error) {
  //     alert.variant = "warning";
  //     alert.innerHTML = "<sl-icon slot=\"icon\" name=\"exclamation-triangle\"></sl-icon>" + alert.innerHTML;
  //     alert.toast();
  //     error = false;
  //   }
  //   else {
  //     const noti = new SlAlert();
  //     noti.closable = true;
  //     noti.variant = "success";
  //     noti.innerHTML = "<sl-icon slot=\"icon\" name=\"check2-circle\"></sl-icon>Your changes have been successfully saved.";
  //     noti.toast();
  //   }

  //   if (node._private.parent.length > 0) {
  //     adaptSubnetInformationOnIpChanges(network._graph.$('#' + node._private.parent._private), newIpAddress);
  //   }
  // });
  let dialog = (network.renderRoot.querySelector('#infoDialog') as SlDialog);
  dialog.innerHTML = "";
  inputFields.forEach(e => dialog.appendChild(e));
  //dialog.appendChild(saveButton);
  dialog.show();
}


export function adaptSubnetInformationOnIpChanges(node: any, newIp: IpAddress): void {
  let compound = node._private.parent._private;
  let siblings = compound.children;

  let oldIp = node._private.data.ipAddress;

  let ips: IpAddress[] = [];

  siblings.forEach(child => {
    let ip = child._private.data.ipAddress;
    if (ip.address == oldIp.address) {
      ips.push(newIp);
    }
    else {
      ips.push(child._private.data.ipAddress);
    }
  });
  node.data.calculateSubnetNumber(ips);
}



