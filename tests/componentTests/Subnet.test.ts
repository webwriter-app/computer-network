import { test, expect } from '@jest/globals';
import { Ipv4Address } from '../../src/adressing/Ipv4Address';
import { Subnet, SubnettingMode } from '../../src/components/logicalNodes/Subnet';

let modes: SubnettingMode[] = ["HOST_BASED", "MANUAL", "SUBNET_BASED"];

test('should set mode correctly', () => {
    expect(Subnet.mode).toBe("MANUAL");
    modes.forEach(mode => {
        Subnet.setMode(mode);
        expect(Subnet.mode).toBe(mode);
    });
});

test('should validate subnet mask correctly', () => {
    expect(Subnet.validateSubnetMask("255.255.255.255")).toBe(true);
    expect(Subnet.validateSubnetMask("255.255.255.0")).toBe(true);
    expect(Subnet.validateSubnetMask("255.255.0.0")).toBe(true);
    expect(Subnet.validateSubnetMask("255.0.0.0")).toBe(true);
    expect(Subnet.validateSubnetMask("0.0.0.0")).toBe(true);
    expect(Subnet.validateSubnetMask("0.1.0.0")).toBe(false);
});

test('should create Subnet for valid subnetNum, subnetMask, bitmask - upper bound', () => {
    modes.forEach(mode => {
        Subnet.setMode(mode);
        let subnet: Subnet = Subnet.createSubnet("", "255.255.255.255", "255.255.255.255", 32, new Map());
        expect(subnet.networkAddress).toStrictEqual(new Ipv4Address("255.255.255.255", ["255", "255", "255", "255"], ["11111111", "11111111", "11111111", "11111111"], [255, 255, 255, 255]));
        expect(subnet.binarySubnetMask).toBe("11111111111111111111111111111111");
        expect(subnet.bitmask).toBe(32);
        expect(subnet.cssClass.includes('unconfigured-subnet')).toBe(false);
        expect(subnet.subnetMask).toBe("255.255.255.255");
        expect(subnet.name).toBe("255.255.255.255 /32");
    });
});

test('should create Subnet for valid subnetNum, subnetMask, bitmask - lower bound', () => {
    modes.forEach(mode => {
        Subnet.setMode(mode);
        let subnet: Subnet = Subnet.createSubnet("", "0.0.0.0", "0.0.0.0", 0, new Map());
        expect(subnet.networkAddress).toStrictEqual(new Ipv4Address("0.0.0.0", ["0", "0", "0", "0"], ["00000000", "00000000", "00000000", "00000000"], [0, 0, 0, 0]));
        expect(subnet.binarySubnetMask).toBe("00000000000000000000000000000000");
        expect(subnet.bitmask).toBe(0);
        expect(subnet.cssClass.includes('unconfigured-subnet')).toBe(false);
        expect(subnet.subnetMask).toBe("0.0.0.0");
        expect(subnet.name).toBe("0.0.0.0 /0");
    });
});

test('should create Subnet for valid subnetNum, subnetMask, bitmask', () => {
    modes.forEach(mode => {
        Subnet.setMode(mode);
        let subnet: Subnet = Subnet.createSubnet("", "128.1.0.0", "255.255.0.0", 16, new Map());
        expect(subnet.networkAddress).toStrictEqual(new Ipv4Address("128.1.0.0", ["128", "1", "0", "0"], ["10000000", "00000001", "00000000", "00000000"], [128, 1, 0, 0]));
        expect(subnet.binarySubnetMask).toBe("11111111111111110000000000000000");
        expect(subnet.bitmask).toBe(16);
        expect(subnet.cssClass.includes('unconfigured-subnet')).toBe(false);
        expect(subnet.subnetMask).toBe("255.255.0.0");
        expect(subnet.name).toBe("128.1.0.0 /16");
    });
});

