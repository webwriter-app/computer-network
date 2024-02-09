import { html } from 'lit';
import { NetworkComponent } from '../';
import { SlPopup } from '@shoelace-style/shoelace';
import { PacketSimulator } from '../event-handlers/packet-simulator';

export function simulationMenuTemplate(this: NetworkComponent) {
    const source = this._graph?.getElementById(PacketSimulator.sourceEndPoint).data();
    const target = this._graph?.getElementById(PacketSimulator.targetEndPoint).data();

    console.log(source, target);

    return html`
        <div class="simulationmenu">
            <sl-popup placement="bottom-end" id="simulationmenuButton" shift arrow arrow-placement="end" distance="8">
                <sl-button
                    slot="anchor"
                    @click=${() => {
                        const acitve = (this.shadowRoot?.getElementById('simulationmenuButton') as SlPopup).active;
                        (this.shadowRoot?.getElementById('simulationmenuButton') as SlPopup).active = !acitve;
                    }}
                    circle
                    >S</sl-button
                >
                <div class="simulationmenu__context">
                    <sl-button
                        id="#setSourceBtn"
                        @click=${(event: Event) => {
                            PacketSimulator.setSource(event, this);
                        }}
                        >Set Source</sl-button
                    >: ${source ? source.id : 'None'}
                    <sl-select>
                        ${source?.portData
                            ? Array.from(source?.portData)?.map((port: any) => {
                                  return html`<sl-option value=${port[1].get('IPv4').address}
                                      >${port[1].get('IPv4').address}</sl-option
                                  >`;
                              })
                            : null}
                    </sl-select>
                    <sl-button
                        id="#setTargetBtn"
                        @click=${(event: Event) => {
                            PacketSimulator.setTarget(event, this);
                        }}
                        >Set Target</sl-button
                    >: ${target ? target.id : 'None'}
                    <sl-select>
                        ${target?.portData
                            ? Array.from(target?.portData)?.map((port: any) => {
                                  return html`<sl-option value=${port[1].get('IPv4').address}
                                      >${port[1].get('IPv4').address}</sl-option
                                  >`;
                              })
                            : null}
                    </sl-select>
                </div>
            </sl-popup>
        </div>
    `;
}
