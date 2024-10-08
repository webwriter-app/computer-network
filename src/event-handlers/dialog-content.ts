import { SlInput, SlDialog, SlButton, SlTabGroup, SlTabPanel, SlSelect } from "@shoelace-style/shoelace";
import { html, TemplateResult } from "lit";
import { ComputerNetwork } from "../..";
import { Address } from "../adressing/Address";
import { Ipv4Address } from "../adressing/Ipv4Address";
import { Ipv6Address } from "../adressing/Ipv6Address";
import { MacAddress } from "../adressing/MacAddress";
import { GraphEdge } from "../components/GraphEdge";
import { Data, Packet, Frame } from "../components/logicalNodes/DataNode";
import { Net } from "../components/logicalNodes/Net";
import { Router } from "../components/physicalNodes/Connector";
import { PhysicalNode } from "../components/physicalNodes/PhysicalNode";
import { AlertHelper } from "../utils/AlertHelper";
import { SubnettingController } from "./subnetting-controller";


export class DialogFactory {
  static generateInputsDetailsForNode(network: ComputerNetwork): void {

    let currentComponentToAdd = network.currentComponentToAdd;

    if (currentComponentToAdd == "") {
      return;
    }

    let numberOfPortsOrInterfaces: number = (network.renderRoot.querySelector('#ports') as SlInput).valueAsNumber ?
      (network.renderRoot.querySelector('#ports') as SlInput).valueAsNumber :
      (currentComponentToAdd == 'computer' || currentComponentToAdd == 'mobile' ? 1 : 2);


    let layer: number = 0;
    let portNum: number = 0;

    switch (currentComponentToAdd) {
      case 'computer': case 'mobile': case 'router':
        layer = 3; //add IPv4, IPv6
        break;
      case 'access-point': case 'bridge': case 'switch':
        layer = 2; //add MAC
        break;
      case 'hub': case 'repeater':
        layer = 1; //add connection type
        break;
      default: break;
    }

    if (currentComponentToAdd == 'repeater' || currentComponentToAdd == 'bridge'
      || numberOfPortsOrInterfaces == null || numberOfPortsOrInterfaces == undefined) {
      portNum = 2;
    }
    else {
      portNum = numberOfPortsOrInterfaces;
    }

    let dialog = new SlDialog();
    dialog.label = "Add details for each port of your " + currentComponentToAdd;

    let table = `<table>`;

    //add the columns
    table += `<tr>`;
    table += `<td>Port number</td>`;
    table += layer > 2 ? `<td>Interface name</td>` : ``;
    table += `<td>Connection type</td>`;
    table += layer > 1 ? `<td>MAC Address</td>` : "";
    table += layer > 2 ? `<td>Ipv4</td><td>Ipv6</td>` : "";
    table += `</tr>`;

    //add row for each port
    for (let i = 1; i <= portNum; i++) {
      table += `<tr>`;
      table += `<td>` + i + `</td>`;
      table += layer > 2 ? `<td><sl-input id="interface-name-` + i + `" placeholder="Interface name" clearable></sl-input></td>` : ``;

      switch (currentComponentToAdd) {
        case 'hub': case 'switch':
          table += `<td>Ethernet</td>`;
          break;
        case 'access-point':
          table += i == 1 ? `<td>Ethernet</td>` : `<td>Wireless</td>`;
          break;
        default:
          table += `<td><sl-select id="connection-type-` + i + `"><sl-menu-item value="ethernet" style="overflow: hidden;">Ethernet</sl-menu-item>
        <sl-menu-item value="wireless" style="overflow: hidden;">Wireless</sl-menu-item></sl-select></td>`;
          break;
      }

      table += layer > 1 ? `<td><sl-input id="mac-` + i + `" placeholder="FF:FF:FF:FF:FF:FF" clearable></sl-input></td>` : "";
      table += layer > 2 ? `<td><sl-input id="ip4-` + i + `" placeholder="0:0:0:0" clearable></sl-input></td>` : "";
      table += layer > 2 ? `<td><sl-input id="ip6-` + i + `"placeholder="FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF" clearable></sl-input></td>` : "";

      table += `</tr>`;
    }
    table += `</table>`;
    dialog.innerHTML = table;

    //TODO: add event listener vào cái nút add node
    const saveButton = new SlButton();
    saveButton.slot = "footer";
    saveButton.variant = "primary";
    saveButton.innerHTML = "Save";
    saveButton.addEventListener('click', () => dialog.hide());
    dialog.appendChild(saveButton);
    (network.renderRoot.querySelector('#inputDialog') as HTMLElement).innerHTML = "";
    (network.renderRoot.querySelector('#inputDialog') as HTMLElement).append(dialog);
    dialog.show();

  }

