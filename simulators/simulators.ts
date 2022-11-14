import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('network-simulator')
export class Simulators extends LitElement {
    static styles =
        css`
    :host {
        position: absolute;
        bottom: 5px;
        right: 5px;
      }
      b {
        display: flex;
        width: calc(14vw - 10px);
        height: calc(100vh - 10px);
        background-color: LightBlue;
      }
    `;
    render() {
        return html`
    <b>
    `;
    }
}