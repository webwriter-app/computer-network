import { test, expect } from '@jest/globals';
import { Ipv4Address } from '../../src/adressing/Ipv4Address';
import { Net, SubnettingMode } from '../../src/components/logicalNodes/Net';

let modes: SubnettingMode[] = ["HOST_BASED", "MANUAL", "NET_BASED"];

test('should set mode correctly', () => {
    expect(Net.mode).toBe("MANUAL");
    modes.forEach(mode => {
        Net.setMode(mode);
        expect(Net.mode).toBe(mode);
    });
});

test('should create Net for valid netId, netmask, bitmask - upper bound', () => {
    modes.forEach(mode => {
        Net.setMode(mode);
        let net: Net = Net.createNet("", "255.255.255.255", "255.255.255.255", 32, new Map());
        expect(net.networkAddress).toStrictEqual(new Ipv4Address("255.255.255.255", ["255", "255", "255", "255"], ["11111111", "11111111", "11111111", "11111111"], [255, 255, 255, 255]));
        expect(net.binaryNetmask).toBe("11111111111111111111111111111111");
        expect(net.bitmask).toBe(32);
        expect(net.cssClass.includes('unconfigured-net')).toBe(false);
        expect(net.netmask).toBe("255.255.255.255");
        expect(net.name).toBe("255.255.255.255 /32");
    });
});

test('should create Net for valid netId, netmask, bitmask - lower bound', () => {
    modes.forEach(mode => {
        Net.setMode(mode);
        let net: Net = Net.createNet("", "0.0.0.0", "0.0.0.0", 0, new Map());
        expect(net.networkAddress).toStrictEqual(new Ipv4Address("0.0.0.0", ["0", "0", "0", "0"], ["00000000", "00000000", "00000000", "00000000"], [0, 0, 0, 0]));
        expect(net.binaryNetmask).toBe("00000000000000000000000000000000");
        expect(net.bitmask).toBe(0);
        expect(net.cssClass.includes('unconfigured-net')).toBe(false);
        expect(net.netmask).toBe("0.0.0.0");
        expect(net.name).toBe("0.0.0.0 /0");
    });
});

test('should create Net for valid netId, netmask, bitmask', () => {
    modes.forEach(mode => {
        Net.setMode(mode);
        let net: Net = Net.createNet("", "128.1.0.0", "255.255.0.0", 16, new Map());
        expect(net.networkAddress).toStrictEqual(new Ipv4Address("128.1.0.0", ["128", "1", "0", "0"], ["10000000", "00000001", "00000000", "00000000"], [128, 1, 0, 0]));
        expect(net.binaryNetmask).toBe("11111111111111110000000000000000");
        expect(net.bitmask).toBe(16);
        expect(net.cssClass.includes('unconfigured-net')).toBe(false);
        expect(net.netmask).toBe("255.255.0.0");
        expect(net.name).toBe("128.1.0.0 /16");
    });
});

test('should create Net for valid netId, netmask, bitmask but unmatched netmask and bitmask', () => {
    modes.forEach(mode => {
        Net.setMode(mode);
        let net: Net = Net.createNet("", "128.1.0.0", "255.254.0.0", 16, new Map());
        expect(net.networkAddress).toStrictEqual(new Ipv4Address("128.1.0.0", ["128", "1", "0", "0"], ["10000000", "00000001", "00000000", "00000000"], [128, 1, 0, 0]));
        expect(net.binaryNetmask).toBe("11111111111111110000000000000000");
        expect(net.bitmask).toBe(16);
        expect(net.cssClass.includes('unconfigured-net')).toBe(false);
        expect(net.netmask).toBe("255.255.0.0");
        expect(net.name).toBe("128.1.0.0 /16");
    });
});

test('host-based/manual: should create unconfigured Net for valid netId and invalid netmask, bitmask', () => {
    let nonstrictMode: SubnettingMode[] = ["HOST_BASED", "MANUAL"];
    let inputs: [string, string, number, number][] = [["128.1.0.0", "", -1, 1], ["128.2.0.0", "", null, 2],
    ["128.3.0.0", "", NaN, 3], ["128.4.0.0", null, null, 4], ["128.5.0.0", undefined, null, 5], ["128.6.0.0", "256.255.0.0", null, 6]];
    nonstrictMode.forEach(mode => {
        Net.setMode(mode);
        let database: Map<string, string> = new Map();
        inputs.forEach(([networkId, netmask, bitmask, totalNumOfAddresses]) => {
            let net: Net = Net.createNet("", networkId, netmask, bitmask, database);
            expect(net).toBeTruthy();
            expect(net.bitmask).toBe(undefined);
            expect(net.binaryNetmask).toBe(undefined);
            expect(net.networkAddress.address).toBe(networkId);
            expect(net.cssClass.includes('unconfigured-net')).toBe(true);
            expect(database.size).toBe(totalNumOfAddresses);
        });
    });
});

