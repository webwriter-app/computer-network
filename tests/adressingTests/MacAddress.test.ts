import { test, expect } from '@jest/globals';
import { MacAddress } from '../../src/adressing/MacAddress';


let macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

test('properly auto-generate new Mac Address', () => {
    let emptyDatabase: Map<string, string> = new Map();
    let randomMac = MacAddress.generateRandomAddress(emptyDatabase);
    expect(macRegex.test(randomMac.address)).toBe(true);
    expect(randomMac.layer).toBe(2);
    expect(randomMac.octets).toStrictEqual(randomMac.address.split(':'));
});


test('properly validate Mac Address regex', () => {
    let emptyDatabase: Map<string, string> = new Map();
    let mac = MacAddress.validateAddress('00:B0:D0:63:C2:26', emptyDatabase);
    expect(macRegex.test(mac.address)).toBe(true);
    expect(mac.address).toBe('00:B0:D0:63:C2:26');
    expect(mac.layer).toBe(2);
    expect(mac.octets).toStrictEqual(['00','B0','D0','63','C2','26']);
});


test('properly validate Mac Address against database', () => {
    let database: Map<string, string> = new Map();
    MacAddress.validateAddress('00:B0:D0:63:C2:26', database);
    expect(MacAddress.validateAddress('00:B0:D0:63:C2:26', database)).toBeNull();
});