import { SlAlert, SlButton, SlDialog, SlInput } from "@shoelace-style/shoelace";
import { ComputerNetwork } from "..";
import { calculateNetworkId, getBinIp, validateManualIp, validateManualMac } from "../adressing/generate-address";

export class InputData {
  label: string;
  helpText: string;
  placeHolder: string;
  clearable: boolean;

  constructor(label: string,
    helpText: string,
    placeHolder: string,
    clearable: boolean) {
    this.label = label;
    this.helpText = helpText;
    this.placeHolder = placeHolder;
    this.clearable = clearable;
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
    dialogContent.push(input);
  });

  return dialogContent;
}

export function handleChangesInDialog(id: string, node: any, network: ComputerNetwork) {

  //pass data of current node into the dialog
  let inputFields = generateDialog(
    id,
    new Map<string, InputData>([
      ["name", new InputData("Name", "The name of this component", node._private.data.name, true)],
      ["mac", new InputData("MAC", "The MAC-Address of this component", node._private.data.mac, true)],
      ["ip", new InputData("IP", "The IP-Address of this component", node._private.data.ip, true)],
      ["ipBin", new InputData("IP(2)", "The IP-Address of this component (binary)", node._private.data.ipBin, true)],
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
    let newIpBin = (network.renderRoot.querySelector('#' + id + "ipBin") as SlInput).value.trim();

    node._private.data.name = newName;
    if (newMac == "") {
      //do not change anything if no input is given
    }
    else if (validateManualMac(newMac)) {
      node._private.data.mac = newMac;
    }
    else {
      error = true;
      alert.innerHTML += "The inserted MAC Address <strong>" + newMac + "</strong> is not valid.\n";
    }

    if (newIp == "") {
      //do not change anything if no input is given
    }
    else if (validateManualIp(newIp)) {
      node._private.data.ip = newIp;
      node._private.data.ipBin = getBinIp(newIp);
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

      if (node._private.parent.length > 0) {
        let newID = adaptSubnetInformationOnIpChanges(node, newIp);
        network._graph.$('#' + node._private.parent._private.data.id).data("ip", newID);
        network._graph.$('#' + node._private.parent._private.data.id).data("name", newID);
      }
    }

  });

  let dialog = (network.renderRoot.querySelector('#infoDialog') as SlDialog);
  dialog.innerHTML = "";
  inputFields.forEach(e => dialog.appendChild(e));
  dialog.appendChild(saveButton);
  dialog.show();
}


export function adaptSubnetInformationOnIpChanges(node: any, newIp): string {
  let compound = node._private.parent._private;
  let siblings = compound.children;

  let oldIp = node._private.data.ip;

  let ips: string[] = [];

  siblings.forEach(child => {
    let ip = child._private.data.ip;
    if (ip == oldIp) {
      ips.push(newIp);
    }
    else {
      ips.push(child._private.data.ip);
    }
  });
  return calculateNetworkId(ips);
}