  static generateInputsDetailsForEdge(network: ComputerNetwork, edge: any, sourceNode: PhysicalNode, targetNode: PhysicalNode): void {
    //filter available ports
    let availableSourcePorts: number[] = [];
    let availableTargetPorts: number[] = [];
    sourceNode.portLinkMapping.forEach((link, port) => {
      if (link == null || link == undefined || link == "") {
        availableSourcePorts.push(port);
      }
    });
    targetNode.portLinkMapping.forEach((link, port) => {
      if (link == null || link == undefined || link == "") {
        availableTargetPorts.push(port);
      }
    });

    let dialog = new SlDialog();
    dialog.label = "Assigning ports for this connection";
    let tabGroup: SlTabGroup = new SlTabGroup();
    tabGroup.innerHTML += `<sl-tab slot="nav" panel="chooseSourcePort">` + sourceNode.name + `</sl-tab><sl-tab slot="nav" panel="chooseTargetPort">` + targetNode.name + `</sl-tab>`;

    //init panel with data of ports of source + select port for source
    let sourcePanel = new SlTabPanel();
    sourcePanel.name = "chooseSourcePort";
    let sourceTable: string = `<table cellspacing="10"><tr>`;
    sourceTable += `<td>Port number</td>`;
    sourceNode.portData.entries().next().value[1].forEach((_, columnName) => sourceTable += `<td>` + columnName + `</td>`);
    sourceTable += `</tr>`;

    sourceNode.portData.forEach((data, port) => {
      sourceTable += `<tr>`;
      sourceTable += `<td>` + port + `</td>`; //add index
      data.forEach((value) => {
        if (value instanceof Address) {
          sourceTable += `<td>` + value.address + `</td>`;
        }
        else {
          sourceTable += `<td>` + value + `</td>`;
        }
      });
      sourceTable += `</tr>`;
    });
    sourceTable += `</table>`;
    sourcePanel.innerHTML += sourceTable;

    let selectedSourcePort = new SlSelect();
    availableSourcePorts.forEach(port => selectedSourcePort.innerHTML += `<sl-menu-item value="` + port + `">` + port + `</sl-menu-item>`);
    sourcePanel.innerHTML += "Select one from available ports:";
    sourcePanel.appendChild(selectedSourcePort);
    tabGroup.append(sourcePanel);

    //init panel with data of ports of target + select port for target
    let targetPanel = new SlTabPanel();
    targetPanel.name = "chooseTargetPort";
    let targetTable: string = `<table cellspacing="10"><tr>`;
    targetTable += `<td>Port number</td>`;
    targetNode.portData.entries().next().value[1].forEach((_, columnName) => targetTable += `<td>` + columnName + `</td>`);
    targetTable += `</tr>`;

    targetNode.portData.forEach((data, index) => {
      targetTable += `<tr>`;
      targetTable += `<td>` + index + `</td>`; //add port/interface name
      data.forEach((value) => {
        if (value instanceof Address) {
          targetTable += `<td>` + value.address + `</td>`;
        }
        else {
          targetTable += `<td>` + value + `</td>`;
        }
      });
      targetTable += `</tr>`;
    });
    targetTable += `</table>`;
    targetPanel.innerHTML += targetTable;

    let selectedTargetPort = new SlSelect();
    availableTargetPorts.forEach(port => selectedTargetPort.innerHTML += `<sl-menu-item value="` + port + `">` + port + `</sl-menu-item>`);

    targetPanel.innerHTML += "Select one from available ports:";
    targetPanel.appendChild(selectedTargetPort);
    tabGroup.append(targetPanel);


    dialog.appendChild(tabGroup);

    const saveButton = new SlButton();
    saveButton.slot = "footer";
    saveButton.variant = "primary";
    saveButton.innerHTML = "Save";
    saveButton.addEventListener('click', () => {
      let inPort: number = +(selectedSourcePort.value as string);
      let outPort: number = +(selectedTargetPort.value as string);

      if (Number.isNaN(inPort) || inPort == undefined || inPort == null) {
        AlertHelper.toastAlert("warning", "exclamation-triangle", "", "Please choose port/interface for " + sourceNode.name);
        return;
      }
      if (Number.isNaN(outPort) || outPort == undefined || outPort == null) {
        AlertHelper.toastAlert("warning", "exclamation-triangle", "", "Please choose port/interface for " + sourceNode.name);
        return;
      }

      let newData = GraphEdge.addPorts(edge.data(), inPort, outPort); //add port-link mapping for source+target
      if (newData != null) {
        edge.removeClass("unconfigured-edge");
        edge.addClass(newData.cssClass);
        dialog.hide();
      } //set new format-display for this connection if no error appears

      SubnettingController.setUpGateway(network._graph.$('#' + sourceNode.id), network._graph.$('#' + targetNode.id), inPort, network.ipv4Database);
      SubnettingController.setUpGateway(network._graph.$('#' + targetNode.id), network._graph.$('#' + sourceNode.id), outPort, network.ipv4Database);
    }
    );
    dialog.appendChild(saveButton);

    (network.renderRoot.querySelector('#inputDialog') as HTMLElement).innerHTML = "";
    (network.renderRoot.querySelector('#inputDialog') as HTMLElement).append(dialog);
    dialog.show();
  }


