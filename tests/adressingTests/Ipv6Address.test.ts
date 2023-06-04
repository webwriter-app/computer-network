import { test, expect } from '@jest/globals';
import { Ipv6Address } from '../../src/adressing/Ipv6Address';


test('should generate loop-back address correctly', () => {
    let loopback: Ipv6Address = Ipv6Address.getLoopBackAddress();
    expect(loopback.address).toBe("0:0:0:0:0:0:0:1");
    expect(loopback.layer).toBe(3);
    expect(loopback.octets).toStrictEqual(["0","0","0","0","0","0","0","1"]);
});

test('properly validate IPv6 Address regex', () => {
    let emptyDatabase: Map<string, string> = new Map();
    let ip6 = Ipv6Address.validateAddress('2001:0db8:85a3:0000:0000:8a2e:0370:7334', emptyDatabase);
    expect(ip6.address).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    expect(ip6.layer).toBe(3);
    expect(ip6.octets).toStrictEqual(['2001','0db8','85a3','0000','0000','8a2e','0370', '7334']);
});

test('properly validate IPv6 Address against database', () => {
    let database: Map<string, string> = new Map();
    expect(Ipv6Address.validateAddress('2001:0db8:85a3:0000:0000:8a2e:0370:7334', database)).not.toBeNull();
});

test('properly validate loopback against database', () => {
    let database: Map<string, string> = new Map();
    expect(Ipv6Address.validateAddress("0:0:0:0:0:0:0:1", database).address).toBe("0:0:0:0:0:0:0:1");
    expect(Ipv6Address.validateAddress("0:0:0:0:0:0:0:1", database).address).toBe("0:0:0:0:0:0:0:1");
    expect(database.size).toBe(0);
});