test('should create Subnet for valid subnetNum, subnetMask, bitmask but unmatched subnetmask and bitmask', () => {
    modes.forEach(mode => {
        Subnet.setMode(mode);
        let subnet: Subnet = Subnet.createSubnet("", "128.1.0.0", "255.254.0.0", 16, new Map());
        expect(subnet.networkAddress).toStrictEqual(new Ipv4Address("128.1.0.0", ["128", "1", "0", "0"], ["10000000", "00000001", "00000000", "00000000"], [128, 1, 0, 0]));
        expect(subnet.binarySubnetMask).toBe("11111111111111110000000000000000");
        expect(subnet.bitmask).toBe(16);
        expect(subnet.cssClass.includes('unconfigured-subnet')).toBe(false);
        expect(subnet.subnetMask).toBe("255.255.0.0");
        expect(subnet.name).toBe("128.1.0.0 /16");
    });
});

test('host-based/manual: should create unconfigured Subnet for valid subnetNum and invalid subnetMask, bitmask', () => {
    let nonstrictMode: SubnettingMode[] = ["HOST_BASED", "MANUAL"];
    let inputs: [string, string, number, number][] = [["128.1.0.0", "", -1, 1], ["128.2.0.0", "", null, 2],
    ["128.3.0.0", "", NaN, 3], ["128.4.0.0", null, null, 4], ["128.5.0.0", undefined, null, 5], ["128.6.0.0", "256.255.0.0", null, 6]];
    nonstrictMode.forEach(mode => {
        Subnet.setMode(mode);
        let database: Map<string, Ipv4Address> = new Map();
        inputs.forEach(([networkId, subnetmask, bitmask, totalNumOfAddresses]) => {
            let subnet: Subnet = Subnet.createSubnet("", networkId, subnetmask, bitmask, database);
            expect(subnet).toBeTruthy();
            expect(subnet.bitmask).toBe(undefined);
            expect(subnet.binarySubnetMask).toBe(undefined);
            expect(subnet.networkAddress.address).toBe(networkId);
            expect(subnet.cssClass.includes('unconfigured-subnet')).toBe(true);
            expect(database.size).toBe(totalNumOfAddresses);
        });
    });
});

test('SUBNET_BASED: should not create Subnet for valid subnetNum and invalid subnetMask, bitmask', () => {
    Subnet.setMode("SUBNET_BASED");
    let inputs: [string, number][] = [["", -1], ["", null], [null, null], [undefined, null], ["256.255.0.0", null], ["", NaN]];
    let database: Map<string, Ipv4Address> = new Map();

    inputs.forEach(([subnetmask, bitmask]) => {
        let subnet: Subnet = Subnet.createSubnet("", "128.1.0.0", subnetmask, bitmask, database);
        expect(subnet).toBeNull();
        expect(database.size).toBe(0);
    });
});

test('should create Subnet for valid subnetNum, bitmask and invalid subnetMask', () => {
    modes.forEach(mode => {
        Subnet.setMode(mode);
        let database: Map<string, Ipv4Address> = new Map();
        let subnet: Subnet = Subnet.createSubnet("", "128.1.0.0", "", 16, database);
        expect(subnet.networkAddress).toStrictEqual(new Ipv4Address("128.1.0.0", ["128", "1", "0", "0"], ["10000000", "00000001", "00000000", "00000000"], [128, 1, 0, 0]));
        expect(subnet.binarySubnetMask).toBe("11111111111111110000000000000000");
        expect(subnet.bitmask).toBe(16);
        expect(subnet.cssClass.includes('unconfigured-subnet')).toBe(false);
        expect(subnet.subnetMask).toBe("255.255.0.0");
        expect(subnet.name).toBe("128.1.0.0 /16");
        expect(database.size).toBe(1);
    });
});

test('should create Subnet for valid subnetNum, subnetmask and invalid bitmask', () => {
    modes.forEach(mode => {
        Subnet.setMode(mode);
        let database: Map<string, Ipv4Address> = new Map();
        let subnet: Subnet = Subnet.createSubnet("", "128.1.0.0", "", 16, database);
        expect(subnet.networkAddress).toStrictEqual(new Ipv4Address("128.1.0.0", ["128", "1", "0", "0"], ["10000000", "00000001", "00000000", "00000000"], [128, 1, 0, 0]));
        expect(subnet.binarySubnetMask).toBe("11111111111111110000000000000000");
        expect(subnet.bitmask).toBe(16);
        expect(subnet.cssClass.includes('unconfigured-subnet')).toBe(false);
        expect(subnet.subnetMask).toBe("255.255.0.0");
        expect(subnet.name).toBe("128.1.0.0 /16");
        expect(database.size).toBe(1);
    });
});