  static handleChangesInDialogForPhysicalNode(id: string, node: any, network: ComputerNetwork, isGateway: boolean, subnet?: Net) {
    let physicalNode: PhysicalNode = node.data();
    let dialog: SlDialog = new SlDialog();
    dialog.label = "Details about component " + physicalNode.name;
    dialog.innerHTML += `<sl-input style="color: #43628A;"label="Name" id="` + id + `-name` + `" value="` + physicalNode.name + `" clearable type="string">`;
    let table: string = `<div style="margin-top: 10px; color: #43628A;">Details of the ports</div><table cellspacing="10"><tr>`;
    table += `<td>Index</td>`;
    physicalNode.portData.entries().next().value[1].forEach((_, columnName) => table += `<td>` + columnName + `</td>`);
    table += `</tr>`;

    physicalNode.portData.forEach((data, index) => {
      table += `<tr>`;
      table += `<td>` + index + `</td>`; //add index
      data.forEach((value, key) => {
        if (value instanceof Address) {
          table += `<td><sl-input id="` + id + "-" + index + "-" + key + `" placeholder="` + value.address + `" clearable type="string"></td>`;
        }
        else if (key == "Connection Type") {
          //show only
          table += `<td>` + value + `</td>`;
        }
        else {
          table += `<td><sl-input id="` + id + "-" + index + "-" + key + `" placeholder="` + value + `" clearable type="string"></td>`;
        }
      });
      table += `</tr>`;
    });
    table += `</table>`;
    dialog.innerHTML += table;

    const saveButton = new SlButton();
    saveButton.slot = "footer";
    saveButton.variant = "primary";
    saveButton.innerHTML = "Save";
    saveButton.addEventListener('click', () => {
      let changed: boolean = false;
      let newNodeName: string = (network.renderRoot.querySelector('#' + id + "-name") as SlInput).value.trim();
      if (newNodeName != physicalNode.name) physicalNode.name = newNodeName;

      //for each interface-index
      for (let index = 1; index <= physicalNode.portData.size; index++) {
        let nameInput = network.renderRoot.querySelector('#' + id + "-" + index + "-" + "Name") as SlInput;
        let newName = nameInput.value.trim() != "" ? nameInput.value.trim() : nameInput.placeholder;
        if (newName != "") {
          physicalNode.portData.get(index).set('Name', newName);
          changed = true;
        }

        if (physicalNode.layer >= 2) {
          let macInput = network.renderRoot.querySelector('#' + id + "-" + index + "-" + "MAC") as SlInput;
          let newMac = macInput.value.trim() != "" ? macInput.value.trim() : "";
          let validatedMac = newMac != "" ? MacAddress.validateAddress(newMac, network.macDatabase) : null;
          if (validatedMac != null) {
            MacAddress.removeAddressFromDatabase(physicalNode.portData.get(index).get('MAC'), network.macDatabase);
            physicalNode.portData.get(index).set('MAC', validatedMac);
            MacAddress.addAddressToDatabase(validatedMac, network.macDatabase, physicalNode.id);
            changed = true;
          }
          else if (newMac != "") {
            AlertHelper.toastAlert("warning", "exclamation-triangle", "", newMac + " is not a valid MAC Address.");
          }
        }

        if (physicalNode.layer >= 3) {
          let ip4Input = network.renderRoot.querySelector('#' + id + "-" + index + "-" + "IPv4") as SlInput;
          let ip6Input = network.renderRoot.querySelector('#' + id + "-" + index + "-" + "IPv6") as SlInput;
          let newIpv4 = ip4Input.value.trim() != "" ? ip4Input.value.trim() : "";
          let newIpv6 = ip6Input.value.trim() != "" ? ip6Input.value.trim() : "";
          let validatedIpv4 = newIpv4 != "" ? Ipv4Address.validateAddress(newIpv4, network.ipv4Database) : null;
          if (validatedIpv4 != null) {
            let keepOldIp: boolean = false;
            //if this physical node is in a network
            if (subnet != null && subnet != undefined) {
              switch (Net.mode) {
                case 'HOST_BASED':
                  if (validatedIpv4 != null && validatedIpv4 != undefined) Net.calculateCIDRGivenNewHost(subnet, validatedIpv4, network.ipv4Database);
                  node.parent().classes(subnet.cssClass);
                  break;
                case 'NET_BASED':
                  if (validatedIpv4 != null && !validatedIpv4.matchesNetworkCidr(subnet)) {
                    AlertHelper.toastAlert('warning', 'exclamation-triangle', 'Subnet-based mode on:', "Inserted IPv4 doesn't match the subnet mask.");
                    keepOldIp = true;
                  }
                  break;
                default:
                  break;
              }
            }
            //if this physical node is a gateway of some networks
            if (isGateway) {
              let affectedNetwork: Net = (physicalNode as Router).portNetMapping.get(index);
              switch (Net.mode) {
                case 'HOST_BASED':
                  if (validatedIpv4 != null && validatedIpv4 != undefined) Net.calculateCIDRGivenNewHost(affectedNetwork, validatedIpv4, network.ipv4Database);
                  network._graph.$('#' + affectedNetwork.id).classes(affectedNetwork.cssClass);
                  break;
                case 'NET_BASED':
                  if (affectedNetwork != null && validatedIpv4 != null && !validatedIpv4.matchesNetworkCidr(affectedNetwork)) {
                    AlertHelper.toastAlert('warning', 'exclamation-triangle', 'Subnet-based mode on:', "Inserted IPv4 for gateway doesn't match the subnet mask or the network is not configured.");
                    keepOldIp = true;
                  }
                  break;
                default:
                  break;
              }
            }

            if (!keepOldIp) {
              Ipv4Address.removeAddressFromDatabase(physicalNode.portData.get(index).get('IPv4'), network.ipv4Database);
              physicalNode.portData.get(index).set('IPv4', validatedIpv4);
              Ipv4Address.addAddressToDatabase(validatedIpv4, network.ipv4Database, physicalNode.id);
              changed = true;
            }
          }
          else if (newIpv4 != "") {
            AlertHelper.toastAlert("warning", "exclamation-triangle", "", newIpv4 + " is not valid.");
          }

          let validatedIpv6 = newIpv6 != "" ? Ipv6Address.validateAddress(newIpv6, network.ipv6Database) : null;
          if (validatedIpv6 != null) {
            Ipv6Address.removeAddressFromDatabase(physicalNode.portData.get(index).get('IPv6'), network.ipv6Database);
            physicalNode.portData.get(index).set('IPv6', validatedIpv6);
            Ipv6Address.addAddressToDatabase(validatedIpv6, network.ipv6Database, physicalNode.id);
            changed = true;
          }
          else if (newIpv6 != "") {
            AlertHelper.toastAlert("warning", "exclamation-triangle", "", newIpv6 + " is not a valid IPv6 Address.");
          }
        }
      }

      if (changed) {
        AlertHelper.toastAlert("success", "check2-circle", "Your changes have been saved.", "");
      }
      dialog.hide();
    }
    );
    dialog.appendChild(saveButton);

    (network.renderRoot.querySelector('#inputDialog') as HTMLElement).innerHTML = "";
    (network.renderRoot.querySelector('#inputDialog') as HTMLElement).append(dialog);
    dialog.show();

  }