test('NET_BASED: should not create Net for valid netId and invalid netmask, bitmask', () => {
    Net.setMode("NET_BASED");
    let inputs: [string, number][] = [["", -1], ["", null], [null, null], [undefined, null], ["256.255.0.0", null], ["", NaN]];
    let database: Map<string, string> = new Map();

    inputs.forEach(([netmask, bitmask]) => {
        let net: Net = Net.createNet("", "128.1.0.0", netmask, bitmask, database);
        expect(net).toBeNull();
        expect(database.size).toBe(0);
    });
});

test('should create Net for valid netId, bitmask and invalid netmask', () => {
    modes.forEach(mode => {
        Net.setMode(mode);
        let database: Map<string, string> = new Map();
        let net: Net = Net.createNet("", "128.1.0.0", "", 16, database);
        expect(net.networkAddress).toStrictEqual(new Ipv4Address("128.1.0.0", ["128", "1", "0", "0"], ["10000000", "00000001", "00000000", "00000000"], [128, 1, 0, 0]));
        expect(net.binaryNetmask).toBe("11111111111111110000000000000000");
        expect(net.bitmask).toBe(16);
        expect(net.cssClass.includes('unconfigured-net')).toBe(false);
        expect(net.netmask).toBe("255.255.0.0");
        expect(net.name).toBe("128.1.0.0 /16");
        expect(database.size).toBe(2);
    });
});

test('should create Net for valid netId, netmask and invalid bitmask', () => {
    modes.forEach(mode => {
        Net.setMode(mode);
        let database: Map<string, string> = new Map();
        let net: Net = Net.createNet("", "128.1.0.0", "", 16, database);
        expect(net.networkAddress).toStrictEqual(new Ipv4Address("128.1.0.0", ["128", "1", "0", "0"], ["10000000", "00000001", "00000000", "00000000"], [128, 1, 0, 0]));
        expect(net.binaryNetmask).toBe("11111111111111110000000000000000");
        expect(net.bitmask).toBe(16);
        expect(net.cssClass.includes('unconfigured-net')).toBe(false);
        expect(net.netmask).toBe("255.255.0.0");
        expect(net.name).toBe("128.1.0.0 /16");
        expect(database.size).toBe(2);
    });
});

/**
 * This test depends on createNet, debug createNet first then this later
 */
test('test supernet should be correct', () => {
    modes.forEach(mode => {
        Net.setMode(mode);
        let database: Map<string, string> = new Map();
        let subnet: Net = Net.createNet("", "128.1.0.0", "", 16, database);
        let supernet: Net = Net.createNet("", "128.0.0.0", "", 15, database);
        expect(database.size).toBe(3); //same broadcast address
        expect(supernet.isSupernetOf(subnet)).toBe(true);
    });
});

/**
 * This test depends on createNet, debug createNet first then this later
 */
test('test not supernet case should be correct', () => {
    modes.forEach(mode => {
        Net.setMode(mode);
        let database: Map<string, string> = new Map();
        let subnet: Net = Net.createNet("", "255.1.0.0", "", 16, database);
        let supernet: Net = Net.createNet("", "255.0.0.0", "", 16, database);
        expect(database.size).toBe(4);
        expect(supernet.isSupernetOf(subnet)).toBe(false);

        subnet = Net.createNet("", "254.0.0.0", "", 14, database);
        expect(database.size).toBe(6);
        expect(supernet.isSupernetOf(subnet)).toBe(false);

        subnet = Net.createNet("", "255.2.128.0", "", 24, database);
        expect(database.size).toBe(8);
        expect(supernet.isSupernetOf(subnet)).toBe(false);
    });
});

/**
 * This test depends on createNet, debug createNet first then this later
 */
test('test supernet for unconfigured subnet/supernet', () => {
    modes.forEach(mode => {
        Net.setMode(mode);
        let database: Map<string, string> = new Map();
        let unconfiguredSubnet: Net = Net.createNet("", "255.0.128.0", "", NaN, database);
        let unconfiguredSupernet: Net = Net.createNet("", "0.0.0.0", "", NaN, database);
        let supernet: Net = Net.createNet("", "255.0.0.0", "", 16, database);
        let subnet: Net = Net.createNet("", "255.0.255.0", "", 24, database);

        expect(supernet.isSupernetOf(unconfiguredSubnet)).toBe(false);
        expect(supernet.isSupernetOf(subnet)).toBe(true);
        if (mode != "NET_BASED") {
            expect(unconfiguredSupernet.isSupernetOf(subnet)).toBe(false);
            expect(unconfiguredSupernet.isSupernetOf(unconfiguredSubnet)).toBe(false);
        }
    });
});