/**
 * This test depends on createSubnet, debug createSubnet first then this later
 */
test('test supernet should be correct', () => {
    modes.forEach(mode => {
        Subnet.setMode(mode);
        let database: Map<string, Ipv4Address> = new Map();
        let subnet: Subnet = Subnet.createSubnet("", "128.1.0.0", "", 16, database);
        let supernet: Subnet = Subnet.createSubnet("", "128.0.0.0", "", 15, database);
        expect(database.size).toBe(2);
        expect(supernet.isSupernetOf(subnet)).toBe(true);
    });
});

/**
 * This test depends on createSubnet, debug createSubnet first then this later
 */
test('test not supernet case should be correct', () => {
    modes.forEach(mode => {
        Subnet.setMode(mode);
        let database: Map<string, Ipv4Address> = new Map();
        let subnet: Subnet = Subnet.createSubnet("", "255.1.0.0", "", 16, database);
        let supernet: Subnet = Subnet.createSubnet("", "255.0.0.0", "", 16, database);
        expect(database.size).toBe(2);
        expect(supernet.isSupernetOf(subnet)).toBe(false);

        subnet = Subnet.createSubnet("", "254.0.0.0", "", 14, database);
        expect(database.size).toBe(3);
        expect(supernet.isSupernetOf(subnet)).toBe(false);

        subnet = Subnet.createSubnet("", "255.2.128.0", "", 24, database);
        expect(database.size).toBe(4);
        expect(supernet.isSupernetOf(subnet)).toBe(false);
    });
});

/**
 * This test depends on createSubnet, debug createSubnet first then this later
 */
test('test supernet for unconfigured subnet/supernet', () => {
    modes.forEach(mode => {
        Subnet.setMode(mode);
        let database: Map<string, Ipv4Address> = new Map();
        let unconfiguredSubnet: Subnet = Subnet.createSubnet("", "255.0.128.0", "", NaN, database);
        let unconfiguredSupernet: Subnet = Subnet.createSubnet("", "0.0.0.0", "", NaN, database);
        let supernet: Subnet = Subnet.createSubnet("", "255.0.0.0", "", 16, database);
        let subnet: Subnet = Subnet.createSubnet("", "255.0.255.0", "", 24, database);

        expect(supernet.isSupernetOf(unconfiguredSubnet)).toBe(false);
        expect(supernet.isSupernetOf(subnet)).toBe(true);
        if (mode != "SUBNET_BASED") {
            expect(unconfiguredSupernet.isSupernetOf(subnet)).toBe(false);
            expect(unconfiguredSupernet.isSupernetOf(unconfiguredSubnet)).toBe(false);
        }
    });
});

test('should extend existed subnet for new host', () => {
    Subnet.setMode("HOST_BASED");
    let database: Map<string, Ipv4Address> = new Map();
    let subnet: Subnet = Subnet.createSubnet("", "128.0.255.0", "", 24, database);
    let ipOfNewHost: Ipv4Address = Ipv4Address.validateAddress("128.128.0.0", database);

    Subnet.calculateCIDRGivenNewHost(subnet, ipOfNewHost, database);

    expect(subnet.networkAddress).toStrictEqual(new Ipv4Address("128.0.0.0", ["128", "0", "0", "0"], ["10000000", "00000000", "00000000", "00000000"], [128, 0, 0, 0]));
    expect(subnet.binarySubnetMask).toBe("11111111000000000000000000000000");
    expect(subnet.bitmask).toBe(8);
    expect(subnet.subnetMask).toBe("255.0.0.0");
    expect(subnet.name).toBe("128.0.0.0 /8");
    expect(subnet.cssClass.includes('unconfigured-subnet')).toBe(false);
    expect(database.has("128.0.255.0")).toBe(false);
    expect(database.has("128.0.0.0")).toBe(true);
    expect(database.size).toBe(2);
});