  static handleChangesInDialogForNet(id: string, node: any, network: ComputerNetwork) {

    let dialog: SlDialog = new SlDialog();
    dialog.label = "Details of this network:";

    let subnet: Net = node.data();
    dialog.innerHTML += `<sl-input id="change-id-` + id + `" label="Network Address" placeholder="`
      + ((subnet.networkAddress != undefined && subnet.networkAddress != null) ? subnet.networkAddress.address : "") + `" clearable type="string">`;
    dialog.innerHTML += `<sl-input id="change-bitmask-` + id + `" label="Bitmask" placeholder="`
      + ((subnet.bitmask != undefined && subnet.bitmask != null) ? subnet.bitmask : "") + `" clearable type="number" min=0>`;
    dialog.innerHTML += `<sl-input id="change-mask-` + id + `" label="Subnet Mask" placeholder="`
      + ((subnet.netmask != undefined && subnet.netmask != null) ? subnet.netmask : "") + `" clearable type="string">`;

    //table for gateways
    let gateways: Map<string, number> = subnet.gateways;
    if (gateways.size != 0) {
      let table: string = `<table cellspacing="10"><tr><td>Gateway</td><td>Interface</td><td>Connection Type</td><td>MAC</td><td>IPv4</td><td>IPv6</td></tr>`;

      //TODO: add id for changes?
      gateways.forEach((port, gatewayId) => {
        if (port != null) {
          let router: Router = network._graph.$("#" + gatewayId).data();
          let data = router.portData.get(port);
          table += `<tr>`;
          table += `<td>` + router.name + `</td>`;
          table += `<td>` + data.get('Name') + `</td>`;
          table += `<td>` + data.get('Connection Type') + `</td>`;
          table += `<td>` + data.get('MAC').address + `</td>`;
          table += `<td>` + data.get('IPv4').address + `</td>`;
          table += `<td>` + data.get('IPv6').address + `</td>`;
          table += `</tr>`;
        }
      });
      table += `</table>`;
      dialog.innerHTML += table;
    }
    //TODO: add event listener vào cái nút add node
    const saveButton = new SlButton();
    saveButton.slot = "footer";
    saveButton.variant = "primary";
    saveButton.innerHTML = "Save";
    saveButton.addEventListener('click', () => {
      let idInput = network.renderRoot.querySelector('#change-id-' + id) as SlInput;
      let bitmaskInput = network.renderRoot.querySelector('#change-bitmask-' + id) as SlInput;
      let netmaskInput = network.renderRoot.querySelector('#change-mask-' + id) as SlInput;

      let newId = idInput.value.trim() != "" ? idInput.value.trim() : idInput.placeholder;
      let newBitmask = bitmaskInput.value.trim() != "" ? bitmaskInput.value.trim() : bitmaskInput.placeholder;
      let newnetmask = netmaskInput.value.trim() != "" ? netmaskInput.value.trim() : netmaskInput.placeholder;

      if (subnet.handleChangesOnNewNetInfo(newId != "" ? newId : null, newnetmask != "" ? newnetmask : null, newBitmask != "" ? +newBitmask : null, network)) {
        node.toggleClass('unconfigured-net', false);
      }
      dialog.hide();
    });

    dialog.appendChild(saveButton);
    (network.renderRoot.querySelector('#inputDialog') as HTMLElement).innerHTML = "";
    (network.renderRoot.querySelector('#inputDialog') as HTMLElement).append(dialog);
    dialog.show();
  }