test('should extend existed net for new host', () => {
    Net.setMode("HOST_BASED");
    let database: Map<string, string> = new Map();
    let net: Net = Net.createNet("", "128.0.255.0", "", 24, database);
    let ipOfNewHost: Ipv4Address = Ipv4Address.validateAddress("128.128.0.0", database);
    Ipv4Address.addAddressToDatabase(ipOfNewHost, database, "mock-node");

    Net.calculateCIDRGivenNewHost(net, ipOfNewHost, database);

    expect(net.networkAddress).toStrictEqual(new Ipv4Address("128.0.0.0", ["128", "0", "0", "0"], ["10000000", "00000000", "00000000", "00000000"], [128, 0, 0, 0]));
    expect(net.binaryNetmask).toBe("11111111000000000000000000000000");
    expect(net.bitmask).toBe(8);
    expect(net.netmask).toBe("255.0.0.0");
    expect(net.name).toBe("128.0.0.0 /8");
    expect(net.cssClass.includes('unconfigured-net')).toBe(false);
    expect(database.has("128.0.255.0")).toBe(false);
    expect(database.has("128.0.255.255")).toBe(false);
    expect(database.has("128.0.0.0")).toBe(true);
    expect(database.has("128.255.255.255")).toBe(true);
    expect(database.size).toBe(3);
});

test("shouldn't extend existed net for new host if not HOST_BASED mode", () => {
    let modes: SubnettingMode[] = ["MANUAL", "NET_BASED"];

    modes.forEach(mode => {
        Net.setMode(mode);
        let database: Map<string, string> = new Map();
        let net: Net = Net.createNet("", "128.0.255.0", "", 24, database);
        let ipOfNewHost: Ipv4Address = Ipv4Address.validateAddress("128.128.0.0", database);
        Ipv4Address.addAddressToDatabase(ipOfNewHost, database, "mock-node");

        Net.calculateCIDRGivenNewHost(net, ipOfNewHost, database);

        expect(net.networkAddress).toStrictEqual(new Ipv4Address("128.0.255.0", ["128", "0", "255", "0"], ["10000000", "00000000", "11111111", "00000000"], [128, 0, 255, 0]));
        expect(net.binaryNetmask).toBe("11111111111111111111111100000000");
        expect(net.bitmask).toBe(24);
        expect(net.netmask).toBe("255.255.255.0");
        expect(net.name).toBe("128.0.255.0 /24");
        expect(net.cssClass.includes('unconfigured-net')).toBe(false);
        expect(database.size).toBe(3);
        expect(database.has("128.0.255.0")).toBe(true);
        expect(database.has("128.0.255.255")).toBe(true);
        expect(database.has("128.128.0.0")).toBe(true);
    });
});

test('should not extend existed net for matching new host', () => {
    Net.setMode("HOST_BASED");
    let database: Map<string, string> = new Map();
    let net: Net = Net.createNet("", "128.0.255.0", "", 24, database);
    let ipOfNewHost: Ipv4Address = Ipv4Address.validateAddress("128.0.255.128", database);
    Ipv4Address.addAddressToDatabase(ipOfNewHost, database, "mock-node");

    Net.calculateCIDRGivenNewHost(net, ipOfNewHost, database);

    expect(net.networkAddress).toStrictEqual(new Ipv4Address("128.0.255.0", ["128", "0", "255", "0"], ["10000000", "00000000", "11111111", "00000000"], [128, 0, 255, 0]));
    expect(net.binaryNetmask).toBe("11111111111111111111111100000000");
    expect(net.bitmask).toBe(24);
    expect(net.netmask).toBe("255.255.255.0");
    expect(net.name).toBe("128.0.255.0 /24");
    expect(net.cssClass.includes('unconfigured-net')).toBe(false);
    expect(database.size).toBe(3);
    expect(database.has("128.0.255.0")).toBe(true);
    expect(database.has("128.0.255.128")).toBe(true);
    expect(database.has("128.0.255.255")).toBe(true);
});

test('should not extend existed net for loopback address', () => {
    Net.setMode("HOST_BASED");
    let database: Map<string, string> = new Map();
    let net: Net = Net.createNet("", "128.0.255.0", "", 24, database);
    let ipOfNewHost: Ipv4Address = Ipv4Address.validateAddress("127.0.0.1", database);
    Ipv4Address.addAddressToDatabase(ipOfNewHost, database, "mock-node");

    Net.calculateCIDRGivenNewHost(net, ipOfNewHost, database);

    expect(net.networkAddress).toStrictEqual(new Ipv4Address("128.0.255.0", ["128", "0", "255", "0"], ["10000000", "00000000", "11111111", "00000000"], [128, 0, 255, 0]));
    expect(net.binaryNetmask).toBe("11111111111111111111111100000000");
    expect(net.bitmask).toBe(24);
    expect(net.netmask).toBe("255.255.255.0");
    expect(net.name).toBe("128.0.255.0 /24");
    expect(net.cssClass.includes('unconfigured-net')).toBe(false);
    expect(database.size).toBe(2);
    expect(database.has("128.0.255.0")).toBe(true);
    expect(database.has("128.0.255.255")).toBe(true);
});

