import { test, expect } from '@jest/globals';
import { AddressingHelper } from '../../src/utils/AdressingHelper';

test('properly convert decimal to binary octet for IPv4', () => {
    expect(AddressingHelper.numTo8BitBinary(0)).toBe("00000000");
    expect(() => AddressingHelper.numTo8BitBinary(-1)).toThrow(Error);
    expect(AddressingHelper.numTo8BitBinary(undefined)).toBe("00000000");
    expect(AddressingHelper.numTo8BitBinary(128)).toBe("10000000");
});

test('properly convert binary IPv4 of length 32 to decimal octets', () => {
    expect(AddressingHelper.binaryToDecimalOctets('0100')).toBeNull();
    expect(AddressingHelper.binaryToDecimalOctets('123')).toBeNull();
    expect(AddressingHelper.binaryToDecimalOctets('01010101010101010101010101010102')).toBeNull();
    expect(AddressingHelper.binaryToDecimalOctets('01010101010101010101010101010101')).toStrictEqual([85,85,85,85]);
    expect(AddressingHelper.binaryToDecimalOctets('00000000000000000000000000000000')).toStrictEqual([0,0,0,0]);
    expect(AddressingHelper.binaryToDecimalOctets('11111111111111111111111111111111')).toStrictEqual([255,255,255,255]);
});

test('properly convert decimal IPv4 to binary', () => {
    expect(AddressingHelper.decimalStringWithDotToBinary('0.0.0.0')).toBe('00000000000000000000000000000000');
    expect(AddressingHelper.decimalStringWithDotToBinary('255.255.255.255')).toBe('11111111111111111111111111111111');
    expect(AddressingHelper.decimalStringWithDotToBinary('85.85.85.85')).toBe('01010101010101010101010101010101');
    expect(AddressingHelper.decimalStringWithDotToBinary('random string')).toBeNull();
    expect(AddressingHelper.decimalStringWithDotToBinary('0.0.0.0.0')).toBeNull();
});

test('properly get longest match', () => {
    expect(AddressingHelper.getPrefix(['0000'])).toBe('0000');
    expect(AddressingHelper.getPrefix([])).toBe("");
    expect(AddressingHelper.getPrefix(['00000', '1111'])).toBe("");
    expect(AddressingHelper.getPrefix(['1000000', '1111'])).toBe("1");
    expect(AddressingHelper.getPrefix(['1000000', '1000000'])).toBe('1000000');
    expect(AddressingHelper.getPrefix(['1000001', '1000000'])).toBe('100000');
});

test('should random between given mix max', () => {
    for(let i=0; i<15; i++){
        let randomNum = AddressingHelper.randomBetween(0,15);
        expect(randomNum).toBeGreaterThanOrEqual(0);
        expect(randomNum).toBeLessThanOrEqual(15);
    }
});

test('should random 2 digits hex', () => {
    let regex = /[0-9a-f]+/;
    for(let i=0; i<15; i++){
        let randomHex = AddressingHelper.randomHex();
        expect(regex.test(randomHex)).toBe(true);
    }
});

test('should replace digit at correct position', () => {
    expect(AddressingHelper.replaceAt('00000000000000000000000000000000',1,'2')).toBe('20000000000000000000000000000000');
    expect(AddressingHelper.replaceAt('00000000000000000000000000000000',32,'2')).toBe('00000000000000000000000000000002');
    expect(AddressingHelper.replaceAt('00000000000000000000000000000000',33,'2')).toBeNull();
    expect(AddressingHelper.replaceAt('00000000000000000000000000000000',-1,'2')).toBeNull();
    expect(AddressingHelper.replaceAt('00000000000000000000000000000000',8,'2')).toBe('00000002000000000000000000000000');
});


test('should validate subnet mask correctly', () => {
    expect(AddressingHelper.validateNetMask("255.255.255.255")).toBe(true);
    expect(AddressingHelper.validateNetMask("255.255.255.0")).toBe(true);
    expect(AddressingHelper.validateNetMask("255.255.0.0")).toBe(true);
    expect(AddressingHelper.validateNetMask("255.0.0.0")).toBe(true);
    expect(AddressingHelper.validateNetMask("0.0.0.0")).toBe(true);
    expect(AddressingHelper.validateNetMask("0.1.0.0")).toBe(false);
});