  static handleChangeDefaultGateway(subnet: Net, id: string, node: any, network: ComputerNetwork) {
    let dialog: SlDialog = new SlDialog();
    dialog.label = "Details of available gateways";
    let gateways: Map<string, number> = subnet.gateways; //gateway-node-id, port

    let select = `<sl-select id="new-gateway-` + id + `">`;

    if (gateways.size != 0) {
      let table: string = `<table cellspacing="10"><tr><td>Gateway</td><td>Port number</td><td>Interface</td><td>Connection Type</td><td>MAC</td><td>IPv4</td><td>IPv6</td></tr>`;

      gateways.forEach((port, gatewayId) => {
        if (port != null) {
          let router: Router = network._graph.$("#" + gatewayId).data();
          let data = router.portData.get(port);
          table += `<tr>`;
          table += `<td>` + router.name + `</td>`;
          table += `<td>` + port + `</td>`;
          table += `<td>` + data.get('Name') + `</td>`;
          table += `<td>` + data.get('Connection Type') + `</td>`;
          table += `<td>` + data.get('MAC').address + `</td>`;
          table += `<td>` + data.get('IPv4').address + `</td>`;
          table += `<td>` + data.get('IPv6').address + `</td>`;
          table += `</tr>`;
          select += `<sl-menu-item value="` + gatewayId + "/" + port + `" style="overflow: hidden;">` + router.name + `</sl-menu-item>`;
        }
      });
      table += `</table>`;
      dialog.innerHTML += table;
      select += `</sl-select>`;
      dialog.innerHTML += select;
    }
    else {
      dialog.innerHTML += "This network has no gateway.";
    }

    if (!node.hasClass('default-gateway-not-found')) {
      let current: [string, number] = node.data('defaultGateway');
      dialog.innerHTML += "Current default gateway is: " + current[0] + ", port: " + current[1];
    }

    const saveButton = new SlButton();
    saveButton.slot = "footer";
    saveButton.variant = "primary";
    saveButton.innerHTML = "Save";
    saveButton.addEventListener('click', () => {
      let newGateway: string = (network.renderRoot.querySelector('#' + "new-gateway-" + id) as SlInput).value.trim();
      if (newGateway != "") {
        node.data('defaultGateway', newGateway.split('/'));
        let cssClass = node.data('cssClass');
        while (cssClass.includes('default-gateway-not-found')) {
          cssClass.splice(cssClass.indexOf('default-gateway-not-found'), 1);
        }
        cssClass.push('gateway-changeable');
        node.toggleClass('default-gateway-not-found', false);
        node.toggleClass('gateway-changeable', true);
        if (!node.data('cssClass').includes('gateway-changeable')) node.data('cssClass').push('gateway-changeable');
      }
      dialog.hide();
    });

    dialog.appendChild(saveButton);
    (network.renderRoot.querySelector('#inputDialog') as HTMLElement).innerHTML = "";
    (network.renderRoot.querySelector('#inputDialog') as HTMLElement).append(dialog);
    dialog.show();
  }