test("shouldn't extend existed subnet for new host if not HOST_BASED mode", () => {
    let modes: SubnettingMode[] = ["MANUAL", "SUBNET_BASED"];

    modes.forEach(mode => {
        Subnet.setMode(mode);
        let database: Map<string, Ipv4Address> = new Map();
        let subnet: Subnet = Subnet.createSubnet("", "128.0.255.0", "", 24, database);
        let ipOfNewHost: Ipv4Address = Ipv4Address.validateAddress("128.128.0.0", database);

        Subnet.calculateCIDRGivenNewHost(subnet, ipOfNewHost, database);

        expect(subnet.networkAddress).toStrictEqual(new Ipv4Address("128.0.255.0", ["128", "0", "255", "0"], ["10000000", "00000000", "11111111", "00000000"], [128, 0, 255, 0]));
        expect(subnet.binarySubnetMask).toBe("11111111111111111111111100000000");
        expect(subnet.bitmask).toBe(24);
        expect(subnet.subnetMask).toBe("255.255.255.0");
        expect(subnet.name).toBe("128.0.255.0 /24");
        expect(subnet.cssClass.includes('unconfigured-subnet')).toBe(false);
        expect(database.size).toBe(2);
        expect(database.has("128.0.255.0")).toBe(true);
        expect(database.has("128.128.0.0")).toBe(true);
    });
});

test('should not extend existed subnet for matching new host', () => {
    Subnet.setMode("HOST_BASED");
    let database: Map<string, Ipv4Address> = new Map();
    let subnet: Subnet = Subnet.createSubnet("", "128.0.255.0", "", 24, database);
    let ipOfNewHost: Ipv4Address = Ipv4Address.validateAddress("128.0.255.128", database);

    Subnet.calculateCIDRGivenNewHost(subnet, ipOfNewHost, database);

    expect(subnet.networkAddress).toStrictEqual(new Ipv4Address("128.0.255.0", ["128", "0", "255", "0"], ["10000000", "00000000", "11111111", "00000000"], [128, 0, 255, 0]));
    expect(subnet.binarySubnetMask).toBe("11111111111111111111111100000000");
    expect(subnet.bitmask).toBe(24);
    expect(subnet.subnetMask).toBe("255.255.255.0");
    expect(subnet.name).toBe("128.0.255.0 /24");
    expect(subnet.cssClass.includes('unconfigured-subnet')).toBe(false);
    expect(database.size).toBe(2);
    expect(database.has("128.0.255.0")).toBe(true);
    expect(database.has("128.0.255.128")).toBe(true);
});

test('should not extend existed subnet for loopback address', () => {
    Subnet.setMode("HOST_BASED");
    let database: Map<string, Ipv4Address> = new Map();
    let subnet: Subnet = Subnet.createSubnet("", "128.0.255.0", "", 24, database);
    let ipOfNewHost: Ipv4Address = Ipv4Address.validateAddress("127.0.0.1", database);

    Subnet.calculateCIDRGivenNewHost(subnet, ipOfNewHost, database);

    expect(subnet.networkAddress).toStrictEqual(new Ipv4Address("128.0.255.0", ["128", "0", "255", "0"], ["10000000", "00000000", "11111111", "00000000"], [128, 0, 255, 0]));
    expect(subnet.binarySubnetMask).toBe("11111111111111111111111100000000");
    expect(subnet.bitmask).toBe(24);
    expect(subnet.subnetMask).toBe("255.255.255.0");
    expect(subnet.name).toBe("128.0.255.0 /24");
    expect(subnet.cssClass.includes('unconfigured-subnet')).toBe(false);
    expect(database.size).toBe(1);
    expect(database.has("128.0.255.0")).toBe(true);
});