test('should extend existed supernet for new subnet (of same bitmask)', () => {
    Net.setMode("HOST_BASED");
    let database: Map<string, string> = new Map();
    let supernet: Net = Net.createNet("", "128.0.255.0", "", 24, database);
    let subnet: Net = Net.createNet("", "128.0.254.0", "", 24, database);

    Net.calculateCIDRGivenNewSubnet(supernet, subnet, database);

    expect(supernet.networkAddress).toStrictEqual(new Ipv4Address("128.0.252.0", ["128", "0", "252", "0"], ["10000000", "00000000", "11111100", "00000000"], [128, 0, 252, 0]));
    expect(supernet.binaryNetmask).toBe("11111111111111111111110000000000");
    expect(supernet.bitmask).toBe(22);
    expect(supernet.netmask).toBe("255.255.252.0");
    expect(supernet.name).toBe("128.0.252.0 /22");
    expect(supernet.cssClass.includes('unconfigured-net')).toBe(false);
    expect(database.size).toBe(4);
    expect(database.has("128.0.255.0")).toBe(false);
    expect(database.has("128.0.255.255")).toBe(true);
    expect(database.has("128.0.253.255")).toBe(false);
    expect(database.has("128.0.252.0")).toBe(true);
    
});

test('should extend existed supernet for new subnet - lower bound', () => {
    Net.setMode("HOST_BASED");
    let database: Map<string, string> = new Map();
    let supernet: Net = Net.createNet("", "128.0.255.0", "", 24, database);
    let subnet: Net = Net.createNet("", "128.0.0.0", "", 24, database);

    Net.calculateCIDRGivenNewSubnet(supernet, subnet, database);

    expect(supernet.networkAddress).toStrictEqual(new Ipv4Address("0.0.0.0", ["0", "0", "0", "0"], ["00000000", "00000000", "00000000", "00000000"], [0, 0, 0, 0]));
    expect(supernet.binaryNetmask).toBe("00000000000000000000000000000000");
    expect(supernet.bitmask).toBe(0);
    expect(supernet.netmask).toBe("0.0.0.0");
    expect(supernet.name).toBe("0.0.0.0 /0");
    expect(supernet.cssClass.includes('unconfigured-net')).toBe(false);
    expect(database.size).toBe(4);
    expect(database.has("128.0.255.0")).toBe(false);
    expect(database.has("128.0.255.255")).toBe(false);
});

test('should set supernet as unconfigured when no valid address available', () => {
    Net.setMode("HOST_BASED");
    let database: Map<string, string> = new Map();
    database.set("0.0.0.0", null); //mock address
    let supernet: Net = Net.createNet("", "128.0.255.0", "", 24, database);
    let subnet: Net = Net.createNet("", "128.0.0.0", "", 24, database);
    
    Net.calculateCIDRGivenNewSubnet(supernet, subnet, database);

    expect(supernet.networkAddress).toBe(null);
    expect(supernet.binaryNetmask).toBe(null);
    expect(supernet.bitmask).toBe(null);
    expect(supernet.netmask).toBe(null);
    expect(supernet.name).toBe("");
    expect(supernet.cssClass.includes('unconfigured-net')).toBe(true);
    expect(database.size).toBe(3);
    expect(database.has("128.0.255.0")).toBe(false);
});

test('should set net as unconfigured when no valid address available (new host)', () => {
    Net.setMode("HOST_BASED");
    let database: Map<string, string> = new Map();
    database.set("0.0.0.0", null); //mock address
    let net: Net = Net.createNet("", "128.0.255.0", "", 24, database);
    let hostIp: Ipv4Address = Ipv4Address.validateAddress("1.0.0.0", database);

    Ipv4Address.addAddressToDatabase(hostIp, database, "mock-node");
    
    Net.calculateCIDRGivenNewHost(net, hostIp, database);

    expect(net.networkAddress).toBe(null);
    expect(net.binaryNetmask).toBe(null);
    expect(net.bitmask).toBe(null);
    expect(net.netmask).toBe(null);
    expect(net.name).toBe("");
    expect(net.cssClass.includes('unconfigured-net')).toBe(true);
    expect(database.size).toBe(2);
    expect(database.has("128.0.255.0")).toBe(false);
});