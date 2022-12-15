import { test, expect } from '@jest/globals';
import { Ipv4Address } from '../../src/adressing/Ipv4Address';
import { Subnet } from '../../src/components/logicalNodes/Subnet';


test('should generate loop-back address correctly', () => {
    let loopback: Ipv4Address = Ipv4Address.getLoopBackAddress();
    expect(loopback.address).toBe("127.0.0.1");
    expect(loopback.layer).toBe(3);
    expect(loopback.binaryOctets).toBe(null);
    expect(loopback.decimalOctets).toBe(null);
    expect(loopback.octets).toBe(null);
});

test('properly validate IPv4 Address of host', () => {
    let database: Map<string, Ipv4Address> = new Map();
    let ip4 = Ipv4Address.validateAddress('192.0.2.255', database);
    expect(ip4.address).toBe('192.0.2.255');
    expect(ip4.layer).toBe(3);
    expect(ip4.binaryOctets).toStrictEqual(['11000000', '00000000', '00000010', '11111111']);
    expect(ip4.decimalOctets).toStrictEqual([192, 0, 2, 255]);
    expect(ip4.octets).toStrictEqual(['192', '0', '2', '255']);

    expect(Ipv4Address.validateAddress('256.128.0.0', database)).toBe(null);
});

test('properly validate IPv4 Address of subnet', () => {
    let emptyDatabase: Map<string, Ipv4Address> = new Map();
    let subnetId = Ipv4Address.validateAddress('255.0.0.0', emptyDatabase, 8);
    expect(subnetId.address).toBe('255.0.0.0');
    expect(subnetId.layer).toBe(3);
    expect(subnetId.binaryOctets).toStrictEqual(['11111111', '00000000', '00000000', '00000000']);
    expect(subnetId.decimalOctets).toStrictEqual([255, 0, 0, 0]);
    expect(subnetId.octets).toStrictEqual(['255', '0', '0', '0']);

    let invalidSubnetId = Ipv4Address.validateAddress('255.128.0.0', emptyDatabase, 8);
    expect(invalidSubnetId).toBe(null);

    expect(Ipv4Address.validateAddress('256.0.0.0', emptyDatabase, 8)).toBe(null);
});

test('properly validate IPv4 Address of host against database', () => {
    let database: Map<string, Ipv4Address> = new Map();
    Ipv4Address.validateAddress('192.0.2.255', database);
    expect(Ipv4Address.validateAddress('192.0.2.255', database)).toBe(null);
});

test('properly validate loopback against database', () => {
    let database: Map<string, Ipv4Address> = new Map();
    expect(Ipv4Address.validateAddress("127.0.0.1", database).address).toBe("127.0.0.1");
    expect(Ipv4Address.validateAddress("127.0.0.1", database).address).toBe("127.0.0.1");
    expect(database.size).toBe(0);
    expect(Ipv4Address.validateAddress("127.0.0.1", database, 1)).toBe(null); //can't use a loopback address for subnet ID
});

test('loopback address should match network CIDR', () => {
    expect(Ipv4Address.getLoopBackAddress().matchesNetworkCidr(Subnet.createSubnet("", "128.0.0.0", "255.0.0.0", 8, new Map()))).toBe(true);
});

test('should match network CIDR', () => {
    let ipv4 = Ipv4Address.validateAddress("128.128.0.0", new Map());
    expect(ipv4.matchesNetworkCidr(Subnet.createSubnet("", "128.0.0.0", "255.0.0.0", 8, new Map()))).toBe(true);
});

test('should not match network CIDR', () => {
    let ipv4 = Ipv4Address.validateAddress("129.0.0.0", new Map());
    expect(ipv4.matchesNetworkCidr(Subnet.createSubnet("", "128.0.0.0", "255.0.0.0", 8, new Map()))).toBe(false);
});

test('should generate new Ip for host', () => {
    let database: Map<string, Ipv4Address> = new Map();
    let subnet = Subnet.createSubnet("", "128.0.0.0", "255.0.0.0", 8, database);
    let hostOldId = Ipv4Address.validateAddress("129.0.0.0", database);

    let newId = Ipv4Address.generateNewIpGivenSubnet(database, hostOldId, subnet);
    expect(newId.binaryOctets.join('').slice(0, subnet.bitmask)).toBe(subnet.networkAddress.binaryOctets.join('').slice(0, subnet.bitmask));
});