  static showDataHeaders(data: Data, network: ComputerNetwork): void {
    let dialog = new SlDialog();
    dialog.label = data.id;

    if (data instanceof Packet) {
      dialog.innerHTML += "Mac Address of Sender:" + data.layer2header.macSender + "<br/>";
      dialog.innerHTML += "IP Address of Sender:" + data.layer3header.ipSender + "<br/>";
      dialog.innerHTML += "Mac Address of Receiver:" + data.layer2header.macReceiver + "<br/>";
      dialog.innerHTML += "IP Address of Receiver:" + data.layer3header.ipReceiver;
    }
    else if (data instanceof Frame) {
      dialog.innerHTML += "Mac Address of Sender:" + data.layer2header.macSender + "<br/>";
      dialog.innerHTML += "IP Address of Sender:" + data.layer2header.ipSender + "<br/>";
      dialog.innerHTML += "Mac Address of Receiver:" + data.layer2header.macReceiver + "<br/>";
      dialog.innerHTML += "IP Address of Receiver:" + data.layer2header.ipReceiver;
    }

    (network.renderRoot.querySelector('#inputDialog') as HTMLElement).innerHTML = "";
    (network.renderRoot.querySelector('#inputDialog') as HTMLElement).append(dialog);
    dialog.show();
  }