test('should extend existed supernet for new subnet (of same bitmask)', () => {
    Subnet.setMode("HOST_BASED");
    let database: Map<string, Ipv4Address> = new Map();
    let supernet: Subnet = Subnet.createSubnet("", "128.0.255.0", "", 24, database);
    let subnet: Subnet = Subnet.createSubnet("", "128.0.254.0", "", 24, database);

    Subnet.calculateCIDRGivenNewSubnet(supernet, subnet, database);

    expect(supernet.networkAddress).toStrictEqual(new Ipv4Address("128.0.252.0", ["128", "0", "252", "0"], ["10000000", "00000000", "11111100", "00000000"], [128, 0, 252, 0]));
    expect(supernet.binarySubnetMask).toBe("11111111111111111111110000000000");
    expect(supernet.bitmask).toBe(22);
    expect(supernet.subnetMask).toBe("255.255.252.0");
    expect(supernet.name).toBe("128.0.252.0 /22");
    expect(supernet.cssClass.includes('unconfigured-subnet')).toBe(false);
    expect(database.size).toBe(2);
    expect(database.has("128.0.255.0")).toBe(false);
});

test('should extend existed supernet for new subnet - lower bound', () => {
    Subnet.setMode("HOST_BASED");
    let database: Map<string, Ipv4Address> = new Map();
    let supernet: Subnet = Subnet.createSubnet("", "128.0.255.0", "", 24, database);
    let subnet: Subnet = Subnet.createSubnet("", "128.0.0.0", "", 24, database);

    Subnet.calculateCIDRGivenNewSubnet(supernet, subnet, database);

    expect(supernet.networkAddress).toStrictEqual(new Ipv4Address("0.0.0.0", ["0", "0", "0", "0"], ["00000000", "00000000", "00000000", "00000000"], [0, 0, 0, 0]));
    expect(supernet.binarySubnetMask).toBe("00000000000000000000000000000000");
    expect(supernet.bitmask).toBe(0);
    expect(supernet.subnetMask).toBe("0.0.0.0");
    expect(supernet.name).toBe("0.0.0.0 /0");
    expect(supernet.cssClass.includes('unconfigured-subnet')).toBe(false);
    expect(database.size).toBe(2);
    expect(database.has("128.0.255.0")).toBe(false);
});

test('should set supernet as unconfigured when no valid address available', () => {
    Subnet.setMode("HOST_BASED");
    let database: Map<string, Ipv4Address> = new Map();
    database.set("0.0.0.0", null); //mock address
    let supernet: Subnet = Subnet.createSubnet("", "128.0.255.0", "", 24, database);
    let subnet: Subnet = Subnet.createSubnet("", "128.0.0.0", "", 24, database);
    
    Subnet.calculateCIDRGivenNewSubnet(supernet, subnet, database);

    expect(supernet.networkAddress).toBe(null);
    expect(supernet.binarySubnetMask).toBe(null);
    expect(supernet.bitmask).toBe(null);
    expect(supernet.subnetMask).toBe(null);
    expect(supernet.name).toBe("");
    expect(supernet.cssClass.includes('unconfigured-subnet')).toBe(true);
    expect(database.size).toBe(2);
    expect(database.has("128.0.255.0")).toBe(false);
});

test('should set subnet as unconfigured when no valid address available (new host)', () => {
    Subnet.setMode("HOST_BASED");
    let database: Map<string, Ipv4Address> = new Map();
    database.set("0.0.0.0", null); //mock address
    let subnet: Subnet = Subnet.createSubnet("", "128.0.255.0", "", 24, database);
    let hostIp: Ipv4Address = Ipv4Address.validateAddress("1.0.0.0", database);
    
    Subnet.calculateCIDRGivenNewHost(subnet, hostIp, database);

    expect(subnet.networkAddress).toBe(null);
    expect(subnet.binarySubnetMask).toBe(null);
    expect(subnet.bitmask).toBe(null);
    expect(subnet.subnetMask).toBe(null);
    expect(subnet.name).toBe("");
    expect(subnet.cssClass.includes('unconfigured-subnet')).toBe(true);
    expect(database.size).toBe(2);
    expect(database.has("128.0.255.0")).toBe(false);
});