  static showHelpText(network: ComputerNetwork): TemplateResult {
    return html`
    <sl-tab-group>
        <sl-tab slot="nav" panel="node">Add/ Configure graph components</sl-tab>
        <sl-tab slot="nav" panel="cidr">CIDR/ Subnetting</sl-tab>
        <sl-tab slot="nav" panel="simulation">Packet travelling simulation</sl-tab>
        
        <sl-tab-panel name="node">
          <sl-details summary="How to add a physical node (host, router, switch,...)?">
            <sl-card class="card-image">
              <div slot="header"><b>Step 1:</b> Choose your component</div>
              <img src="/resources/help-instructions/toolbar-select-physical.png"/>
            </sl-card>
            <sl-card class="card-image">
              <div slot="header"><b>Step 2:</b> More details with "Add details for ports"</div>
              <img src="/resources/help-instructions/toolbar-physical-node.png"/>
            </sl-card>
            <sl-card class="card-image">
              <div slot="header"><b>Step 3:</b> Pick a color also if you want to:</div>
              <img src="/resources/help-instructions/pick-color.png"/>
            </sl-card>
            <sl-card class="card-image">
              <div slot="header"><b>Step 4:</b> Click add</div>
              <img src="/resources/help-instructions/add-button.png"/>
            </sl-card>
          </sl-details>
          <sl-details summary="How to add a logical node (network node)?">
            <sl-card class="card-image">
              <div slot="header"><b>Step 1:</b> Choose your component</div>
              <img src="/resources/help-instructions/toolbar-select-logical.png"/>
            </sl-card>
            <sl-card class="card-image">
              <div slot="header"><b>Step 2:</b> Configure your network</div>
              <img src="/resources/help-instructions/toolbar-logical-node.png"/>
            </sl-card>
            <sl-card class="card-image">
              <div slot="header"><b>Step 3:</b> Pick a color also if you want to:</div>
              <img src="/resources/help-instructions/pick-color.png"/>
            </sl-card>
            <sl-card class="card-image">
              <div slot="header"><b>Step 4:</b> Click add</div>
              <img src="/resources/help-instructions/add-button.png"/>
            </sl-card>
          </sl-details>
          <sl-details summary="How to add a link between two physical nodes?">
            <sl-card class="card-image">
              <div slot="header"><b>Step 1:</b> Choose edge component</div>
              <img src="/resources/help-instructions/toolbar-select-edge.png"/>
            </sl-card>
            <sl-card class="card-image">
              <div slot="header"><b>Step 2:</b> Pick a color also if you want to:</div>
              <img src="/resources/help-instructions/pick-color.png"/>
            </sl-card>
            <sl-card class="card-image">
              <div slot="header"><b>Step 3:</b> Toggle draw mode</div>
              <img src="/resources/help-instructions/draw-edge-button.png"/>
            </sl-card>
            <sl-card class="card-image">
              <div slot="header"><b>Step 4:</b> Draw then configure on right click</div>
              <img src="/resources/help-instructions/configure-edge.png"/>
            </sl-card>
          </sl-details>

        </sl-tab-panel>
        <sl-tab-panel name="cidr">
          <sl-details summary="How to assign a gateway?">
            <sl-card class="card-image">
              <div slot="header"><b>Step 1:</b> Activate the "assign gateway" mode:</div>
              <img src="/resources/help-instructions/drag-to-assign-gateway.png"/>
            </sl-card>
            <sl-card class="card-image">
              <div slot="header"><b>Step 2:</b> Drag the gateway on the edge of a network:</div>
              <img src="/resources/help-instructions/drag-on-the-edge.png"/>
            </sl-card>
          </sl-details>
          <sl-details summary="How to drag a component into a network?">
            <sl-card class="card-image">
              <div slot="header"><b>Step 1:</b> Activate the "drag-and-drop" mode:</div>
              <img height="175px" src="/resources/help-instructions/drag-and-drop.png"/>
            </sl-card>
            <sl-card class="card-image">
              <div slot="header"><b>Step 2:</b> Drag the component inside the network:</div>
              <img src="/resources/help-instructions/drag-inside.png"/>
            </sl-card>
          </sl-details>
          <sl-details summary="How does the Net-based mode work?">
            <sl-card class="card-image">
              <div slot="header"><b>Before </b>dragging a node into network <b>1.1.1.0 /24</b></div>
              <img src="/resources/help-instructions/before-netmode.png"/>
            </sl-card>
            <sl-card class="card-image">
              <div slot="header"><b>After </b>dragging the node into network <b>1.1.1.0 /24</b></div>
              <img src="/resources/help-instructions/after-netmode.png"/>
              <div slot="footer">New IPv4 will be assigned for <b>conflicting</b> addresses.<br/>
              During this mode, when users <b>edit</b> addresses of:
              <ul>
                <li><b>networks</b>: conflicting addresses of all related hosts/gateways will be <b>reassigned</b>.</li>
                <li><b>hosts/gateways/subnetworks</b>: new addresses will be <b>validated</b> against the network addresses and will only be accepted when they are valid.</li>
              </ul>
              </div>
            </sl-card>
          </sl-details>
          <sl-details summary="How does the Host-based mode work?">
            <sl-card class="card-image">
              <div slot="header"><b>Before </b>dragging host0 into network <b>1.1.1.128 /25</b></div>
              <img height="210px" src="/resources/help-instructions/before-hostmode.png"/>
            </sl-card>
            <sl-card class="card-image">
              <div slot="header"><b>After </b>dragging host0 into network <b>1.1.1.128 /25</b></div>
              <img height="210px"  src="/resources/help-instructions/after-hostmode.png"/>
              <div slot="footer">The existing network will <b>expand</b> to contain the new host.<br/>
              During this mode, when users <b>edit</b> addresses of:
              <ul>
                <li><b>networks</b>: new network address range will be <b>checked</b> if they expands the old ones.</li>
                <li><b>hosts/gateways/subnetworks</b>: the existing network will <b>expand</b> to contain the new addresses.</li>
              </ul>
              </div>
            </sl-card>
          </sl-details>
        </sl-tab-panel>

        <sl-tab-panel name="simulation">
          <sl-details summary="How to manipulate a simulation session?">
            <sl-card class="card-image">
              <div slot="header"><b>Step 1:</b> if you don't use a graph from the examples, <b>Init</b> a new simulation session</div>
              <img height="175px" src="/resources/help-instructions/init-session.png"/>
              <div slot="footer">In this step, for the:
                <ul>
                  <li>host/router: ARP table and routing table are created</li>
                  <li>switch/bridge/access point: MAC address table is created</li>
                <ul>
              </div>
            </sl-card>
            <sl-card class="card-image">
              <div slot="header"><b>Step 2:</b> assign a sender/receiver for the packet</div>
              <img height="175px" src="/resources/help-instructions/choose-receiver.png"/>
              <div slot="footer">
                <ul>
                  <li>Click on <b>Choose sender</b> or <b>Choose receiver</b></li>
                  <li>Click on a <b>host</b> on the canvas</li>
                  <li>Choose an <b>IP</b></li>
                <ul>
              </div>
            </sl-card>
            <sl-card class="card-image">
              <div slot="header"><b>Step 3:</b> start sending a packet with the assigned sender and receiver in step 2</div>
              <img height="175px" src="/resources/help-instructions/send-packet.png"/>
              <div slot="footer"><b>Repeat steps 2 and 3</b> as much as desired.<br/> You can also use <b>pause/resume</b> or change <b>focus/speed</b> during or before starting to send a packet.</div>
            </sl-card>
            <sl-card class="card-image">
              <div slot="header"><b>Last step</b></div>
              <img height="175px" src="/resources/help-instructions/stop-session.png"/>
            <div slot="footer">
            <b>Stop session</b> resets all tables and ends the current simulation session.<br/>
            Start from step 1 again for a new simulation session.
            </div>
            </sl-card>
          </sl-details>
          <sl-details summary="How to configure the tables?">
            <sl-card class="card-image">
              <div slot="header"><b>Step 1:</b> <b>Init</b>. Ignore this step if you use an <b>example graph</b>, or there is a <b>session running</b>.</div>
              <img src="/resources/help-instructions/init-table.png"/>
            </sl-card>
            <sl-card class="card-image">
              <div slot="header"><b>Step 2.a:</b> Click on <b>Add</b> to generate a new row in the table</div>
              <img src="/resources/help-instructions/add-table.png"/>
            </sl-card>
            <sl-card class="card-image">
              <div slot="header"><b>Step 2.b:</b> Fill your table according to its type. Except for the tables of the routers, tables of other nodes can be filled automatically.</div>
              <img src="/resources/help-instructions/example-table.png"/>
            </sl-card>
            <sl-card class="card-image">
              <div slot="header"><b>Step 3:</b> <b>Remove</b> button removes all <b>checked</b> rows</div>
              <img src="/resources/help-instructions/remove-table.png"/>
            </sl-card>
            <sl-card class="card-image">
              <div slot="header"><b>Step 4:</b> <b>Save</b> button saves the current table on the UI to the database</div>
              <img src="/resources/help-instructions/save-table.png"/>
            </sl-card>

          </sl-details>
        </sl-tab-panel>
    </sl-tab-group>
    `;
  }
}








